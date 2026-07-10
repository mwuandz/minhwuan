import { NextResponse } from "next/server";
import { validateVoucher } from "../../../../lib/redis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code || "");
    const amount = Math.max(0, Number(body.amount || 0));
    const result = await validateVoucher(code, amount);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, discountAmount: 0, message: "Không kiểm tra được voucher" }, { status: 400 });
  }
}
