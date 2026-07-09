import { NextResponse } from "next/server";
import { getOrder, saveOrder } from "../../../../lib/redis";
import { sendTelegramMessage } from "../../../../lib/telegram";

export async function POST(req: Request) {
  const body = await req.json();
  const order = await getOrder(body.id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });

  order.status = "paid";
  order.paidAt = new Date().toISOString();

  await saveOrder(order);

  const itemLines = (order.items || [])
    .map((item) => `• ${item.name} x${item.quantity} = ${item.subtotal.toLocaleString("vi-VN")}đ`)
    .join("\n");

  await sendTelegramMessage(
    `✅ <b>DEMO THANH TOÁN THÀNH CÔNG - CẦN GỬI SẢN PHẨM</b>\n\n` +
    `Mã đơn: <code>${order.id}</code>\n` +
    `Tổng tiền: <b>${order.amount.toLocaleString("vi-VN")}đ</b>\n\n` +
    `<b>Sản phẩm:</b>\n${itemLines || order.productName}\n\n` +
    `<b>Khách:</b> ${order.customerName}\n` +
    `<b>Liên hệ:</b> ${order.customerContact}\n` +
    `Trạng thái: Đã thanh toán, admin gửi sản phẩm thủ công.`
  );

  return NextResponse.json({ order });
}
