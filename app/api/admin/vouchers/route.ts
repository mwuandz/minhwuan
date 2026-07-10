import { NextResponse } from "next/server";
import { listVouchers, saveVoucher } from "../../../../lib/redis";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function GET(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const vouchers = await listVouchers(true);
  return NextResponse.json({ vouchers });
}

export async function POST(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const body = await req.json();
  if (!body.code || Number(body.value) <= 0) {
    return NextResponse.json({ error: "Thiếu mã voucher hoặc giá trị giảm không hợp lệ" }, { status: 400 });
  }
  const voucher = await saveVoucher(body);
  return NextResponse.json({ voucher });
}
