"use client";

import { useMemo, useState, useEffect, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingBag, Package, Ticket, Settings,
  ArrowLeft, RefreshCw, Pencil, Trash2, Plus, Clock,
  CheckCircle2, Truck, XCircle, Loader2,
} from "lucide-react";
import { defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { Order, Product, SiteSettings, Voucher } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "orders" | "products" | "vouchers" | "settings";

const emptyProduct: Product = {
  id: "", name: "", category: "App AI", price: 0, duration: "1 tháng",
  description: "", deliveryType: "manual", active: true,
  image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com", badge: "",
};

const emptyVoucher: Voucher = {
  id: "", code: "", description: "", type: "fixed", value: 0,
  minOrderAmount: 0, maxDiscount: 0, usageLimit: 0, usedCount: 0,
  active: true, applicableProductIds: [],
};

function toDateTimeLocalValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTimeLocalToIso(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const statusConfig: Record<string, { label: string; className: string; icon: ReactNode }> = {
  pending: { label: "Chờ TT", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: <Clock className="h-3.5 w-3.5" /> },
  paid: { label: "Đã TT", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  delivered: { label: "Đã giao", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: <Truck className="h-3.5 w-3.5" /> },
  cancelled: { label: "Hủy", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [voucherForm, setVoucherForm] = useState<Voucher>(emptyVoucher);
  const [msg, setMsg] = useState("");

  const headers = useMemo(
    () => ({ "x-admin-password": password, "Content-Type": "application/json" }),
    [password]
  );

  async function loadAll(pwd = password) {
    setLoading(true);
    setMsg("");
    try {
      const [o, p, v, s] = await Promise.all([
        fetch(`/api/admin/orders?password=${encodeURIComponent(pwd)}`).then((r) => r.json()),
        fetch(`/api/admin/products?password=${encodeURIComponent(pwd)}`).then((r) => r.json()),
        fetch(`/api/admin/vouchers?password=${encodeURIComponent(pwd)}`).then((r) => r.json()),
        fetch(`/api/admin/settings?password=${encodeURIComponent(pwd)}`).then((r) => r.json()),
      ]);
      if (o.error || p.error) throw new Error(o.error || p.error || "Sai mật khẩu");
      setOrders(o.orders || []);
      setProducts(p.products || []);
      setVouchers(v.vouchers || []);
      if (s.settings) setSettings(s.settings);
      setAuthed(true);
      localStorage.setItem("mw_admin_password", pwd);
      setMsg("Đăng nhập admin thành công");
    } catch (e) {
      setAuthed(false);
      setMsg(e instanceof Error ? e.message : "Sai mật khẩu admin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("mw_admin_password");
    if (saved) {
      setPassword(saved);
      loadAll(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/products?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(productForm),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Lỗi lưu sản phẩm");
    setProductForm(emptyProduct);
    setMsg("Đã lưu sản phẩm");
    loadAll();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm?")) return;
    await fetch(`/api/admin/products/${id}?password=${encodeURIComponent(password)}`, {
      method: "DELETE",
      headers,
    });
    setMsg("Đã xóa sản phẩm");
    loadAll();
  }

  async function saveVoucher(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/vouchers?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(voucherForm),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Lỗi lưu voucher");
    setVoucherForm(emptyVoucher);
    setMsg("Đã lưu voucher");
    loadAll();
  }

  async function deleteVoucher(code: string) {
    if (!confirm("Xóa voucher?")) return;
    await fetch(`/api/admin/vouchers/${code}?password=${encodeURIComponent(password)}`, {
      method: "DELETE",
      headers,
    });
    setMsg("Đã xóa voucher");
    loadAll();
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Lỗi lưu cài đặt");
    if (data.settings) setSettings(data.settings);
    setMsg("Đã lưu cài đặt website");
  }

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid" || o.status === "delivered");
    const revenue = paid.reduce((s, o) => s + (o.amount || 0), 0);
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: paid.length,
      revenue,
    };
  }, [orders]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 noel-hero-bg">
        <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-2xl font-black text-white">
              MW
            </div>
            <h1 className="text-xl font-black">Admin Panel</h1>
            <p className="mt-1 text-sm text-slate-500">Minh Wuan Store · Noel 2026</p>
          </div>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            placeholder="ADMIN_PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadAll()}
          />
          {msg && <p className="text-sm text-rose-500 text-center">{msg}</p>}
          <button
            onClick={() => loadAll()}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-amber-500 py-3 font-bold text-white shadow-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Đăng nhập admin"}
          </button>
          <Link href="/" className="block text-center text-sm text-slate-500 hover:text-red-600">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-red-100 dark:border-red-900/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-600" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-950/40">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-black">Admin 🎄</h1>
          </div>
          <button onClick={() => loadAll()} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {([
            ["dashboard", LayoutDashboard, "Dashboard"],
            ["orders", ShoppingBag, "Đơn hàng"],
            ["products", Package, "Sản phẩm"],
            ["vouchers", Ticket, "Voucher"],
            ["settings", Settings, "Cài đặt"],
          ] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                tab === id ? "bg-red-600 text-white shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {msg && (
          <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {msg}
          </div>
        )}

        {tab === "dashboard" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Tổng đơn", stats.total, ""],
              ["Chờ thanh toán", stats.pending, "text-amber-600"],
              ["Đã thanh toán", stats.paid, "text-emerald-600"],
              ["Doanh thu", formatMoney(stats.revenue), "text-red-600"],
            ].map(([label, val, color]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="text-sm text-slate-500">{label}</div>
                <div className={`mt-1 text-2xl font-black ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-slate-500 py-12">Chưa có đơn hàng</p>
            ) : (
              orders.map((o) => {
                const st = statusConfig[o.status] || statusConfig.pending;
                return (
                  <div key={o.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{o.id}</div>
                        <div className="text-sm text-slate-500">
                          {o.customerName} · {o.customerContact}
                        </div>
                        <div className="mt-1 text-sm">
                          {(o.items || []).map((i) => `${i.name} x${i.quantity}`).join(", ") || o.productName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-600">{formatMoney(o.amount)}</div>
                        <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", st.className)}>
                          {st.icon} {st.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                      {o.voucherCode ? ` · Voucher ${o.voucherCode}` : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "products" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={saveProduct} className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="font-black">{productForm.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
              <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="ID (để trống = tự tạo)" value={productForm.id} onChange={(e) => setProductForm({ ...productForm, id: e.target.value })} />
              <input required className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Tên" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              <input required className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Danh mục" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input required type="number" className="rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Giá" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                <input required className="rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Thời hạn" value={productForm.duration} onChange={(e) => setProductForm({ ...productForm, duration: e.target.value })} />
              </div>
              <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="URL ảnh" value={productForm.image || ""} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Badge" value={productForm.badge || ""} onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })} />
              <textarea required rows={3} className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Mô tả" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={productForm.active !== false} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} />
                Hiển thị
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Lưu</button>
                <button type="button" onClick={() => setProductForm(emptyProduct)} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Mới</button>
              </div>
            </form>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.category} · {formatMoney(p.price)}</div>
                  </div>
                  <button onClick={() => { setProductForm(p); }} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteProduct(p.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "vouchers" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={saveVoucher} className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="font-black">Voucher</h2>
              <input required className="w-full rounded-xl border px-3 py-2 text-sm uppercase dark:bg-slate-800 dark:border-slate-700" placeholder="Mã" value={voucherForm.code} onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Mô tả" value={voucherForm.description || ""} onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })} />
              <select className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" value={voucherForm.type} onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value as Voucher["type"] })}>
                <option value="fixed">Giảm số tiền</option>
                <option value="percent">Giảm %</option>
              </select>
              <input required type="number" className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Giá trị" value={voucherForm.value} onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Đơn tối thiểu" value={voucherForm.minOrderAmount || 0} onChange={(e) => setVoucherForm({ ...voucherForm, minOrderAmount: Number(e.target.value) })} />
                <input type="number" className="rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Giảm tối đa" value={voucherForm.maxDiscount || 0} onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: Number(e.target.value) })} />
              </div>
              <button type="submit" className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Lưu voucher</button>
            </form>
            <div className="space-y-2">
              {vouchers.map((v) => (
                <div key={v.code} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{v.code}</div>
                    <div className="text-xs text-slate-500">{v.type === "percent" ? `${v.value}%` : formatMoney(v.value)}</div>
                  </div>
                  <button onClick={() => setVoucherForm({ ...v, applicableProductIds: v.applicableProductIds || [] })} className="rounded-lg p-2 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteVoucher(v.code)} className="rounded-lg p-2 text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <form onSubmit={saveSettings} className="mx-auto max-w-xl space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="font-black">Cài đặt website</h2>
            <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Tiêu đề" value={settings.siteTitle} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Subtitle" value={settings.siteSubtitle} onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Domain" value={settings.brandDomain} onChange={(e) => setSettings({ ...settings, brandDomain: e.target.value })} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Hero title" value={settings.heroTitle} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} />
            <textarea rows={3} className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Hero description" value={settings.heroDescription} onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Event text" value={settings.eventText} onChange={(e) => setSettings({ ...settings, eventText: e.target.value })} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="Zalo link" value={settings.zaloLink} onChange={(e) => setSettings({ ...settings, zaloLink: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.flashSaleEnabled !== false} onChange={(e) => setSettings({ ...settings, flashSaleEnabled: e.target.checked })} />
              Bật Flash Sale
            </label>
            <input type="datetime-local" className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" value={toDateTimeLocalValue(settings.flashSaleEndsAt)} onChange={(e) => setSettings({ ...settings, flashSaleEndsAt: dateTimeLocalToIso(e.target.value) })} />
            <button type="submit" className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Lưu cài đặt</button>
          </form>
        )}
      </div>
    </div>
  );
}
