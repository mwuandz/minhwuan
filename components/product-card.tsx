"use client";

import Link from "next/link";
import { ShoppingCart, Zap, Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  salePrice?: number;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

function getBadgeClass(badge?: string) {
  if (!badge) return "";
  const b = badge.toLowerCase();
  if (/hot|best|combo/.test(b)) return "badge-hot";
  if (/sale|giá tốt|rẻ/.test(b)) return "badge-sale";
  if (/new|mới/.test(b)) return "badge-new";
  return "badge-combo";
}

export function ProductCard({ product, salePrice, onAddToCart, onBuyNow, isFavorite = false, onToggleFavorite }: ProductCardProps) {
  const isSale = salePrice !== undefined && salePrice < product.price;
  const displayPrice = isSale ? salePrice : product.price;
  const discountPercent = isSale
    ? Math.round(((product.price - salePrice!) / product.price) * 100)
    : 0;

  return (
    <article className="product-card-noel reveal-card group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-red-50 via-amber-50/60 to-emerald-50 dark:from-red-950/40 dark:via-amber-950/20 dark:to-emerald-950/30 p-4">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-16 w-16 rounded-2xl object-contain shadow-md transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-2xl font-black text-white shadow-lg">
            {product.name.charAt(0)}
          </div>
        )}

        <button type="button" onClick={onToggleFavorite} aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
          className="absolute right-3 bottom-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-red-600 shadow-md backdrop-blur transition hover:scale-110 dark:bg-slate-900/90">
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {product.badge && (
          <span className={cn("absolute left-3 top-3", getBadgeClass(product.badge))}>
            {product.badge}
          </span>
        )}

        {isSale && (
          <span className="absolute right-3 top-3 badge bg-red-600 text-white shadow-md">
            -{discountPercent}%
          </span>
        )}

        <span className="absolute bottom-2 right-3 text-lg opacity-70">🎄</span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600/80 dark:text-red-400/80">
          {product.category}
        </div>
        <Link href={`/product/${product.id}`} className="group/title">
          <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50 transition group-hover/title:text-red-600 dark:group-hover/title:text-red-400">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {product.duration}
        </p>
        <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400/80">
          {product.description}
        </p>

        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-slate-50">
              {formatMoney(displayPrice)}
            </span>
            {isSale && (
              <span className="text-sm text-slate-400 line-through">
                {formatMoney(product.price)}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onAddToCart?.(product)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 text-sm font-bold transition hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800"
            >
              <ShoppingCart className="h-4 w-4" />
              Thêm
            </button>
            <button
              onClick={() => onBuyNow?.(product)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #c41e3a 0%, #9b1b2e 60%, #d4a017 100%)",
                boxShadow: "0 6px 20px -4px rgba(196, 30, 58, 0.4)",
              }}
            >
              <Zap className="h-4 w-4" />
              Mua
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
