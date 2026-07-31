import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  MapPin,
  Package,
  Headphones,
  CreditCard,
} from "lucide-react";
import RetailProductCard from "@/components/RetailProductCard";
import ProductImage from "@/components/ProductImage";
import HomeSlider from "@/components/HomeSlider";
import { STATIC_PRODUCT_LIMIT, GRAPHQL_URL } from "@/lib/env";
import { getProducts } from "@/lib/graphql/fetcher";
import type { Product } from "@/types/woocommerce";

// ISR: cache globally for 24 hours, purged on-demand via webhook
export const revalidate = 86400;

const CATEGORIES = [
  { label: "Dabs",        slug: "dabs",             bg: "bg-sky-500",     text: "text-white" },
  { label: "Nicotine",    slug: "nicotine",          bg: "bg-amber-400",   text: "text-white" },
  { label: "Disposables", slug: "disposables",       bg: "bg-rose-500",    text: "text-white" },
  { label: "Gummies",     slug: "gummies",           bg: "bg-violet-500",  text: "text-white" },
  { label: "Flower",      slug: "flower",            bg: "bg-green-500",   text: "text-white" },
  { label: "Pre-Rolls",   slug: "pre-rolls-blunts",  bg: "bg-yellow-400",  text: "text-black" },
  { label: "Tinctures",   slug: "tinctures",         bg: "bg-teal-500",    text: "text-white" },
];

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>> | null = null;
  let fetchError: string | null = null;
  let fetchStatus: number | undefined;

  try {
    products = await getProducts(STATIC_PRODUCT_LIMIT);
  } catch (err: any) {
    const isTimeout =
      err?.name === 'AbortError' ||
      err?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
    fetchError = isTimeout
      ? 'Store server is unreachable. Please try again later.'
      : (err?.message ?? 'Failed to load products.');
    fetchStatus = err?.status;
    console.error('[home] fetch error', err?.message ?? err);
  }

  const featured = products?.edges?.[0]?.node;
  const productList = products?.edges?.map((e) => e.node) ?? [];
  const popularProducts = productList.slice(0, 5);
  const featuredProducts = productList.slice(5, 10);
  const allProducts = productList.slice(10, 15);
  const bannerProduct = productList[2] ?? featured;
  const promoProduct = productList[8] ?? featured;
  const slides = [featured, productList[1], bannerProduct]
    .filter((product): product is Product => Boolean(product))
    .map((product, index) => ({
      id: product.id,
      title:
        index === 0
          ? "Now Available!"
          : index === 1
            ? "Fresh Shelf Stock"
            : "Wholesale Ready",
      subtitle:
        index === 0
          ? "Back and better than ever"
          : index === 1
            ? "Built for modern smoke shop shelves"
            : "Fast-moving products for your catalog",
      eyebrow:
        index === 0
          ? "Featured drop"
          : index === 1
            ? "Popular release"
            : "Top seller",
      ctaLabel: "Shop now",
      ctaHref: `/product/${product.slug}`,
      imageSrc: product.image?.sourceUrl ?? null,
      imageAlt: product.image?.altText || product.name,
      accent: index === 1 ? "bg-[#0b7d3b]" : "bg-black",
      background:
        index === 1
          ? "bg-[linear-gradient(115deg,#eef7ea_0%,#d9eed7_36%,#ffffff_100%)]"
          : index === 2
            ? "bg-[linear-gradient(115deg,#fff3ec_0%,#ffe0cf_38%,#ffffff_100%)]"
            : "bg-[linear-gradient(115deg,#edf8ff_0%,#d9f0ff_38%,#ffffff_100%)]",
    }));

  return (
    <div className="bg-[#f3f3f3] text-[#111111]">
      {fetchError ? (
        <div className="mx-auto max-w-[1440px] px-4 pt-6">
          <ErrorState
            status={fetchStatus}
            message={fetchError}
            endpoint={GRAPHQL_URL}
          />
        </div>
      ) : null}

      <HomeSlider slides={slides} />

      <section className="bg-[#050505] text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-6 px-4 py-6 md:grid-cols-[0.85fr_1.15fr]">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-2xl font-black uppercase leading-none tracking-tight text-lime-300 md:text-4xl">
                Champs
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-white/80">
                Trade Shows
              </p>
            </div>
            <div className="text-sm leading-6 text-white/80">
              The premier counterculture expo experience.
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2 md:items-start">
            <div className="text-2xl font-black uppercase leading-tight tracking-tight md:text-4xl">
              Register Now For Champs Las Vegas
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/80">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-lime-400" />
                May 6-9, 2026
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-lime-400" />
                Las Vegas Convention Center
              </span>
            </div>
            <Link
              href="/products"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-lime-400 px-6 text-sm font-bold uppercase tracking-[0.16em] text-lime-300 transition hover:bg-lime-400 hover:text-black"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 md:py-14">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-black/70">
          Shop By Category
        </p>
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
          {CATEGORIES.map((cat) => (
            <CategoryBubble key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

      <ProductShelf
        id="popular-products"
        title="Popular Products"
        products={popularProducts}
      />

      <ProductShelf title="Featured Products" products={featuredProducts} />

      <section className="mx-auto max-w-[1440px] px-4 py-4 md:py-8">
        <div className="relative overflow-hidden bg-[linear-gradient(90deg,#b069a4_0%,#dca6bf_30%,#f8efef_52%,#f8efef_70%,#b98ab0_100%)] p-6 md:p-10">
          <div className="absolute inset-y-0 left-0 w-10 bg-black/5 md:w-20" />
          <div className="absolute inset-y-0 right-0 w-10 bg-black/5 md:w-20" />
          <div className="grid items-center gap-6 md:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3 pr-4 text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/55">
                Seasonal Highlight
              </p>
              <h2 className="text-3xl font-black uppercase leading-none tracking-tight md:text-5xl">
                Bold Packaging.
                <br />
                Bright Shelf Appeal.
              </h2>
              <p className="max-w-lg text-sm leading-6 text-black/70">
                Use the hero promo section to spotlight key collections, drops, or
                brand launches without changing your product workflow.
              </p>
            </div>

            <div className="relative mx-auto aspect-[16/9] w-full max-w-[720px] overflow-hidden">
              <div className="absolute left-[6%] top-[8%] h-[36%] w-[18%] rotate-[-26deg] overflow-hidden rounded-2xl bg-white/30 shadow-xl">
                <ProductImage
                  src={featured?.image?.sourceUrl ?? null}
                  alt={featured?.image?.altText || featured?.name || "Featured product"}
                  fill
                  sizes="(max-width: 768px) 30vw, 18vw"
                  className="object-contain p-3"
                />
              </div>
              <div className="absolute right-[12%] top-[14%] h-[72%] w-[42%] rotate-[16deg] overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,#1f5b91_0%,#3c8dc6_36%,#163451_100%)] shadow-[0_25px_60px_rgba(0,0,0,0.28)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.38),transparent_38%)]" />
                <div className="absolute inset-0">
                  <ProductImage
                    src={promoProduct?.image?.sourceUrl ?? featured?.image?.sourceUrl ?? null}
                    alt={promoProduct?.image?.altText || promoProduct?.name || "Promo product"}
                    fill
                    sizes="(max-width: 768px) 60vw, 32vw"
                    className="object-contain p-6"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-5 text-center text-sm font-black uppercase tracking-[0.3em] text-yellow-200">
                  3660MG Total
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductShelf title="All Products" products={allProducts} showViewAll />

      <section className="mx-auto max-w-[1280px] px-4 py-12">
        <div className="grid border-y border-black/10 bg-white md:grid-cols-2">
          <SupportCard
            icon={<Headphones className="h-6 w-6" />}
            title="Customer Support"
            description="Need assistance?"
          />
          <SupportCard
            icon={<CreditCard className="h-6 w-6" />}
            title="Secured Payment"
            description="Safe & fast"
          />
        </div>
      </section>
    </div>
  );
}

function CategoryBubble({
  label,
  slug,
  bg,
  text,
}: {
  label: string;
  slug: string;
  bg: string;
  text: string;
}) {
  const letter = label.charAt(0).toUpperCase();
  return (
    <Link href={`/category/${slug}`} className="group text-center">
      <div
        className={`relative mx-auto flex aspect-square w-full max-w-[160px] items-center justify-center overflow-hidden rounded-full ${bg} shadow-[0_12px_28px_rgba(0,0,0,0.15)] transition group-hover:scale-105 group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.22)]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.30),transparent_55%)]" />
        <span className={`relative text-5xl font-black uppercase tracking-tighter ${text} drop-shadow-sm`}>
          {letter}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-black uppercase leading-none tracking-tight md:text-base">
        {label}
      </h3>
    </Link>
  );
}

function ProductShelf({
  id,
  title,
  products,
  showViewAll = false,
}: {
  id?: string;
  title: string;
  products: Product[];
  showViewAll?: boolean;
}) {
  return (
    <section id={id} className="mx-auto max-w-[1440px] px-4 py-10 md:py-14">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-black/70">
        {title}
      </p>

      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <RetailProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {showViewAll ? (
        <div className="mt-10 flex justify-center">
          <Link
            href="/products"
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-black px-5 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}



function SupportCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-6 py-8 text-center">
      <div className="text-black">{icon}</div>
      <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-black/70">{description}</p>
    </div>
  );
}

function ErrorState({
  status,
  message,
  endpoint,
}: {
  status?: number;
  message: string;
  endpoint: string;
}) {
  return (
    <div className="space-y-3 border border-[#d93b2e]/30 bg-[#d93b2e]/5 p-6 text-sm">
      <div className="flex items-center gap-2 font-semibold text-[#d93b2e]">
        <AlertCircle className="h-4 w-4" />
        Could not load products
      </div>
      <p className="text-foreground/80">
        Status:{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">
          {status ?? 'unknown'}
        </code>{' '}
        — Message:{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">{message}</code>
      </p>
      <p className="text-xs text-muted-foreground">
        Endpoint: <code>{endpoint}</code>
      </p>
      <p className="text-xs text-muted-foreground">
        Tips: verify WPGraphQL + WooGraphQL are installed, the URL is correct, and
        the server is reachable. Open the URL in a browser to use the GraphiQL
        IDE.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-black/20 bg-white p-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
        <Package className="h-6 w-6 text-black/55" />
      </div>
      <p className="text-sm font-medium text-black/65">
        No products to show yet.
      </p>
      <Link
        href="/products"
        className="text-sm font-medium text-black underline-offset-4 hover:underline"
      >
        Browse all products →
      </Link>
    </div>
  );
}
