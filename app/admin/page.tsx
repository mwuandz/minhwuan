"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultSettings } from "../../lib/products";
import { formatMoney } from "../../lib/money";
import { Order, Product, SiteSettings, Voucher } from "../../lib/types";

type Tab = "orders" | "products" | "vouchers" | "settings";

const emptyProduct: Product = {
  id: "",
  name: "",
  category: "App AI",
  price: 0,
  duration: "1 tháng",
  description: "",
  deliveryType: "manual",
  active: true,
  image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com",
  badge: ""
};

const emptyVoucher: Voucher = {
  id: "",
  code: "",
  description: "",
  type: "fixed",
  value: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  usageLimit: 0,
  usedCount: 0,
  active: true,
  applicableProductIds: []
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [voucherForm, setVoucherForm] = useState<Voucher>(emptyVoucher);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = useMemo(() => ({ "x-admin-password": password, "Content-Type": "application/json" }), [password]);

  async function loadOrders(currentPassword = password) {
    const res = await fetch(`/api/admin/orders?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải đơn hàng");
    setOrders(data.orders || []);
  }

  async function loadProducts(currentPassword = password) {
    const res = await fetch(`/api/admin/products?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải sản phẩm");
    setProducts(data.products || []);
  }

  async function loadVouchers(currentPassword = password) {
    const res = await fetch(`/api/admin/vouchers?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải voucher");
    setVouchers(data.vouchers || []);
  }

  async function loadSettings(currentPassword = password) {
    const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải cài đặt");
    setSettings(data.settings || defaultSettings);
  }

  async function loadAll() {
    const currentPassword = password.trim();
    setError("");
    setMessage("");

    if (!currentPassword) {
      setIsAuthed(false);
      setError("Vui lòng nhập mật khẩu admin");
      return;
    }

    try {
      setLoading(true);
      await Promise.all([loadOrders(currentPassword), loadProducts(currentPassword), loadVouchers(currentPassword), loadSettings(currentPassword)]);
      setIsAuthed(true);
      localStorage.setItem("mw_admin_password", currentPassword);
      setMessage("Đăng nhập admin thành công.");
    } catch (err) {
      setIsAuthed(false);
      setError(err instanceof Error ? err.message : "Sai mật khẩu admin");
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
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
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/products/${id}?password=${encodeURIComponent(password)}`, { method: "DELETE", headers });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không xóa được sản phẩm");
    setMessage("Đã xóa sản phẩm.");
    await loadProducts();
  }

  async function saveVoucher(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/vouchers?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(voucherForm)
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không lưu được voucher");
    setVoucherForm(emptyVoucher);
    setMessage("Đã lưu voucher.");
    await loadVouchers();
  }

  async function deleteVoucher(code: string) {
    if (!confirm("Xóa voucher này?")) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/vouchers/${code}?password=${encodeURIComponent(password)}`, { method: "DELETE", headers });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không xóa được voucher");
    setMessage("Đã xóa voucher.");
    await loadVouchers();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
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

  function editVoucher(voucher: Voucher) {
    setVoucherForm({ ...voucher, applicableProductIds: voucher.applicableProductIds || [] });
    setTab("vouchers");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleVoucherProduct(productId: string) {
    const current = voucherForm.applicableProductIds || [];
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    setVoucherForm({ ...voucherForm, applicableProductIds: next });
  }

  function clearVoucherProducts() {
    setVoucherForm({ ...voucherForm, applicableProductIds: [] });
  }

  function toggleFlashSaleProduct(productId: string) {
    const current = settings.flashSaleProductIds || [];
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    setSettings({ ...settings, flashSaleProductIds: next });
  }

  function clearFlashSaleProducts() {
    setSettings({ ...settings, flashSaleProductIds: [] });
  }

  function logout() {
    localStorage.removeItem("mw_admin_password");
    setPassword("");
    setIsAuthed(false);
    setOrders([]);
    setProducts([]);
    setVouchers([]);
    setMessage("Đã đăng xuất admin.");
  }

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
            <p className="muted">Nhập mật khẩu để quản lý đơn hàng, sản phẩm, voucher, giá và giao diện website.</p>
          </div>
          <div className="form admin-login">
            <input type="password" placeholder="Nhập ADMIN_PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadAll(); }} />
            <button className="btn" onClick={loadAll} disabled={loading}>{loading ? "Đang kiểm tra..." : "Đăng nhập admin"}</button>
            {isAuthed && <button className="btn secondary" onClick={logout}>Đăng xuất</button>}
          </div>
        </section>

        {error && <div className="notice error">{error}</div>}
        {message && <div className="notice success">{message}</div>}

        {!isAuthed ? (
          <section className="card admin-section">
            <h2>Vui lòng đăng nhập</h2>
            <p className="muted">Các chức năng chỉnh giá, thêm sản phẩm, tạo voucher, sửa tiêu đề web và xem đơn hàng chỉ hiển thị sau khi nhập đúng mật khẩu admin.</p>
          </section>
        ) : (
          <>
            <div className="admin-tabs">
              <button className={tab === "orders" ? "chip active" : "chip"} onClick={() => setTab("orders")}>Đơn hàng</button>
              <button className={tab === "products" ? "chip active" : "chip"} onClick={() => setTab("products")}>Sản phẩm & giá</button>
              <button className={tab === "vouchers" ? "chip active" : "chip"} onClick={() => setTab("vouchers")}>Voucher</button>
              <button className={tab === "settings" ? "chip active" : "chip"} onClick={() => setTab("settings")}>Tiêu đề & theme</button>
            </div>

            {tab === "orders" && (
              <section className="card admin-section">
                <div className="section-head split compact"><div><h2>Đơn hàng</h2><p className="muted">Đơn chờ thanh toán sẽ tự ẩn/xóa sau 15 phút nếu khách chưa thanh toán.</p></div><button className="btn secondary" onClick={() => loadOrders()}>Tải lại</button></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Tạm tính</th><th>Voucher</th><th>Cần thu</th><th>Khách</th><th>Liên hệ</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{(order.items || []).map((item) => `${item.name} x${item.quantity}`).join(", ") || order.productName}</td>
                          <td>{formatMoney(order.originalAmount || order.amount)}</td>
                          <td>{order.voucherCode ? `${order.voucherCode} (-${formatMoney(order.discountAmount || 0)})` : "-"}</td>
                          <td>{formatMoney(order.amount)}</td>
                          <td>{order.customerName}</td>
                          <td>{order.customerContact}</td>
                          <td><span className={`status-pill ${order.status}`}>{order.status}</span></td>
                          <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                        </tr>
                      ))}
                      {!orders.length && <tr><td colSpan={9}>Chưa có đơn hàng.</td></tr>}
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
                  <input required placeholder="Danh mục, ví dụ App AI, Video / Photo" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                  <input required type="number" placeholder="Giá" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                  <input required placeholder="Thời hạn" value={productForm.duration} onChange={(e) => setProductForm({ ...productForm, duration: e.target.value })} />
                  <input placeholder="URL ảnh/logo sản phẩm hoặc icon, ví dụ https://..." value={productForm.image || ""} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
                  <input placeholder="Nhãn nhỏ, ví dụ Hot, New, 1 năm" value={productForm.badge || ""} onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })} />
                  <textarea required placeholder="Mô tả" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={4} />
                  <label className="switch-row"><input type="checkbox" checked={productForm.active !== false} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} /> Hiển thị sản phẩm</label>
                  <button className="btn wide" type="submit">Lưu sản phẩm</button>
                  <button className="btn secondary wide" type="button" onClick={() => setProductForm(emptyProduct)}>Tạo mới</button>
                </form>

                <section className="card admin-section">
                  <div className="section-head split compact"><div><h2>Danh sách sản phẩm</h2><p className="muted">Bấm Sửa để đổi giá/tên/mô tả/icon.</p></div><button className="btn secondary" onClick={() => loadProducts()}>Tải lại</button></div>
                  <div className="product-admin-list">
                    {products.map((product) => (
                      <article className="product-admin-card" key={product.id}>
                        <span className="admin-icon">{product.image?.startsWith("http") ? <img src={product.image} alt={product.name} /> : (product.image || "💎")}</span>
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

            {tab === "vouchers" && (
              <section className="admin-grid">
                <form className="card form admin-section" onSubmit={saveVoucher}>
                  <h2>{voucherForm.code ? "Sửa voucher" : "Tạo voucher"}</h2>
                  <input required placeholder="Mã voucher, ví dụ SALE10" value={voucherForm.code} onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })} />
                  <input placeholder="Mô tả" value={voucherForm.description || ""} onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })} />
                  <label>Loại giảm<select value={voucherForm.type} onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value as Voucher["type"] })}><option value="fixed">Giảm số tiền cố định</option><option value="percent">Giảm phần trăm</option></select></label>
                  <input required type="number" placeholder="Giá trị giảm, ví dụ 10000 hoặc 10" value={voucherForm.value} onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })} />
                  <input type="number" placeholder="Đơn tối thiểu" value={voucherForm.minOrderAmount || 0} onChange={(e) => setVoucherForm({ ...voucherForm, minOrderAmount: Number(e.target.value) })} />
                  <input type="number" placeholder="Giảm tối đa, áp dụng cho %" value={voucherForm.maxDiscount || 0} onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: Number(e.target.value) })} />
                  <input type="number" placeholder="Giới hạn lượt dùng, 0 là không giới hạn" value={voucherForm.usageLimit || 0} onChange={(e) => setVoucherForm({ ...voucherForm, usageLimit: Number(e.target.value) })} />
                  <input type="datetime-local" value={voucherForm.expiresAt ? voucherForm.expiresAt.slice(0, 16) : ""} onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                  <div className="voucher-scope-box">
                    <div className="scope-head">
                      <b>Áp dụng cho sản phẩm</b>
                      <button className="btn secondary mini" type="button" onClick={clearVoucherProducts}>Tất cả sản phẩm</button>
                    </div>
                    <p className="muted small">Không chọn sản phẩm nào = áp dụng cho toàn bộ đơn. Chọn sản phẩm thì voucher chỉ giảm trên phần tiền của các sản phẩm đó.</p>
                    <div className="voucher-product-checks">
                      {products.map((product) => (
                        <label key={product.id} className="product-check">
                          <input
                            type="checkbox"
                            checked={(voucherForm.applicableProductIds || []).includes(product.id)}
                            onChange={() => toggleVoucherProduct(product.id)}
                          />
                          <span>{product.name} · {product.duration}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="switch-row"><input type="checkbox" checked={voucherForm.active !== false} onChange={(e) => setVoucherForm({ ...voucherForm, active: e.target.checked })} /> Voucher đang hoạt động</label>
                  <button className="btn wide" type="submit">Lưu voucher</button>
                  <button className="btn secondary wide" type="button" onClick={() => setVoucherForm(emptyVoucher)}>Tạo mới</button>
                </form>

                <section className="card admin-section">
                  <div className="section-head split compact"><div><h2>Danh sách voucher</h2><p className="muted">Khách nhập voucher tại phần thanh toán.</p></div><button className="btn secondary" onClick={() => loadVouchers()}>Tải lại</button></div>
                  <div className="product-admin-list">
                    {vouchers.map((voucher) => (
                      <article className="product-admin-card" key={voucher.code}>
                        <span className="admin-icon">🎟️</span>
                        <div><b>{voucher.code}</b><small>{voucher.description || "-"} · {(voucher.applicableProductIds || []).length ? `Áp dụng ${voucher.applicableProductIds!.length} sản phẩm` : "Áp dụng tất cả"} · Đã dùng {voucher.usedCount || 0}{voucher.usageLimit ? `/${voucher.usageLimit}` : ""}</small></div>
                        <strong>{voucher.type === "percent" ? `${voucher.value}%` : formatMoney(voucher.value)}</strong>
                        <span className={voucher.active === false ? "status-pill cancelled" : "status-pill paid"}>{voucher.active === false ? "Tắt" : "Bật"}</span>
                        <button className="btn secondary" onClick={() => editVoucher(voucher)}>Sửa</button>
                        <button className="remove" onClick={() => deleteVoucher(voucher.code)}>Xóa</button>
                      </article>
                    ))}
                    {!vouchers.length && <p className="muted">Chưa có voucher.</p>}
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
                  <label className="switch-row"><input type="checkbox" checked={settings.communityPopupEnabled !== false} onChange={(e) => setSettings({ ...settings, communityPopupEnabled: e.target.checked })} /> Bật popup nhóm Zalo khi mở web</label>
                  <label>Màu chủ đạo<input type="color" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} /></label>
                  <label>Theme<select value={settings.themeMode} onChange={(e) => setSettings({ ...settings, themeMode: e.target.value as SiteSettings["themeMode"] })}><option value="light">Sáng</option><option value="dark">Tối</option></select></label>
                </div>
                <label>Tiêu đề popup cộng đồng<input value={settings.communityPopupTitle || ""} onChange={(e) => setSettings({ ...settings, communityPopupTitle: e.target.value })} /></label>
                <label>Mô tả popup cộng đồng<textarea value={settings.communityPopupDescription || ""} onChange={(e) => setSettings({ ...settings, communityPopupDescription: e.target.value })} rows={2} /></label>
                <label>Tiêu đề lớn hero<textarea value={settings.heroTitle} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} rows={2} /></label>
                <label>Mô tả hero<textarea value={settings.heroDescription} onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })} rows={3} /></label>
                <label>Thông báo cảnh báo<textarea value={settings.warningText} onChange={(e) => setSettings({ ...settings, warningText: e.target.value })} rows={2} /></label>
                <label>Dòng event<input value={settings.eventText} onChange={(e) => setSettings({ ...settings, eventText: e.target.value })} /></label>

                <div className="flash-admin-box">
                  <div className="scope-head">
                    <div>
                      <h3>Flash Sale đầu trang</h3>
                      <p className="muted small">Bật/tắt, sửa nội dung và chọn sản phẩm hiển thị ở đầu website.</p>
                    </div>
                    <label className="switch-row"><input type="checkbox" checked={settings.flashSaleEnabled !== false} onChange={(e) => setSettings({ ...settings, flashSaleEnabled: e.target.checked })} /> Bật flash sale</label>
                  </div>
                  <div className="form-grid">
                    <label>Tag flash sale<input value={settings.flashSaleBadge || ""} onChange={(e) => setSettings({ ...settings, flashSaleBadge: e.target.value })} placeholder="FLASH SALE" /></label>
                    <label>Nút kêu gọi<input value={settings.flashSaleCta || ""} onChange={(e) => setSettings({ ...settings, flashSaleCta: e.target.value })} placeholder="Mua ngay" /></label>
                    <label>Tiêu đề flash sale<input value={settings.flashSaleTitle || ""} onChange={(e) => setSettings({ ...settings, flashSaleTitle: e.target.value })} placeholder="Flash Sale App Premium hôm nay" /></label>
                    <label>Thời gian kết thúc<input type="datetime-local" value={settings.flashSaleEndsAt ? settings.flashSaleEndsAt.slice(0, 16) : ""} onChange={(e) => setSettings({ ...settings, flashSaleEndsAt: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></label>
                  </div>
                  <label>Mô tả flash sale<textarea value={settings.flashSaleDescription || ""} onChange={(e) => setSettings({ ...settings, flashSaleDescription: e.target.value })} rows={2} /></label>
                  <div className="scope-head product-scope-title">
                    <b>Sản phẩm trong Flash Sale</b>
                    <button className="btn secondary mini" type="button" onClick={clearFlashSaleProducts}>Tự động chọn sản phẩm hot</button>
                  </div>
                  <p className="muted small">Không chọn sản phẩm nào = web tự lấy sản phẩm có badge hot/best/combo/giá tốt. Chọn sản phẩm thì flash sale chỉ hiện các sản phẩm đó.</p>
                  <div className="voucher-product-checks">
                    {products.map((product) => (
                      <label key={product.id} className="product-check">
                        <input
                          type="checkbox"
                          checked={(settings.flashSaleProductIds || []).includes(product.id)}
                          onChange={() => toggleFlashSaleProduct(product.id)}
                        />
                        <span>{product.name} · {product.duration} · {formatMoney(product.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button className="btn wide" type="submit">Lưu giao diện</button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
