import { NextResponse } from "next/server";
import { getOrder, saveOrder } from "../../../../lib/redis";
import { sendTelegramMessage } from "../../../../lib/telegram";

function findOrderIdFromText(text: string) {
  const match = text.match(/MW-\d+/i);
  return match?.[0]?.toUpperCase();
}

function getTransactionContent(body: Record<string, unknown>) {
  return String(
    body.content ||
    body.description ||
    body.transferContent ||
    body.transaction_content ||
    body.transactionContent ||
    body.referenceCode ||
    ""
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

    if (!id) return NextResponse.json({ success: true, message: "Không tìm thấy mã đơn" });

    const order = await getOrder(id);
    if (!order) return NextResponse.json({ success: true, message: "Đơn không tồn tại" });
    if (order.status !== "pending") return NextResponse.json({ success: true, message: "Đơn đã xử lý" });

    if (amount < order.amount) {
      await sendTelegramMessage(
        `⚠️ <b>GIAO DỊCH KHÔNG ĐỦ TIỀN</b>\n\n` +
        `Mã đơn: <code>${order.id}</code>\n` +
        `Cần thu: ${order.amount.toLocaleString("vi-VN")}đ\n` +
        `Đã nhận: ${amount.toLocaleString("vi-VN")}đ\n` +
        `Nội dung: ${content}`
      );
      return NextResponse.json({ success: true, message: "Số tiền chưa đủ" });
    }

    order.status = "paid";
    order.paidAt = new Date().toISOString();
    await saveOrder(order);

    const itemLines = (order.items || [])
      .map((item) => `• ${item.name} x${item.quantity} = ${item.subtotal.toLocaleString("vi-VN")}đ`)
      .join("\n");

    await sendTelegramMessage(
      `✅ <b>ĐƠN HÀNG ĐÃ THANH TOÁN - CẦN GỬI SẢN PHẨM</b>\n\n` +
      `Mã đơn: <code>${order.id}</code>\n` +
      `Tổng tiền: <b>${order.amount.toLocaleString("vi-VN")}đ</b>\n\n` +
      `<b>Sản phẩm khách mua:</b>\n${itemLines || order.productName}\n\n` +
      `<b>Khách:</b> ${order.customerName}\n` +
      `<b>Liên hệ:</b> ${order.customerContact}\n` +
      `${order.customerEmail ? `<b>Email:</b> ${order.customerEmail}\n` : ""}` +
      `${order.customerNote ? `<b>Ghi chú:</b> ${order.customerNote}\n` : ""}` +
      `Trạng thái: Đã thanh toán, admin gửi sản phẩm thủ công cho khách.`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
