import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCatalog from "@/components/ProductCatalog";
import {
  getAllStoreCategoriesCached,
  getFilteredStoreProductsCached,
  getStoreProductsCached,
} from "@/lib/store-api-server";
import { MAIN_CATEGORY_SLUGS } from "@/lib/category-nav";
import { BRAND_FILTERS } from "@/lib/env";

export const metadata: Metadata = {
  title: "All Products | HEDY STORE",
  description: "Browse the full catalog of curated products.",
};

export const revalidate = 86400;

const SORT_OPTIONS = [
  { value: "date-desc", label: "Default sorting", orderby: "date", order: "desc" },
  { value: "price-asc", label: "Price: low to high", orderby: "price", order: "asc" },
  { value: "price-desc", label: "Price: high to low", orderby: "price", order: "desc" },
  { value: "title-asc", label: "Name: A to Z", orderby: "title", order: "asc" },
];

type PageProps = {
  searchParams?: {
    search?: string;
    page?: string;
    category?: string;
    brand?: string;
    sort?: string;
    perPage?: string;
    minPrice?: string;
    maxPrice?: string;
  };
};

const BRANDS = ["Dazed", "Brixz NYC", "Shrumfuzed", "Hytz", "Myzen Organix", "Rox"];

function buildProductsHref(
  params: PageProps["searchParams"],
  updates: Record<string, string | number | undefined>
) {
  const nextParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) nextParams.set(key, value);
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
  });

  const query = nextParams.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const perPage = [20, 24, 40].includes(Number(searchParams?.perPage))
    ? Number(searchParams?.perPage)
    : 20;
  const selectedSort =
    SORT_OPTIONS.find((option) => option.value === searchParams?.sort) ??
    SORT_OPTIONS[0];
  const selectedSearch = searchParams?.search ?? "";
  const minPrice = searchParams?.minPrice ?? "";
  const maxPrice = searchParams?.maxPrice ?? "";

  // Multi-select filters as comma-separated slugs: ?category=a,b  ?brand=x,y
  const parseSlugs = (v?: string) =>
    (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const selectedCategories = parseSlugs(searchParams?.category);
  const selectedBrands = parseSlugs(searchParams?.brand);

  let products: Awaited<ReturnType<typeof getFilteredStoreProductsCached>> | null = null;
  let fetchError: string | null = null;

  // Categories are needed first to map filter slugs → ids for the Store API.
  let categories: Awaited<ReturnType<typeof getAllStoreCategoriesCached>> = [];
  try {
    categories = await getAllStoreCategoriesCached();
  } catch (err) {
    console.error("Failed to load categories", err);
  }
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const orderby = selectedSort.orderby as
    | "date"
    | "price"
    | "title"
    | "popularity"
    | "rating"
    | "menu_order";
  const order = selectedSort.order as "asc" | "desc";

  try {
    if (selectedBrands.length > 0) {
      // Brand filtering needs the custom endpoint (Store API can't do brands).
      products = await getFilteredStoreProductsCached({
        search: selectedSearch,
        page,
        perPage,
        categories: selectedCategories,
        brands: selectedBrands,
        minPrice,
        maxPrice,
        orderby,
        order,
      });
    } else {
      // No brand filter → reliable Store API, mapping category slugs → ids.
      const categoryIds = selectedCategories
        .map((slug) => bySlug.get(slug)?.id)
        .filter(Boolean)
        .join(",");
      products = await getStoreProductsCached({
        search: selectedSearch,
        page,
        perPage,
        category: categoryIds,
        minPrice,
        maxPrice,
        orderby,
        order,
      });
    }
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Failed to load products.";
  }

  // Curated main categories for the sidebar multi-select (slug + count).
  const categoryFilters = MAIN_CATEGORY_SLUGS.map((slug) => bySlug.get(slug))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => ({ name: c.name, slug: c.slug, count: c.count }));

  const currentItems = products?.items ?? [];
  const total = products?.total ?? 0;
  const totalPages = products?.totalPages ?? 1;

  return (
    <div className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Shop</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-14">
        {fetchError ? (
          <div className="border border-[#d93b2e]/25 bg-[#d93b2e]/5 p-6 text-sm text-[#d93b2e]">
            Could not load products: {fetchError}
          </div>
        ) : (
          <ProductCatalog
            currentItems={currentItems}
            categories={categories}
            brandFilters={BRAND_FILTERS}
            categoryFilters={categoryFilters}
            selectedBrands={selectedBrands}
            selectedCategories={selectedCategories}
            total={total}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        )}
      </div>
    </div>
  );
}
