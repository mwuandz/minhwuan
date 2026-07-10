import { NextResponse } from "next/server";
import { deleteVoucher, saveVoucher } from "../../../../../lib/redis";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function PUT(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const { code } = await params;
  const body = await req.json();
  const voucher = await saveVoucher({ ...body, code });
  return NextResponse.json({ voucher });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const { code } = await params;
  const deleted = await deleteVoucher(code);
  return NextResponse.json({ deleted });
}
