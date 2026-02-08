import fs from "fs/promises";
import path from "path";

export const ARTIFACTS_ROOT = path.join(process.cwd(), "artifacts");

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function getUploadsDir() {
  return path.join(ARTIFACTS_ROOT, "uploads");
}

export function getJobsDir() {
  return path.join(ARTIFACTS_ROOT, "jobs");
}

export function getJobDir(jobId: string) {
  return safeJoin(getJobsDir(), jobId);
}

export async function writeText(filePath: string, contents: string) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents, "utf8");
}

export async function readText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

export async function writeJson(filePath: string, data: unknown) {
  await writeText(filePath, JSON.stringify(data, null, 2));
}

export async function readJson<T>(filePath: string): Promise<T | undefined> {
  const content = await readText(filePath);
  if (!content) return undefined;
  return JSON.parse(content) as T;
}

export function safeJoin(base: string, target: string) {
  const resolved = path.resolve(base, target);
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error("Unsafe path");
  }
  return resolved;
}

export async function ensureArtifactsStructure() {
  await ensureDir(getUploadsDir());
  await ensureDir(getJobsDir());
}

export function placeholderSvg(label: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0%" stop-color="#0b1220"/>\n      <stop offset="50%" stop-color="#142035"/>\n      <stop offset="100%" stop-color="#0b1220"/>\n    </linearGradient>\n  </defs>\n  <rect width="1200" height="675" rx="28" fill="url(#g)"/>\n  <rect x="70" y="70" width="1060" height="535" rx="22" stroke="#1f2a3a" stroke-width="2" fill="#0e1726"/>\n  <text x="120" y="190" font-family="Arial" font-size="42" fill="#93c5fd" font-weight="700">${label}</text>\n  <text x="120" y="245" font-family="Arial" font-size="22" fill="#9ab0c8">Replay2PR Evidence Placeholder</text>\n  <text x="120" y="515" font-family="Arial" font-size="18" fill="#6b7d96">Generated for demo mode. Replace with real Playwright screenshots when available.</text>\n</svg>`;
}
