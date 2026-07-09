"use client";
import { useState } from "react";
import { products } from "../lib/products";
import { formatMoney } from "../lib/money";

export default function HomePage() {
  const [productId, setProductId] = useState(products[0].id);
  const [loading, setLoading] = useState(false);
  const selected = products.find((p) => p.id === productId)!;

  async function createOrder(formData: FormData) {
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        customerName: formData.get("customerName"),
        customerContact: formData.get("customerContact"),
        customerEmail: formData.get("customerEmail")
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert(data.error || "Không tạo được đơn hàng");
    window.location.href = `/checkout/${data.order.id}`;
  }

  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="logo">MinhWuan Store</div>
          <a className="badge" href="/admin">Admin Orders</a>
        </nav>

        <section className="hero">
          <div>
            <span className="badge">Thanh toán tự động · Telegram · Giao tài nguyên</span>
            <h1>Premium App & Digital Resources</h1>
            <p>
              Website mẫu bán tài nguyên số/app premium có backend API, tạo đơn hàng, thanh toán qua payOS/VietQR,
              webhook xác nhận và thông báo Telegram cho admin.
            </p>
            <div className="actions">
              <a className="btn" href="#products">Xem sản phẩm</a>
              <a className="btn secondary" href="#checkout">Tạo đơn thử</a>
            </div>
          </div>
          <div className="card">
            <h2>Hệ thống tự động</h2>
            <p>Khách đặt hàng, hệ thống tạo QR, nhận webhook thanh toán và bắn thông báo Telegram ngay khi đơn được thanh toán.</p>
            <div className="stats">
              <div className="stat"><b>24/7</b><span className="muted">Nhận đơn</span></div>
              <div className="stat"><b>QR</b><span className="muted">VietQR/payOS</span></div>
              <div className="stat"><b>Bot</b><span className="muted">Telegram</span></div>
            </div>
          </div>
        </section>

        <section id="products">
          <h2>Sản phẩm nổi bật</h2>
          <div className="grid">
            {products.map((product) => (
              <article className="card product" key={product.id}>
                <span className="label">{product.category}</span>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price">{formatMoney(product.price)}</div>
                <span className="muted">Thời hạn: {product.duration}</span>
                <button className="btn" onClick={() => { setProductId(product.id); document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }); }}>Mua ngay</button>
              </article>
            ))}
          </div>
        </section>

        <section id="checkout" className="card" style={{ marginBottom: 56 }}>
          <h2>Tạo đơn hàng</h2>
          <p>Demo tạo đơn qua backend. Khi cấu hình payOS, đơn sẽ có link thanh toán thật.</p>
          <form className="form" action={createOrder}>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} - {formatMoney(p.price)}</option>)}
            </select>
            <input required name="customerName" placeholder="Tên khách hàng" />
            <input required name="customerContact" placeholder="SĐT/Zalo/Facebook" />
            <input name="customerEmail" placeholder="Email nếu cần gửi tự động" />
            <button className="btn" disabled={loading}>{loading ? "Đang tạo..." : `Thanh toán ${formatMoney(selected.price)}`}</button>
          </form>
        </section>
      </div>
      <footer className="footer"><div className="container">© MinhWuan Store · Chỉ nên kinh doanh sản phẩm/tài nguyên hợp lệ, minh bạch nguồn gốc và chính sách bảo hành.</div></footer>
    </main>
  );
}
