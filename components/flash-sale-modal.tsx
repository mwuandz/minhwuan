"use client";
import { X, Clock } from "lucide-react";
import { Product, SiteSettings } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { salePrice } from "@/lib/home-helpers";

type Props = {
  open: boolean;
  products: Product[];
  settings: SiteSettings;
  now: number;
  remaining: string;
  onClose: () => void;
  onAdd: (p: Product) => void;
};

export function FlashSaleModal({ open, products, settings, now, remaining, onClose, onAdd }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel" onClick={onClose}>
      <div className="card-surface relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full bg-slate-100 p-2.5 dark:bg-slate-800"><X className="h-5 w-5" /></button>
        <span className="inline-flex rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-1 text-[11px] font-black text-white">⚡ {settings.flashSaleBadge || "FLASH SALE"}</span>
        <h3 className="mt-2 text-xl font-black pr-10">{settings.flashSaleTitle || "Flash Sale App Premium"}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{settings.flashSaleDescription || "Săn nhanh các gói hot với giá tốt."}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
          <Clock className="h-4 w-4" /> Còn lại: <span className="font-mono">{remaining}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {products.map((p) => {
            const sp = salePrice(p, settings, now);
            const is = sp < p.price;
            return (
              <div key={p.id} className="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 p-3 dark:border-rose-900/40 dark:bg-rose-950/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || "/logo.jpg"} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover bg-white" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.duration}</div>
                  <div className="mt-1 flex gap-1.5 items-baseline">
                    <span className="text-base font-black text-rose-600">{formatMoney(sp)}</span>
                    {is && <span className="text-xs text-slate-400 line-through">{formatMoney(p.price)}</span>}
                  </div>
                  <button type="button" onClick={() => onAdd(p)} className="mt-2 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-1.5 text-xs font-bold text-white">
                    {settings.flashSaleCta || "Mua ngay"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl border py-2.5 text-sm font-bold dark:border-slate-700">Để sau</button>
      </div>
    </div>
  );
}
