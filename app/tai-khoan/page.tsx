"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  LogOut,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

const TOKEN_KEY = "mw_customer_token";
const USER_KEY = "mw_customer_user";

interface Customer {
  id: string;
  name: string;
  contact: string;
  email?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  amount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Chờ thanh toán", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40", icon: Clock },
  paid: { label: "Đã thanh toán", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40", icon: CheckCircle2 },
  delivered: { label: "Đã giao", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", icon: Truck },
  cancelled: { label: "Đã huỷ", color: "text-red-600 bg-red-50 dark:bg-red-950/40", icon: XCircle },
};

export default function TaiKhoanPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (!token || !userStr) {
      router.replace("/dang-nhap");
      return;
    }
    try {
      setCustomer(JSON.parse(userStr));
    } catch {
      router.replace("/dang-nhap");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/orders", {
          headers: { "x-customer-token": token },
        });
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          router.replace("/dang-nhap");
          return;
        }
        const data = await res.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        // ignore network errors – still show profile
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function handleLogout() {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-customer-token": token },
      body: JSON.stringify({ token }),
    }).catch(() => {});
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="card-surface p-6 mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-50">{customer?.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{customer?.contact}</p>
                {customer?.email && <p className="text-xs text-slate-400">{customer.email}</p>}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50">Đơn hàng của bạn</h2>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Package className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm">Chưa có đơn hàng nào</p>
              <Link href="/" className="mt-4 inline-block text-sm font-bold text-red-600 hover:underline">
                Mua sắm ngay →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                const StatusIcon = status.icon;
                return (
                  <div key={order.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-50">{order.id}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-semibold">{formatMoney(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-sm text-slate-500">Tổng</span>
                      <span className="font-black text-red-600">{formatMoney(order.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
