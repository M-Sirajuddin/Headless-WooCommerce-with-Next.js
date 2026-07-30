import { siteConfig, absoluteUrl } from "@/lib/seo";
import type { Product } from "@/types/woocommerce";

function priceNumber(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const n = input.replace(/[^\d.]/g, "");
  return n || undefined;
}

/**
 * Product + BreadcrumbList JSON-LD for a product page. Drives Google rich
 * results (price, availability, ratings) and gives answer engines a
 * structured product record.
 */
export default function ProductStructuredData({ product }: { product: Product }) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const availability =
    product.stockStatus === "OUT_OF_STOCK"
      ? "https://schema.org/OutOfStock"
      : product.stockStatus === "ON_BACKORDER"
        ? "https://schema.org/BackOrder"
        : "https://schema.org/InStock";

  const price = priceNumber(product.price);
  const description =
    (product.shortDescription || product.description || product.name)
      ?.replace(/<[^>]*>/g, "")
      .slice(0, 500) || product.name;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description,
        sku: String(product.databaseId),
        image: product.image?.sourceUrl ? [product.image.sourceUrl] : undefined,
        brand: { "@type": "Brand", name: siteConfig.name },
        url,
        ...(price
          ? {
              offers: {
                "@type": "Offer",
                url,
                priceCurrency: "USD",
                price,
                availability,
                seller: { "@id": `${siteConfig.url}/#organization` },
              },
            }
          : {}),
        ...(product.reviewCount && product.averageRating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.averageRating,
                reviewCount: product.reviewCount,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/products") },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
