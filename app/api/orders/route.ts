import { NextResponse } from "next/server";
import { getProduct, getSettings, saveOrder, validateVoucher } from "../../../lib/redis";
import { CartItem, Order } from "../../../lib/types";
import { sendTelegramMessage } from "../../../lib/telegram";

function makeOrderCode() {
  return Date.now();
}


function getActiveFlashSalePrice(product: { id: string; price: number; badge?: string; category: string }, settings: any, nowMs: number) {
  const endsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  if (settings.flashSaleEnabled === false) return product.price;
  if (endsAt > 0 && endsAt <= nowMs) return product.price;

  const selectedIds = settings.flashSaleProductIds || [];
  const isSelected = selectedIds.length ? selectedIds.includes(product.id) : /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`);
  if (!isSelected) return product.price;

  const salePrice = Number(settings.flashSalePrices?.[product.id] || 0);
  if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= product.price) return product.price;
  return salePrice;
}

function makeVietQrUrl(amount: number, paymentContent: string) {
  const bankBin = process.env.VIETQR_BANK_BIN || "970422";
  const accountNo = process.env.VIETQR_ACCOUNT_NO || "0123456789";
  const accountName = process.env.VIETQR_ACCOUNT_NAME || "MINHWUAN STORE";
  const template = process.env.VIETQR_TEMPLATE || "compact2";

  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(paymentContent)}&accountName=${encodeURIComponent(accountName)}`;
}

async function normalizeItems(body: any): Promise<CartItem[]> {
  const settings = await getSettings();
  const nowMs = Date.now();
  const rawItems = Array.isArray(body.items) ? body.items : body.productId ? [{ productId: body.productId, quantity: 1 }] : [];

  const mapped = rawItems
    .map(async (item: any) => {
      const product = await getProduct(String(item.productId || ""));
      if (!product) return null;
      const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      const activePrice = getActiveFlashSalePrice(product, settings, nowMs);
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        duration: product.duration,
        price: activePrice,
        quantity,
        subtotal: activePrice * quantity
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

    const originalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (originalAmount <= 0) {
      return NextResponse.json({ error: "Sản phẩm cần liên hệ shop để báo giá" }, { status: 400 });
    }

    const voucherCode = String(body.voucherCode || "").trim().toUpperCase();
    const voucherResult = voucherCode ? await validateVoucher(voucherCode, originalAmount, items) : null;
    const discountAmount = voucherResult?.valid ? voucherResult.discountAmount : 0;
    const amount = Math.max(1000, originalAmount - discountAmount);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
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
      originalAmount,
      discountAmount,
      voucherCode: discountAmount > 0 ? voucherCode : undefined,
      voucherEligibleAmount: voucherResult?.valid ? voucherResult.eligibleAmount : undefined,
      customerName: String(body.customerName),
      customerContact: String(body.customerContact),
      customerEmail: body.customerEmail ? String(body.customerEmail) : undefined,
      customerNote: body.customerNote ? String(body.customerNote) : undefined,
      status: "pending",
      paymentContent,
      qrCode: makeVietQrUrl(amount, paymentContent),
      createdAt: now.toISOString(),
      expiresAt
    };

    await saveOrder(order);

    const itemLines = items
      .map((item) => `• ${item.name} x${item.quantity} = ${item.subtotal.toLocaleString("vi-VN")}đ`)
      .join("\n");

    try {
      await sendTelegramMessage(
        `🛒 <b>ĐƠN HÀNG MỚI - CHỜ THANH TOÁN</b>\n\n` +
        `Mã đơn: <code>${order.id}</code>\n` +
        `Tổng gốc: ${originalAmount.toLocaleString("vi-VN")}đ\n` +
        `${discountAmount > 0 ? `Voucher: ${voucherCode} -${discountAmount.toLocaleString("vi-VN")}đ${voucherResult?.eligibleProductNames?.length ? ` (áp dụng: ${voucherResult.eligibleProductNames.join(", ")})` : ""}\n` : ""}` +
        `Cần thanh toán: <b>${order.amount.toLocaleString("vi-VN")}đ</b>\n` +
        `Hết hạn: ${new Date(order.expiresAt!).toLocaleString("vi-VN")}\n\n` +
        `<b>Sản phẩm:</b>\n${itemLines}\n\n` +
        `<b>Khách:</b> ${order.customerName}\n` +
        `<b>Liên hệ:</b> ${order.customerContact}\n` +
        `${order.customerEmail ? `<b>Email:</b> ${order.customerEmail}\n` : ""}` +
        `${order.customerNote ? `<b>Ghi chú:</b> ${order.customerNote}\n` : ""}` +
        `Trạng thái: Chờ khách thanh toán`
      );
    } catch (telegramError) {
      console.error("Telegram order notification failed", telegramError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
