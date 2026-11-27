import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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
    const name = String(body.name || "").trim();
    const contact = String(body.contact || "").trim();
    const email = String(body.email || "").trim() || undefined;
    const password = String(body.password || "");

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên (tối thiểu 2 ký tự)" }, { status: 400 });
    }
    if (!contact || contact.length < 8) {
      return NextResponse.json({ error: "Vui lòng nhập Zalo / SĐT hợp lệ" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    const existing = await getCustomerByContact(contact);
    if (existing) {
      return NextResponse.json({ error: "Số Zalo/SĐT này đã được đăng ký. Hãy đăng nhập." }, { status: 409 });
    }

    const customer: Customer = {
      id: randomUUID(),
      name,
      contact,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    await saveCustomer(customer);
    const session = await createSession(customer.id);

    return NextResponse.json({
      customer: toPublic(customer),
      token: session.token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Không thể đăng ký. Thử lại sau." }, { status: 500 });
  }
}
