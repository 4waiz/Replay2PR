import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { writeText } from "@/lib/artifacts";

const execAsync = promisify(exec);

export interface PlaywrightResult {
  passed: boolean;
  summary: string;
  output: string;
  outputPath: string;
}

export async function runPlaywrightTest(testFile: string, jobId: string): Promise<PlaywrightResult> {
  const cwd = process.cwd();
  const outputPath = path.join(cwd, "artifacts", "jobs", jobId, "playwright-output");
  const command = `npx playwright test "${testFile}" --reporter=line --output="${outputPath}"`;
  const env = {
    ...process.env,
    BASE_URL: process.env.BASE_URL || "http://localhost:3000"
  };

  try {
    const { stdout, stderr } = await execAsync(command, { cwd, env, timeout: 120000 });
    const output = `${stdout}\n${stderr}`.trim();
    await writeText(path.join(cwd, "artifacts", "jobs", jobId, "playwright.log"), output);
    return {
      passed: true,
      summary: "Playwright run passed",
      output,
      outputPath
    };
  } catch (error: any) {
    const output = `${error?.stdout || ""}\n${error?.stderr || ""}`.trim();
    await writeText(path.join(cwd, "artifacts", "jobs", jobId, "playwright.log"), output);
    return {
      passed: false,
      summary: "Playwright run failed",
      output,
      outputPath
    };
  }
}
