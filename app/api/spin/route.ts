import { NextRequest, NextResponse } from "next/server";
import { getSpinByOrder, getSpinConfig, spinForOrder } from "@/lib/spin";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId") || "";
  const config = await getSpinConfig();
  if (!orderId) {
    return NextResponse.json({
      config: {
        enabled: config.enabled,
        title: config.title,
        description: config.description,
        minOrderAmount: config.minOrderAmount,
        prizes: config.prizes.map((p) => ({
          id: p.id,
          label: p.label,
          type: p.type,
          color: p.color,
          weight: p.weight,
        })),
      },
    });
  }
  const existing = await getSpinByOrder(orderId);
  return NextResponse.json({
    config: {
      enabled: config.enabled,
      title: config.title,
      description: config.description,
      minOrderAmount: config.minOrderAmount,
      prizes: config.prizes.map((p) => ({
        id: p.id,
        label: p.label,
        type: p.type,
        color: p.color,
        weight: p.weight,
      })),
    },
    alreadySpun: Boolean(existing),
    result: existing,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "Thiếu mã đơn" }, { status: 400 });
    }
    const out = await spinForOrder(orderId);
    if (!out.ok) {
      return NextResponse.json(
        { error: out.error, result: "result" in out ? out.result : undefined },
        { status: 400 }
      );
    }
    return NextResponse.json({
      result: out.result,
      prize: out.prize,
      config: {
        title: out.config?.title,
        prizes: out.config?.prizes?.map((p) => ({
          id: p.id,
          label: p.label,
          color: p.color,
          type: p.type,
          weight: p.weight,
        })),
      },
    });
  } catch (e) {
    console.error("spin error", e);
    return NextResponse.json({ error: "Không quay được" }, { status: 500 });
  }
}
