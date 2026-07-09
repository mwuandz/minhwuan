import { NextResponse } from "next/server";
import { getProduct, saveOrder } from "../../../lib/redis";
import { CartItem, Order } from "../../../lib/types";
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

async function normalizeItems(body: any): Promise<CartItem[]> {
  const rawItems = Array.isArray(body.items) ? body.items : body.productId ? [{ productId: body.productId, quantity: 1 }] : [];

  const mapped = rawItems
    .map(async (item: any) => {
      const product = await getProduct(String(item.productId || ""));
      if (!product) return null;
      const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        duration: product.duration,
        price: product.price,
        quantity,
        subtotal: product.price * quantity
      } satisfies CartItem;
    });

  const items = await Promise.all(mapped);
  return items.filter(Boolean) as CartItem[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = await normalizeItems(body);

    if (!items.length) {
      return NextResponse.json({ error: "Giỏ hàng trống hoặc sản phẩm không tồn tại" }, { status: 400 });
    }

    if (!body.customerName || !body.customerContact) {
      return NextResponse.json({ error: "Thiếu thông tin khách hàng" }, { status: 400 });
    }

    const amount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const orderCode = makeOrderCode();
    const id = `MW-${orderCode}`;
    const paymentContent = id;
    const productName = items.length === 1 ? items[0].name : `${items.length} sản phẩm trong giỏ hàng`;

    const order: Order = {
      id,
      orderCode,
      productId: items[0].productId,
      productName,
      items,
      amount,
      customerName: String(body.customerName),
      customerContact: String(body.customerContact),
      customerEmail: body.customerEmail ? String(body.customerEmail) : undefined,
      customerNote: body.customerNote ? String(body.customerNote) : undefined,
      status: "pending",
      paymentContent,
      qrCode: makeVietQrUrl(amount, paymentContent),
      createdAt: new Date().toISOString()
    };

    await saveOrder(order);

    const itemLines = items
      .map((item) => `• ${item.name} x${item.quantity} = ${item.subtotal.toLocaleString("vi-VN")}đ`)
      .join("\n");

    await sendTelegramMessage(
      `🛒 <b>ĐƠN HÀNG MỚI - CHỜ THANH TOÁN</b>\n\n` +
      `Mã đơn: <code>${order.id}</code>\n` +
      `Tổng tiền: <b>${order.amount.toLocaleString("vi-VN")}đ</b>\n\n` +
      `<b>Sản phẩm:</b>\n${itemLines}\n\n` +
      `<b>Khách:</b> ${order.customerName}\n` +
      `<b>Liên hệ:</b> ${order.customerContact}\n` +
      `${order.customerEmail ? `<b>Email:</b> ${order.customerEmail}\n` : ""}` +
      `${order.customerNote ? `<b>Ghi chú:</b> ${order.customerNote}\n` : ""}` +
      `Trạng thái: Chờ khách thanh toán`
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
