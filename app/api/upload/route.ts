import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { ensureArtifactsStructure, getUploadsDir } from "@/lib/artifacts";
import { getMaxUploadMb } from "@/lib/env";

export const runtime = "nodejs";

const MAX_UPLOAD_MB = getMaxUploadMb();

export async function POST(request: Request) {
  await ensureArtifactsStructure();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const originalName = file.name || "upload.mp4";
  const ext = path.extname(originalName).toLowerCase();
  const isMp4Ext = ext === ".mp4";
  const isMp4Mime = file.type === "video/mp4";
  if (!isMp4Ext || !isMp4Mime) {
    return NextResponse.json({ error: "Only MP4 files are supported (mime + .mp4 extension required)" }, { status: 400 });
  }

  const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File exceeds ${MAX_UPLOAD_MB}MB limit` }, { status: 400 });
  }

  const uploadId = `upload-${randomUUID()}.mp4`;
  const uploadPath = path.join(getUploadsDir(), uploadId);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(uploadPath, Buffer.from(arrayBuffer));

  return NextResponse.json({
    uploadId,
    filename: file.name,
    size: file.size,
    mimeType: file.type
  });
}
