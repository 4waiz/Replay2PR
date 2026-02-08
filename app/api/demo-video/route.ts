import { NextResponse } from "next/server";
import { ensureDemoVideo } from "@/lib/demo-video";

export const runtime = "nodejs";

export async function GET() {
  const url = await ensureDemoVideo();
  return NextResponse.json({ url });
}
