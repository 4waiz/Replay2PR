import { NextResponse } from "next/server";
import { z } from "zod";
import { createJob } from "@/lib/jobs";
import { createDemoUpload } from "@/lib/demo-video";
import { isVercelRuntime } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  demoMode: z.boolean().default(true),
  uploadId: z.string().optional(),
  uploadFilename: z.string().optional(),
  notes: z.string().optional(),
  repoUrl: z.string().url().optional()
});

export async function POST(request: Request) {
  const isServerless = isVercelRuntime();
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { demoMode, uploadId, uploadFilename, notes, repoUrl } = parsed.data;
  let finalUploadId = uploadId;
  let finalUploadFilename = uploadFilename;

  if (demoMode) {
    if (isServerless) {
      finalUploadId = "demo.mp4";
      finalUploadFilename = "demo.mp4";
    } else {
      const demo = await createDemoUpload();
      finalUploadId = demo.uploadId;
      finalUploadFilename = demo.filename;
    }
  }

  if (!finalUploadId) {
    const message = isServerless
      ? "Uploads are disabled in the Vercel demo. Enable Demo Mode to continue."
      : "Upload is required when demo mode is off";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const job = await createJob({
    mode: demoMode ? "demo" : "repo",
    repoUrl,
    uploadId: finalUploadId,
    uploadFilename: finalUploadFilename,
    notes
  });

  return NextResponse.json({
    jobId: job.id,
    shareUrl: job.shareUrl
  });
}
