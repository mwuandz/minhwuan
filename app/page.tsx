"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts, defaultSettings } from "../lib/products";
import { formatMoney } from "../lib/money";
import { CartItem, Product, SiteSettings } from "../lib/types";

const CART_KEY = "minhwuan_cart";

type LocalCartItem = { productId: string; quantity: number };

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [category, setCategory] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<LocalCartItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products?.length) setProducts(data.products);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const categories = useMemo(() => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const detailedCart = useMemo<CartItem[]>(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          category: product.category,
          duration: product.duration,
          price: product.price,
          quantity: item.quantity,
          subtotal: product.price * item.quantity
        } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];
  }, [cart, products]);

  const cartTotal = detailedCart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartQuantity = detailedCart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = category === "Tất cả" || product.category === category;
      const matchKeyword = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(keyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [category, keyword, products]);

  function addToCart(productId: string) {
    setCart((current) => {
      const existed = current.find((item) => item.productId === productId);
      if (existed) return current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { productId, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  async function createOrder(formData: FormData) {
    if (!detailedCart.length) return alert("Giỏ hàng đang trống");
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        customerName: formData.get("customerName"),
        customerContact: formData.get("customerContact"),
        customerEmail: formData.get("customerEmail"),
        customerNote: formData.get("customerNote")
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert(data.error || "Không tạo được đơn hàng");
    localStorage.removeItem(CART_KEY);
    setCart([]);
    window.location.href = `/checkout/${data.order.id}`;
  }

  return (
    <main className={settings.themeMode === "dark" ? "theme-dark" : "theme-light"} style={{ ["--accent" as string]: settings.accentColor }}>
      <div className="top-alert"><div className="marquee"><span>⚠️ {settings.warningText}</span><span>⚠️ {settings.warningText}</span></div></div>
      <div className="event-strip">✅ {settings.eventText}</div>

      <div className="container">
        <nav className="nav">
          <a className="brand" href="#top" aria-label={settings.siteTitle}>
            <span className="brand-mark">MW</span>
            <span><b>{settings.siteTitle}</b><small>{settings.brandDomain}</small></span>
          </a>
          <div className="nav-links">
            <a href="#products">Sản phẩm</a>
            <a href="#checkout">Thanh toán</a>
            <button className="cart-button" onClick={() => setCartOpen(true)}>🛒 Giỏ hàng <b>{cartQuantity}</b></button>
          </div>
        </nav>

        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="eyebrow">{settings.siteSubtitle}</span>
            <h1>{settings.heroTitle}</h1>
            <p>{settings.heroDescription}</p>
            <div className="actions">
              <a className="btn" href="#products">Xem sản phẩm</a>
              <button className="btn secondary" onClick={() => setCartOpen(true)}>Mở giỏ hàng</button>
            </div>
          </div>
          <div className="hero-panel">
            <div className="light-orb orb-one" />
            <div className="light-orb orb-two" />
            <div className="glass-card floating-card top-card"><span>🛒 Giỏ hàng</span><b>{cartQuantity} sản phẩm</b></div>
            <div className="glass-card hero-card">
              <div className="card-head"><span className="app-icon">PAY</span><div><b>Thanh toán an toàn</b><small>VietQR · xác nhận tự động</small></div></div>
              <div className="mini-list"><span>Tổng giỏ hàng</span><strong>{formatMoney(cartTotal)}</strong></div>
              <div className="mini-list"><span>Xác nhận đơn</span><strong>Tự động</strong></div>
              <div className="mini-list"><span>Bàn giao</span><strong>Qua liên hệ</strong></div>
            </div>
            <div className="glass-card floating-card bottom-card"><span>✅ Sau thanh toán</span><b>Shop xử lý đơn</b></div>
          </div>
        </section>

        <section id="products" className="products-section">
          <div className="section-head split">
            <div><span className="eyebrow">Danh mục sản phẩm</span><h2>Mua trực tiếp tại website</h2></div>
            <input className="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm ChatGPT, Canva, YouTube..." />
          </div>

          <div className="category-row">
            {categories.map((item) => <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>{item}</button>)}
          </div>

          {filteredProducts.length === 0 ? <div className="empty">Không tìm thấy sản phẩm phù hợp.</div> : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-top"><span className="label">{product.category}</span><span className="duration">{product.duration}</span></div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="price-row"><b>{formatMoney(product.price)}</b><small>Bảo hành trong thời gian sử dụng</small></div>
                  <div className="product-actions">
                    <button className="btn wide" onClick={() => addToCart(product.id)}>Thêm vào giỏ</button>
                    <button className="btn secondary wide" onClick={() => { addToCart(product.id); document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }); }}>Mua ngay</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="commitments">
          <article><span>🛒</span><h3>Giỏ hàng</h3><p>Mua nhiều sản phẩm trong một đơn và thanh toán một lần trên website.</p></article>
          <article><span>🏦</span><h3>VietQR</h3><p>QR tự tạo theo đúng số tiền và mã đơn, dễ khớp giao dịch.</p></article>
          <article><span>📨</span><h3>Xác nhận đơn</h3><p>Sau thanh toán, hệ thống ghi nhận đơn để shop xử lý và liên hệ khách hàng.</p></article>
          <article><span>🤝</span><h3>Bàn giao sản phẩm</h3><p>Shop gửi tài khoản, key hoặc hướng dẫn sử dụng qua thông tin liên hệ của khách.</p></article>
        </section>

        <section id="checkout" className="checkout-card">
          <div>
            <span className="eyebrow">Checkout</span>
            <h2>Thanh toán giỏ hàng</h2>
            <p>Điền thông tin khách. Website tạo mã đơn và mã QR thanh toán riêng. Sau khi giao dịch được xác nhận, shop sẽ liên hệ và bàn giao sản phẩm cho khách.</p>
          </div>
          <form className="form" action={createOrder}>
            <div className="cart-summary">
              <h3>Giỏ hàng của bạn</h3>
              {detailedCart.length ? detailedCart.map((item) => (
                <div className="cart-line" key={item.productId}><span>{item.name} x{item.quantity}</span><b>{formatMoney(item.subtotal)}</b></div>
              )) : <p className="muted">Chưa có sản phẩm trong giỏ.</p>}
              <div className="cart-total"><span>Tổng cộng</span><b>{formatMoney(cartTotal)}</b></div>
            </div>
            <input required name="customerName" placeholder="Tên khách hàng" />
            <input required name="customerContact" placeholder="SĐT/Zalo/Facebook để shop gửi sản phẩm" />
            <input name="customerEmail" placeholder="Email nếu cần" />
            <textarea name="customerNote" placeholder="Ghi chú cho shop nếu cần hỗ trợ thêm" rows={3} />
            <button className="btn wide" disabled={loading || !detailedCart.length}>{loading ? "Đang tạo đơn..." : `Thanh toán ${formatMoney(cartTotal)}`}</button>
            <a className="text-link" href={settings.zaloLink} target="_blank">Cần hỗ trợ? Nhắn Zalo</a>
          </form>
        </section>
      </div>

      <button className="cart-float" onClick={() => setCartOpen(true)}>🛒 {cartQuantity}</button>
      <a className="zalo-float" href={settings.zaloLink} target="_blank">Zalo</a>

      {cartOpen && (
        <div className="modal-backdrop" onClick={() => setCartOpen(false)}>
          <div className="modal cart-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setCartOpen(false)}>×</button>
            <h2>Giỏ hàng</h2>
            {detailedCart.length ? detailedCart.map((item) => (
              <div className="cart-item" key={item.productId}>
                <div><b>{item.name}</b><small>{formatMoney(item.price)} · {item.duration}</small></div>
                <div className="qty-box"><button onClick={() => changeQuantity(item.productId, item.quantity - 1)}>-</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.productId, item.quantity + 1)}>+</button></div>
                <b>{formatMoney(item.subtotal)}</b>
                <button className="remove" onClick={() => removeFromCart(item.productId)}>Xóa</button>
              </div>
            )) : <p className="muted">Giỏ hàng đang trống.</p>}
            <div className="cart-total large"><span>Tổng cộng</span><b>{formatMoney(cartTotal)}</b></div>
            <button className="btn wide" onClick={() => { setCartOpen(false); document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }); }} disabled={!detailedCart.length}>Đi tới thanh toán</button>
            <button className="btn secondary wide" onClick={() => setCommunityOpen(true)}>Liên hệ hỗ trợ</button>
          </div>
        </div>
      )}

      {communityOpen && (
        <div className="modal-backdrop" onClick={() => setCommunityOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setCommunityOpen(false)}>×</button>
            <h2>Liên hệ hỗ trợ Zalo</h2>
            <p>Nhận thông báo event Free, cập nhật bảng giá và ưu đãi mới.</p>
            <a className="btn wide" href={settings.communityLink} target="_blank">Tham gia nhóm ngay</a>
            <button className="btn secondary wide" onClick={() => setCommunityOpen(false)}>Để sau</button>
          </div>
        </div>
      )}

      <footer className="footer"><div className="container"><b>{settings.siteTitle}</b><span>App Pro/Premium · Thanh toán tự động · Admin gửi sản phẩm thủ công</span></div></footer>
    </main>
  );
}
