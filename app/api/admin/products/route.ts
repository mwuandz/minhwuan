import { NextResponse } from "next/server";
import { listProducts, saveProduct } from "../../../../lib/redis";

function checkPassword(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function GET(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const products = await listProducts(true);
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  if (!checkPassword(req)) return NextResponse.json({ error: "Sai mật khẩu admin" }, { status: 401 });
  const body = await req.json();
  if (!body.name || Number(body.price) < 0) {
    return NextResponse.json({ error: "Thiếu tên sản phẩm hoặc giá không hợp lệ" }, { status: 400 });
  }
  const product = await saveProduct(body);
  return NextResponse.json({ product });
}
