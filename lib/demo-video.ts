import fs from "fs/promises";
import path from "path";
import { ensureDir, getUploadsDir } from "@/lib/artifacts";

const base64Path = path.join(process.cwd(), "assets", "demo-video.b64");
const publicPath = path.join(process.cwd(), "public", "demo.mp4");

export async function ensureDemoVideo() {
  try {
    await fs.access(publicPath);
    return "/demo.mp4";
  } catch {
    const b64 = await fs.readFile(base64Path, "utf8");
    const buffer = Buffer.from(b64, "base64");
    await ensureDir(path.dirname(publicPath));
    await fs.writeFile(publicPath, buffer);
    return "/demo.mp4";
  }
}

export async function createDemoUpload() {
  const url = await ensureDemoVideo();
  const uploadId = `demo-${Date.now()}.mp4`;
  const uploadPath = path.join(getUploadsDir(), uploadId);
  await ensureDir(getUploadsDir());
  const source = path.join(process.cwd(), "public", "demo.mp4");
  await fs.copyFile(source, uploadPath);
  return { uploadId, url, filename: "demo.mp4", uploadPath };
}
