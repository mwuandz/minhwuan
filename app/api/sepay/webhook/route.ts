import { NextResponse } from "next/server";
import { getOrder, saveOrder } from "../../../../lib/redis";
import { getProduct } from "../../../../lib/products";
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
