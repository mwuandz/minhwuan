import { NextResponse } from "next/server";
import { getProduct } from "../../../lib/products";
import { saveOrder } from "../../../lib/redis";
import { Order } from "../../../lib/types";
import { sendTelegramMessage } from "../../../lib/telegram";
import { getPayOS } from "../../../lib/payos";

function makeOrderCode() {
  return Math.floor(Date.now() / 1000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = getProduct(body.productId);
    if (!product) return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 });
    if (!body.customerName || !body.customerContact) {
      return NextResponse.json({ error: "Thiếu thông tin khách hàng" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const orderCode = makeOrderCode();
    const id = `MW-${orderCode}`;
    const paymentContent = id;

    const order: Order = {
      id,
      orderCode,
      productId: product.id,
      productName: product.name,
      amount: product.price,
      customerName: body.customerName,
      customerContact: body.customerContact,
      customerEmail: body.customerEmail,
      status: "pending",
      paymentContent,
      createdAt: new Date().toISOString()
    };

    const payOS = getPayOS();
    if (payOS) {
      const paymentLinkRes = await payOS.createPaymentLink({
        orderCode,
        amount: product.price,
        description: paymentContent.slice(0, 25),
        items: [{ name: product.name, quantity: 1, price: product.price }],
        returnUrl: `${baseUrl}/checkout/${id}`,
        cancelUrl: `${baseUrl}/checkout/${id}`
      });
      order.checkoutUrl = paymentLinkRes.checkoutUrl;
      order.qrCode = paymentLinkRes.qrCode;
    } else {
      order.qrCode = `https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=${product.price}&addInfo=${encodeURIComponent(paymentContent)}&accountName=MINHWUAN%20STORE`;
    }

    await saveOrder(order);

    await sendTelegramMessage(
      `🛒 <b>ĐƠN HÀNG MỚI</b>\n\n` +
      `Mã đơn: <code>${order.id}</code>\n` +
      `Sản phẩm: ${order.productName}\n` +
      `Số tiền: ${order.amount.toLocaleString("vi-VN")}đ\n` +
      `Khách: ${order.customerName}\n` +
      `Liên hệ: ${order.customerContact}\n` +
      `Trạng thái: Chờ thanh toán`
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
