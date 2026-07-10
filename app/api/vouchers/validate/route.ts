import { NextResponse } from "next/server";
import { getProduct, getSettings, validateVoucher } from "../../../../lib/redis";
import { CartItem } from "../../../../lib/types";


function getActiveFlashSalePrice(product: { id: string; price: number; badge?: string; category: string }, settings: any, nowMs: number) {
  const endsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  if (settings.flashSaleEnabled === false) return product.price;
  if (endsAt > 0 && endsAt <= nowMs) return product.price;

  const selectedIds = settings.flashSaleProductIds || [];
  const isSelected = selectedIds.length ? selectedIds.includes(product.id) : /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`);
  if (!isSelected) return product.price;

  const salePrice = Number(settings.flashSalePrices?.[product.id] || 0);
  if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= product.price) return product.price;
  return salePrice;
}

async function normalizeItems(rawItems: unknown): Promise<CartItem[]> {
  const settings = await getSettings();
  const nowMs = Date.now();
  if (!Array.isArray(rawItems)) return [];

  const rows = await Promise.all(
    rawItems.map(async (item: any) => {
      const product = await getProduct(String(item.productId || ""));
      if (!product) return null;
      const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      const activePrice = getActiveFlashSalePrice(product, settings, nowMs);
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        duration: product.duration,
        price: activePrice,
        quantity,
        subtotal: activePrice * quantity
      } satisfies CartItem;
    })
  );

  return rows.filter(Boolean) as CartItem[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code || "");
    const items = await normalizeItems(body.items);
    const amount = items.length
      ? items.reduce((sum, item) => sum + item.subtotal, 0)
      : Number(body.amount || 0);

    const result = await validateVoucher(code, amount, items);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ valid: false, discountAmount: 0, message: "Lỗi kiểm tra voucher" }, { status: 400 });
  }
}
