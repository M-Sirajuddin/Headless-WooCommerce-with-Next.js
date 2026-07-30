import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCatalog from "@/components/ProductCatalog";
import { getStoreCategoriesCached as getStoreCategories, getStoreProductsCached as getStoreProducts } from "@/lib/store-api-server";

function getTagName(slug: string): string {
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
  const tagName = getTagName(params.slug);
  return {
    title: `Products Tagged "${tagName}" | HEDY STORE`,
    description: `Shop wholesale products tagged with ${tagName}.`,
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const tagName = getTagName(params.slug);

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

  let products: Awaited<ReturnType<typeof getStoreProducts>> = { items: [], total: 0, totalPages: 1 };
  let categories: Awaited<ReturnType<typeof getStoreCategories>> = [];
  try {
    [products, categories] = await Promise.all([
      getStoreProducts({
        tag: params.slug,
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
    console.error("Failed to fetch tag products", err);
  }

  // Inject tag parameters
  const activeSearchParams = {
    ...searchParams,
    tag: params.slug,
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
          <span>Tag: {tagName}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-14">
        <ProductCatalog
          currentItems={products.items}
          categories={categories}
          total={products.total}
          totalPages={products.totalPages}
          searchParams={activeSearchParams}
          basePath={`/tag/${params.slug}`}
        />
      </div>
    </div>
  );
}
