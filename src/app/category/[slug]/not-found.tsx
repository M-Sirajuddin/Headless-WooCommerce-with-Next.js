import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCatalog from "@/components/ProductCatalog";
import { getStoreCategoriesCached as getStoreCategories } from "@/lib/store-api-server";

export default async function CategoryNotFound() {
  let categories: Awaited<ReturnType<typeof getStoreCategories>> = [];
  try {
    categories = await getStoreCategories(100);
  } catch {}

  return (
    <div className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-black">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Category Not Found</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-14">
        <ProductCatalog
          currentItems={[]}
          categories={categories}
          total={0}
          totalPages={1}
          searchParams={{}}
          basePath="/products"
        />
      </div>
    </div>
  );
}
