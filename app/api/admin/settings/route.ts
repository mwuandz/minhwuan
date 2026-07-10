import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "../../../../lib/redis";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function GET(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const body = await req.json();
  const settings = await saveSettings(body);
  return NextResponse.json({ settings });
}
