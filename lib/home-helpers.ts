import { Product, SiteSettings } from "@/lib/types";

export function fmtRem(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function salePrice(p: Product, st: SiteSettings, now: number) {
  const ends = st.flashSaleEndsAt ? new Date(st.flashSaleEndsAt).getTime() : 0;
  if (st.flashSaleEnabled === false) return p.price;
  if (ends > 0 && ends <= now) return p.price;
  const ids = st.flashSaleProductIds || [];
  const ok = ids.length ? ids.includes(p.id) : /hot|best|combo|giá tốt|rẻ/i.test(`${p.badge || ""} ${p.category}`);
  if (!ok) return p.price;
  const sp = Number(st.flashSalePrices?.[p.id] || 0);
  if (!Number.isFinite(sp) || sp <= 0 || sp >= p.price) return p.price;
  return sp;
}
