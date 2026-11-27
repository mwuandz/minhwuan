import { Redis } from "@upstash/redis";
import { getOrder } from "./redis";
import type { Announcement, SpinConfig, SpinPrize, SpinResult } from "./types";

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const memorySpinConfig: { value: SpinConfig | null } = { value: null };
const memorySpinByOrder = new Map<string, SpinResult>();
const memorySpinResults: SpinResult[] = [];
const memoryAnnouncements: Announcement[] = [];

export const defaultSpinConfig: SpinConfig = {
  enabled: true,
  title: "Vòng quay Noel 🎄",
  description: "Thanh toán thành công để quay thưởng – voucher, quà & sản phẩm!",
  minOrderAmount: 0,
  oncePerOrder: true,
  prizes: [
    { id: "p1", label: "Voucher 10K", type: "voucher", weight: 25, color: "#ef4444", voucherCode: "NOEL10K" },
    { id: "p2", label: "Voucher 20K", type: "voucher", weight: 15, color: "#f59e0b", voucherCode: "NOEL20K" },
    { id: "p3", label: "Quà bí mật", type: "gift", weight: 10, color: "#10b981", note: "Admin sẽ liên hệ trao quà" },
    { id: "p4", label: "Chúc may mắn", type: "nothing", weight: 35, color: "#64748b" },
    { id: "p5", label: "Giảm 5%", type: "voucher", weight: 10, color: "#8b5cf6", voucherCode: "NOEL5" },
    { id: "p6", label: "Quà Noel", type: "gift", weight: 5, color: "#c41e3a", note: "Quà Noel đặc biệt" },
  ],
};

export async function getSpinConfig(): Promise<SpinConfig> {
  if (redis) {
    const raw = await redis.get("spin:config");
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw as SpinConfig);
      return {
        ...defaultSpinConfig,
        ...parsed,
        prizes: parsed.prizes?.length ? parsed.prizes : defaultSpinConfig.prizes,
      };
    }
  }
  return memorySpinConfig.value || defaultSpinConfig;
}

export async function saveSpinConfig(input: Partial<SpinConfig>): Promise<SpinConfig> {
  const current = await getSpinConfig();
  const next: SpinConfig = {
    ...current,
    ...input,
    prizes: Array.isArray(input.prizes) ? input.prizes : current.prizes,
    updatedAt: new Date().toISOString(),
  };
  if (redis) await redis.set("spin:config", JSON.stringify(next));
  else memorySpinConfig.value = next;
  return next;
}

export async function getSpinByOrder(orderId: string): Promise<SpinResult | null> {
  if (redis) {
    const raw = await redis.hget("spin:byOrder", orderId);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : (raw as SpinResult);
  }
  return memorySpinByOrder.get(orderId) || null;
}

export async function listSpinResults(limit = 50): Promise<SpinResult[]> {
  if (redis) {
    const ids = await redis.zrange<string[]>("spin:index", 0, limit - 1, { rev: true });
    if (!ids?.length) return [];
    const rows = await Promise.all(
      ids.map(async (id) => {
        const raw = await redis!.hget("spin:results", id);
        if (!raw) return null;
        return (typeof raw === "string" ? JSON.parse(raw) : raw) as SpinResult;
      })
    );
    return rows.filter(Boolean) as SpinResult[];
  }
  return [...memorySpinResults].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

function pickWeightedPrize(prizes: SpinPrize[]): SpinPrize {
  const active = prizes.filter((p) => Number(p.weight) > 0);
  if (!active.length) {
    return { id: "empty", label: "Chúc may mắn", type: "nothing", weight: 1, color: "#64748b" };
  }
  const total = active.reduce((s, p) => s + Number(p.weight), 0);
  let r = Math.random() * total;
  for (const p of active) {
    r -= Number(p.weight);
    if (r <= 0) return p;
  }
  return active[active.length - 1];
}

export async function spinForOrder(orderId: string) {
  const config = await getSpinConfig();
  if (!config.enabled) return { ok: false as const, error: "Vòng quay đang tắt" };

  const order = await getOrder(orderId, false);
  if (!order) return { ok: false as const, error: "Không tìm thấy đơn hàng" };
  if (order.status !== "paid" && order.status !== "delivered") {
    return { ok: false as const, error: "Chỉ quay sau khi thanh toán thành công" };
  }
  if ((order.amount || 0) < (config.minOrderAmount || 0)) {
    return {
      ok: false as const,
      error: `Đơn tối thiểu ${config.minOrderAmount.toLocaleString("vi-VN")}đ để quay`,
    };
  }

  const existed = await getSpinByOrder(orderId);
  if (existed && config.oncePerOrder) {
    return { ok: false as const, error: "Đơn này đã quay rồi", result: existed };
  }

  const prize = pickWeightedPrize(config.prizes || []);
  const result: SpinResult = {
    id: `SP${Date.now()}`,
    orderId: order.id,
    prizeId: prize.id,
    prizeLabel: prize.label,
    prizeType: prize.type,
    customerContact: order.customerContact,
    createdAt: new Date().toISOString(),
  };

  if (redis) {
    await redis.hset("spin:results", { [result.id]: JSON.stringify(result) });
    await redis.hset("spin:byOrder", { [orderId]: JSON.stringify(result) });
    await redis.zadd("spin:index", { score: Date.now(), member: result.id });
  } else {
    memorySpinByOrder.set(orderId, result);
    memorySpinResults.unshift(result);
  }

  return { ok: true as const, result, prize, config };
}

export async function listAnnouncements(includeInactive = false): Promise<Announcement[]> {
  let list: Announcement[] = [];
  if (redis) {
    const raw = await redis.get("announcements:list");
    if (raw) list = typeof raw === "string" ? JSON.parse(raw) : (raw as Announcement[]);
  } else {
    list = [...memoryAnnouncements];
  }
  const now = Date.now();
  return list
    .filter((a) => includeInactive || (a.active && (!a.endsAt || new Date(a.endsAt).getTime() > now)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveAnnouncement(input: Partial<Announcement>): Promise<Announcement> {
  const list = await listAnnouncements(true);
  const id = input.id || `AN${Date.now()}`;
  const item: Announcement = {
    id,
    title: String(input.title || "Thông báo").trim(),
    body: String(input.body || "").trim(),
    type: (input.type as Announcement["type"]) || "system",
    active: input.active !== false,
    createdAt: input.createdAt || new Date().toISOString(),
    endsAt: input.endsAt || undefined,
  };
  const idx = list.findIndex((a) => a.id === id);
  const next = idx >= 0 ? list.map((a) => (a.id === id ? item : a)) : [item, ...list];
  if (redis) await redis.set("announcements:list", JSON.stringify(next));
  else {
    memoryAnnouncements.length = 0;
    memoryAnnouncements.push(...next);
  }
  return item;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const list = await listAnnouncements(true);
  const next = list.filter((a) => a.id !== id);
  if (next.length === list.length) return false;
  if (redis) await redis.set("announcements:list", JSON.stringify(next));
  else {
    memoryAnnouncements.length = 0;
    memoryAnnouncements.push(...next);
  }
  return true;
}
