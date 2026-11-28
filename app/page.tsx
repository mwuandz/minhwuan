"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts, defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { CartItem, Order, Product, SiteSettings } from "@/lib/types";
import { Header } from "@/components/header";
import { Snow } from "@/components/snow";
import { ProductCard } from "@/components/product-card";
import { CartDrawer } from "@/components/cart-drawer";
import { SpinWheel } from "@/components/spin-wheel";
import { Shield, Zap, QrCode, Gift, X, CheckCircle2, Sparkles, ArrowUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const CART_KEY = "minhwuan_cart";
const WISHLIST_KEY = "minhwuan_wishlist";
const ZALO_SUPPORT = "https://zalo.me/0559331106";
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
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days} ngày ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getActiveFlashSalePrice(product: Product, settings: SiteSettings, now: number) {
  const endsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  if (settings.flashSaleEnabled === false) return product.price;
  if (endsAt > 0 && endsAt <= now) return product.price;
  const selectedIds = settings.flashSaleProductIds || [];
  const isSelected = selectedIds.length
    ? selectedIds.includes(product.id)
    : /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`);
  if (!isSelected) return product.price;
  const salePrice = Number(settings.flashSalePrices?.[product.id] || 0);
  if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= product.price) return product.price;
  return salePrice;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [category, setCategory] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [loading, setLoading] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistHydrated, setWishlistHydrated] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherState | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string; type: string }[]>([]);
  const [spinOpen, setSpinOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products?.length) setProducts(data.products);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => null)
      .finally(() => setSettingsLoaded(true));
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.announcements)) setAnnouncements(data.announcements.slice(0, 5));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
    if (!paymentOrder) return;
    if (paymentOrder.status === "paid" || paymentOrder.status === "delivered") {
      const key = `mw_spin_auto_${paymentOrder.id}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {}
      const t = setTimeout(() => setSpinOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, [paymentOrder?.id, paymentOrder?.status]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed))
          setCart(parsed.filter((item) => item && typeof item.productId === "string" && Number(item.quantity) > 0));
      }
      const savedWishlist = localStorage.getItem(WISHLIST_KEY);
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) setWishlist(parsed.filter((id) => typeof id === "string"));
      }
    } catch {
      setCart([]);
      setWishlist([]);
    } finally {
      setCartHydrated(true);
      setWishlistHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (!wishlistHydrated) return;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, wishlistHydrated]);

  useEffect(() => {
    setVoucher(null);
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("cart") === "open") setCartOpen(true);
  }, []);

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
          subtotal: activePrice * item.quantity,
        } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];
  }, [cart, products, settings, now]);

  const cartTotal = detailedCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = voucher?.valid ? voucher.discountAmount : 0;
  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const cartQuantity = detailedCart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    let list = products.filter((product) => {
      const matchCategory = category === "Tất cả" || product.category === category;
      const matchKeyword = `${product.name} ${product.category} ${product.description} ${product.duration}`
        .toLowerCase()
        .includes(keyword.toLowerCase());
      return matchCategory && matchKeyword && product.active !== false;
    });
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    return list;
  }, [category, keyword, products, sortBy]);

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

  function addToCart(product: Product) {
    setCart((current) => {
      const existed = current.find((item) => item.productId === product.id);
      if (existed)
        return current.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { productId: product.id, quantity: 1 }];
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

  function toggleWishlist(productId: string) {
    setWishlist((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
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
    if (!voucherInput.trim())
      return setVoucher({ code: "", valid: false, discountAmount: 0, message: "Vui lòng nhập mã voucher" });
    if (!cartTotal)
      return setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Giỏ hàng đang trống" });
    setVoucherLoading(true);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherInput,
          amount: cartTotal,
          items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const data = await res.json();
      setVoucher({
        code: voucherInput.trim().toUpperCase(),
        valid: Boolean(data.valid),
        discountAmount: Number(data.discountAmount || 0),
        eligibleAmount: Number(data.eligibleAmount || 0),
        eligibleProductNames: Array.isArray(data.eligibleProductNames) ? data.eligibleProductNames : [],
        message: data.message || (data.valid ? "Đã áp dụng voucher" : "Voucher không hợp lệ"),
      });
    } catch {
      setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Lỗi kết nối" });
    } finally {
      setVoucherLoading(false);
    }
  }

  async function createOrder(formData: FormData) {
    if (!detailedCart.length) return alert("Giỏ hàng đang trống");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          voucherCode: voucher?.valid ? voucher.code : undefined,
          customerName: formData.get("customerName"),
          customerContact: formData.get("customerContact"),
          customerEmail: formData.get("customerEmail"),
          customerNote: formData.get("customerNote"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không tạo được đơn hàng");
        return;
      }
      localStorage.removeItem(CART_KEY);
      setCart([]);
      setVoucher(null);
      setCartOpen(false);
      setPaymentOrder(data.order);
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg relative">
      <Snow />
      <Header siteTitle={settings.siteTitle || "Minh Wuan Store"} brandDomain={settings.brandDomain || "minhwuan.com"} cartCount={cartQuantity} onOpenCart={() => setCartOpen(true)} onSearch={setKeyword} />

      <div className="overflow-hidden border-b border-red-100 dark:border-red-900/30 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 py-2">
        <div className="marquee-track text-[11px] sm:text-sm font-bold text-white">
          <span className="inline-block px-6 sm:px-8 whitespace-nowrap">🎄 {settings.eventText || "Noel Sale – App Pro/Premium giá tốt"} · Thanh toán tự động VietQR · Kích hoạt 1–5 phút · Bảo hành rõ ràng · Hỗ trợ Zalo 24/7 🎄</span>
          <span className="inline-block px-6 sm:px-8 whitespace-nowrap" aria-hidden>🎄 {settings.eventText || "Noel Sale – App Pro/Premium giá tốt"} · Thanh toán tự động VietQR · Kích hoạt 1–5 phút · Bảo hành rõ ràng · Hỗ trợ Zalo 24/7 🎄</span>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="border-b border-amber-200/60 bg-amber-50 dark:bg-amber-950/30">
          <div className="container-main py-2.5 space-y-1.5">
            {announcements.slice(0, 2).map((a) => (
              <div key={a.id} className="text-sm">
                <span className="mr-2 rounded-full bg-amber-200/80 dark:bg-amber-800 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900 dark:text-amber-100">{a.type}</span>
                <span className="font-bold text-slate-900 dark:text-slate-50">{a.title}</span>
                <span className="text-slate-600 dark:text-slate-300"> — {a.body}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="container-main py-5 sm:py-8 pb-28 sm:pb-8">
        <section className="hero-enter mb-8 sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300">
            <Sparkles className="h-3.5 w-3.5" />
            {settings.siteSubtitle || "Noel 2026 · App Premium"}
          </div>
          <h1 className="text-[1.75rem] leading-tight font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            {settings.heroTitle || (
              <>
                Mua App Pro/Premium <span className="text-noel">giá tốt</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm sm:text-base text-slate-500 dark:text-slate-400">
            {settings.heroDescription || "ChatGPT, CapCut, Netflix, YouTube Premium, Gemini. Thanh toán VietQR tự động, bảo hành rõ ràng, kích hoạt nhanh 1–5 phút."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a href="#products" className="btn-primary"><Gift className="h-4 w-4" /> Xem bảng giá</a>
            <button type="button" onClick={() => setCartOpen(true)} className="btn-secondary">Giỏ hàng ({cartQuantity})</button>
          </div>
        </section>

        <section id="products" className="mb-12 sm:mb-16">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-red-600/80">Bảng giá</div>
              <h2 className="text-xl sm:text-3xl font-black">Chọn sản phẩm & thêm vào giỏ</h2>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="w-full sm:w-auto rounded-xl border px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700">
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name">Tên A–Z</option>
            </select>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-bold", category === item ? "bg-gradient-to-r from-red-600 to-amber-500 text-white" : "border dark:border-slate-700 bg-white dark:bg-slate-900")}>
                {item}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, idx) => {
              const salePrice = getActiveFlashSalePrice(product, settings, now);
              return (
                <div key={product.id} className="reveal-card" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                  <ProductCard product={product} salePrice={salePrice < product.price ? salePrice : undefined} onAddToCart={addToCart} onBuyNow={(p) => addToCart(p)} isFavorite={wishlist.includes(product.id)} onToggleFavorite={() => toggleWishlist(product.id)} />
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-slate-400">
        <div className="container-main">© {new Date().getFullYear()} {settings.siteTitle || "Minh Wuan Store"}</div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={detailedCart} voucherInput={voucherInput} onVoucherInput={setVoucherInput} voucher={voucher} voucherLoading={voucherLoading} onApplyVoucher={applyVoucher} onChangeQuantity={changeQuantity} onRemove={removeFromCart} cartTotal={cartTotal} discountAmount={discountAmount} payableTotal={payableTotal} onCheckout={createOrder} loading={loading} zaloLink={settings.zaloLink || ZALO_SUPPORT} />

      {paymentOrder && (() => {
        const expiresAt = paymentOrder.expiresAt ? new Date(paymentOrder.expiresAt).getTime() : 0;
        const isPending = paymentOrder.status === "pending";
        const isExpired = isPending && expiresAt > 0 && expiresAt <= now;
        const remaining = expiresAt > 0 ? formatRemaining(expiresAt - now) : "15:00";
        const isPaid = paymentOrder.status === "paid" || paymentOrder.status === "delivered";
        const isFree = (paymentOrder.amount || 0) === 0;
        return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel">
          <div className="card-surface relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto">
            <button type="button" onClick={() => setPaymentOrder(null)} className="absolute right-3 top-3 rounded-full bg-slate-100 p-2.5 dark:bg-slate-800"><X className="h-5 w-5" /></button>
            <h3 className="text-xl font-black pr-10">{isFree || isPaid ? "Đơn hàng" : "Thanh toán đơn hàng"}</h3>
            <p className="mt-1 text-sm text-slate-500">Mã: {paymentOrder.id}</p>
            <div className="mt-4 text-2xl font-black text-red-600">{formatMoney(paymentOrder.amount)}</div>

            {isPending && !isExpired && !isFree && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-sm font-bold text-amber-800 dark:text-amber-200">
                <Clock className="h-4 w-4 shrink-0" />
                Còn <span className="font-mono text-base">{remaining}</span> · hết hạn sau 15 phút
              </div>
            )}
            {isPending && isExpired && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                Đơn đã hết hạn. Vui lòng tạo đơn mới.
              </div>
            )}

            {isPending && !isExpired && paymentOrder.qrCode && (
              <>
                <p className="mt-3 text-center text-xs text-slate-500">Quét VietQR · giữ nguyên số tiền & nội dung CK</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paymentOrder.qrCode} alt="VietQR" className="mx-auto mt-3 max-w-[220px] rounded-xl bg-white p-2" />
                <p className="mt-2 text-center text-xs text-slate-400">Nội dung: <b>{paymentOrder.paymentContent}</b></p>
              </>
            )}

            {isPaid && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-center gap-2 font-bold text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  {isFree ? "Đơn 0đ – đã nhận, bỏ qua thanh toán" : "Đã thanh toán thành công"}
                </div>
                <button type="button" onClick={() => setSpinOpen(true)} className="btn-primary w-full">🎡 Quay thưởng Noel</button>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {paymentOrder && <SpinWheel orderId={paymentOrder.id} open={spinOpen} onClose={() => setSpinOpen(false)} />}

      {showScrollTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-[9.5rem] right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg safe-bottom">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {flashSaleActive && !flashOpen && (
        <button type="button" onClick={() => setFlashOpen(true)} className="fixed bottom-[5.5rem] right-3 z-40 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg safe-bottom">
          ⚡ Flash Sale
        </button>
      )}

      <a href={ZALO_SUPPORT} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-3 sm:right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-lg shadow-blue-500/40 transition hover:scale-105 hover:bg-[#0054d1] safe-bottom" aria-label="Zalo hỗ trợ" title="Chat Zalo hỗ trợ">
        <span className="text-sm font-black">Zalo</span>
      </a>
    </div>
  );
}
