import { NextRequest, NextResponse } from "next/server";
import { getCustomerFromToken, getOrdersByContact } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.headers.get("x-customer-token") ||
      req.nextUrl.searchParams.get("token") ||
      "";

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const customer = await getCustomerFromToken(token);
    if (!customer) {
      return NextResponse.json({ error: "Phiên đăng nhập hết hạn" }, { status: 401 });
    }

    const orders = await getOrdersByContact(customer.contact);
    const sorted = orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ orders: sorted });
  } catch (err) {
    console.error("My orders error:", err);
    return NextResponse.json({ error: "Lỗi tải đơn hàng" }, { status: 500 });
  }
}
