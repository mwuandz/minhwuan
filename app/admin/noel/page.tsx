"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Save } from "lucide-react";
import type { Announcement, Product, SpinConfig, SpinPrize, SpinResult } from "@/lib/types";

export default function AdminNoelPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [config, setConfig] = useState<SpinConfig | null>(null);
  const [results, setResults] = useState<SpinResult[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [annForm, setAnnForm] = useState({ title: "", body: "", type: "promo" as Announcement["type"] });

  useEffect(() => {
    const saved = localStorage.getItem("mw_admin_password");
    if (saved) {
      setPassword(saved);
      load(saved);
    }
  }, []);

  async function load(pwd = password) {
    setLoading(true);
    setMsg("");
    try {
      const [spinRes, annRes, prodRes] = await Promise.all([
        fetch(`/api/admin/spin?password=${encodeURIComponent(pwd)}`),
        fetch(`/api/admin/announcements?password=${encodeURIComponent(pwd)}`),
        fetch(`/api/admin/products?password=${encodeURIComponent(pwd)}`),
      ]);
      const spin = await spinRes.json();
      const ann = await annRes.json();
      const prod = await prodRes.json();
      if (!spinRes.ok) throw new Error(spin.error || "Sai mật khẩu");
      setConfig(spin.config);
      setResults(spin.results || []);
      setAnnouncements(ann.announcements || []);
      setProducts(Array.isArray(prod.products) ? prod.products : []);
      setAuthed(true);
      localStorage.setItem("mw_admin_password", pwd);
    } catch (e) {
      setAuthed(false);
      setMsg(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function saveSpin(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/spin?password=${encodeURIComponent(password)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu");
      setConfig(data.config);
      setMsg("Đã lưu vòng quay");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  function updatePrize(i: number, patch: Partial<SpinPrize>) {
    if (!config) return;
    const prizes = config.prizes.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
    setConfig({ ...config, prizes });
  }

  function selectProductForPrize(i: number, productId: string) {
    if (!config) return;
    if (!productId) {
      updatePrize(i, { productId: "", type: "nothing" });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updatePrize(i, {
      type: "product",
      productId: product.id,
      label: product.name,
      image: product.image || "",
      note: product.duration ? `Thời hạn: ${product.duration}` : undefined,
    });
  }

  function addPrize() {
    if (!config) return;
    setConfig({
      ...config,
      prizes: [
        ...config.prizes,
        {
          id: `p${Date.now()}`,
          label: "Phần thưởng mới",
          type: "nothing",
          weight: 10,
          color: "#64748b",
        },
      ],
    });
  }

  function addProductPrize(product: Product) {
    if (!config) return;
    if (config.prizes.some((p) => p.productId === product.id)) {
      setMsg("Sản phẩm này đã có trên vòng quay");
      return;
    }
    setConfig({
      ...config,
      prizes: [
        ...config.prizes,
        {
          id: `prod_${product.id}_${Date.now()}`,
          label: product.name,
          type: "product",
          weight: 10,
          color: "#3b82f6",
          productId: product.id,
          image: product.image || "",
          note: product.duration ? `Thời hạn: ${product.duration}` : undefined,
        },
      ],
    });
    setMsg(`Đã thêm ${product.name} vào vòng quay`);
  }

  function removePrize(i: number) {
    if (!config) return;
    setConfig({ ...config, prizes: config.prizes.filter((_, idx) => idx !== i) });
  }

  async function saveAnnouncement(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/announcements?password=${encodeURIComponent(password)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(annForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      setAnnouncements((list) => [data.announcement, ...list]);
      setAnnForm({ title: "", body: "", type: "promo" });
      setMsg("Đã đăng thông báo");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function removeAnnouncement(id: string) {
    if (!confirm("Xóa thông báo?")) return;
    await fetch(`/api/admin/announcements?password=${encodeURIComponent(password)}&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    setAnnouncements((list) => list.filter((a) => a.id !== id));
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-sm space-y-3 rounded-2xl border bg-white p-6 shadow">
          <h1 className="text-xl font-black text-center">Admin · Noel tools</h1>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2"
            placeholder="ADMIN_PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          {msg && <p className="text-sm text-rose-500 text-center">{msg}</p>}
          <button onClick={() => load()} disabled={loading} className="w-full rounded-xl bg-red-600 py-3 font-bold text-white">
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Đăng nhập"}
          </button>
          <Link href="/admin" className="block text-center text-sm text-slate-500">
            ← Admin chính
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-black">Noel · Vòng quay & Thông báo</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
        {msg && <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}

        {config && (
          <form onSubmit={saveSpin} className="space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="font-black text-lg">🎡 Vòng quay Noel</h2>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              Bật vòng quay sau thanh toán
            </label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Tiêu đề"
            />
            <textarea
              className="w-full rounded-xl border px-3 py-2 text-sm"
              rows={2}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Mô tả"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="rounded-xl border px-3 py-2 text-sm"
                value={config.minOrderAmount}
                onChange={(e) => setConfig({ ...config, minOrderAmount: Number(e.target.value) })}
                placeholder="Đơn tối thiểu"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.oncePerOrder}
                  onChange={(e) => setConfig({ ...config, oncePerOrder: e.target.checked })}
                />
                1 lần / đơn
              </label>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-2">
              <h3 className="font-bold text-sm">🛒 Thêm sản phẩm từ shop vào vòng quay</h3>
              <p className="text-xs text-slate-500">Chọn SP → tự điền tên + ảnh minh họa trên vòng quay.</p>
              <div className="grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {products
                  .filter((p) => p.active !== false)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProductPrize(p)}
                      className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left text-sm hover:border-blue-400"
                    >
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold">
                          SP
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.category}</div>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-blue-600" />
                    </button>
                  ))}
                {products.length === 0 && <p className="text-xs text-slate-500">Chưa có sản phẩm</p>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Phần thưởng & tỉ lệ (weight)</h3>
                <button
                  type="button"
                  onClick={addPrize}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-bold"
                >
                  <Plus className="h-4 w-4" /> Thêm thủ công
                </button>
              </div>
              <p className="text-xs text-slate-500">Xác suất ≈ weight / tổng weight. Ảnh hiện trên vòng quay.</p>
              {config.prizes.map((p, i) => (
                <div key={p.id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-6">
                  <div className="sm:col-span-6 flex items-center gap-2">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover border" />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold"
                        style={{ background: p.color || "#e2e8f0" }}
                      >
                        {p.label.slice(0, 2)}
                      </div>
                    )}
                    <input
                      className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
                      value={p.label}
                      onChange={(e) => updatePrize(i, { label: e.target.value })}
                      placeholder="Tên quà"
                    />
                    <button
                      type="button"
                      onClick={() => removePrize(i)}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <select
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    value={p.type}
                    onChange={(e) => updatePrize(i, { type: e.target.value as SpinPrize["type"] })}
                  >
                    <option value="voucher">Voucher</option>
                    <option value="gift">Quà</option>
                    <option value="product">Sản phẩm</option>
                    <option value="nothing">Không trúng</option>
                  </select>
                  <input
                    type="number"
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    value={p.weight}
                    onChange={(e) => updatePrize(i, { weight: Number(e.target.value) })}
                    placeholder="Weight"
                  />
                  <input
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    value={p.voucherCode || ""}
                    onChange={(e) => updatePrize(i, { voucherCode: e.target.value })}
                    placeholder="Mã voucher"
                  />
                  <input
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    type="color"
                    value={p.color || "#64748b"}
                    onChange={(e) => updatePrize(i, { color: e.target.value })}
                    title="Màu ô"
                  />
                  <select
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    value={p.productId || ""}
                    onChange={(e) => selectProductForPrize(i, e.target.value)}
                  >
                    <option value="">— Chọn SP shop —</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="sm:col-span-6 rounded-lg border px-2 py-1.5 text-sm"
                    value={p.image || ""}
                    onChange={(e) => updatePrize(i, { image: e.target.value })}
                    placeholder="URL ảnh minh họa (tự điền khi chọn SP)"
                  />
                  <input
                    className="sm:col-span-6 rounded-lg border px-2 py-1.5 text-sm"
                    value={p.note || ""}
                    onChange={(e) => updatePrize(i, { note: e.target.value })}
                    placeholder="Ghi chú / mô tả quà"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white"
            >
              <Save className="h-4 w-4" /> Lưu vòng quay
            </button>
          </form>
        )}

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-black text-lg mb-3">Lịch sử quay gần đây</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.length === 0 && <p className="text-sm text-slate-500">Chưa có lượt quay</p>}
            {results.map((r) => (
              <div key={r.id} className="flex justify-between gap-2 rounded-xl border px-3 py-2 text-sm">
                <div>
                  <div className="font-bold">{r.prizeLabel}</div>
                  <div className="text-xs text-slate-500">
                    {r.orderId} · {r.customerContact}
                  </div>
                </div>
                <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString("vi-VN")}</div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={saveAnnouncement} className="space-y-3 rounded-2xl border bg-white p-5">
          <h2 className="font-black text-lg">📢 Thông báo từ Admin</h2>
          <p className="text-xs text-slate-500">Hiện banner trên trang chủ: thêm SP, đổi giá, khuyến mại…</p>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Tiêu đề"
            value={annForm.title}
            onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-xl border px-3 py-2 text-sm"
            rows={3}
            placeholder="Nội dung"
            value={annForm.body}
            onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
            required
          />
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={annForm.type}
            onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as Announcement["type"] })}
          >
            <option value="promo">Khuyến mại</option>
            <option value="product">Sản phẩm mới</option>
            <option value="price">Điều chỉnh giá</option>
            <option value="system">Hệ thống</option>
          </select>
          <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">
            Đăng thông báo
          </button>

          <div className="space-y-2 pt-2">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 rounded-xl border p-3">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400">{a.type}</div>
                  <div className="font-bold">{a.title}</div>
                  <div className="text-sm text-slate-500">{a.body}</div>
                </div>
                <button type="button" onClick={() => removeAnnouncement(a.id)} className="p-2 text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
