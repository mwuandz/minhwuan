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
import { FlashSaleModal } from "@/components/flash-sale-modal";
import { CommunityPopup } from "@/components/community-popup";
import { fmtRem, salePrice } from "@/lib/home-helpers";
import { Gift, X, CheckCircle2, Sparkles, ArrowUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const CART_KEY = "minhwuan_cart";
const ZALO = "https://zalo.me/0559331106";
type LCI = { productId: string; quantity: number };

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [category, setCategory] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [loading, setLoading] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<LCI[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; valid: boolean; discountAmount: number; message: string } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string; type: string }[]>([]);
  const [spinOpen, setSpinOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => {
      if (d.products?.length) setProducts(d.products);
      if (d.settings) setSettings(d.settings);
    }).catch(() => null).finally(() => setSettingsLoaded(true));
    fetch("/api/announcements").then((r) => r.json()).then((d) => {
      if (Array.isArray(d.announcements)) setAnnouncements(d.announcements.slice(0, 5));
    }).catch(() => null);
  }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const onS = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onS);
    return () => window.removeEventListener("scroll", onS);
  }, []);
  useEffect(() => {
    try {
      const s = localStorage.getItem(CART_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p)) setCart(p.filter((i: LCI) => i && typeof i.productId === "string" && Number(i.quantity) > 0));
      }
    } catch { setCart([]); }
    finally { setHydrated(true); }
  }, []);
  useEffect(() => { if (!hydrated) return; localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => {
    if (!paymentOrder?.id || paymentOrder.status !== "pending") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/orders/${paymentOrder.id}`);
        const d = await r.json();
        if (r.ok && d.order) setPaymentOrder(d.order);
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [paymentOrder?.id, paymentOrder?.status]);
  useEffect(() => {
    if (!paymentOrder) return;
    if (paymentOrder.status === "paid" || paymentOrder.status === "delivered") {
      const k = `mw_spin_auto_${paymentOrder.id}`;
      try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch {}
      const t = setTimeout(() => setSpinOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, [paymentOrder?.id, paymentOrder?.status]);

  const categories = useMemo(() => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const detailedCart = useMemo<CartItem[]>(() => cart.map((item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return null;
    const pr = salePrice(p, settings, now);
    return { productId: p.id, name: p.name, category: p.category, duration: p.duration, price: pr, quantity: item.quantity, subtotal: pr * item.quantity } satisfies CartItem;
  }).filter(Boolean) as CartItem[], [cart, products, settings, now]);
  const cartTotal = detailedCart.reduce((s, i) => s + i.subtotal, 0);
  const discountAmount = voucher?.valid ? voucher.discountAmount : 0;
  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const cartQuantity = detailedCart.reduce((s, i) => s + i.quantity, 0);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const c = category === "Tất cả" || p.category === category;
      const k = `${p.name} ${p.category} ${p.description} ${p.duration}`.toLowerCase().includes(keyword.toLowerCase());
      return c && k && p.active !== false;
    });
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    return list;
  }, [category, keyword, products, sortBy]);

  const flashProducts = useMemo(() => {
    const ids = settings.flashSaleProductIds || [];
    const active = products.filter((p) => p.active !== false && p.price > 0);
    if (ids.length) return ids.map((id) => active.find((p) => p.id === id)).filter(Boolean).slice(0, 6) as Product[];
    return active.filter((p) => /hot|best|combo|giá tốt|rẻ/i.test(`${p.badge || ""} ${p.category}`)).slice(0, 6);
  }, [products, settings.flashSaleProductIds]);
  const flashEnds = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  const flashRem = flashEnds > 0 ? fmtRem(flashEnds - now) : "Đang mở";
  const flashActive = settings.flashSaleEnabled !== false && flashProducts.length > 0 && !(flashEnds > 0 && flashEnds <= now);

  useEffect(() => {
    if (!settingsLoaded || !flashActive) return;
    try {
      if (sessionStorage.getItem("mw_flash_popup_seen")) {
        setFlashDismissed(true);
        return;
      }
    } catch {}
    const t = setTimeout(() => setFlashOpen(true), 650);
    return () => clearTimeout(t);
  }, [settingsLoaded, flashActive]);

  useEffect(() => {
    if (!settingsLoaded || settings.communityPopupEnabled === false) return;
    if (flashActive && !flashDismissed) return;
    try { if (sessionStorage.getItem("mw_community_popup_seen")) return; } catch {}
    const t = setTimeout(() => setCommunityOpen(true), 900);
    return () => clearTimeout(t);
  }, [settingsLoaded, settings.communityPopupEnabled, flashActive, flashDismissed]);

  function addToCart(p: Product) {
    setCart((c) => {
      const e = c.find((i) => i.productId === p.id);
      if (e) return c.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...c, { productId: p.id, quantity: 1 }];
    });
    setCartOpen(true);
  }
  function changeQty(id: string, q: number) {
    if (q <= 0) return setCart((c) => c.filter((i) => i.productId !== id));
    setCart((c) => c.map((i) => (i.productId === id ? { ...i, quantity: q } : i)));
  }
  function removeItem(id: string) { setCart((c) => c.filter((i) => i.productId !== id)); }
  function closeFlash() {
    try { sessionStorage.setItem("mw_flash_popup_seen", "1"); } catch {}
    setFlashOpen(false);
    setFlashDismissed(true);
  }
  function closeCommunity() {
    try { sessionStorage.setItem("mw_community_popup_seen", "1"); } catch {}
    setCommunityOpen(false);
  }

  async function applyVoucher() {
    if (!voucherInput.trim()) return setVoucher({ code: "", valid: false, discountAmount: 0, message: "Nhập mã voucher" });
    if (!cartTotal) return setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Giỏ trống" });
    setVoucherLoading(true);
    try {
      const r = await fetch("/api/vouchers/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: voucherInput, amount: cartTotal, items: detailedCart.map((i) => ({ productId: i.productId, quantity: i.quantity })) }) });
      const d = await r.json();
      setVoucher({ code: voucherInput.trim().toUpperCase(), valid: !!d.valid, discountAmount: Number(d.discountAmount || 0), message: d.message || (d.valid ? "OK" : "Không hợp lệ") });
    } catch { setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Lỗi kết nối" }); }
    finally { setVoucherLoading(false); }
  }
  async function createOrder(fd: FormData) {
    if (!detailedCart.length) return alert("Giỏ trống");
    setLoading(true);
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: detailedCart.map((i) => ({ productId: i.productId, quantity: i.quantity })), voucherCode: voucher?.valid ? voucher.code : undefined, customerName: fd.get("customerName"), customerContact: fd.get("customerContact"), customerEmail: fd.get("customerEmail"), customerNote: fd.get("customerNote") }) });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Lỗi tạo đơn"); return; }
      localStorage.removeItem(CART_KEY); setCart([]); setVoucher(null); setCartOpen(false); setPaymentOrder(d.order);
    } catch { alert("Lỗi kết nối"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg relative">
      <Snow />
      <Header siteTitle={settings.siteTitle || "Minh Wuan Store"} brandDomain={settings.brandDomain || "minhwuan.com"} cartCount={cartQuantity} onOpenCart={() => setCartOpen(true)} onSearch={setKeyword} />
      <div className="overflow-hidden border-b bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 py-2">
        <div className="marquee-track text-[11px] sm:text-sm font-bold text-white">
          <span className="inline-block px-6 whitespace-nowrap">🎄 {settings.eventText || "Noel Sale"} · VietQR · Kích hoạt nhanh 🎄</span>
          <span className="inline-block px-6 whitespace-nowrap" aria-hidden>🎄 {settings.eventText || "Noel Sale"} · VietQR · Kích hoạt nhanh 🎄</span>
        </div>
      </div>
      {announcements.length > 0 && (
        <div className="border-b border-amber-200/60 bg-amber-50 dark:bg-amber-950/30">
          <div className="container-main py-2.5 space-y-1">
            {announcements.slice(0, 2).map((a) => (
              <div key={a.id} className="text-sm"><span className="mr-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase">{a.type}</span><b>{a.title}</b> — {a.body}</div>
            ))}
          </div>
        </div>
      )}
      <main className="container-main py-5 sm:py-8 pb-28">
        <section className="hero-enter mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-bold text-red-700"><Sparkles className="h-3.5 w-3.5" />{settings.siteSubtitle || "Noel 2026"}</div>
          <h1 className="text-[1.75rem] font-black sm:text-5xl">{settings.heroTitle || <>Mua App Pro <span className="text-noel">giá tốt</span></>}</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-500">{settings.heroDescription || "ChatGPT, CapCut, Netflix, YouTube Premium."}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a href="#products" className="btn-primary"><Gift className="h-4 w-4" /> Xem bảng giá</a>
            <button type="button" onClick={() => setCartOpen(true)} className="btn-secondary">Giỏ ({cartQuantity})</button>
            {flashActive && <button type="button" onClick={() => setFlashOpen(true)} className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-sm font-black text-white shadow-lg">⚡ Flash Sale</button>}
          </div>
        </section>
        <section id="products" className="mb-12">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="text-xs font-bold uppercase text-red-600/80">Bảng giá</div><h2 className="text-xl sm:text-3xl font-black">Chọn sản phẩm</h2></div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-xl border px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700">
              <option value="default">Mặc định</option><option value="price-asc">Giá tăng</option><option value="price-desc">Giá giảm</option><option value="name">Tên A–Z</option>
            </select>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-bold", category === item ? "bg-gradient-to-r from-red-600 to-amber-500 text-white" : "border dark:border-slate-700 bg-white dark:bg-slate-900")}>{item}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} salePrice={salePrice(p, settings, now)} onAddToCart={() => addToCart(p)} onToggleFavorite={() => {}} isFavorite={false} />
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-sm text-slate-400"><div className="container-main">© {new Date().getFullYear()} {settings.siteTitle || "Minh Wuan Store"}</div></footer>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={detailedCart} voucherInput={voucherInput} onVoucherInput={setVoucherInput} voucher={voucher} voucherLoading={voucherLoading} onApplyVoucher={applyVoucher} onChangeQuantity={changeQty} onRemove={removeItem} cartTotal={cartTotal} discountAmount={discountAmount} payableTotal={payableTotal} onCheckout={createOrder} loading={loading} zaloLink={settings.zaloLink || ZALO} />

      <FlashSaleModal open={flashOpen && flashActive} products={flashProducts} settings={settings} now={now} remaining={flashRem} onClose={closeFlash} onAdd={(p) => { addToCart(p); closeFlash(); }} />

      <CommunityPopup open={communityOpen} settings={settings} fallbackLink={ZALO} onClose={closeCommunity} />

      {paymentOrder && (() => {
        const exp = paymentOrder.expiresAt ? new Date(paymentOrder.expiresAt).getTime() : 0;
        const pending = paymentOrder.status === "pending";
        const expired = pending && exp > 0 && exp <= now;
        const rem = exp > 0 ? fmtRem(exp - now) : "15:00";
        const paid = paymentOrder.status === "paid" || paymentOrder.status === "delivered";
        const free = (paymentOrder.amount || 0) === 0;
        return (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel">
            <div className="card-surface relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto">
              <button type="button" onClick={() => setPaymentOrder(null)} className="absolute right-3 top-3 rounded-full bg-slate-100 p-2.5 dark:bg-slate-800"><X className="h-5 w-5" /></button>
              <h3 className="text-xl font-black pr-10">{free || paid ? "Đơn hàng" : "Thanh toán"}</h3>
              <p className="mt-1 text-sm text-slate-500">Mã: {paymentOrder.id}</p>
              <div className="mt-4 text-2xl font-black text-red-600">{formatMoney(paymentOrder.amount)}</div>
              {pending && !expired && !free && <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800"><Clock className="h-4 w-4" /> Còn <span className="font-mono">{rem}</span></div>}
              {pending && expired && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Đơn hết hạn</div>}
              {pending && !expired && paymentOrder.qrCode && (<>
                <p className="mt-3 text-center text-xs text-slate-500">Quét VietQR</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paymentOrder.qrCode} alt="QR" className="mx-auto mt-3 max-w-[220px] rounded-xl bg-white p-2" />
                <p className="mt-2 text-center text-xs text-slate-400">ND: <b>{paymentOrder.paymentContent}</b></p>
              </>)}
              {paid && <div className="mt-4 space-y-3"><div className="flex items-center justify-center gap-2 font-bold text-emerald-600"><CheckCircle2 className="h-5 w-5" />{free ? "Đơn 0đ" : "Đã thanh toán"}</div><button type="button" onClick={() => setSpinOpen(true)} className="btn-primary w-full">🎡 Quay thưởng Noel</button></div>}
            </div>
          </div>
        );
      })()}
      {paymentOrder && <SpinWheel orderId={paymentOrder.id} open={spinOpen} onClose={() => setSpinOpen(false)} />}
      {showScrollTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-[9.5rem] right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg safe-bottom"><ArrowUp className="h-5 w-5" /></button>}
      {flashActive && !flashOpen && (
        <button type="button" onClick={() => setFlashOpen(true)} className="fixed bottom-[5.75rem] right-3 z-[55] rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 px-3.5 py-2.5 text-xs font-black text-white shadow-lg shadow-rose-500/40 ring-2 ring-white/30 animate-pulse safe-bottom" aria-label="Flash Sale">⚡ Flash Sale</button>
      )}
      <a href={ZALO} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-3 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-lg safe-bottom"><span className="text-sm font-black">Zalo</span></a>
    </div>
  );
}
