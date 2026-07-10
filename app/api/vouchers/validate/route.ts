import { NextResponse } from "next/server";
import { getProduct, validateVoucher } from "../../../../lib/redis";
import { CartItem } from "../../../../lib/types";

async function normalizeItems(rawItems: unknown): Promise<CartItem[]> {
  if (!Array.isArray(rawItems)) return [];

  const rows = await Promise.all(
    rawItems.map(async (item: any) => {
      const product = await getProduct(String(item.productId || ""));
      if (!product) return null;
      const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        duration: product.duration,
        price: product.price,
        quantity,
        subtotal: product.price * quantity
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
