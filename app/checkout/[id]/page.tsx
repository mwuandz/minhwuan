"use client";
import { useEffect, useState } from "react";
import { formatMoney } from "../../../lib/money";
import { Order } from "../../../lib/types";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function loadOrder(orderId = id) {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (res.ok) setOrder(data.order);
  }

  useEffect(() => {
    if (!id) return;
    loadOrder(id);
    const t = setInterval(() => loadOrder(id), 3000);
    return () => clearInterval(t);
  }, [id]);

  async function demoPaid() {
    setLoading(true);
    const res = await fetch("/api/demo/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setOrder(data.order);
    else alert(data.error || "Lỗi demo thanh toán");
  }

  if (!order) return <main className="checkout"><div className="card">Đang tải đơn hàng...</div></main>;

  const items = order.items?.length ? order.items : [{ productId: order.productId || "", name: order.productName, category: "", duration: "", price: order.amount, quantity: 1, subtotal: order.amount }];

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
            <div className="cart-total"><span>Tổng cần thanh toán</span><b>{formatMoney(order.amount)}</b></div>
          </div>

          <p>Nội dung chuyển khoản: <b>{order.paymentContent}</b></p>

          {order.status === "pending" ? (
            <>
              <p className="muted">Quét VietQR để chuyển khoản. Giữ nguyên nội dung chuyển khoản để hệ thống tự khớp đơn qua SePay webhook.</p>
              {order.qrCode && <img className="qr" src={order.qrCode} alt="QR thanh toán" />}
              <div className="actions">
                <button className="btn secondary" onClick={demoPaid} disabled={loading}>{loading ? "Đang xử lý..." : "Demo: đánh dấu đã thanh toán"}</button>
              </div>
            </>
          ) : (
            <div className="status">
              ✅ Thanh toán thành công. Admin đã nhận thông báo Telegram và sẽ gửi sản phẩm cho khách qua thông tin liên hệ đã nhập.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
