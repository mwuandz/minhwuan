import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token =
      req.headers.get("x-customer-token") ||
      String(body.token || "");

    if (token) await deleteSession(token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
