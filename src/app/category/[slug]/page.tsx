import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ProductCatalog from "@/components/ProductCatalog";
import {
  getAllStoreCategoriesCached,
  getStoreCategoryBySlugCached,
  getStoreProductsCached as getStoreProducts,
} from "@/lib/store-api-server";
import { buildCategoryNav } from "@/lib/category-nav";

interface PageProps {
  params: { slug: string };
  searchParams?: {
    page?: string;
    sort?: string;
    perPage?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
  };
}

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const category = await getStoreCategoryBySlugCached(params.slug);
    if (!category) return { title: "Category Not Found", robots: { index: false } };
    return {
      title: category.name,
      description: `Browse wholesale products in the ${category.name} category.`,
      alternates: { canonical: `/category/${category.slug}` },
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  let allCategories: Awaited<ReturnType<typeof getAllStoreCategoriesCached>> = [];
  try {
    allCategories = await getAllStoreCategoriesCached();
  } catch (err) {
    console.error("Failed to fetch store categories", err);
  }

  const category = allCategories.find((c) => c.slug === params.slug) ?? null;
  if (!category) notFound();

  // Hierarchical sidebar: this category's sub-categories (or siblings if leaf).
  const categoryNav = buildCategoryNav(allCategories, params.slug);

  const page = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const perPage = [20, 24, 40].includes(Number(searchParams?.perPage))
    ? Number(searchParams?.perPage)
    : 20;

  const selectedSort = searchParams?.sort ?? "date-desc";
  const orderby = selectedSort.startsWith("price") ? "price" : selectedSort.startsWith("title") ? "title" : "date";
  const order = selectedSort.endsWith("asc") ? "asc" : "desc";

  const minPrice = searchParams?.minPrice ?? "";
  const maxPrice = searchParams?.maxPrice ?? "";
  const search = searchParams?.search ?? "";

  let products: Awaited<ReturnType<typeof getStoreProducts>> = { items: [], total: 0, totalPages: 1 };
  try {
    products = await getStoreProducts({
      category: String(category.id),
      page,
      perPage,
      orderby: orderby as any,
      order: order as any,
      minPrice,
      maxPrice,
      search,
    });
  } catch (err) {
    console.error("Failed to fetch category products", err);
  }

  const activeSearchParams = { ...searchParams, category: String(category.id) };

  return (
    <div className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-black">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Category: {category.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-14">
        <ProductCatalog
          currentItems={products.items}
          categories={allCategories}
          categoryNav={categoryNav}
          heading={category.name}
          total={products.total}
          totalPages={products.totalPages}
          searchParams={activeSearchParams}
          basePath={`/category/${params.slug}`}
        />
      </div>
    </div>
  );
}
