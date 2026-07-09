import { NextResponse } from "next/server";
import { getProduct } from "../../../lib/products";
import { saveOrder } from "../../../lib/redis";
import { Order } from "../../../lib/types";
import { sendTelegramMessage } from "../../../lib/telegram";

function makeOrderCode() {
  return Math.floor(Date.now() / 1000);
}

function makeVietQrUrl(amount: number, paymentContent: string) {
  const bankBin = process.env.VIETQR_BANK_BIN || "970436";
  const accountNo = process.env.VIETQR_ACCOUNT_NO || "0123456789";
  const accountName = process.env.VIETQR_ACCOUNT_NAME || "MINHWUAN STORE";
  const template = process.env.VIETQR_TEMPLATE || "compact2";

  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(paymentContent)}&accountName=${encodeURIComponent(accountName)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = getProduct(body.productId);
    if (!product) return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 });
    if (!body.customerName || !body.customerContact) {
      return NextResponse.json({ error: "Thiếu thông tin khách hàng" }, { status: 400 });
    }

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
      qrCode: makeVietQrUrl(product.price, paymentContent),
      createdAt: new Date().toISOString()
    };

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
