import { NextResponse } from "next/server";
import { listOrders, getOrder, saveOrder } from "../../../../lib/redis";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function GET(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function PUT(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const body = await req.json();
  const id = String(body.id || "");
  const status = body.status as string;
  if (!id || !["pending", "paid", "delivered", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Thiếu id hoặc status không hợp lệ" }, { status: 400 });
  }
  const order = await getOrder(id, false);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  const next = { ...order, status: status as typeof order.status };
  if (status === "paid" && !order.paidAt) next.paidAt = new Date().toISOString();
  if (status === "delivered") {
    next.deliveredAt = new Date().toISOString();
    if (body.deliveredData) next.deliveredData = String(body.deliveredData);
  }
  await saveOrder(next);
  return NextResponse.json({ order: next });
}
