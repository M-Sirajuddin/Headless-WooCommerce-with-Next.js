"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  House,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";
import CartCount from "@/components/CartCount";
import ProductImage from "@/components/ProductImage";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useCartTotals } from "@/hooks/useCartTotals";
import { removeItem, updateQuantity } from "@/store/cartSlice";

const CATEGORY_COLUMNS = [
  [
    {
      title: "Shrooms",
      href: "/category/shrooms",
      items: [
        { name: "Miniz", href: "/category/miniz" },
        { name: "Classic Gummies", href: "/category/classic-gummies" },
        { name: "Classic Chocolates", href: "/category/classic-chocolates" },
        { name: "Tabz", href: "/category/tabz" },
        { name: "MAX Gummies", href: "/category/max-gummies" },
        { name: "MAX Chocolates", href: "/category/max-chocolates" },
        { name: "Dazed&Shrumfuzed", href: "/category/dazedxshrumfuzed" },
      ],
    },
    {
      title: "Concentrates",
      href: "/category/dabs",
      items: [
        { name: "THCA", href: "/category/dabs-thca" },
        { name: "THCP", href: "/category/dabs-thcp" },
        { name: "THCA/THCP/D8P/D9P", href: "/category/dab-thca-thcp-d8p-d9p" },
      ],
    }
  ],
  [
    {
      title: "Edibles",
      href: "/category/edibles",
      items: [
        { name: "THCP", href: "/category/edibles-thcp" },
        { name: "D9/D9THCP/D8THCP/CBD", href: "/category/edibles-d9-d9thcp-d8thcp-cbd" },
        { name: "THCV", href: "/category/thcv" },
        { name: "Dazed Sleep/Relax", href: "/category/dazed-sleep-relax" },
        { name: "Brixz CBD+", href: "/category/brixz-cbd" },
        { name: "Brixz Pharm", href: "/category/brixz-pharm" },
      ],
    },
    {
      title: "Nicotine",
      href: "/category/nicotine",
      items: [
        { name: "Brixz 9000", href: "/category/brixz-9000" },
        { name: "Brixz 3.0", href: "/category/brixz-3-0" },
      ],
    }
  ],
  [
    {
      title: "Disposables",
      href: "/category/disposables",
      items: [
        { name: "THCA", href: "/category/disposable-thc-a" },
        { name: "THCP", href: "/category/disposable-thcp" },
        { name: "THCA/THCP/D8", href: "/category/disposable-d8-thca-thcp-disposables" },
        { name: "THCV", href: "/category/disposable-thcv" },
        { name: "Delta 8", href: "/category/disposable-d8-disposables" },
      ],
    },
    {
      title: "Cartridges",
      href: "/category/cartridges",
      items: [
        { name: "THCA", href: "/category/carts-thca" },
        { name: "THCP", href: "/category/carts-thcp-carts" },
        { name: "THCA/THCP", href: "/category/thca-thcp" },
        { name: "Delta 8", href: "/category/carts-d8" },
      ],
    }
  ],
  [
    {
      title: "Kanna",
      href: "/category/kanna",
      items: [
        { name: "Kanna", href: "/category/kanna-bliss" },
        { name: "Kanna + Shrums", href: "/category/kanna-shrums" },
        { name: "Shrums", href: "/category/kanna-shrums-kanna" },
      ],
    },
    {
      title: "Alkaloids + Rich Whips",
      href: "/category/alkaloids-rich-whips",
      items: [
        { name: "Alkaloids", href: "/category/alkaloids" },
        { name: "3.3L", href: "/category/rich-whips-3-3l-2" },
        { name: "4.4L", href: "/category/rich-whips-4-4l" },
        { name: "640g", href: "/category/rich-whips-640g" },
      ],
    }
  ],
  [
    {
      title: "Supplements",
      href: "/category/supplements",
      items: [
        { name: "Ski Gear", href: "/category/ski-gear" },
        { name: "Sauce Shield", href: "/category/sauce-shield" },
        { name: "Roll Patrol", href: "/category/roll-patrol" },
        { name: "Lung Hero", href: "/category/lung-hero" },
        { name: "The WHIP", href: "/category/the-whip" },
        { name: "The NOD", href: "/category/the-nod" },
      ],
    }
  ]
];

const WP_CDN = "https://woocommerce-1331608-4874165.cloudwaysapps.com/wp-content/uploads";

const BRAND_COLUMNS = [
  [
    {
      title: "Dazed",
      href: "/brand/dazed",
      logo: `${WP_CDN}/2026/02/Dazed-Logo-flat-1-scaled.png`,
      items: [
        { name: "Ai Blenz", href: "/tag/ai-blenz" },
        { name: "Atomic Blenz", href: "/tag/atomic-blenz" },
        { name: "Diamond Dabz", href: "/tag/Diamond-Dabz" },
        { name: "Diamonds Sauze", href: "/tag/Diamonds-Sauze" },
        { name: "Frosted Flower", href: "/tag/frosted-flower" },
        { name: "Money Blenz", href: "/category/disposable-money-blenz" },
        { name: "Sleep + Relax", href: "/tag/sleeprelax" },
        { name: "Supersonic Blenz", href: "/category/gummy-supersonic-blenz" },
        { name: "THCA Collection", href: "/tag/THCA-Collection" },
        { name: "THCP Collection", href: "/tag/THCP-Collection" },
        { name: "THCV Collection", href: "/tag/THCV-Collection" },
      ],
    },
  ],
  [
    {
      title: "Brixz",
      href: "/brand/brixz",
      logo: `${WP_CDN}/2026/02/brixz-gold.png`,
      items: [
        { name: "Bespoke", href: "/tag/bespoke" },
        { name: "CBD+ Collection", href: "/tag/cbd-collection" },
        { name: "Diamond Dabs", href: "/tag/diamond-dabs" },
        { name: "High-Rise", href: "/tag/high-rise" },
        { name: "Pharm", href: "/tag/pharm" },
        { name: "THCA Collection", href: "/tag/thca-collection-brixz" },
      ],
    },
    {
      title: "Jackpot",
      href: "/brand/jackpot",
      logo: `${WP_CDN}/2026/02/jackpot-my-scaled.png`,
      items: [
        { name: "THCA X THCP Disposables", href: "/category/disposable-d8-thca-thcp-disposables" },
      ],
    },
  ],
  [
    {
      title: "Shrumfuzed",
      href: "/brand/shrumfuzed",
      logo: `${WP_CDN}/2026/02/shrumfuzed-my.png`,
      items: [
        { name: "Classic (Gummies/Chocolates)", href: "/category/gummies-shrumfuzed" },
        { name: "MAX (Gummies/Chocolates)", href: "/tag/SF-MAX" },
        { name: "miniz", href: "/tag/shrumfuzed-miniz" },
        { name: "Tabz", href: "/tag/shrumfuzed-tabz" },
        { name: "Dazed&Shrumfuzed", href: "/brand/dazedxshrumfuzed" },
      ],
    },
    {
      title: "Hytz",
      href: "/brand/hytz",
      logo: `${WP_CDN}/2026/05/hytz-2.png`,
      items: [
        { name: "Single Serve Packs", href: "/category/hytz-capsule-single-serving-supplement" },
        { name: "3 Serving Box", href: "/category/hytz-capsule-3-servings-supplement" },
      ],
    },
    {
      title: "7Rox",
      href: "/brand/7rox",
      logo: `${WP_CDN}/2026/02/7rox-my.png`,
      items: [
        { name: "Classic (7-OH)", href: "/tag/Classic-7-OH" },
        { name: "Shots", href: "/tag/shots" },
        { name: "Super (Pseudo + 7-OH)", href: "/tag/Super-7-OH" },
      ],
    },
  ],
  [
    {
      title: "MyZen",
      href: "/brand/myzen",
      logo: `${WP_CDN}/2026/05/myzen.png`,
      items: [
        { name: "Spiritual Bliss (Kanna)", href: "/tag/spiritual-bliss-Kanna" },
        { name: "Cosmic Voyage (Shrums)", href: "/tag/cosmic-voyage-shrums" },
        { name: "Celestial Bloom (Kanna + Shrums)", href: "/tag/celestial-bloom-kanna-shrums" },
        { name: "Poppy & Lotus", href: "/tag/Poppy-Lotus" },
      ],
    },
    {
      title: "Smokin Tenns",
      href: "/brand/smokin-tenns",
      logo: `${WP_CDN}/2026/02/SmokinTenns_Vector-01-1-scaled.png`,
      items: [
        { name: "THCA Collection", href: "/tag/smokin-tenns-flower" },
        { name: "THCP Gummies", href: "/tag/smokin-tenns-gummy" },
      ],
    },
    {
      title: "Krox",
      href: "/brand/krox",
      logo: `${WP_CDN}/2026/02/krox-my.png`,
      items: [
        { name: "Capsules", href: "/tag/capsules" },
      ],
    },
  ],
];

const CATEGORY_MENU = CATEGORY_COLUMNS.flat();
const BRAND_MENU = BRAND_COLUMNS.flat();

const NAV_LINKS = [
  { href: "/products", label: "Shop By Category", hasDropdown: "category" },
  { href: "/products", label: "Shop By Brand", hasDropdown: "brand" },
  { href: "/category/clearance", label: "Clearance", highlight: true },
  { href: "/account/quotes", label: "Quote Requests" },
  { href: "/category/marketing-materials", label: "Marketing Material" },
];

function BrandLogoImg({ logo, title, className }: { logo: string; title: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={title} className={className} style={{ objectFit: "contain", objectPosition: "left" }} />
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") ?? "";
  const [searchValue, setSearchValue] = useState(initialSearch);

  // Full totals (tax, shipping, fees) — only fetched while the mini-cart
  // drawer is open, so other pages make no extra calls.
  const { totals: miniTotals } = useCartTotals(undefined, { enabled: miniCartOpen });

  // The server renders as a guest (empty cart, no user). Client state comes
  // from localStorage, so we defer auth/cart-dependent UI until after mount to
  // keep the first client render identical to the server HTML (no hydration
  // mismatch). `mounted` flips true only in the browser, post-hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Auth hydration from the saved token is handled once in StoreProvider —
  // the Header just reads token/user from the store.

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const numeric = Number(item.price?.replace(/[^\d.]/g, "")) || 0;
        return sum + numeric * item.quantity;
      }, 0),
    [items]
  );

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }

    params.delete("page");
    router.push(`/products?${params.toString()}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
      <div className="bg-[#111111] text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <div className="hidden items-center gap-4 md:flex">
            <span>Wholesale Portal</span>
            <span className="text-white/50">|</span>
            <span>Fast Shipping</span>
          </div>
          <div className="truncate text-center md:text-left">
            {mounted && user ? (
              <span className="font-bold text-lime-400">
                Welcome back, {user.displayName || user.firstName || user.username}!
              </span>
            ) : (
              <Link href="/register" className="hover:underline hover:text-[#d93b2e] transition text-white">
                Register now for the latest product launches
              </Link>
            )}
          </div>
          <div className="hidden md:block">Safe Checkout</div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-black transition hover:text-[#d93b2e]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black">
              <House className="h-4 w-4" />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-black uppercase tracking-[0.14em]">
                HEDY
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/55">
                STORE
              </span>
            </span>
          </Link>

          <nav className="hidden h-full items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="group flex h-full items-center">
                <Link
                  href={link.href}
                  className={`inline-flex items-center gap-1 py-4 text-[11px] font-bold uppercase tracking-[0.14em] transition hover:text-[#d93b2e] ${link.highlight ? "text-[#d93b2e]" : "text-black"}`}
                >
                  <span>{link.label}</span>
                  {link.hasDropdown ? <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" /> : null}
                </Link>
                  {link.hasDropdown === "category" && (
                  <div className="invisible absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[960px] max-w-[95vw] border border-black/10 bg-white opacity-0 shadow-2xl transition-all duration-200 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 rounded-xl max-h-[70vh] overflow-y-auto z-50">
                    <div className="grid grid-cols-5 items-start gap-x-8 gap-y-6 px-8 py-6">
                      {CATEGORY_COLUMNS.map((col, colIdx) => (
                        <div key={colIdx} className="space-y-4">
                          {col.map((section) => (
                            <div key={section.title}>
                              <Link href={section.href} className="mb-1 block text-[11px] font-black uppercase tracking-[0.16em] text-black hover:text-[#d93b2e] transition">
                                {section.title}
                              </Link>
                              <ul className="space-y-0">
                                {section.items.map((item) => (
                                  <li key={item.name}>
                                    <Link href={item.href} className="text-[13px] py-[3px] block text-black/70 hover:text-[#d93b2e] font-semibold transition leading-tight">
                                      {item.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {link.hasDropdown === "brand" && (
                  <div className="invisible absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[800px] max-w-[95vw] border border-black/10 bg-white opacity-0 shadow-2xl transition-all duration-200 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 rounded-xl max-h-[70vh] overflow-y-auto z-50">
                    <div className="grid grid-cols-2 items-start gap-x-8 gap-y-6 px-8 py-6 sm:grid-cols-3 lg:grid-cols-4">
                      {BRAND_MENU.map((section) => (
                        <div key={section.title}>
                          {/* Fixed-height logo box so every brand image lines up
                              regardless of its natural dimensions. */}
                          <Link href={section.href} className="mb-2 flex h-10 items-center justify-start hover:opacity-80 transition">
                            <BrandLogoImg logo={section.logo} title={section.title} className="max-h-8 w-auto max-w-[130px] object-contain" />
                          </Link>
                          <ul className="space-y-0">
                            {section.items.map((item) => (
                              <li key={item.name}>
                                <Link href={item.href} className="text-[13px] py-[3px] block text-black/70 hover:text-[#d93b2e] font-semibold transition leading-tight">
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="col-span-2 mt-2 text-right sm:col-span-3 lg:col-span-4">
                        <Link href="/products" className="text-xs font-black uppercase text-black underline underline-offset-4 hover:text-[#d93b2e]">
                          View All Brands →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:border-black hover:bg-black hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href={mounted && token ? "/account" : "/login"}
            aria-label="My Account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:border-black hover:bg-black hover:text-white"
          >
            <User className="h-4 w-4" />
          </Link>

          <button
            type="button"
            aria-label="Toggle cart drawer"
            onClick={() => setMiniCartOpen(true)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:border-black hover:bg-black hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            <CartCount />
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:border-black hover:bg-black hover:text-white lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-black/10 bg-[#f7f7f7]">
          <div className="mx-auto max-w-[1440px] px-4 py-3">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-3 md:flex-row"
            >
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search products..."
                className="h-12 flex-1 border border-black/15 bg-white px-4 text-sm outline-none focus:border-black"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <nav className="border-t border-black/10 bg-white lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="mb-3 flex gap-2">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search products..."
                className="h-11 flex-1 border border-black/15 px-3 text-sm outline-none"
              />
              <button
                type="submit"
                className="h-11 bg-black px-4 text-xs font-black uppercase tracking-[0.16em] text-white"
              >
                Go
              </button>
            </form>
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="border-b border-black/5 last:border-b-0">
                <div className="flex items-center justify-between py-3">
                  <Link
                    href={link.href}
                    onClick={() => {
                      if (!link.hasDropdown) setMobileOpen(false);
                    }}
                    className={`text-sm font-bold uppercase tracking-[0.12em] ${link.highlight ? "text-[#d93b2e]" : "text-black"}`}
                  >
                    {link.label}
                  </Link>
                  {link.hasDropdown ? (
                    <button
                      type="button"
                      onClick={() => setMobileAccordion(mobileAccordion === link.label ? null : link.label)}
                      className="inline-flex h-8 w-8 items-center justify-center border border-black/10"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${mobileAccordion === link.label ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                </div>
                {link.hasDropdown === "category" && mobileAccordion === link.label && (
                  <div className="pb-4 pl-4">
                    {CATEGORY_MENU.map((col) => (
                      <div key={col.title} className="mt-3">
                        <Link
                          href={col.href}
                          onClick={() => setMobileOpen(false)}
                          className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-black hover:text-[#d93b2e]"
                        >
                          {col.title}
                        </Link>
                        <ul className="space-y-2 border-l border-black/10 pl-3">
                          {col.items.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="text-sm text-black/80 hover:text-[#d93b2e]"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {link.hasDropdown === "brand" && mobileAccordion === link.label && (
                  <div className="pb-4 pl-4">
                    {BRAND_MENU.map((col) => (
                      <div key={col.title} className="mt-3">
                        <Link
                          href={col.href}
                          onClick={() => setMobileOpen(false)}
                          className="mb-2 flex items-center justify-start h-8 hover:opacity-80 transition"
                        >
                          <BrandLogoImg logo={col.logo} title={col.title} className="h-8 w-auto max-w-[120px]" />
                        </Link>
                        <ul className="space-y-2 border-l border-black/10 pl-3">
                          {col.items.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="text-sm text-black/80 hover:text-[#d93b2e]"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      ) : null}

      {miniCartOpen ? (
        <>
          <button
            type="button"
            aria-label="Close cart drawer overlay"
            onClick={() => setMiniCartOpen(false)}
            className="fixed inset-0 z-40 bg-black/45"
          />
          <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[360px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em]">
                  Cart
                </p>
                <p className="text-xs text-black/55">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close cart drawer"
                onClick={() => setMiniCartOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-black/8 pb-4">
                      <div className="relative h-20 w-20 overflow-hidden border border-black/10 bg-[#f5f5f5]">
                        <ProductImage
                          src={item.imageUrl || null}
                          alt={item.name}
                          fill
                          sizes="80px"
                          unoptimized
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <Link
                          href={item.slug ? `/product/${item.slug}` : "/cart"}
                          onClick={() => setMiniCartOpen(false)}
                          className="line-clamp-3 text-sm font-semibold leading-5 text-black"
                        >
                          {item.name}
                        </Link>
                        <div className="text-sm text-black/65">
                          {item.quantity} x {item.price}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center border border-black/10">
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateQuantity({
                                    id: item.id,
                                    quantity: Math.max(1, item.quantity - 1),
                                  })
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="inline-flex min-w-8 items-center justify-center text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateQuantity({
                                    id: item.id,
                                    quantity: item.quantity + 1,
                                  })
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => dispatch(removeItem(item.id))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/45 transition hover:bg-black hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag className="h-10 w-10 text-black/25" />
                  <p className="text-sm text-black/60">Your cart is empty.</p>
                </div>
              )}
            </div>

            <div className="border-t border-black/10 p-4">
              <div className="mb-4 space-y-2 border border-black/10 bg-[#f6f6f6] px-4 py-4 text-sm">
                <div className="flex items-center justify-between text-black/70">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">
                    {miniTotals?.subtotalFormatted ?? `$${subtotal.toFixed(2)}`}
                  </span>
                </div>

                {miniTotals?.appliedCoupons.map((c) => (
                  <div key={c.code} className="flex items-center justify-between text-emerald-700">
                    <span className="font-semibold uppercase">Coupon: {c.code}</span>
                    <span className="font-bold">−{c.discountFormatted}</span>
                  </div>
                ))}

                {miniTotals && miniTotals.shippingTotal > 0 && (
                  <div className="flex items-center justify-between text-black/70">
                    <span className="font-semibold">Shipping</span>
                    <span className="font-bold">{miniTotals.shippingFormatted}</span>
                  </div>
                )}

                {miniTotals?.fees.map((fee, i) => (
                  <div key={i} className="flex items-center justify-between text-black/70">
                    <span className="font-semibold">{fee.name}</span>
                    <span className="font-bold">{fee.totalFormatted}</span>
                  </div>
                ))}

                {miniTotals?.taxLines.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-black/70">
                    <span className="font-semibold">{t.label}</span>
                    <span className="font-bold">{t.totalFormatted}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-black/10 pt-2 text-black">
                  <span className="font-black uppercase tracking-wide">Total</span>
                  <span className="text-base font-black">
                    {miniTotals?.totalFormatted ?? `$${subtotal.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={() => setMiniCartOpen(false)}
                  className="inline-flex h-12 items-center justify-center bg-[#8a96a2] text-sm font-black uppercase tracking-[0.14em] text-white transition hover:brightness-95"
                >
                  View cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setMiniCartOpen(false)}
                  className="inline-flex h-12 items-center justify-center bg-[#6f7b87] text-sm font-black uppercase tracking-[0.14em] text-white transition hover:brightness-95"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </header>
  );
}
