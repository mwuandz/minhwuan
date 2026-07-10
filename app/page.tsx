"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts, defaultSettings } from "../lib/products";
import { formatMoney } from "../lib/money";
import { CartItem, Order, Product, SiteSettings } from "../lib/types";

const CART_KEY = "minhwuan_cart";
type LocalCartItem = { productId: string; quantity: number };

type VoucherState = {
  code: string;
  valid: boolean;
  discountAmount: number;
  eligibleAmount?: number;
  eligibleProductNames?: string[];
  message: string;
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isImageUrl(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function getActiveFlashSalePrice(product: Product, settings: SiteSettings, now: number) {
  const endsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  if (settings.flashSaleEnabled === false) return product.price;
  if (endsAt > 0 && endsAt <= now) return product.price;

  const selectedIds = settings.flashSaleProductIds || [];
  const isSelected = selectedIds.length ? selectedIds.includes(product.id) : /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`);
  if (!isSelected) return product.price;

  const rawSalePrice = settings.flashSalePrices?.[product.id];
  const salePrice = Number(rawSalePrice || 0);
  if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= product.price) return product.price;
  return salePrice;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [category, setCategory] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherState | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products?.length) setProducts(data.products);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => null)
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!paymentOrder?.id || paymentOrder.status !== "pending") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${paymentOrder.id}`);
        const data = await res.json();
        if (res.ok && data.order) setPaymentOrder(data.order);
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [paymentOrder?.id, paymentOrder?.status]);

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

  useEffect(() => {
    setVoucher(null);
  }, [cart]);

  const categories = useMemo(() => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const detailedCart = useMemo<CartItem[]>(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const activePrice = getActiveFlashSalePrice(product, settings, now);
        return {
          productId: product.id,
          name: product.name,
          category: product.category,
          duration: product.duration,
          price: activePrice,
          quantity: item.quantity,
          subtotal: activePrice * item.quantity
        } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];
  }, [cart, products, settings, now]);

  const cartTotal = detailedCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = voucher?.valid ? voucher.discountAmount : 0;
  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const cartQuantity = detailedCart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = category === "Tất cả" || product.category === category;
      const matchKeyword = `${product.name} ${product.category} ${product.description} ${product.duration}`.toLowerCase().includes(keyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [category, keyword, products]);

  const flashProducts = useMemo(() => {
    const ids = settings.flashSaleProductIds || [];
    const activeProducts = products.filter((product) => product.active !== false && product.price > 0);
    if (ids.length) {
      return ids.map((id) => activeProducts.find((product) => product.id === id)).filter(Boolean).slice(0, 6) as Product[];
    }
    return activeProducts
      .filter((product) => /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`))
      .slice(0, 6);
  }, [products, settings.flashSaleProductIds]);

  const flashEndsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  const flashRemaining = flashEndsAt > 0 ? formatRemaining(flashEndsAt - now) : "Đang mở";
  const flashExpired = flashEndsAt > 0 && flashEndsAt <= now;
  const flashSaleActive = settings.flashSaleEnabled !== false && flashProducts.length > 0 && !flashExpired;

  useEffect(() => {
    if (!settingsLoaded || !flashSaleActive) return;
    try {
      if (sessionStorage.getItem("mw_flash_popup_seen")) {
        setFlashDismissed(true);
        return;
      }
    } catch {}
    const timer = setTimeout(() => setFlashOpen(true), 650);
    return () => clearTimeout(timer);
  }, [settingsLoaded, flashSaleActive]);

  useEffect(() => {
    if (!settingsLoaded || settings.communityPopupEnabled === false) return;
    if (flashSaleActive && !flashDismissed) return;
    try {
      if (sessionStorage.getItem("mw_community_popup_seen")) return;
    } catch {}
    const timer = setTimeout(() => setCommunityOpen(true), 900);
    return () => clearTimeout(timer);
  }, [settingsLoaded, settings.communityPopupEnabled, flashSaleActive, flashDismissed]);

  function addToCart(productId: string) {
    setCart((current) => {
      const existed = current.find((item) => item.productId === productId);
      if (existed) return current.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { productId, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  function closeFlashPopup() {
    try {
      sessionStorage.setItem("mw_flash_popup_seen", "1");
    } catch {}
    setFlashOpen(false);
    setFlashDismissed(true);
  }

  function closeCommunityPopup() {
    try {
      sessionStorage.setItem("mw_community_popup_seen", "1");
    } catch {}
    setCommunityOpen(false);
  }

  async function applyVoucher() {
    if (!voucherInput.trim()) return setVoucher({ code: "", valid: false, discountAmount: 0, message: "Vui lòng nhập mã voucher" });
    if (!cartTotal) return setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Giỏ hàng đang trống" });
    setVoucherLoading(true);
    const res = await fetch("/api/vouchers/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: voucherInput,
        amount: cartTotal,
        items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      })
    });
    const data = await res.json();
    setVoucherLoading(false);
    setVoucher({
      code: voucherInput.trim().toUpperCase(),
      valid: Boolean(data.valid),
      discountAmount: Number(data.discountAmount || 0),
      eligibleAmount: Number(data.eligibleAmount || 0),
      eligibleProductNames: Array.isArray(data.eligibleProductNames) ? data.eligibleProductNames : [],
      message: data.message || (data.valid ? "Đã áp dụng voucher" : "Voucher không hợp lệ")
    });
  }

  async function createOrder(formData: FormData) {
    if (!detailedCart.length) return alert("Giỏ hàng đang trống");
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        voucherCode: voucher?.valid ? voucher.code : undefined,
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
    setVoucher(null);
    setCartOpen(false);
    setPaymentOrder(data.order);
  }

  return (
    <main className={settings.themeMode === "dark" ? "theme-dark" : "theme-light"} style={{ ["--accent" as string]: settings.accentColor }}>
      <div className="top-alert"><div className="marquee"><span>🔥 {settings.warningText}</span><span>🔥 {settings.warningText}</span></div></div>
      <div className="event-strip">✅ {settings.eventText}</div>

      {flashSaleActive && <button className="flash-sale-floating" onClick={() => setFlashOpen(true)}>⚡ Flash Sale</button>}


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
              <a className="btn" href="#products">Xem bảng giá</a>
              <button className="btn secondary" onClick={() => setCartOpen(true)}>Mở giỏ hàng</button>
            </div>
            <div className="hero-badges"><span>✔ Bảo hành</span><span>✔ Kích hoạt 1–5 phút</span><span>✔ Voucher thanh toán</span></div>
          </div>
          <div className="hero-panel product-showcase">
            <div className="light-orb orb-one" />
            <div className="light-orb orb-two" />
            <div className="showcase-icon big">🤖</div>
            <div className="showcase-icon mid">🎬</div>
            <div className="showcase-icon small">🎧</div>
            <div className="glass-card floating-card top-card"><span>🔥 App Premium</span><b>Update 8/7</b></div>
            <div className="glass-card hero-card">
              <div className="card-head"><span className="app-icon">QR</span><div><b>Thanh toán tự động</b><small>VietQR · MB Bank · SePay</small></div></div>
              <div className="mini-list"><span>Tổng giỏ hàng</span><strong>{formatMoney(cartTotal)}</strong></div>
              <div className="mini-list"><span>Voucher</span><strong>{discountAmount ? `-${formatMoney(discountAmount)}` : "Có hỗ trợ"}</strong></div>
              <div className="mini-list"><span>Cần thanh toán</span><strong>{formatMoney(payableTotal)}</strong></div>
            </div>
            <div className="glass-card floating-card bottom-card"><span>🎁 Event Free</span><b>Thứ 4 & Thứ 7</b></div>
          </div>
        </section>

        <section id="products" className="products-section">
          <div className="section-head split">
            <div><span className="eyebrow">Bảng giá App Pro/Premium</span><h2>Chọn sản phẩm và thêm vào giỏ</h2></div>
            <input className="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm ChatGPT, CapCut, Canva, YouTube..." />
          </div>

          <div className="category-row">
            {categories.map((item) => <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>{item}</button>)}
          </div>

          {filteredProducts.length === 0 ? <div className="empty">Không tìm thấy sản phẩm phù hợp.</div> : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card product-card-animated" key={product.id}>
                  <div className="product-image">{isImageUrl(product.image) ? <img src={product.image} alt={product.name} /> : <span>{product.image || "💎"}</span>}{product.badge && <b>{product.badge}</b>}</div>
                  <div className="product-top"><span className="label">{product.category}</span><span className="duration">{product.duration}</span></div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="price-row"><b>{product.price > 0 ? formatMoney(product.price) : "Liên hệ"}</b><small>Bảo hành trong thời gian sử dụng</small></div>
                  <div className="product-actions">
                    {product.price > 0 ? (
                      <>
                        <button className="btn wide" onClick={() => addToCart(product.id)}>Thêm vào giỏ</button>
                        <button className="btn secondary wide" onClick={() => { addToCart(product.id); document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }); }}>Mua ngay</button>
                      </>
                    ) : (
                      <a className="btn wide" href={settings.zaloLink} target="_blank">Liên hệ báo giá</a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="commitments">
          <article><span>🛡️</span><h3>Bảo hành rõ ràng</h3><p>Bảo hành trong thời gian sử dụng. Lỗi sẽ được hỗ trợ nhanh nhất.</p></article>
          <article><span>⚡</span><h3>Kích hoạt nhanh</h3><p>Shop xử lý và kích hoạt nhanh khoảng 1–5 phút sau khi xác nhận thanh toán.</p></article>
          <article><span>🏦</span><h3>VietQR tự động</h3><p>QR tạo theo đúng số tiền, mã đơn và voucher để dễ khớp giao dịch.</p></article>
          <article><span>🎁</span><h3>Event Free</h3><p>Tặng Free 2 lần mỗi tuần vào tối thứ 4 và tối thứ 7.</p></article>
        </section>

        <section id="checkout" className="checkout-card">
          <div>
            <span className="eyebrow">Checkout</span>
            <h2>Thanh toán giỏ hàng</h2>
            <p>Điền thông tin khách, nhập voucher nếu có. Website tạo mã đơn và VietQR riêng. Sau khi giao dịch được xác nhận, shop sẽ liên hệ và bàn giao sản phẩm.</p>
          </div>
          <form className="form" action={createOrder}>
            <div className="cart-summary">
              <h3>Giỏ hàng của bạn</h3>
              {detailedCart.length ? detailedCart.map((item) => (
                <div className="cart-line" key={item.productId}><span>{item.name} x{item.quantity}</span><b>{formatMoney(item.subtotal)}</b></div>
              )) : <p className="muted">Chưa có sản phẩm trong giỏ.</p>}
              <div className="voucher-box">
                <input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} placeholder="Nhập mã voucher" />
                <button className="btn secondary" type="button" onClick={applyVoucher} disabled={voucherLoading || !cartTotal}>{voucherLoading ? "Đang kiểm tra..." : "Áp dụng"}</button>
              </div>
              {voucher && <div className={voucher.valid ? "notice success compact" : "notice error compact"}>{voucher.message}{voucher.valid ? ` · Giảm ${formatMoney(voucher.discountAmount)}${voucher.eligibleAmount ? ` trên ${formatMoney(voucher.eligibleAmount)}` : ""}` : ""}</div>}
              <div className="cart-line"><span>Tạm tính</span><b>{formatMoney(cartTotal)}</b></div>
              {discountAmount > 0 && <div className="cart-line discount"><span>Voucher {voucher?.code}</span><b>-{formatMoney(discountAmount)}</b></div>}
              <div className="cart-total"><span>Tổng cần thanh toán</span><b>{formatMoney(payableTotal)}</b></div>
            </div>
            <input required name="customerName" placeholder="Tên khách hàng" />
            <input required name="customerContact" placeholder="SĐT/Zalo/Facebook để shop gửi sản phẩm" />
            <input name="customerEmail" placeholder="Email nếu cần" />
            <textarea name="customerNote" placeholder="Ghi chú cho shop nếu cần hỗ trợ thêm" rows={3} />
            <button className="btn wide" disabled={loading || !detailedCart.length}>{loading ? "Đang tạo đơn..." : `Thanh toán ${formatMoney(payableTotal)}`}</button>
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

      {paymentOrder && (() => {
        const expiresAt = paymentOrder.expiresAt ? new Date(paymentOrder.expiresAt).getTime() : 0;
        const isExpired = paymentOrder.status === "pending" && expiresAt > 0 && expiresAt <= now;
        const remaining = expiresAt > 0 ? formatRemaining(expiresAt - now) : "15:00";
        const paymentItems = paymentOrder.items?.length ? paymentOrder.items : [];
        return (
          <div className="modal-backdrop payment-backdrop" onClick={() => setPaymentOrder(null)}>
            <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setPaymentOrder(null)}>×</button>
              <span className="eyebrow">Thanh toán VietQR</span>
              <h2>Đơn hàng đang chờ thanh toán</h2>
              <p>Mã đơn: <b>{paymentOrder.id}</b></p>
              <div className="cart-summary payment-summary">
                {paymentItems.map((item) => (
                  <div className="cart-line" key={item.productId}><span>{item.name} x{item.quantity}</span><b>{formatMoney(item.subtotal)}</b></div>
                ))}
                {Boolean(paymentOrder.originalAmount && paymentOrder.discountAmount) && <div className="cart-line"><span>Tạm tính</span><b>{formatMoney(paymentOrder.originalAmount || paymentOrder.amount)}</b></div>}
                {Boolean(paymentOrder.discountAmount) && <div className="cart-line discount"><span>Voucher {paymentOrder.voucherCode}</span><b>-{formatMoney(paymentOrder.discountAmount || 0)}</b></div>}
                <div className="cart-total"><span>Cần thanh toán</span><b>{formatMoney(paymentOrder.amount)}</b></div>
              </div>
              <div className="payment-code">Nội dung CK: <b>{paymentOrder.paymentContent}</b></div>
              {paymentOrder.status === "pending" && !isExpired ? (
                <>
                  <div className="status pending-status">⏳ Đang chờ thanh toán · còn <b>{remaining}</b></div>
                  {paymentOrder.qrCode && <img className="qr popup-qr" src={paymentOrder.qrCode} alt="QR thanh toán" />}
                  <p className="muted center">Quét QR và giữ nguyên số tiền + nội dung chuyển khoản. Sau khi SePay xác nhận, shop sẽ gửi sản phẩm thủ công qua thông tin bạn đã nhập.</p>
                </>
              ) : paymentOrder.status === "pending" && isExpired ? (
                <div className="notice error">Đơn đã hết hạn sau 15 phút. Vui lòng tạo đơn mới.</div>
              ) : (
                <div className="status">✅ Đã thanh toán. Shop đã nhận thông tin và sẽ gửi sản phẩm cho bạn.</div>
              )}
              <a className="text-link" href={`/checkout/${paymentOrder.id}`}>Mở trang thanh toán chi tiết</a>
            </div>
          </div>
        );
      })()}

      {flashOpen && flashSaleActive && (
        <div className="modal-backdrop flash-popup-backdrop" onClick={closeFlashPopup}>
          <div className="modal flash-sale-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeFlashPopup}>×</button>
            <div className="flash-popup-head">
              <span className="flash-badge">⚡ {settings.flashSaleBadge || "FLASH SALE"}</span>
              <div>
                <h2>{settings.flashSaleTitle || "Flash Sale App Premium"}</h2>
                <p>{settings.flashSaleDescription || "Ưu đãi nhanh trong thời gian giới hạn."}</p>
              </div>
            </div>
            <div className="flash-popup-timer">
              <span>{flashEndsAt > 0 ? "Kết thúc sau" : "Trạng thái"}</span>
              <b>{flashRemaining}</b>
            </div>
            <div className="flash-popup-products">
              {flashProducts.slice(0, 6).map((product) => {
                const salePrice = getActiveFlashSalePrice(product, settings, now);
                const hasSale = salePrice < product.price;
                return (
                  <button
                    key={product.id}
                    className="flash-popup-product"
                    onClick={() => {
                      addToCart(product.id);
                      closeFlashPopup();
                      setCartOpen(true);
                    }}
                  >
                    {isImageUrl(product.image) ? <img src={product.image} alt={product.name} /> : <span>{product.image || "💎"}</span>}
                    <div>
                      <b>{product.name}</b>
                      <small>{product.duration}</small>
                    </div>
                    <strong>{hasSale ? <><del>{formatMoney(product.price)}</del>{formatMoney(salePrice)}</> : formatMoney(product.price)}</strong>
                  </button>
                );
              })}
            </div>
            <div className="flash-popup-actions">
              <button className="btn wide" onClick={() => { closeFlashPopup(); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}>
                {settings.flashSaleCta || "Mua ngay"}
              </button>
              <button className="btn secondary wide" onClick={closeFlashPopup}>Để sau</button>
            </div>
          </div>
        </div>
      )}

      {communityOpen && (
        <div className="modal-backdrop" onClick={closeCommunityPopup}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeCommunityPopup}>×</button>
            <h2>{settings.communityPopupTitle || "Tham gia nhóm cộng đồng Zalo"}</h2>
            <p>{settings.communityPopupDescription || "Nhận thông báo event Free, cập nhật bảng giá và ưu đãi mới."}</p>
            <a className="btn wide" href={settings.communityLink} target="_blank" onClick={closeCommunityPopup}>Tham gia nhóm ngay</a>
            <button className="btn secondary wide" onClick={closeCommunityPopup}>Để sau</button>
          </div>
        </div>
      )}

      <footer className="footer"><div className="container"><b>{settings.siteTitle}</b><span>App Pro/Premium · Voucher · Thanh toán tự động · Admin gửi sản phẩm thủ công</span></div></footer>
    </main>
  );
}
