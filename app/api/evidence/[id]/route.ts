import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  const body = JSON.stringify(job, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="evidence-${job.id}.json"`
    }
  });
}
