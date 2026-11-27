import { NextRequest, NextResponse } from "next/server";
import { getSpinConfig, listSpinResults, saveSpinConfig } from "@/lib/spin";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function GET(req: NextRequest) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const [config, results] = await Promise.all([getSpinConfig(), listSpinResults(80)]);
  return NextResponse.json({ config, results });
}

export async function POST(req: NextRequest) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const body = await req.json();
  const config = await saveSpinConfig(body);
  return NextResponse.json({ config });
}
