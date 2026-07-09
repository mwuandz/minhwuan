import { NextResponse } from "next/server";
import { getSettings, listProducts } from "../../../lib/redis";

export async function GET() {
  const [products, settings] = await Promise.all([listProducts(false), getSettings()]);
  return NextResponse.json({ products, settings });
}
