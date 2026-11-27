import { NextRequest, NextResponse } from "next/server";
import { getCustomerFromToken } from "@/lib/redis";
import type { Customer, CustomerPublic } from "@/lib/types";

function toPublic(c: Customer): CustomerPublic {
  return {
    id: c.id,
    name: c.name,
    contact: c.contact,
    email: c.email,
    createdAt: c.createdAt,
  };
}

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

    return NextResponse.json({ customer: toPublic(customer) });
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
