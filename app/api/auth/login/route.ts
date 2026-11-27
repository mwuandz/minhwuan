import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getCustomerByContact,
  hashPassword,
  saveCustomer,
} from "@/lib/redis";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contact = String(body.contact || "").trim();
    const password = String(body.password || "");

    if (!contact || !password) {
      return NextResponse.json({ error: "Nhập Zalo/SĐT và mật khẩu" }, { status: 400 });
    }

    const customer = await getCustomerByContact(contact);
    if (!customer || customer.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Sai Zalo/SĐT hoặc mật khẩu" }, { status: 401 });
    }

    customer.lastLoginAt = new Date().toISOString();
    await saveCustomer(customer);
    const session = await createSession(customer.id);

    return NextResponse.json({
      customer: toPublic(customer),
      token: session.token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Không thể đăng nhập" }, { status: 500 });
  }
}
