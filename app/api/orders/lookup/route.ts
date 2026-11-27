import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getOrderByCode, getOrdersByContact } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ message: "Vui lòng nhập mã đơn hoặc số liên hệ" }, { status: 400 });
    }

    let order = null;

    order = await getOrderById(q);

    if (!order) {
      const codeMatch = q.toUpperCase().match(/^(?:MW)?(\d+)$/);
      if (codeMatch) {
        order = await getOrderByCode(codeMatch[1]);
      }
    }

    if (!order) {
      const orders = await getOrdersByContact(q);
      if (orders.length > 0) {
        order = orders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      }
    }

    if (!order) {
      return NextResponse.json(
        { message: "Không tìm thấy đơn hàng. Kiểm tra lại mã đơn (MW...) hoặc số điện thoại." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Lookup error:", err);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
