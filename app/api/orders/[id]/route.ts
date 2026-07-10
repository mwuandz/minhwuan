import { NextResponse } from "next/server";
import { getOrder } from "../../../../lib/redis";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hoặc đơn đã hết hạn" }, { status: 404 });
  return NextResponse.json({ order });
}
