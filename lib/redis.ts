import { Redis } from "@upstash/redis";
import { Order } from "./types";

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

const memoryOrders = new Map<string, Order>();

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
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as Order);
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
