import { Redis } from "@upstash/redis";
import { defaultProducts, defaultSettings, normalizeProduct } from "./products";
import { Order, Product, SiteSettings } from "./types";

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

function parseMaybeJson<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
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

export async function getOrder(id: string): Promise<Order | null> {
  if (redis) {
    const raw = await redis.hget<string>("orders", id);
    return parseMaybeJson<Order>(raw);
  }
  return memoryOrders.get(id) ?? null;
}

export async function listOrders(): Promise<Order[]> {
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
    const raw = await redis.get<string>("products:list");
    let products = parseMaybeJson<Product[]>(raw) || [];
    if (!products.length) {
      products = defaultProducts;
      await redis.set("products:list", JSON.stringify(products));
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
  const next = index >= 0
    ? products.map((p) => (p.id === product.id ? { ...p, ...product } : p))
    : [...products, product];

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

export async function getSettings(): Promise<SiteSettings> {
  if (redis) {
    const raw = await redis.get<string>("site:settings");
    const saved = parseMaybeJson<Partial<SiteSettings>>(raw) || {};
    const settings = { ...defaultSettings, ...saved };
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
    themeMode: input.themeMode === "dark" ? "dark" : "light",
    accentColor: String(input.accentColor ?? current.accentColor)
  };
  if (redis) await redis.set("site:settings", JSON.stringify(next));
  else memorySettings = next;
  return next;
}
