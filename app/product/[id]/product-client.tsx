"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Zap, Shield, Clock, CheckCircle2 } from "lucide-react";
import { defaultProducts, defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { Product, SiteSettings } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products) {
          const found = data.products.find((p: Product) => p.id === id);
          setProduct(found || defaultProducts.find((p) => p.id === id) || null);
        }
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {
        setProduct(defaultProducts.find((p) => p.id === id) || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function addToCart() {
    if (!product) return;
    try {
      const raw = localStorage.getItem("minhwuan_cart");
      const cart: { productId: string; quantity: number }[] = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c) => c.productId === product.id);
      if (existing) existing.quantity += 1;
      else cart.push({ productId: product.id, quantity: 1 });
      localStorage.setItem("minhwuan_cart", JSON.stringify(cart));
      router.push("/?cart=open");
    } catch {
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-main flex min-h-screen flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-black">Không tìm thấy sản phẩm</h1>
        <Link href="/" className="btn-primary mt-6">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg">
      <div className="container-main py-6 max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại bảng giá
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left: Image */}
          <div className="card-surface flex items-center justify-center p-12">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.name} className="h-40 w-40 object-contain" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-amber-500 text-5xl font-black text-white">
                {product.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-red-600/80 dark:text-red-400/80">
              {product.category}
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl flex items-center gap-2">{product.name} <span className="text-2xl">🎄</span></h1>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">{product.duration}</p>

            {product.badge && (
              <span className="mt-3 inline-block rounded-full bg-gradient-to-r from-red-600 to-amber-500 px-3 py-1 text-xs font-bold text-white">
                {product.badge}
              </span>
            )}

            <div className="mt-6 text-3xl font-black text-slate-900 dark:text-slate-50">
              {formatMoney(product.price)}
            </div>

            <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed">{product.description}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={addToCart} className="btn-secondary flex-1">
                <ShoppingCart className="h-4 w-4" />
                Thêm vào giỏ
              </button>
              <button onClick={addToCart} className="btn-primary flex-1">
                <Zap className="h-4 w-4" />
                Mua ngay
              </button>
            </div>

            {/* Trust */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <Shield className="h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <div className="text-sm font-bold">Bảo hành</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Trong thời gian sử dụng</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <Clock className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <div className="text-sm font-bold">Kích hoạt nhanh</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">1–5 phút sau thanh toán</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <div className="text-sm font-bold">Thanh toán an toàn</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">VietQR + SePay tự động</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
