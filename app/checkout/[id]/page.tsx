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

  return (
    <main className="checkout">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <a className="badge" href="/">← Về trang chủ</a>
          <h1 style={{ fontSize: 42 }}>Thanh toán đơn hàng</h1>
          <p>Mã đơn: <b>{order.id}</b></p>
          <p>Sản phẩm: <b>{order.productName}</b></p>
          <p>Số tiền: <b>{formatMoney(order.amount)}</b></p>
          <p>Nội dung chuyển khoản: <b>{order.paymentContent}</b></p>

          {order.status === "pending" ? (
            <>
              {order.checkoutUrl ? (
                <a className="btn" href={order.checkoutUrl} target="_blank">Mở trang thanh toán payOS</a>
              ) : (
                <>
                  <p className="muted">Demo VietQR. Hãy thay số tài khoản trong code bằng tài khoản thật hoặc cấu hình payOS.</p>
                  {order.qrCode && <img className="qr" src={order.qrCode} alt="QR thanh toán" />}
                </>
              )}
              <div className="actions">
                <button className="btn secondary" onClick={demoPaid} disabled={loading}>{loading ? "Đang xử lý..." : "Demo: đánh dấu đã thanh toán"}</button>
              </div>
            </>
          ) : (
            <div className="status">
              ✅ Thanh toán thành công. Trạng thái: {order.status === "delivered" ? "Đã giao tự động" : "Chờ admin xử lý"}
            </div>
          )}

          {order.deliveredData && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Tài nguyên của bạn</h3>
              <p>{order.deliveredData}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
