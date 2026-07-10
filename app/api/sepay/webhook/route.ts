import { NextResponse } from "next/server";
import { getOrder, markVoucherUsed, saveOrder } from "../../../../lib/redis";
import { sendTelegramMessage } from "../../../../lib/telegram";

function findOrderIdFromText(text: string) {
  if (!text) return "";
  const upperText = text.toUpperCase();

  const matchWithDash = upperText.match(/MW-\d+/);
  if (matchWithDash) return matchWithDash[0];

  const matchNoDash = upperText.match(/MW\d+/);
  if (matchNoDash) return matchNoDash[0].replace("MW", "MW-");

  return "";
}

function getTransactionContent(body: Record<string, unknown>) {
  return String(
    [
      body.code,
      body.content,
      body.description,
      body.transferContent,
      body.transaction_content,
      body.transactionContent,
      body.referenceCode
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getTransactionAmount(body: Record<string, unknown>) {
  const raw = body.transferAmount || body.amount || body.value || body.money || body.creditAmount || 0;
  const amount = typeof raw === "string" ? Number(raw.replace(/[^0-9]/g, "")) : Number(raw);
  return Number.isFinite(amount) ? amount : 0;
}

export async function POST(req: Request) {
  try {
    const token = process.env.SEPAY_WEBHOOK_TOKEN;
    if (token) {
      const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
      const headerToken = auth.replace(/^Bearer\s+/i, "");
      if (headerToken !== token) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const content = getTransactionContent(body);
    const amount = getTransactionAmount(body);
    const id = findOrderIdFromText(content);

    if (!id) {
      return NextResponse.json({ success: true, message: "Không tìm thấy mã thanh toán" });
    }

    const order = await getOrder(id, false);
    if (!order) {
      return NextResponse.json({ success: true, message: "Đơn không tồn tại", orderId: id });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ success: true, message: "Đơn đã xử lý", orderId: id });
    }

    if (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now()) {
      return NextResponse.json({ success: true, message: "Đơn đã hết hạn", orderId: id });
    }

    if (amount < order.amount) {
      try {
        await sendTelegramMessage(
          `⚠️ <b>GIAO DỊCH KHÔNG ĐỦ TIỀN</b>\n\n` +
            `Mã đơn: <code>${order.id}</code>\n` +
            `Cần thu: ${order.amount.toLocaleString("vi-VN")}đ\n` +
            `Đã nhận: ${amount.toLocaleString("vi-VN")}đ\n` +
            `Nội dung: ${content}`
        );
      } catch (telegramError) {
        console.error("Telegram underpaid notification failed", telegramError);
      }

      return NextResponse.json({ success: true, message: "Số tiền chưa đủ", orderId: id });
    }

    order.status = "paid";
    order.paidAt = new Date().toISOString();
    await saveOrder(order);
    if (order.voucherCode) await markVoucherUsed(order.voucherCode);

    const itemLines = (order.items || [])
      .map((item) => `• ${item.name} x${item.quantity} = ${item.subtotal.toLocaleString("vi-VN")}đ`)
      .join("\n");

    try {
      await sendTelegramMessage(
        `✅ <b>ĐƠN HÀNG ĐÃ THANH TOÁN - CẦN GỬI SẢN PHẨM</b>\n\n` +
          `Mã đơn: <code>${order.id}</code>\n` +
          `${order.originalAmount ? `Tổng gốc: ${order.originalAmount.toLocaleString("vi-VN")}đ\n` : ""}` +
          `${order.discountAmount ? `Voucher: ${order.voucherCode} -${order.discountAmount.toLocaleString("vi-VN")}đ\n` : ""}` +
          `Khách đã thanh toán: <b>${order.amount.toLocaleString("vi-VN")}đ</b>\n\n` +
          `<b>Sản phẩm khách mua:</b>\n${itemLines || order.productName}\n\n` +
          `<b>Khách:</b> ${order.customerName}\n` +
          `<b>Liên hệ:</b> ${order.customerContact}\n` +
          `${order.customerEmail ? `<b>Email:</b> ${order.customerEmail}\n` : ""}` +
          `${order.customerNote ? `<b>Ghi chú:</b> ${order.customerNote}\n` : ""}` +
          `Trạng thái: Đã thanh toán, admin gửi sản phẩm thủ công cho khách.`
      );
    } catch (telegramError) {
      console.error("Telegram paid notification failed", telegramError);
    }

    return NextResponse.json({ success: true, message: "Đã cập nhật thanh toán", orderId: id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Webhook xử lý lỗi" }, { status: 400 });
  }
}
