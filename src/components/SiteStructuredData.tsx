import { siteConfig } from "@/lib/seo";

/**
 * Global JSON-LD structured data (Organization + WebSite + Store).
 * These are the primary signals answer engines (Google AI Overviews,
 * ChatGPT, Perplexity) and rich results use to understand the brand.
 * Rendered server-side in <body> so crawlers always see it.
 */
export default function SiteStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        legalName: siteConfig.legalName,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: siteConfig.logo,
        },
        description: siteConfig.description,
        email: siteConfig.contact.email,
        sameAs: siteConfig.sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/products?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Store",
        "@id": `${siteConfig.url}/#store`,
        name: siteConfig.name,
        image: siteConfig.logo,
        url: siteConfig.url,
        description: siteConfig.description,
        priceRange: "$$",
        parentOrganization: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD is trusted, generated from our own config.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
