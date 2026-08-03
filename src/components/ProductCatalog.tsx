"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { ChevronRight, Loader2, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StoreProductCard from "@/components/StoreProductCard";
import type { StoreApiProduct, getStoreCategories } from "@/lib/mock";
import type { CategoryNav } from "@/lib/category-nav";

const BRANDS = ["Dazed", "Brixz NYC", "Shrumfuzed", "Hytz", "Myzen Organix", "Rox"];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Default sorting", orderby: "date", order: "desc" },
  { value: "price-asc", label: "Price: low to high", orderby: "price", order: "asc" },
  { value: "price-desc", label: "Price: high to low", orderby: "price", order: "desc" },
  { value: "title-asc", label: "Name: A to Z", orderby: "title", order: "asc" },
];

function buildProductsHref(
  params: any,
  updates: Record<string, string | number | undefined>,
  basePath: string = "/products"
) {
  const nextParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) nextParams.set(key, String(value));
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
  });

  const query = nextParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

interface ProductCatalogProps {
  currentItems: StoreApiProduct[];
  categories: Awaited<ReturnType<typeof getStoreCategories>>;
  total: number;
  totalPages: number;
  searchParams: any;
  basePath?: string;
  /** Hierarchical category navigation (top-level or sub-category depth). */
  categoryNav?: CategoryNav;
  /** Overrides the section heading (e.g. the current category name). */
  heading?: string;
  /** Multi-select brand filter options (slug-based ?brand=a,b). */
  brandFilters?: Array<{ name: string; slug: string }>;
  /** Multi-select category filter options (slug-based ?category=a,b). */
  categoryFilters?: Array<{ name: string; slug: string; count: number }>;
  selectedBrands?: string[];
  selectedCategories?: string[];
}

export default function ProductCatalog({
  currentItems,
  categories,
  total,
  totalPages,
  searchParams,
  basePath = "/products",
  categoryNav,
  heading,
  brandFilters,
  categoryFilters,
  selectedBrands = [],
  selectedCategories = [],
}: ProductCatalogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const page = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const perPage = [20, 24, 40].includes(Number(searchParams?.perPage))
    ? Number(searchParams?.perPage)
    : 20;
  const selectedSort =
    SORT_OPTIONS.find((option) => option.value === searchParams?.sort) ??
    SORT_OPTIONS[0];
  const selectedCategory = searchParams?.category ?? "";
  const selectedSearch = searchParams?.search ?? "";
  const minPrice = searchParams?.minPrice ?? "";
  const maxPrice = searchParams?.maxPrice ?? "";

  const activeCategory = categories.find(
    (category) => String(category.id) === selectedCategory
  );

  // Input states
  const [searchVal, setSearchVal] = useState(selectedSearch);
  const [minPriceVal, setMinPriceVal] = useState(minPrice);
  const [maxPriceVal, setMaxPriceVal] = useState(maxPrice);

  useEffect(() => {
    setSearchVal(selectedSearch);
    setMinPriceVal(minPrice);
    setMaxPriceVal(maxPrice);
  }, [selectedSearch, minPrice, maxPrice]);

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    return buildProductsHref(searchParams, updates, basePath);
  };

  const handleNavigate = (updates: Record<string, string | number | undefined>) => {
    const nextUrl = buildHref(updates);
    startTransition(() => {
      router.push(nextUrl);
    });
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    updates: Record<string, string | number | undefined>
  ) => {
    e.preventDefault();
    if (isPending) return;
    handleNavigate(updates);
  };

  // Toggle a slug in a comma-separated multi-select param (?brand=, ?category=).
  const toggleSlug = (param: "brand" | "category", slug: string) => {
    const current = param === "brand" ? selectedBrands : selectedCategories;
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    return { [param]: next.join(","), page: 1 } as Record<
      string,
      string | number | undefined
    >;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate({ search: searchVal, page: 1 });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate({ minPrice: minPriceVal, maxPrice: maxPriceVal, page: 1 });
  };

  const hasActiveFilters = Boolean(
    selectedCategory ||
      selectedSearch ||
      minPrice ||
      maxPrice ||
      selectedBrands.length > 0 ||
      selectedCategories.length > 0
  );

  const resetUpdates = {
    category: undefined,
    brand: undefined,
    search: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    page: 1,
  };

  const renderFiltersContent = (isMobile = false) => (
    <>
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <h2 className="text-2xl font-black tracking-tight text-black">
          Filters
        </h2>
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-black/50 hover:bg-black hover:text-white transition"
              aria-label="Close filters"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-black">
          Search
        </h2>
        <form
          onSubmit={(e) => {
            setMobileFiltersOpen(false);
            handleSearchSubmit(e);
          }}
          className="mt-3 space-y-3"
        >
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search catalog"
            className="h-11 w-full border border-black/15 px-3 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center bg-black text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 border-t border-black/10 pt-6">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-black">
          Brands
        </h2>
        <div className="mt-4 space-y-3">
          {brandFilters ? (
            brandFilters.map((brand) => {
              const active = selectedBrands.includes(brand.slug);
              const updates = toggleSlug("brand", brand.slug);
              return (
                <Link
                  key={brand.slug}
                  href={buildHref(updates)}
                  onClick={(e) => handleLinkClick(e, updates)}
                  className="flex items-center gap-3 text-sm text-black/80 hover:text-black"
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                      active ? "border-black bg-black text-white" : "border-black/25"
                    }`}
                  >
                    {active && <span className="text-[10px] leading-none">✓</span>}
                  </span>
                  <span className={active ? "font-bold text-black" : ""}>{brand.name}</span>
                </Link>
              );
            })
          ) : (
            BRANDS.map((brand) => {
              const searchTerm = brand.toLowerCase() === "brixz nyc" ? "Brixz" : brand.toLowerCase() === "myzen organix" ? "Myzen" : brand;
              const active = selectedSearch.toLowerCase() === searchTerm.toLowerCase() || selectedSearch.toLowerCase().includes(searchTerm.toLowerCase());
              const updates = { search: active ? undefined : searchTerm, page: 1 };
              return (
                <Link
                  key={brand}
                  href={buildHref(updates)}
                  onClick={(e) => {
                    setMobileFiltersOpen(false);
                    handleLinkClick(e, updates);
                  }}
                  className="flex items-center gap-3 text-sm text-black/80 hover:text-black"
                >
                  <span
                    className={`inline-flex h-4 w-4 rounded-full border transition-colors ${
                      active ? "border-black bg-black" : "border-black/25"
                    }`}
                  />
                  <span className={active ? "font-bold text-black" : ""}>{brand}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-black/10 pt-6">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-black">
          {categoryNav?.heading ? categoryNav.heading : "Categories"}
        </h2>

        {categoryFilters ? (
          /* Multi-select category filter (?category=slug1,slug2) */
          <div className="mt-4 space-y-3">
            {categoryFilters.map((category) => {
              const active = selectedCategories.includes(category.slug);
              const updates = toggleSlug("category", category.slug);
              return (
                <Link
                  key={category.slug}
                  href={buildHref(updates)}
                  onClick={(e) => handleLinkClick(e, updates)}
                  className="flex items-center justify-between gap-3 text-sm text-black/80 hover:text-black"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        active ? "border-black bg-black text-white" : "border-black/25"
                      }`}
                    >
                      {active && <span className="text-[10px] leading-none">✓</span>}
                    </span>
                    <span className={active ? "font-bold text-black" : ""}>{category.name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : categoryNav ? (
          /* Hierarchical: each item is an archive link; drills one level deep. */
          <div className="mt-4 space-y-3">
            {/* Back / All */}
            {categoryNav.parent ? (
              <Link
                href={`/category/${categoryNav.parent.slug}`}
                onClick={() => setMobileFiltersOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-black/70 hover:text-black"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                {categoryNav.parent.name}
              </Link>
            ) : null}
            <Link
              href="/products"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex items-center gap-3 text-sm text-black/80 hover:text-black"
            >
              <span className="inline-flex h-4 w-4 rounded-full border border-black/25" />
              All products
            </Link>
            {categoryNav.items.map((category) => {
              const active = categoryNav.currentSlug === category.slug;
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex items-center justify-between gap-3 text-sm text-black/80 hover:text-black"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-4 w-4 rounded-full border ${
                        active ? "border-black bg-black" : "border-black/25"
                      }`}
                    />
                    <span className={active ? "font-bold text-black" : ""}>{category.name}</span>
                  </span>
                  <span className="text-black/35">{category.count}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Legacy flat filter (products page ?category=) */
          <div className="mt-4 space-y-3">
            <Link
              href={buildHref({ category: undefined, page: 1 })}
              onClick={(e) => {
                setMobileFiltersOpen(false);
                handleLinkClick(e, { category: undefined, page: 1 });
              }}
              className="flex items-center gap-3 text-sm text-black/80 hover:text-black"
            >
              <span
                className={`inline-flex h-4 w-4 rounded-full border ${
                  !selectedCategory ? "border-black bg-black" : "border-black/25"
                }`}
              />
              All products
            </Link>
            {categories.map((category) => {
              const active = selectedCategory === String(category.id);
              const updates = { category: category.id, page: 1 };

              return (
                <Link
                  key={category.id}
                  href={buildHref(updates)}
                  onClick={(e) => {
                    setMobileFiltersOpen(false);
                    handleLinkClick(e, updates);
                  }}
                  className="flex items-center justify-between gap-3 text-sm text-black/80 hover:text-black"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-4 w-4 rounded-full border ${
                        active ? "border-black bg-black" : "border-black/25"
                      }`}
                    />
                    <span className={active ? "font-bold text-black" : ""}>{category.name}</span>
                  </span>
                  <span className="text-black/35">{category.count}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-black/10 pt-6">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-black">
          Price range
        </h2>
        <form
          onSubmit={(e) => {
            setMobileFiltersOpen(false);
            handlePriceSubmit(e);
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            type="number"
            placeholder="Min"
            aria-label="Minimum Price"
            value={minPriceVal}
            onChange={(e) => setMinPriceVal(e.target.value)}
            className="h-10 w-full border border-black/15 bg-white px-2 text-sm outline-none focus:border-black"
          />
          <span className="text-black/45">—</span>
          <input
            type="number"
            placeholder="Max"
            aria-label="Maximum Price"
            value={maxPriceVal}
            onChange={(e) => setMaxPriceVal(e.target.value)}
            className="h-10 w-full border border-black/15 bg-white px-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center bg-black px-3 text-[11px] font-black uppercase tracking-[0.16em] text-white hover:bg-[#d93b2e]"
          >
            Go
          </button>
        </form>
      </div>

      {/* Sticky reset button — stays pinned to the bottom of the filter panel
          while the filters scroll. */}
      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-8 border-t border-black/10 bg-white/95 px-6 py-4 backdrop-blur">
        <Link
          href="/products"
          aria-disabled={!hasActiveFilters}
          onClick={(e) => {
            if (!hasActiveFilters) {
              e.preventDefault();
              return;
            }
            setMobileFiltersOpen(false);
            handleLinkClick(e, resetUpdates);
          }}
          className={`inline-flex h-11 w-full items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
            hasActiveFilters
              ? "bg-[#d93b2e] text-white hover:bg-black"
              : "cursor-not-allowed bg-black/10 text-black/40"
          }`}
        >
          <X className="h-3.5 w-3.5" />
          Reset Filter
        </Link>
      </div>
    </>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <aside className={`hidden self-start border border-black/10 bg-white p-6 transition-opacity duration-300 lg:sticky lg:top-4 lg:block ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
        {renderFiltersContent(false)}
      </aside>

      <section>
        <div className={`flex flex-col gap-4 border border-black/10 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between transition-opacity duration-300 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/65">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-9 items-center gap-2 border border-black/15 bg-white px-4 text-[11px] font-black uppercase tracking-[0.14em] hover:border-black transition lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            <label htmlFor="sort-select" className="hidden xs:inline">Sort by</label>
            <select
              id="sort-select"
              value={selectedSort.value}
              onChange={(e) => handleNavigate({ sort: e.target.value, page: 1 })}
              className="h-9 cursor-pointer border border-black/15 bg-white px-3 text-[11px] font-black uppercase tracking-[0.14em] text-black outline-none transition hover:border-black focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/65">
            <span>Show</span>
            {[20, 24, 40].map((size) => {
              const updates = { perPage: size, page: 1 };
              return (
                <Link
                  key={size}
                  href={buildHref(updates)}
                  onClick={(e) => handleLinkClick(e, updates)}
                  className={`inline-flex h-9 min-w-10 items-center justify-center border px-3 transition ${
                    perPage === size
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-white text-black hover:border-black"
                  }`}
                >
                  {size}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-black">
              {heading || activeCategory?.name || "Shop"}
            </h2>
            <p className="mt-1 text-sm text-black/55">
              {selectedSearch
                ? `Showing results for "${selectedSearch}"`
                : "Browse the live WooCommerce catalog"}
            </p>
          </div>
          <div className="text-sm font-semibold text-black/60">
            {total} product{total === 1 ? "" : "s"}
          </div>
        </div>

        <div className="relative mt-8 min-h-[400px]">
          {isPending && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/20 backdrop-blur-[1px] rounded-lg">
              <div className="flex flex-col items-center gap-3 bg-white p-6 shadow-xl border border-black/10">
                <Loader2 className="h-10 w-10 animate-spin text-[#d93b2e]" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black">
                  Updating catalog...
                </span>
              </div>
            </div>
          )}

          {currentItems.length > 0 ? (
            <div className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 transition-all duration-300 ${isPending ? "opacity-30 pointer-events-none" : ""}`}>
              {currentItems.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-black/10 bg-white p-10 text-center">
              <p className="text-lg font-bold text-black">No products found.</p>
              <p className="mt-2 text-sm text-black/55">
                Try another search or clear the selected filters.
              </p>
            </div>
          )}
        </div>

        {currentItems.length > 0 && (
          <div className={`mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-6 transition-opacity duration-300 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/50">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={buildHref({
                  page: Math.max(1, page - 1),
                })}
                onClick={(e) => handleLinkClick(e, { page: Math.max(1, page - 1) })}
                className={`inline-flex h-10 min-w-10 items-center justify-center border px-4 text-sm font-black ${
                  page <= 1
                    ? "pointer-events-none border-black/10 text-black/25"
                    : "border-black bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                Prev
              </Link>

              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, idx) => idx + Math.max(1, Math.min(page - 2, totalPages - 4))
              )
                .filter((pageNumber, index, all) =>
                  pageNumber >= 1 &&
                  pageNumber <= totalPages &&
                  all.indexOf(pageNumber) === index
                )
                .map((pageNumber) => {
                  const updates = { page: pageNumber };
                  return (
                    <Link
                      key={pageNumber}
                      href={buildHref(updates)}
                      onClick={(e) => handleLinkClick(e, updates)}
                      className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-black ${
                        pageNumber === page
                          ? "border-black bg-black text-white"
                          : "border-black/15 bg-white text-black hover:border-black"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}

              <Link
                href={buildHref({
                  page: Math.min(totalPages, page + 1),
                })}
                onClick={(e) => handleLinkClick(e, { page: Math.min(totalPages, page + 1) })}
                className={`inline-flex h-10 min-w-10 items-center justify-center border px-4 text-sm font-black ${
                  page >= totalPages
                    ? "pointer-events-none border-black/10 text-black/25"
                    : "border-black bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm lg:hidden w-full h-full cursor-default"
              aria-label="Close filters overlay"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-[320px] bg-white p-6 shadow-2xl flex flex-col h-full lg:hidden overflow-y-auto"
            >
              {renderFiltersContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
