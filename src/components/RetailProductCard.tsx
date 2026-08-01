"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AddToCartButton from "@/components/ui/AddToCartButton";
import PriceDisplay from "@/components/ui/PriceDisplay";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/types/woocommerce";
import QuickViewModal, { QuickViewProduct } from "@/components/ui/QuickViewModal";
export default function RetailProductCard({ product }: { product: Product }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const mappedProductForQuickView = useMemo<QuickViewProduct>(() => ({
    id: product.id,
    name: product.name,
    price: product.price,
    regularPrice: null,
    description: product.description || product.shortDescription || "",
    imageUrl: product.image?.sourceUrl ?? undefined,
    slug: product.slug,
    inStock: product.stockStatus === "IN_STOCK",
    category: product.image?.altText || "Product",
  }), [product]);

  return (
    <article className="flex flex-col items-center bg-transparent text-center w-full">
      <div className="group relative w-full flex justify-center">
        <Link
          href={`/product/${product.slug}`}
          className="flex w-full flex-col items-center"
        >
          <div className="relative flex aspect-[4/4.5] w-full items-center justify-center overflow-hidden bg-transparent">
            <ProductImage
              src={product.image?.thumbnailUrl ?? product.image?.sourceUrl ?? null}
              alt={product.image?.altText || product.name}
              fill
              sizes="(max-width: 768px) 80vw, 20vw"
              unoptimized
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="pointer-events-auto translate-y-2 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-lg transition duration-300 hover:bg-black hover:text-white group-hover:translate-y-0"
          >
            Quick View
          </button>
        </div>
      </div>

      <Link
        href={`/product/${product.slug}`}
        className="w-full flex flex-col items-center"
      >
        <h3 className="mt-3 line-clamp-2 min-h-[44px] text-sm font-semibold leading-5 text-black hover:text-[#d93b2e] transition-colors">
          {product.name}
        </h3>
      </Link>

      <PriceDisplay
        price={product.price}
        className="mt-2 justify-center"
        size="md"
      />

      <AddToCartButton
        product={product}
        size="sm"
        showIcon={false}
        className="mt-3 h-8 rounded-none border border-black bg-transparent px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black shadow-none hover:bg-black hover:text-white"
      />

      <QuickViewModal
        product={mappedProductForQuickView}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </article>
  );
}
