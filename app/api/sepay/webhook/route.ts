import { NextResponse } from "next/server";
import { getOrder, saveOrder } from "../../../../lib/redis";
import { getProduct } from "../../../../lib/products";
import { sendTelegramMessage } from "../../../../lib/telegram";
import { getPayOS } from "../../../../lib/payos";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payOS = getPayOS();

    let data = body?.data;
    if (payOS) {
      data = payOS.verifyPaymentWebhookData(body);
    }

    const orderCode = data?.orderCode;
    if (!orderCode) return NextResponse.json({ success: true });

    const id = `MW-${orderCode}`;
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ success: true });

    const isPaid = data?.code === "00" || body?.success === true || data?.amount === order.amount;
    if (!isPaid) return NextResponse.json({ success: true });

    const product = getProduct(order.productId);
    order.status = product?.deliveryType === "auto" ? "delivered" : "paid";
    order.paidAt = new Date().toISOString();

    if (product?.deliveryType === "auto" && product.stock?.length) {
      order.deliveredData = product.stock[0];
      order.deliveredAt = new Date().toISOString();
    }

    await saveOrder(order);

    await sendTelegramMessage(
      `✅ <b>ĐƠN HÀNG ĐÃ THANH TOÁN</b>\n\n` +
      `Mã đơn: <code>${order.id}</code>\n` +
      `Sản phẩm: ${order.productName}\n` +
      `Số tiền: ${order.amount.toLocaleString("vi-VN")}đ\n` +
      `Khách: ${order.customerName}\n` +
      `Liên hệ: ${order.customerContact}\n` +
      `Trạng thái: ${order.status === "delivered" ? "Đã giao tự động" : "Cần xử lý thủ công"}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
