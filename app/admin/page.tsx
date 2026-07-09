"use client";

import { useEffect, useState } from "react";
import { defaultSettings } from "../../lib/products";
import { formatMoney } from "../../lib/money";
import { Order, Product, SiteSettings } from "../../lib/types";

type Tab = "orders" | "products" | "settings";

const emptyProduct: Product = {
  id: "",
  name: "",
  category: "AI",
  price: 0,
  duration: "1 tháng",
  description: "",
  deliveryType: "manual",
  active: true
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = { "x-admin-password": password, "Content-Type": "application/json" };

  async function loadOrders() {
    setError("");
    const res = await fetch(`/api/admin/orders?password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Lỗi tải đơn hàng");
    setOrders(data.orders);
  }

  async function loadProducts() {
    setError("");
    const res = await fetch(`/api/admin/products?password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Lỗi tải sản phẩm");
    setProducts(data.products);
  }

  async function loadSettings() {
    setError("");
    const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Lỗi tải cài đặt");
    setSettings(data.settings);
  }

  async function loadAll() {
    await Promise.all([loadOrders(), loadProducts(), loadSettings()]);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch(`/api/admin/products?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(productForm)
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không lưu được sản phẩm");
    setProductForm(emptyProduct);
    setMessage("Đã lưu sản phẩm. Reload trang chủ để thấy thay đổi.");
    await loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    const res = await fetch(`/api/admin/products/${id}?password=${encodeURIComponent(password)}`, { method: "DELETE", headers });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không xóa được sản phẩm");
    setMessage("Đã xóa sản phẩm.");
    await loadProducts();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không lưu được cài đặt");
    setSettings(data.settings);
    setMessage("Đã lưu tiêu đề và giao diện web.");
  }

  function editProduct(product: Product) {
    setProductForm(product);
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!password) return;
    const saved = localStorage.getItem("mw_admin_password");
    if (saved !== password) localStorage.setItem("mw_admin_password", password);
  }, [password]);

  useEffect(() => {
    const saved = localStorage.getItem("mw_admin_password");
    if (saved) setPassword(saved);
  }, []);

  return (
    <main className="theme-light admin-page">
      <div className="container">
        <nav className="nav">
          <a className="brand" href="/"><span className="brand-mark">MW</span><span><b>MinhWuan Store</b><small>Admin Panel</small></span></a>
          <a className="badge" href="/">← Về web</a>
        </nav>

        <section className="card admin-hero">
          <div>
            <span className="eyebrow">Admin Dashboard</span>
            <h1>Quản lý shop</h1>
            <p className="muted">Chỉnh giá, thêm sản phẩm, sửa tiêu đề website, đổi theme sáng/tối và xem đơn thanh toán.</p>
          </div>
          <div className="form admin-login">
            <input type="password" placeholder="Nhập ADMIN_PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn" onClick={loadAll}>Tải dữ liệu</button>
          </div>
        </section>

        <div className="admin-tabs">
          <button className={tab === "orders" ? "chip active" : "chip"} onClick={() => setTab("orders")}>Đơn hàng</button>
          <button className={tab === "products" ? "chip active" : "chip"} onClick={() => setTab("products")}>Sản phẩm & giá</button>
          <button className={tab === "settings" ? "chip active" : "chip"} onClick={() => setTab("settings")}>Tiêu đề & theme</button>
        </div>

        {error && <div className="notice error">{error}</div>}
        {message && <div className="notice success">{message}</div>}

        {tab === "orders" && (
          <section className="card admin-section">
            <div className="section-head split compact"><div><h2>Đơn hàng</h2><p className="muted">Đơn đã thanh toán sẽ gửi về Telegram, trang này dùng để kiểm tra lại.</p></div><button className="btn secondary" onClick={loadOrders}>Tải lại</button></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Số tiền</th><th>Khách</th><th>Liên hệ</th><th>Ghi chú</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{(order.items || []).map((item) => `${item.name} x${item.quantity}`).join(", ") || order.productName}</td>
                      <td>{formatMoney(order.amount)}</td>
                      <td>{order.customerName}</td>
                      <td>{order.customerContact}</td>
                      <td>{order.customerNote || "-"}</td>
                      <td><span className={`status-pill ${order.status}`}>{order.status}</span></td>
                      <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                  {!orders.length && <tr><td colSpan={8}>Chưa có dữ liệu hoặc chưa nhập mật khẩu.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "products" && (
          <section className="admin-grid">
            <form className="card form admin-section" onSubmit={saveProduct}>
              <h2>{productForm.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
              <input placeholder="ID sản phẩm, có thể để trống khi thêm mới" value={productForm.id} onChange={(e) => setProductForm({ ...productForm, id: e.target.value })} />
              <input required placeholder="Tên sản phẩm" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              <input required placeholder="Danh mục, ví dụ AI, Giải trí" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
              <input required type="number" placeholder="Giá" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
              <input required placeholder="Thời hạn" value={productForm.duration} onChange={(e) => setProductForm({ ...productForm, duration: e.target.value })} />
              <textarea required placeholder="Mô tả" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={4} />
              <label className="switch-row"><input type="checkbox" checked={productForm.active !== false} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} /> Hiển thị sản phẩm</label>
              <button className="btn wide" type="submit">Lưu sản phẩm</button>
              <button className="btn secondary wide" type="button" onClick={() => setProductForm(emptyProduct)}>Tạo mới</button>
            </form>

            <section className="card admin-section">
              <div className="section-head split compact"><div><h2>Danh sách sản phẩm</h2><p className="muted">Bấm Sửa để đổi giá/tên/mô tả.</p></div><button className="btn secondary" onClick={loadProducts}>Tải lại</button></div>
              <div className="product-admin-list">
                {products.map((product) => (
                  <article className="product-admin-card" key={product.id}>
                    <div><b>{product.name}</b><small>{product.id} · {product.category} · {product.duration}</small></div>
                    <strong>{formatMoney(product.price)}</strong>
                    <span className={product.active === false ? "status-pill cancelled" : "status-pill paid"}>{product.active === false ? "Ẩn" : "Hiện"}</span>
                    <button className="btn secondary" onClick={() => editProduct(product)}>Sửa</button>
                    <button className="remove" onClick={() => deleteProduct(product.id)}>Xóa</button>
                  </article>
                ))}
                {!products.length && <p className="muted">Chưa có sản phẩm.</p>}
              </div>
            </section>
          </section>
        )}

        {tab === "settings" && (
          <form className="card form admin-section settings-form" onSubmit={saveSettings}>
            <h2>Sửa tiêu đề web và theme</h2>
            <div className="form-grid">
              <label>Tiêu đề shop<input value={settings.siteTitle} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} /></label>
              <label>Dòng phụ<input value={settings.siteSubtitle} onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })} /></label>
              <label>Domain hiển thị<input value={settings.brandDomain} onChange={(e) => setSettings({ ...settings, brandDomain: e.target.value })} /></label>
              <label>Link Zalo<input value={settings.zaloLink} onChange={(e) => setSettings({ ...settings, zaloLink: e.target.value })} /></label>
              <label>Link cộng đồng<input value={settings.communityLink} onChange={(e) => setSettings({ ...settings, communityLink: e.target.value })} /></label>
              <label>Màu chủ đạo<input type="color" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} /></label>
              <label>Theme<select value={settings.themeMode} onChange={(e) => setSettings({ ...settings, themeMode: e.target.value as SiteSettings["themeMode"] })}><option value="light">Sáng</option><option value="dark">Tối</option></select></label>
            </div>
            <label>Tiêu đề lớn hero<textarea value={settings.heroTitle} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} rows={2} /></label>
            <label>Mô tả hero<textarea value={settings.heroDescription} onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })} rows={3} /></label>
            <label>Thông báo cảnh báo<textarea value={settings.warningText} onChange={(e) => setSettings({ ...settings, warningText: e.target.value })} rows={2} /></label>
            <label>Dòng event<input value={settings.eventText} onChange={(e) => setSettings({ ...settings, eventText: e.target.value })} /></label>
            <button className="btn wide" type="submit">Lưu giao diện</button>
          </form>
        )}
      </div>
    </main>
  );
}
