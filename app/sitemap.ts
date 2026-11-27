import type { MetadataRoute } from "next";
import { defaultProducts } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.minhwuan.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products = defaultProducts;

  try {
    const { listProducts } = await import("@/lib/redis");
    const live = await listProducts(false);
    if (live?.length) products = live;
  } catch {
    // fallback defaultProducts
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/tra-cuu`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/dang-nhap`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
