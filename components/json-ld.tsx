const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.minhwuan.com";

export function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Minh Wuan Store",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Cửa hàng App Pro/Premium: ChatGPT, CapCut, Netflix, YouTube Premium. Thanh toán VietQR tự động.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Vietnamese"],
      url: siteUrl,
    },
    sameAs: [],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Minh Wuan Store",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const store = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Minh Wuan Store",
    url: siteUrl,
    description: "Mua App Pro/Premium chính hãng giá tốt tại Việt Nam",
    priceRange: "$$",
    currenciesAccepted: "VND",
    paymentAccepted: "VietQR, Bank Transfer",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(store) }}
      />
    </>
  );
}
