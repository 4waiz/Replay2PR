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

function normalizeErrorMessage(error: unknown) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Unknown error";
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function isGeminiQuotaError(error: unknown) {
  const message = normalizeErrorMessage(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("quota") ||
    message.includes("rate limit")
  );
}

export function isGeminiModelNotFoundError(error: unknown) {
  const message = normalizeErrorMessage(error).toLowerCase();
  return (
    message.includes("not found for api version") ||
    message.includes("not supported for generatecontent") ||
    message.includes("model is not found") ||
    (message.includes("models/") && message.includes("not found"))
  );
}

export function isGeminiRecoverableError(error: unknown) {
  return isGeminiQuotaError(error) || isGeminiModelNotFoundError(error);
}

export function getGeminiFallbackReason(error: unknown) {
  if (isGeminiQuotaError(error)) return "quota or rate limit";
  if (isGeminiModelNotFoundError(error)) return "model not available";
  return "unexpected error";
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  maxRetries = 2,
  shouldRetry?: (error: unknown) => boolean
) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
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

  return withRetry(
    async () => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const json = extractJson(text);
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new Error(`Gemini response validation failed: ${parsed.error.message}`);
      }
      return parsed.data;
    },
    2,
    (error) => !isGeminiRecoverableError(error)
  );
}

export async function extractReproSteps(
  params: { notes: string; videoInfo: string },
  options?: { forceMock?: boolean }
) {
  if (options?.forceMock || isMockGemini()) {
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

export async function generatePlaywrightTest(
  params: { repro: typeof demoRepro; baseUrlHint: string },
  options?: { forceMock?: boolean }
) {
  if (options?.forceMock || isMockGemini()) {
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

export async function generatePatchDiff(
  params: { repro: typeof demoRepro; testOutput: string; currentSource: string },
  options?: { forceMock?: boolean }
) {
  if (options?.forceMock || isMockGemini()) {
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

  try {
    return await callGeminiJson(prompt, PRO_MODEL, PatchSchema);
  } catch (error) {
    if (isGeminiRecoverableError(error) && PRO_MODEL !== FLASH_MODEL) {
      return callGeminiJson(prompt, FLASH_MODEL, PatchSchema);
    }
    throw error;
  }
}
