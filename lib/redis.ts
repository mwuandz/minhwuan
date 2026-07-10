import { Redis } from "@upstash/redis";
import { defaultProducts, defaultSettings, defaultVouchers, normalizeProduct, normalizeVoucher } from "./products";
import { CartItem, Order, Product, SiteSettings, Voucher, VoucherValidation } from "./types";

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

const memoryOrders = new Map<string, Order>();
let memoryProducts = [...defaultProducts];
let memorySettings = { ...defaultSettings };
let memoryVouchers = [...defaultVouchers];
const PRODUCT_CATALOG_VERSION = "2026-07-10-real-images-popup-voucher";

function parseMaybeJson<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

function isExpiredPendingOrder(order: Order) {
  return order.status === "pending" && Boolean(order.expiresAt) && new Date(order.expiresAt!).getTime() <= Date.now();
}

export async function deleteOrder(id: string) {
  if (redis) {
    await redis.hdel("orders", id);
    await redis.zrem("orders:index", id);
  } else {
    memoryOrders.delete(id);
  }
}

export async function cleanupExpiredOrders() {
  if (redis) {
    const ids = await redis.zrange<string[]>("orders:index", 0, 300, { rev: true });
    if (!ids.length) return;

    const rows = await Promise.all(ids.map(async (id) => ({ id, order: await getOrder(id, false) })));
    const expired = rows.filter((row) => row.order && isExpiredPendingOrder(row.order)).map((row) => row.id);

    if (expired.length) await Promise.all(expired.map((id) => deleteOrder(id)));
    return;
  }

  for (const [id, order] of memoryOrders.entries()) {
    if (isExpiredPendingOrder(order)) memoryOrders.delete(id);
  }
}

export async function saveOrder(order: Order) {
  if (redis) {
    await redis.hset("orders", { [order.id]: JSON.stringify(order) });
    await redis.zadd("orders:index", { score: Date.now(), member: order.id });
  } else {
    memoryOrders.set(order.id, order);
  }
  return order;
}

export async function getOrder(id: string, removeExpired = true): Promise<Order | null> {
  if (redis) {
    const raw = await redis.hget<string>("orders", id);
    const order = parseMaybeJson<Order>(raw);
    if (order && removeExpired && isExpiredPendingOrder(order)) {
      await deleteOrder(id);
      return null;
    }
    return order;
  }

  const order = memoryOrders.get(id) ?? null;
  if (order && removeExpired && isExpiredPendingOrder(order)) {
    memoryOrders.delete(id);
    return null;
  }
  return order;
}

export async function listOrders(): Promise<Order[]> {
  await cleanupExpiredOrders();

  if (redis) {
    const ids = await redis.zrange<string[]>("orders:index", 0, 100, { rev: true });
    if (!ids.length) return [];
    const rows = await Promise.all(ids.map((id) => getOrder(id)));
    return rows.filter(Boolean) as Order[];
  }

  return Array.from(memoryOrders.values()).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  if (redis) {
    const version = await redis.get<string>("products:version");
    const raw = await redis.get<string>("products:list");
    let products = parseMaybeJson<Product[]>(raw) || [];
    if (!products.length || version !== PRODUCT_CATALOG_VERSION) {
      products = defaultProducts;
      await redis.set("products:list", JSON.stringify(products));
      await redis.set("products:version", PRODUCT_CATALOG_VERSION);
    }
    return includeInactive ? products : products.filter((p) => p.active !== false);
  }
  return includeInactive ? memoryProducts : memoryProducts.filter((p) => p.active !== false);
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await listProducts(true);
  return products.find((product) => product.id === id && product.active !== false) || null;
}

export async function saveProduct(input: Partial<Product>): Promise<Product> {
  const product = normalizeProduct(input);
  const products = await listProducts(true);
  const index = products.findIndex((p) => p.id === product.id);
  const next = index >= 0 ? products.map((p) => (p.id === product.id ? { ...p, ...product } : p)) : [...products, product];

  if (redis) await redis.set("products:list", JSON.stringify(next));
  else memoryProducts = next;

  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await listProducts(true);
  const existed = products.some((p) => p.id === id);
  const next = products.filter((p) => p.id !== id);
  if (redis) await redis.set("products:list", JSON.stringify(next));
  else memoryProducts = next;
  return existed;
}

export async function listVouchers(includeInactive = false): Promise<Voucher[]> {
  if (redis) {
    const raw = await redis.get<string>("vouchers:list");
    let vouchers = parseMaybeJson<Voucher[]>(raw) || [];
    if (!vouchers.length) {
      vouchers = defaultVouchers;
      await redis.set("vouchers:list", JSON.stringify(vouchers));
    }
    return includeInactive ? vouchers : vouchers.filter((v) => v.active !== false);
  }
  return includeInactive ? memoryVouchers : memoryVouchers.filter((v) => v.active !== false);
}

export async function getVoucher(code: string): Promise<Voucher | null> {
  const normalized = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) return null;
  const vouchers = await listVouchers(true);
  return vouchers.find((v) => v.code === normalized || v.id === normalized) || null;
}

function getVoucherEligibleItems(voucher: Voucher, items: CartItem[] = []) {
  const ids = Array.isArray(voucher.applicableProductIds) ? voucher.applicableProductIds.filter(Boolean) : [];
  if (!ids.length) return items;
  return items.filter((item) => ids.includes(item.productId));
}

export function calculateVoucherDiscount(voucher: Voucher, amount: number, items: CartItem[] = []): VoucherValidation {
  const now = Date.now();
  if (!voucher || voucher.active === false) return { valid: false, discountAmount: 0, eligibleAmount: 0, message: "Voucher không hoạt động" };
  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < now) return { valid: false, discountAmount: 0, eligibleAmount: 0, message: "Voucher đã hết hạn" };
  if (voucher.minOrderAmount && amount < voucher.minOrderAmount) return { valid: false, discountAmount: 0, eligibleAmount: 0, message: `Đơn tối thiểu ${voucher.minOrderAmount.toLocaleString("vi-VN")}đ` };
  if (voucher.usageLimit && (voucher.usedCount || 0) >= voucher.usageLimit) return { valid: false, discountAmount: 0, eligibleAmount: 0, message: "Voucher đã hết lượt sử dụng" };

  const eligibleItems = items.length ? getVoucherEligibleItems(voucher, items) : [];
  const hasProductScope = Boolean(voucher.applicableProductIds?.length);
  const eligibleAmount = items.length ? eligibleItems.reduce((sum, item) => sum + item.subtotal, 0) : amount;

  if (hasProductScope && items.length && eligibleAmount <= 0) {
    return {
      valid: false,
      discountAmount: 0,
      eligibleAmount: 0,
      eligibleProductNames: [],
      message: "Voucher này không áp dụng cho sản phẩm trong giỏ hàng"
    };
  }

  const rawDiscount = voucher.type === "percent" ? Math.floor((eligibleAmount * voucher.value) / 100) : voucher.value;
  const capped = voucher.maxDiscount ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount;
  const discountAmount = Math.max(0, Math.min(eligibleAmount, capped));
  const eligibleProductNames = Array.from(new Set(eligibleItems.map((item) => item.name)));

  if (discountAmount <= 0) return { valid: false, discountAmount: 0, eligibleAmount, eligibleProductNames, message: "Voucher chưa có giá trị giảm hợp lệ" };

  const scopeText = hasProductScope
    ? eligibleProductNames.length
      ? ` · áp dụng cho ${eligibleProductNames.join(", ")}`
      : " · áp dụng cho sản phẩm được chọn"
    : "";

  return {
    valid: true,
    voucher,
    discountAmount,
    eligibleAmount,
    eligibleProductNames,
    message: `Đã áp dụng ${voucher.code}${scopeText}`
  };
}

export async function validateVoucher(code: string, amount: number, items: CartItem[] = []): Promise<VoucherValidation> {
  const voucher = await getVoucher(code);
  if (!voucher) return { valid: false, discountAmount: 0, eligibleAmount: 0, message: "Không tìm thấy voucher" };
  return calculateVoucherDiscount(voucher, amount, items);
}

export async function saveVoucher(input: Partial<Voucher>): Promise<Voucher> {
  const voucher = normalizeVoucher(input);
  const vouchers = await listVouchers(true);
  const index = vouchers.findIndex((v) => v.code === voucher.code || v.id === voucher.id);
  const next = index >= 0 ? vouchers.map((v) => (v.code === voucher.code || v.id === voucher.id ? { ...v, ...voucher } : v)) : [...vouchers, voucher];
  if (redis) await redis.set("vouchers:list", JSON.stringify(next));
  else memoryVouchers = next;
  return voucher;
}

export async function deleteVoucher(code: string): Promise<boolean> {
  const normalized = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  const vouchers = await listVouchers(true);
  const existed = vouchers.some((v) => v.code === normalized || v.id === normalized);
  const next = vouchers.filter((v) => v.code !== normalized && v.id !== normalized);
  if (redis) await redis.set("vouchers:list", JSON.stringify(next));
  else memoryVouchers = next;
  return existed;
}

export async function markVoucherUsed(code: string) {
  const normalized = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) return;
  const vouchers = await listVouchers(true);
  const next = vouchers.map((v) => (v.code === normalized || v.id === normalized ? { ...v, usedCount: (v.usedCount || 0) + 1 } : v));
  if (redis) await redis.set("vouchers:list", JSON.stringify(next));
  else memoryVouchers = next;
}

export async function getSettings(): Promise<SiteSettings> {
  if (redis) {
    const raw = await redis.get<string>("site:settings");
    const saved = parseMaybeJson<Partial<SiteSettings>>(raw) || {};
    const settings = { ...defaultSettings, ...saved };
    if (!saved.communityLink || saved.communityLink === saved.zaloLink || saved.communityLink === "https://zalo.me/0359868717") {
      settings.communityLink = defaultSettings.communityLink;
    }
    await redis.set("site:settings", JSON.stringify(settings));
    return settings;
  }
  return { ...defaultSettings, ...memorySettings };
}

export async function saveSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const next: SiteSettings = {
    ...current,
    siteTitle: String(input.siteTitle ?? current.siteTitle),
    siteSubtitle: String(input.siteSubtitle ?? current.siteSubtitle),
    brandDomain: String(input.brandDomain ?? current.brandDomain),
    heroTitle: String(input.heroTitle ?? current.heroTitle),
    heroDescription: String(input.heroDescription ?? current.heroDescription),
    warningText: String(input.warningText ?? current.warningText),
    eventText: String(input.eventText ?? current.eventText),
    zaloLink: String(input.zaloLink ?? current.zaloLink),
    communityLink: String(input.communityLink ?? current.communityLink),
    communityPopupEnabled: input.communityPopupEnabled === false ? false : true,
    communityPopupTitle: String(input.communityPopupTitle ?? current.communityPopupTitle ?? "Tham gia nhóm cộng đồng Zalo"),
    communityPopupDescription: String(input.communityPopupDescription ?? current.communityPopupDescription ?? "Vào nhóm để nhận bảng giá mới, event Free và ưu đãi riêng."),
    flashSaleEnabled: input.flashSaleEnabled === false ? false : true,
    flashSaleTitle: String(input.flashSaleTitle ?? current.flashSaleTitle ?? "Flash Sale App Premium hôm nay"),
    flashSaleDescription: String(input.flashSaleDescription ?? current.flashSaleDescription ?? "Săn nhanh các gói hot với giá tốt."),
    flashSaleBadge: String(input.flashSaleBadge ?? current.flashSaleBadge ?? "FLASH SALE"),
    flashSaleEndsAt: String(input.flashSaleEndsAt ?? current.flashSaleEndsAt ?? ""),
    flashSaleProductIds: Array.isArray(input.flashSaleProductIds) ? input.flashSaleProductIds.filter(Boolean).map(String) : (current.flashSaleProductIds || []),
    flashSalePrices: Object.fromEntries(
      Object.entries((input.flashSalePrices as Record<string, unknown>) || current.flashSalePrices || {})
        .map(([id, value]) => [String(id), Number(value)])
        .filter(([id, value]) => Boolean(id) && Number.isFinite(value as number) && Number(value) > 0)
    ),
    flashSaleCta: String(input.flashSaleCta ?? current.flashSaleCta ?? "Mua ngay"),
    themeMode: input.themeMode === "dark" ? "dark" : "light",
    accentColor: String(input.accentColor ?? current.accentColor)
  };
  if (redis) await redis.set("site:settings", JSON.stringify(next));
  else memorySettings = next;
  return next;
}
