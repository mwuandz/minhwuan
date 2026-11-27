"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts, defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { CartItem, Order, Product, SiteSettings } from "@/lib/types";
import { Header } from "@/components/header";
import { Snow } from "@/components/snow";
import { ProductCard } from "@/components/product-card";
import { CartDrawer } from "@/components/cart-drawer";
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
  if (days > 0) {
    return `${days} ngày ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
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
    const params = new URLSearchParams(window.location.search);
    if (params.get("cart") === "open") setCartOpen(true);
  }, []);

  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

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
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
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
    setWishlist((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
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
      <Header
        siteTitle={settings.siteTitle || "Minh Wuan Store"}
        brandDomain={settings.brandDomain || "minhwuan.com"}
        cartCount={cartQuantity}
        onOpenCart={() => setCartOpen(true)}
        onSearch={setKeyword}
      />

      <div className="overflow-hidden border-b border-red-100 dark:border-red-900/30 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 py-2">
        <div className="marquee-track text-sm font-bold text-white">
          <span className="px-8">🎄 {settings.eventText || "Noel Sale – App Pro/Premium giá tốt"} · VietQR tự động · Kích hoạt 1–5 phút · Bảo hành rõ ràng 🎄</span>
          <span className="px-8">🎄 {settings.eventText || "Noel Sale – App Pro/Premium giá tốt"} · VietQR tự động · Kích hoạt 1–5 phút · Bảo hành rõ ràng 🎄</span>
        </div>
      </div>

      <main className="container-main py-5 sm:py-8 pb-28 sm:pb-8">
        <section className="hero-enter mb-8 sm:mb-12 grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300">
              <Sparkles className="h-3.5 w-3.5" />
              {settings.siteSubtitle || "Noel 2026 · App Premium"}
            </div>
            <h1 className="text-[1.75rem] leading-tight font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
              {settings.heroTitle || (
                <>
                  Mua App Pro/Premium{" "}
                  <span className="text-noel">giá tốt</span>
                </>
              )}
            </h1>
            <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-slate-500 dark:text-slate-400">
              {settings.heroDescription ||
                "ChatGPT, CapCut, Netflix, YouTube Premium, Gemini. Thanh toán VietQR tự động, bảo hành rõ ràng, kích hoạt nhanh 1–5 phút."}
            </p>
            <div className="mt-5 sm:mt-6 flex flex-wrap gap-2.5 sm:gap-3">
              <a href="#products" className="btn-primary">
                <Gift className="h-4 w-4" /> Xem bảng giá
              </a>
              <button type="button" onClick={() => setCartOpen(true)} className="btn-secondary">
                Giỏ hàng ({cartQuantity})
              </button>
            </div>
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1">✔ Bảo hành</span>
              <span className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1">✔ 1–5 phút</span>
              <span className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1">✔ VietQR</span>
            </div>
          </div>
          <div className="card-surface hero-float relative overflow-hidden p-5 sm:p-6 hidden sm:block">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-2xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-50">Thanh toán tự động</div>
                  <div className="text-xs text-slate-500">VietQR · SePay · MB Bank</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-500">Giỏ hàng</div>
                  <div className="font-black text-lg">{formatMoney(cartTotal)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-500">Cần thanh toán</div>
                  <div className="font-black text-lg text-red-600">{formatMoney(payableTotal)}</div>
                </div>
              </div>
              <div className="text-center text-4xl">🎄</div>
            </div>
          </div>
        </section>

        <section id="products" className="mb-12 sm:mb-16">
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-red-600/80">Bảng giá</div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">Chọn sản phẩm & thêm vào giỏ</h2>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm">
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name">Tên A–Z</option>
            </select>
          </div>

          <div className="mb-4 sm:mb-6 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-bold transition", category === item ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md" : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300")}>
                {item}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="card-surface py-16 text-center text-slate-500">Không tìm thấy sản phẩm phù hợp.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
              {filteredProducts.map((product, idx) => {
                const salePrice = getActiveFlashSalePrice(product, settings, now);
                return (
                  <div key={product.id} className="reveal-card" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                    <ProductCard product={product} salePrice={salePrice < product.price ? salePrice : undefined} onAddToCart={addToCart} onBuyNow={(p) => addToCart(p)} isFavorite={wishlist.includes(product.id)} onToggleFavorite={() => toggleWishlist(product.id)} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-12 sm:mb-16 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { icon: Shield, title: "Bảo hành", desc: "Trong thời gian dùng" },
            { icon: Zap, title: "Kích hoạt nhanh", desc: "1–5 phút" },
            { icon: QrCode, title: "VietQR", desc: "Tự động" },
            { icon: Gift, title: "Event Free", desc: "Tối T4 & T7" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-surface flex gap-2.5 sm:gap-3 p-3.5 sm:p-5">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-50 truncate">{title}</div>
                <div className="text-xs sm:text-sm text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 sm:py-8 text-center text-sm text-slate-500">
        <div className="container-main">© {new Date().getFullYear()} {settings.siteTitle || "Minh Wuan Store"} · {settings.brandDomain || "minhwuan.com"}</div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={detailedCart} voucherInput={voucherInput} onVoucherInput={setVoucherInput} voucher={voucher} voucherLoading={voucherLoading} onApplyVoucher={applyVoucher} onChangeQuantity={changeQuantity} onRemove={removeFromCart} cartTotal={cartTotal} discountAmount={discountAmount} payableTotal={payableTotal} onCheckout={createOrder} loading={loading} zaloLink={settings.zaloLink || ZALO_SUPPORT} />

      {paymentOrder && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel">
          <div className="card-surface relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
            <button type="button" onClick={() => setPaymentOrder(null)} className="absolute right-3 top-3 rounded-full bg-slate-100 dark:bg-slate-800 p-2.5"><X className="h-5 w-5" /></button>
            <h3 className="text-xl font-black pr-10">Thanh toán đơn hàng</h3>
            <p className="mt-1 text-sm text-slate-500">Mã: {paymentOrder.id}</p>
            <div className="mt-4 text-2xl font-black text-red-600">{formatMoney(paymentOrder.amount)}</div>
            {paymentOrder.qrCode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paymentOrder.qrCode} alt="VietQR" className="mx-auto mt-4 max-w-[220px] sm:max-w-[240px] rounded-xl bg-white p-2" />
            )}
            <p className="mt-3 text-center text-xs text-slate-500">{paymentOrder.status === "pending" ? "Đang chờ thanh toán..." : paymentOrder.status}</p>
            {(paymentOrder.status === "paid" || paymentOrder.status === "delivered") && (
              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="h-5 w-5" /> Đã thanh toán thành công</div>
            )}
          </div>
        </div>
      )}

      {flashOpen && flashSaleActive && (
        <div className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel">
          <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border border-red-200/60 dark:border-red-900/40 bg-white dark:bg-slate-900 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-600" />
            <button type="button" onClick={closeFlashPopup} className="absolute right-3 top-4 z-10 rounded-full bg-slate-100 dark:bg-slate-800 p-2.5" aria-label="Đóng"><X className="h-5 w-5" /></button>
            <div className="p-5 sm:p-6">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">⚡ Flash Sale Noel</div>
              <h3 className="mt-2 pr-10 text-xl sm:text-2xl font-black">{settings.flashSaleTitle || "Ưu đãi Noel đang diễn ra"}</h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400"><Clock className="h-4 w-4" /> Còn lại: {flashRemaining}</p>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {flashProducts.slice(0, 4).map((p) => {
                  const sale = getActiveFlashSalePrice(p, settings, now);
                  return (
                    <button key={p.id} type="button" onClick={() => { addToCart(p); closeFlashPopup(); }} className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-gradient-to-br from-red-50/80 to-amber-50/50 dark:from-red-950/30 dark:to-slate-900 p-3.5 text-left">
                      <div className="font-bold text-sm line-clamp-2">{p.name}</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-red-600 font-black">{formatMoney(sale)}</span>
                        {sale < p.price && <span className="text-xs text-slate-400 line-through">{formatMoney(p.price)}</span>}
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-emerald-700">+ Thêm vào giỏ</div>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={closeFlashPopup} className="mt-4 w-full rounded-xl border py-3 text-sm font-bold text-slate-600">Để sau</button>
            </div>
          </div>
        </div>
      )}

      {communityOpen && (
        <div className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel">
          <div className="relative w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
            <button type="button" onClick={closeCommunityPopup} className="absolute right-3 top-4 z-10 rounded-full bg-slate-100 dark:bg-slate-800 p-2.5" aria-label="Đóng"><X className="h-5 w-5" /></button>
            <div className="p-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl shadow-lg">💬</div>
              <h3 className="text-lg sm:text-xl font-black">Tham gia nhóm Zalo<br />Minh Wuan Store</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">Vào nhóm cộng đồng <span className="font-bold text-slate-700 dark:text-slate-200">Zalo Minh Wuan Store</span> để nhận nhiều ưu đãi và được hỗ trợ kịp thời.</p>
              <a href={settings.zaloLink || ZALO_SUPPORT} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full" onClick={closeCommunityPopup}>Tham gia nhóm Zalo ngay</a>
              <button type="button" onClick={closeCommunityPopup} className="mt-3 w-full py-2 text-sm font-semibold text-slate-400">Để sau</button>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-24 right-3 sm:right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900 safe-bottom">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {flashSaleActive && !flashOpen && (
        <button type="button" onClick={() => setFlashOpen(true)} className="fixed bottom-6 left-3 sm:left-4 z-40 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-500/30 safe-bottom">
          ⚡ Flash Sale
        </button>
      )}

      <a
        href={ZALO_SUPPORT}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-3 sm:right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-lg shadow-blue-500/40 transition hover:scale-105 hover:bg-[#0054d1] safe-bottom"
        aria-label="Zalo hỗ trợ"
        title="Chat Zalo hỗ trợ"
      >
        <span className="text-sm font-black tracking-tight">Zalo</span>
      </a>
    </div>
  );
}
