import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { getJobDir, writeText } from "@/lib/artifacts";

const execAsync = promisify(exec);

export interface PlaywrightResult {
  passed: boolean;
  summary: string;
  output: string;
  outputPath: string;
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureServerReachable(baseUrl: string, timeoutMs = 10_000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl, { method: "GET", cache: "no-store" });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    const delay = Math.min(1500, 300 * Math.pow(2, attempt));
    await wait(delay);
    attempt += 1;
  }
  return false;
}

export async function runPlaywrightTest(testFile: string, jobId: string): Promise<PlaywrightResult> {
  const cwd = process.cwd();
  const jobDir = getJobDir(jobId);
  const outputPath = path.join(jobDir, "playwright-output");
  const command = `npx playwright test "${testFile}" --reporter=line --output="${outputPath}"`;
  const env = {
    ...process.env,
    BASE_URL: process.env.BASE_URL || "http://localhost:3000"
  };

  try {
    const reachable = await ensureServerReachable(env.BASE_URL);
    if (!reachable) {
      const output = `Base URL not reachable: ${env.BASE_URL}`;
      await writeText(path.join(jobDir, "playwright.log"), output);
      return {
        passed: false,
        summary: "Playwright skipped (server unreachable)",
        output,
        outputPath
      };
    }
    const { stdout, stderr } = await execAsync(command, { cwd, env, timeout: 120000 });
    const output = `${stdout}\n${stderr}`.trim();
    await writeText(path.join(jobDir, "playwright.log"), output);
    return {
      passed: true,
      summary: "Playwright run passed",
      output,
      outputPath
    };
  } catch (error: any) {
    const output = `${error?.stdout || ""}\n${error?.stderr || ""}`.trim();
    await writeText(path.join(jobDir, "playwright.log"), output);
    return {
      passed: false,
      summary: "Playwright run failed",
      output,
      outputPath
    };
  }
}
