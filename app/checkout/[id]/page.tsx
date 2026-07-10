"use client";
import { useEffect, useState } from "react";
import { formatMoney } from "../../../lib/money";
import { Order } from "../../../lib/types";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function loadOrder(orderId = id) {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();

    if (res.ok) {
      setOrder(data.order);
      setError("");
      return;
    }

    setOrder(null);
    setError(data.error || "Đơn hàng không tồn tại hoặc đã hết hạn");
  }

  useEffect(() => {
    if (!id) return;
    loadOrder(id);
    const t = setInterval(() => loadOrder(id), 3000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <main className="checkout">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="card">
            <a className="badge" href="/">← Về trang chủ</a>
            <h1 style={{ fontSize: 42 }}>Đơn hàng đã hết hạn</h1>
            <div className="notice error">{error}. Vui lòng tạo đơn mới để thanh toán.</div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) return <main className="checkout"><div className="card">Đang tải đơn hàng...</div></main>;

  const items = order.items?.length ? order.items : [{ productId: order.productId || "", name: order.productName, category: "", duration: "", price: order.amount, quantity: 1, subtotal: order.amount }];
  const expiresAt = order.expiresAt ? new Date(order.expiresAt).getTime() : 0;
  const isExpired = order.status === "pending" && expiresAt > 0 && expiresAt <= now;
  const remaining = expiresAt > 0 ? formatRemaining(expiresAt - now) : "15:00";

  return (
    <main className="checkout">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="card">
          <a className="badge" href="/">← Về trang chủ</a>
          <h1 style={{ fontSize: 42 }}>Thanh toán đơn hàng</h1>
          <p>Mã đơn: <b>{order.id}</b></p>
          <p>Khách hàng: <b>{order.customerName}</b> · Liên hệ: <b>{order.customerContact}</b></p>

          <div className="cart-summary" style={{ margin: "18px 0" }}>
            <h3>Sản phẩm đã đặt</h3>
            {items.map((item) => (
              <div className="cart-line" key={item.productId || item.name}>
                <span>{item.name} x{item.quantity}</span>
                <b>{formatMoney(item.subtotal)}</b>
              </div>
            ))}
            {Boolean(order.originalAmount && order.discountAmount) && <div className="cart-line"><span>Tạm tính</span><b>{formatMoney(order.originalAmount || order.amount)}</b></div>}
            {Boolean(order.discountAmount) && <div className="cart-line discount"><span>Voucher {order.voucherCode}</span><b>-{formatMoney(order.discountAmount || 0)}</b></div>}
            <div className="cart-total"><span>Tổng cần thanh toán</span><b>{formatMoney(order.amount)}</b></div>
          </div>

          <p>Nội dung chuyển khoản: <b>{order.paymentContent}</b></p>

          {order.status === "pending" && !isExpired ? (
            <>
              <div className="notice" style={{ marginBottom: 16 }}>
                Đơn hàng tự hết hạn sau 15 phút. Thời gian còn lại: <b>{remaining}</b>
              </div>
              <p className="muted">Quét VietQR để chuyển khoản. Vui lòng giữ nguyên số tiền và nội dung chuyển khoản để hệ thống xác nhận tự động.</p>
              {order.qrCode && <img className="qr" src={order.qrCode} alt="QR thanh toán" />}
              <div className="status pending">
                ⏳ Đơn hàng đang chờ thanh toán. Sau khi hệ thống xác nhận giao dịch, shop sẽ liên hệ và bàn giao sản phẩm theo thông tin bạn đã nhập.
              </div>
            </>
          ) : order.status === "pending" && isExpired ? (
            <div className="notice error">
              Đơn hàng đã hết hạn do chưa thanh toán trong 15 phút. Vui lòng quay về trang chủ và tạo đơn mới.
            </div>
          ) : (
            <div className="status">
              ✅ Thanh toán thành công. Shop đã nhận đơn và sẽ gửi sản phẩm cho khách qua thông tin liên hệ đã nhập.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
