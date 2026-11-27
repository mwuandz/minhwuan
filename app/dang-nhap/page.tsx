"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Snow } from "@/components/snow";

const TOKEN_KEY = "mw_customer_token";
const USER_KEY = "mw_customer_user";

export default function DangNhapPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { contact, password }
          : { name, contact, email: email || undefined, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        setLoading(false);
        return;
      }

      if (!data.token || !data.customer) {
        setError("Phản hồi đăng nhập không hợp lệ");
        setLoading(false);
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.customer));
      // Hard navigation – tránh bị kẹt ở trang đăng nhập
      window.location.href = "/tai-khoan";
      return;
    } catch {
      setError("Không kết nối được máy chủ");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg relative">
      <Snow />
      <div className="mx-auto max-w-md px-4 py-10 relative z-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="card-surface p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-lg">
              <User className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"} 🎄
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Đăng nhập để xem đơn hàng & lịch sử"
                : "Tạo tài khoản để quản lý đơn hàng dễ dàng"}
            </p>
          </div>

          <div className="mb-6 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                mode === "register"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Họ tên</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện thoại / Zalo</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email (tuỳ chọn)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : mode === "login" ? (
                "Đăng nhập"
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
