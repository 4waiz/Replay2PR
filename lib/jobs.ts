import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { JobData, JobStep, StepId } from "@/lib/types";
import {
  ensureArtifactsStructure,
  getJobDir,
  readJson,
  writeJson,
  writeText,
  placeholderSvg
} from "@/lib/artifacts";
import {
  extractReproSteps,
  generatePatchDiff,
  generatePlaywrightTest,
  getGeminiFallbackReason,
  isGeminiRecoverableError
} from "@/lib/gemini";
import { runPlaywrightTest } from "@/lib/playwright";
import { applyUnifiedDiff, createUnifiedDiff } from "@/lib/patcher";
import { readDemoTarget, resetDemoTarget, writeDemoTarget } from "@/lib/demo-target";
import { getMaxConcurrentJobs, isVercelRuntime } from "@/lib/env";

const jobs = new Map<string, JobData>();
const jobQueue: string[] = [];
let runningJobs = 0;
const MAX_CONCURRENT_JOBS = getMaxConcurrentJobs();

interface CreateJobParams {
  mode: "demo" | "repo";
  repoUrl?: string;
  uploadId: string;
  uploadFilename?: string;
  notes?: string;
}

const stepDefs: { id: StepId; title: string }[] = [
  { id: "extract", title: "Extract" },
  { id: "reproduce", title: "Reproduce" },
  { id: "patch", title: "Patch" },
  { id: "verify", title: "Verify" },
  { id: "ship", title: "Ship" }
];

function initSteps(): JobStep[] {
  return stepDefs.map((step) => ({
    ...step,
    status: "pending",
    logs: []
  }));
}

function now() {
  return new Date().toISOString();
}

function getStep(job: JobData, id: StepId) {
  const step = job.steps.find((s) => s.id === id);
  if (!step) {
    throw new Error(`Missing step ${id}`);
  }
  return step;
}

async function persistJob(job: JobData) {
  job.updatedAt = now();
  const jobDir = getJobDir(job.id);
  await writeJson(path.join(jobDir, "job.json"), job);
}

function logStep(job: JobData, id: StepId, message: string) {
  const step = getStep(job, id);
  step.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function startStep(job: JobData, id: StepId) {
  const step = getStep(job, id);
  step.status = "running";
  step.startedAt = now();
}

function finishStep(job: JobData, id: StepId, status: JobStep["status"], summary?: string) {
  const step = getStep(job, id);
  step.status = status;
  step.endedAt = now();
  if (summary) step.summary = summary;
}

function svgToDataUrl(svg: string) {
  const encoded = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

async function createMockJob(id: string, params: CreateJobParams): Promise<JobData> {
  const createdAt = now();
  const updatedAt = createdAt;
  const job: JobData = {
    id,
    mode: params.mode,
    repoUrl: params.repoUrl,
    uploadId: params.uploadId,
    uploadFilename: params.uploadFilename,
    notes: params.notes,
    createdAt,
    updatedAt,
    status: "success",
    steps: initSteps(),
    shareUrl: `/evidence/${id}`
  };

  const videoInfo = `${params.uploadFilename || params.uploadId}`;
  const repro = await extractReproSteps(
    { notes: params.notes || "", videoInfo },
    { forceMock: true }
  );
  job.reproSteps = repro.steps;

  const testResult = await generatePlaywrightTest(
    { repro, baseUrlHint: "https://example.com" },
    { forceMock: true }
  );
  job.testFile = "mock/generated.spec.ts";
  job.testCode = testResult.testCode;

  const fallbackSource = `"use client";\nimport { useState } from "react";\n\nexport default function BuggyForm() {\n  const [submitted, setSubmitted] = useState(false);\n  const [status, setStatus] = useState("Draft");\n  return <div data-testid="demo-root" />;\n}\n`;
  const currentSource = await readDemoTarget().catch(() => fallbackSource);
  const patchPlan = await generatePatchDiff(
    { repro, testOutput: "Mock run in serverless mode.", currentSource },
    { forceMock: true }
  );
  job.patchDiff = patchPlan.diff;
  job.patchSummary = patchPlan.summary;

  job.verify = {
    passed: true,
    summary: "Mock verification passed",
    output: "Playwright runs are disabled in the Vercel demo. This output is simulated."
  };

  job.evidence = {
    beforeImage: svgToDataUrl(placeholderSvg("Before Patch")),
    afterImage: svgToDataUrl(placeholderSvg("After Patch"))
  };

  const logTime = new Date().toLocaleTimeString();
  const markStep = (id: StepId, summary: string, log: string) => {
    const step = getStep(job, id);
    step.status = "success";
    step.startedAt = createdAt;
    step.endedAt = updatedAt;
    step.summary = summary;
    step.logs.push(`[${logTime}] ${log}`);
  };

  markStep("extract", repro.summary, "Generated mock reproduction steps.");
  markStep("reproduce", "Playwright test generated.", "Generated mock Playwright test.");
  markStep("patch", patchPlan.summary, "Generated mock patch diff.");
  markStep("verify", job.verify.summary, "Skipped Playwright execution in serverless mode.");
  markStep("ship", "Evidence pack ready.", "Packaged mock evidence artifacts.");

  return job;
}

export async function createJob(params: CreateJobParams) {
  if (isVercelRuntime()) {
    const id = randomUUID();
    const job = await createMockJob(id, params);
    jobs.set(id, job);
    return job;
  }
  await ensureArtifactsStructure();
  const id = randomUUID();
  const job: JobData = {
    id,
    mode: params.mode,
    repoUrl: params.repoUrl,
    uploadId: params.uploadId,
    uploadFilename: params.uploadFilename,
    notes: params.notes,
    createdAt: now(),
    updatedAt: now(),
    status: "queued",
    steps: initSteps(),
    shareUrl: `/evidence/${id}`
  };

  jobs.set(id, job);
  await persistJob(job);
  jobQueue.push(job.id);
  void processQueue();

  return job;
}

export async function getJob(id: string) {
  try {
    const jobDir = getJobDir(id);
    const diskJob = await readJson<JobData>(path.join(jobDir, "job.json"));
    if (diskJob) {
      jobs.set(id, diskJob);
      return diskJob;
    }
    const cached = jobs.get(id);
    if (cached) return cached;
    if (isVercelRuntime()) {
      return createMockJob(id, {
        mode: "demo",
        uploadId: "demo.mp4",
        uploadFilename: "demo.mp4",
        notes: ""
      });
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function processQueue() {
  if (runningJobs >= MAX_CONCURRENT_JOBS) return;
  const nextId = jobQueue.shift();
  if (!nextId) return;
  const job = await getJob(nextId);
  if (!job) {
    void processQueue();
    return;
  }
  runningJobs += 1;
  job.status = "running";
  await persistJob(job);
  void runJobWithGuard(job).finally(() => {
    runningJobs -= 1;
    void processQueue();
  });
}

async function runJobWithGuard(job: JobData) {
  try {
    await runJob(job);
  } catch (error: any) {
    job.status = "error";
    logStep(job, "ship", `Job failed: ${error.message || error}`);
    finishStep(job, "ship", "error", "Failed during processing");
    await persistJob(job);
  }
}

async function runJob(job: JobData) {
  const jobDir = getJobDir(job.id);
  await fs.mkdir(jobDir, { recursive: true });
  await resetDemoTarget();
  const repoFallback = job.mode === "repo" && !job.repoUrl;
  const repoDisabled = job.mode === "demo" && Boolean(job.repoUrl);
  let forceMockGemini = job.mode === "demo" || repoFallback || repoDisabled;

  async function callWithGeminiFallback<T>(
    stepId: StepId,
    run: () => Promise<T>,
    fallback: () => Promise<T>
  ) {
    if (forceMockGemini) {
      return fallback();
    }
    try {
      return await run();
    } catch (error) {
      if (isGeminiRecoverableError(error)) {
        forceMockGemini = true;
        logStep(
          job,
          stepId,
          `Gemini unavailable (${getGeminiFallbackReason(error)}). Falling back to mock responses for this run.`
        );
        return fallback();
      }
      throw error;
    }
  }

  const beforeSvg = placeholderSvg("Before Patch");
  await writeText(path.join(jobDir, "before.svg"), beforeSvg);
  job.evidence = { beforeImage: `/api/artifacts/jobs/${job.id}/before.svg` };

  startStep(job, "extract");
  if (repoDisabled) {
    logStep(
      job,
      "extract",
      "Repo mode is disabled in this build. Running the demo pipeline instead."
    );
  }
  if (repoFallback) {
    logStep(
      job,
      "extract",
      "Repo mode is disabled without a repo URL. Falling back to the demo pipeline."
    );
  }
  if (forceMockGemini) {
    logStep(job, "extract", "Demo mode uses deterministic mock responses for reproducibility.");
  }
  logStep(job, "extract", "Analyzing video metadata and notes with Gemini...");
  const videoInfo = `${job.uploadFilename || job.uploadId}`;
  const repro = await callWithGeminiFallback(
    "extract",
    () => extractReproSteps({ notes: job.notes || "", videoInfo }),
    () => extractReproSteps({ notes: job.notes || "", videoInfo }, { forceMock: true })
  );
  job.reproSteps = repro.steps;
  await writeJson(path.join(jobDir, "repro.json"), repro);
  logStep(job, "extract", `Captured ${repro.steps.length} reproduction steps.`);
  finishStep(job, "extract", "success", repro.summary);
  await persistJob(job);

  startStep(job, "reproduce");
  logStep(job, "reproduce", "Generating Playwright test...");
  const testResult = await callWithGeminiFallback(
    "reproduce",
    () => generatePlaywrightTest({ repro, baseUrlHint: process.env.BASE_URL || "http://localhost:3000" }),
    () => generatePlaywrightTest({ repro, baseUrlHint: process.env.BASE_URL || "http://localhost:3000" }, { forceMock: true })
  );
  const testFile = path.join(jobDir, "generated.spec.ts");
  await writeText(testFile, testResult.testCode);
  job.testFile = `artifacts/jobs/${job.id}/generated.spec.ts`;
  job.testCode = testResult.testCode;
  logStep(job, "reproduce", "Running Playwright against the demo target...");
  const reproRun = await runPlaywrightTest(testFile, job.id);
  const reproSummary = reproRun.passed
    ? "Test passed unexpectedly (bug not reproduced)."
    : "Test failed as expected. Bug reproduced.";
  logStep(job, "reproduce", reproSummary);
  finishStep(job, "reproduce", "success", reproSummary);
  await persistJob(job);

  startStep(job, "patch");
  logStep(job, "patch", "Requesting patch plan from Gemini...");
  const currentSource = await readDemoTarget();
  const patchPlan = await callWithGeminiFallback(
    "patch",
    () => generatePatchDiff({ repro, testOutput: reproRun.output, currentSource }),
    () => generatePatchDiff({ repro, testOutput: reproRun.output, currentSource }, { forceMock: true })
  );
  logStep(job, "patch", patchPlan.summary);
  const patchedSource = applyUnifiedDiff(currentSource, patchPlan.diff);
  await writeDemoTarget(patchedSource);
  const diff = createUnifiedDiff("app/demo/buggy-form.tsx", currentSource, patchedSource);
  await writeText(path.join(jobDir, "patch.diff"), diff);
  job.patchDiff = diff;
  job.patchSummary = patchPlan.summary;
  finishStep(job, "patch", "success", patchPlan.summary);
  await persistJob(job);

  startStep(job, "verify");
  logStep(job, "verify", "Re-running Playwright after patch...");
  let verifyRun = await runPlaywrightTest(testFile, job.id);
  let attempts = 1;

  while (!verifyRun.passed && attempts < 2) {
    logStep(job, "verify", "Patch did not resolve. Attempting second patch...");
    const latestSource = await readDemoTarget();
    const followupPatch = await callWithGeminiFallback(
      "verify",
      () => generatePatchDiff({ repro, testOutput: verifyRun.output, currentSource: latestSource }),
      () => generatePatchDiff({ repro, testOutput: verifyRun.output, currentSource: latestSource }, { forceMock: true })
    );
    const followupPatched = applyUnifiedDiff(latestSource, followupPatch.diff);
    await writeDemoTarget(followupPatched);
    const followupDiff = createUnifiedDiff("app/demo/buggy-form.tsx", latestSource, followupPatched);
    await writeText(path.join(jobDir, "patch.diff"), followupDiff);
    job.patchDiff = followupDiff;
    job.patchSummary = followupPatch.summary;
    attempts += 1;
    verifyRun = await runPlaywrightTest(testFile, job.id);
  }

  job.verify = {
    passed: verifyRun.passed,
    summary: verifyRun.summary,
    output: verifyRun.output
  };
  logStep(job, "verify", verifyRun.summary);
  finishStep(job, "verify", verifyRun.passed ? "success" : "error", verifyRun.summary);
  await persistJob(job);

  const afterSvg = placeholderSvg("After Patch");
  await writeText(path.join(jobDir, "after.svg"), afterSvg);
  job.evidence = {
    ...job.evidence,
    afterImage: `/api/artifacts/jobs/${job.id}/after.svg`
  };

  startStep(job, "ship");
  const finalSummary = verifyRun.passed ? "Patch verified. Evidence pack ready." : "Patch failed to verify.";
  finishStep(job, "ship", verifyRun.passed ? "success" : "error", finalSummary);
  job.status = verifyRun.passed ? "success" : "error";
  await persistJob(job);
}
