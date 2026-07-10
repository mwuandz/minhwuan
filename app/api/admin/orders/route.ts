import { NextResponse } from "next/server";
import { listOrders } from "../../../../lib/redis";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  }
  const orders = await listOrders();
  return NextResponse.json({ orders });
}
