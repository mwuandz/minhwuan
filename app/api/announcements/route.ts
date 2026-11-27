import { NextResponse } from "next/server";
import { listAnnouncements } from "@/lib/spin";

export async function GET() {
  const announcements = await listAnnouncements(false);
  return NextResponse.json({ announcements });
}
