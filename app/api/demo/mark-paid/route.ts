import { NextResponse } from "next/server";
import { getOrder, saveOrder } from "../../../../lib/redis";
import { getProduct } from "../../../../lib/products";
import { sendTelegramMessage } from "../../../../lib/telegram";

export async function POST(req: Request) {
  const body = await req.json();
  const order = await getOrder(body.id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });

  const product = getProduct(order.productId);
  order.status = product?.deliveryType === "auto" ? "delivered" : "paid";
  order.paidAt = new Date().toISOString();

  if (product?.deliveryType === "auto" && product.stock?.length) {
    order.deliveredData = product.stock[0];
    order.deliveredAt = new Date().toISOString();
  }

  await saveOrder(order);
  await sendTelegramMessage(
    `✅ <b>THANH TOÁN THÀNH CÔNG</b>\n\n` +
    `Mã đơn: <code>${order.id}</code>\n` +
    `Sản phẩm: ${order.productName}\n` +
    `Số tiền: ${order.amount.toLocaleString("vi-VN")}đ\n` +
    `Khách: ${order.customerName}\n` +
    `Trạng thái: ${order.status === "delivered" ? "Đã giao tự động" : "Cần xử lý thủ công"}`
  );

  return NextResponse.json({ order });
}
