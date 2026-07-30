import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ProductCatalog from "@/components/ProductCatalog";
import { getStoreCategoriesCached as getStoreCategories, getStoreProductsCached as getStoreProducts } from "@/lib/store-api-server";

const brandMap: Record<string, string> = {
  "dazed": "Dazed",
  "brixz-nyc": "Brixz NYC",
  "shrumfuzed": "Shrumfuzed",
  "hytz": "Hytz",
  "myzen-organix": "Myzen Organix",
  "rox": "Rox",
};

function getBrandName(slug: string): string {
  const mapped = brandMap[slug.toLowerCase()];
  if (mapped) return mapped;
  // Fallback: capitalize words and replace dashes
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface PageProps {
  params: { slug: string };
  searchParams?: {
    page?: string;
    sort?: string;
    perPage?: string;
    minPrice?: string;
    maxPrice?: string;
    category?: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const brandName = getBrandName(params.slug);
  return {
    title: `${brandName} Products | HEDY STORE`,
    description: `Shop wholesale products from the premium brand ${brandName}.`,
  };
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const brandName = getBrandName(params.slug);

  const page = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const perPage = [20, 24, 40].includes(Number(searchParams?.perPage))
    ? Number(searchParams?.perPage)
    : 20;

  const selectedSort = searchParams?.sort ?? "date-desc";
  const orderby = selectedSort.startsWith("price") ? "price" : selectedSort.startsWith("title") ? "title" : "date";
  const order = selectedSort.endsWith("asc") ? "asc" : "desc";

  const minPrice = searchParams?.minPrice ?? "";
  const maxPrice = searchParams?.maxPrice ?? "";
  const category = searchParams?.category ?? "";

  const brandSearchTerm = brandName.toLowerCase() === "brixz nyc" ? "Brixz" : brandName.toLowerCase() === "myzen organix" ? "Myzen" : brandName;

  let products: Awaited<ReturnType<typeof getStoreProducts>> = { items: [], total: 0, totalPages: 1 };
  let categories: Awaited<ReturnType<typeof getStoreCategories>> = [];
  try {
    [products, categories] = await Promise.all([
      getStoreProducts({
        search: brandSearchTerm,
        page,
        perPage,
        orderby: orderby as any,
        order: order as any,
        minPrice,
        maxPrice,
        category,
      }),
      getStoreCategories(100),
    ]);
  } catch (err) {
    console.error("Failed to fetch brand products", err);
  }

  // Inject brand name into search parameter so sidebar / filters display correctly
  const activeSearchParams = {
    ...searchParams,
    search: brandName,
  };

  return (
    <div className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-black">
            Shop
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Brand: {brandName}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-14">
        <ProductCatalog
          currentItems={products.items}
          categories={categories}
          total={products.total}
          totalPages={products.totalPages}
          searchParams={activeSearchParams}
          basePath={`/brand/${params.slug}`}
        />
      </div>
    </div>
  );
}
