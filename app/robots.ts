import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://www.minhwuan.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/tai-khoan", "/dang-nhap"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
