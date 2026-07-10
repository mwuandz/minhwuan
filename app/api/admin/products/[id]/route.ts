import { NextResponse } from "next/server";
import { deleteProduct, saveProduct } from "../../../../../lib/redis";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const product = await saveProduct({ ...body, id });
  return NextResponse.json({ product });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const { id } = await params;
  const deleted = await deleteProduct(id);
  return NextResponse.json({ deleted });
}
