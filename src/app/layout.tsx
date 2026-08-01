import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/seo";
import StoreProvider from "@/store/Provider";
import { ServerStatusProvider } from "@/context/ServerStatus";
import ServerDownBanner from "@/components/ServerDownBanner";
import SiteStructuredData from "@/components/SiteStructuredData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "wholesale cannabis", "Delta-9", "THC-P", "THC-A", "CBD", "Kanna",
    "disposables", "gummies", "flower", "pre-rolls", "tinctures",
    "Dazed", "Brixz", "Shrumfuzed", "Hytz", "MyZen", "hemp wholesale",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      { url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    site: siteConfig.twitter,
    creator: siteConfig.twitter,
    images: ["/opengraph-image"],
  },
  formatDetection: { telephone: false, email: false, address: false },
  category: "shopping",
}

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>
        <SiteStructuredData />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to main content
        </a>
        <NextTopLoader color="#d93b2e" showSpinner={false} />
        <StoreProvider>
          <ServerStatusProvider>
            <ServerDownBanner />
            <div className="flex min-h-screen flex-col">
              <Suspense fallback={null}>
                <Header />
              </Suspense>
              <main id="main-content" className="flex-1">{children}</main>
              <Footer />
            </div>
          </ServerStatusProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
