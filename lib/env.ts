export function parseBoolean(value?: string) {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return ["true", "1", "yes", "y", "on"].includes(normalized);
}

export function isMockGemini() {
  return !process.env.GEMINI_API_KEY || parseBoolean(process.env.USE_MOCK_GEMINI);
}

export function getMaxUploadMb() {
  const raw = Number(process.env.MAX_UPLOAD_MB || 50);
  return Number.isFinite(raw) && raw > 0 ? raw : 50;
}

export function getMaxConcurrentJobs() {
  const raw = Number(process.env.MAX_CONCURRENT_JOBS || 1);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}
