import { PUBLIC_SITE_URL } from "./env";

/**
 * Central site/brand config used across metadata, structured data,
 * sitemap and robots. Update the values here — everything else follows.
 */
export const siteConfig = {
  name: "HEDY STORE",
  legalName: "HEDY STORE",
  url: PUBLIC_SITE_URL,
  description:
    "HEDY STORE is a premium wholesale marketplace for Delta-9, THC-P, THC-A, CBD, Kanna, disposables, gummies, flower and pre-rolls from top brands including Dazed, Brixz, Shrumfuzed, Hytz and MyZen.",
  tagline: "Premium Wholesale Cannabis & Hemp Products",
  locale: "en_US",
  twitter: "@hedystore",
  logo: `${PUBLIC_SITE_URL}/icon.svg`,
  ogImage: `${PUBLIC_SITE_URL}/opengraph-image`,
  sameAs: [
    // Add real social profile URLs when available
    "https://www.facebook.com/",
  ],
  contact: {
    email: "support@hedy.store",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Build an absolute URL from a path for canonical/OG use. */
export function absoluteUrl(path = ""): string {
  if (!path) return siteConfig.url;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
