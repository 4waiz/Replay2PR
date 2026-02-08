import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { createUnifiedDiff } from "@/lib/patcher";
import { isMockGemini } from "@/lib/env";

const FLASH_MODEL = process.env.GEMINI_MODEL_FLASH || "gemini-3-flash";
const PRO_MODEL = process.env.GEMINI_MODEL_PRO || "gemini-3-pro";

const demoRepro = {
  summary: "Submitting the replay form never shows the success banner.",
  steps: [
    "Open the demo page at /demo",
    "Fill out the Name, Issue ID, and Steps fields",
    "Click 'Send Replay Report'",
    "Observe that the success banner never appears"
  ],
  expected: "A success banner and Sent status should appear.",
  actual: "The status returns to Draft and no success banner shows.",
  confidence: "high"
};

const demoTestCode = `import { test, expect } from "@playwright/test";

test("replay form should show success banner", async ({ page }) => {
  await page.goto("/demo");
  await page.getByTestId("name-input").fill("Ava Pilot");
  await page.getByTestId("issue-input").fill("RPL-102");
  await page.getByTestId("steps-input").fill("Click the submit button");
  await page.getByTestId("submit-button").click();
  await expect(page.getByTestId("success-banner")).toBeVisible();
  await expect(page.getByTestId("status-chip")).toHaveText(/Sent/i);
});
`;

const ReproSchema = z.object({
  summary: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
  expected: z.string().min(1),
  actual: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"])
});

const TestSchema = z.object({
  testCode: z.string().min(1)
});

const PatchSchema = z.object({
  summary: z.string().min(1),
  diff: z.string().min(1)
});

function extractJson(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new Error("No JSON object found in Gemini response");
  }
  const sliced = text.slice(first, last + 1);
  return JSON.parse(sliced);
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 2) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= maxRetries) throw error;
      const delay = 500 * Math.pow(2, attempt);
      await wait(delay);
      attempt += 1;
    }
  }
}

async function callGeminiJson<T>(prompt: string, modelName: string, schema: z.ZodSchema<T>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = extractJson(text);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Gemini response validation failed: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

export async function extractReproSteps(params: { notes: string; videoInfo: string }) {
  if (isMockGemini()) {
    return ReproSchema.parse(demoRepro);
  }
  const prompt = `You are a QA automation lead. Extract strict JSON with the following schema:
{
  "summary": string,
  "steps": string[],
  "expected": string,
  "actual": string,
  "confidence": "low"|"medium"|"high"
}
Video metadata: ${params.videoInfo}
User notes: ${params.notes || "(none)"}
Return only JSON.`;

  return callGeminiJson(prompt, FLASH_MODEL, ReproSchema);
}

export async function generatePlaywrightTest(params: { repro: typeof demoRepro; baseUrlHint: string }) {
  if (isMockGemini()) {
    return TestSchema.parse({ testCode: demoTestCode });
  }

  const prompt = `You are generating a Playwright test (TypeScript) for a Next.js demo app.
Constraints:
- Use @playwright/test
- Base URL: ${params.baseUrlHint}
- Target page: /demo
- Use data-testid selectors if possible
- Output strict JSON with schema { "testCode": string }
Repro steps: ${JSON.stringify(params.repro, null, 2)}
Return only JSON.`;

  return callGeminiJson(prompt, FLASH_MODEL, TestSchema);
}

export async function generatePatchDiff(params: { repro: typeof demoRepro; testOutput: string; currentSource: string }) {
  if (isMockGemini()) {
    const after = params.currentSource
      .replace("setSubmitted(false)", "setSubmitted(true)")
      .replace("setStatus(\"Draft\")", "setStatus(\"Sent\")");
    const diff = createUnifiedDiff("app/demo/buggy-form.tsx", params.currentSource, after);
    return PatchSchema.parse({
      summary: "Flip submitted state to true and update status to Sent.",
      diff
    });
  }

  const prompt = `You are a senior frontend engineer. Provide a unified diff patch ONLY for app/demo/buggy-form.tsx.
Constraints:
- Keep changes minimal
- Fix the bug so the success banner appears after submit
- Output strict JSON with schema { "summary": string, "diff": string }

Repro: ${JSON.stringify(params.repro, null, 2)}
Test output: ${params.testOutput}
Current file:\n${params.currentSource}

Return only JSON.`;

  return callGeminiJson(prompt, PRO_MODEL, PatchSchema);
}
