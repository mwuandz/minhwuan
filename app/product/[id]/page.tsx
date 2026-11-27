import type { Metadata } from "next";
import { defaultProducts } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import ProductClient from "./product-client";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.minhwuan.com";

async function resolveProduct(id: string) {
  try {
    const { getProduct: fetchProduct, listProducts } = await import("@/lib/redis");
    const p = await fetchProduct(id);
    if (p) return p;
    const all = await listProducts(true);
    return all.find((x) => x.id === id) || defaultProducts.find((x) => x.id === id) || null;
  } catch {
    return defaultProducts.find((x) => x.id === id) || null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await resolveProduct(id);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm",
      robots: { index: false },
    };
  }

  const title = `Mua ${product.name} ${product.duration} – ${formatMoney(product.price)}`;
  const description =
    product.description ||
    `${product.name} ${product.duration}. Giá ${formatMoney(product.price)}. Thanh toán VietQR, bảo hành rõ ràng tại Minh Wuan Store.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${product.id}`,
    },
    openGraph: {
      title: `${product.name} | Minh Wuan Store`,
      description,
      url: `${siteUrl}/product/${product.id}`,
      type: "website",
      images: product.image
        ? [{ url: product.image, alt: product.name }]
        : [{ url: "/og.png", alt: "Minh Wuan Store" }],
    },
    twitter: {
      card: "summary",
      title: product.name,
      description,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await resolveProduct(id);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.image || `${siteUrl}/og.png`,
        brand: {
          "@type": "Brand",
          name: "Minh Wuan Store",
        },
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/product/${product.id}`,
          priceCurrency: "VND",
          price: product.price,
          availability:
            product.active === false
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "Minh Wuan Store",
          },
        },
        category: product.category,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient />
    </>
  );
}
