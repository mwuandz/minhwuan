"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Package, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerContact: string;
  amount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  note?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Chờ thanh toán", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40", icon: Clock },
  paid: { label: "Đã thanh toán", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40", icon: CheckCircle2 },
  processing: { label: "Đang xử lý", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40", icon: Package },
  completed: { label: "Hoàn thành", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", icon: CheckCircle2 },
  cancelled: { label: "Đã huỷ", color: "text-red-600 bg-red-50 dark:bg-red-950/40", icon: XCircle },
};

export default function TraCuuPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không tìm thấy đơn hàng");
        return;
      }
      setOrder(data.order || data);
    } catch {
      setError("Không kết nối được máy chủ");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = order ? STATUS_MAP[order.status] || STATUS_MAP.pending : null;
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg">
      <div className="mx-auto max-w-lg px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="card-surface p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white">
              <Search className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">Tra cứu đơn hàng</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Nhập mã đơn hoặc số điện thoại để kiểm tra
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mã đơn hoặc SĐT..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Tra cứu
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {order && statusInfo && (
            <div className="mt-8 space-y-4">
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${statusInfo.color}`}>
                <StatusIcon className="h-5 w-5" />
                <span className="font-bold">{statusInfo.label}</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đơn</span>
                  <span className="font-mono font-bold">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng</span>
                  <span className="font-semibold">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Liên hệ</span>
                  <span>{order.customerContact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền</span>
                  <span className="font-bold text-red-600">{formatMoney(order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian</span>
                  <span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="mb-3 text-sm font-bold">Sản phẩm</div>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-semibold">{formatMoney(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {searched && !order && !error && !loading && (
            <div className="mt-6 text-center text-sm text-slate-500">Không tìm thấy đơn hàng phù hợp.</div>
          )}
        </div>
      </div>
    </div>
  );
}
