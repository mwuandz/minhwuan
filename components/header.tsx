"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ShoppingCart, Search, Moon, Sun, Menu, X, PackageSearch, User } from "lucide-react";
import { useState } from "react";

type HeaderProps = {
  siteTitle?: string;
  brandDomain?: string;
  cartCount?: number;
  onOpenCart?: () => void;
  onSearch?: (q: string) => void;
};

export function Header({
  siteTitle = "Minh Wuan Store",
  brandDomain = "minhwuan.com",
  cartCount = 0,
  onOpenCart,
  onSearch,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-red-200/60 dark:border-red-900/40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-600" />

      <div className="container-main">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Minh Wuan"
              className="h-10 w-10 object-contain sm:h-11 sm:w-11 transition group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="text-sm font-black leading-tight flex items-center gap-1.5">
                {siteTitle}
                <span className="text-base">🎄</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{brandDomain}</div>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="Tìm sản phẩm, ChatGPT, CapCut..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/tra-cuu"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition"
            >
              <PackageSearch className="h-4 w-4" />
              Tra cứu
            </Link>

            <Link
              href="/tai-khoan"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition"
            >
              <User className="h-4 w-4" />
              Tài khoản
            </Link>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative rounded-xl p-2.5 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 m-auto h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            <button
              onClick={onOpenCart}
              className="relative rounded-xl p-2.5 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full cart-badge px-1 text-[11px] font-bold text-white shadow-md">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            <button
              className="md:hidden rounded-xl p-2.5 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-red-100 dark:border-red-900/40 py-3 md:hidden space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="Tìm sản phẩm..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm outline-none"
              />
            </div>
            <Link
              href="/tra-cuu"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => setMobileOpen(false)}
            >
              <PackageSearch className="h-4 w-4" />
              Tra cứu đơn hàng
            </Link>
            <Link
              href="/tai-khoan"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => setMobileOpen(false)}
            >
              <User className="h-4 w-4" />
              Tài khoản
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
