"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProductImage from "@/components/ProductImage";
import type { StoreApiProduct } from "@/lib/store-api";
import { formatStorePrice } from "@/lib/store-api";
import QuickViewModal, { QuickViewProduct } from "@/components/ui/QuickViewModal";
import AddToCartButton from "@/components/ui/AddToCartButton";
import type { Product } from "@/types/woocommerce";

function getFormattedRegularPrice(product: StoreApiProduct): string | null {
  const { regular_price, currency_code, currency_minor_unit } = product.prices;
  const numericValue = Number(regular_price) / 10 ** currency_minor_unit;

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency_code || "USD",
    }).format(numericValue);
  } catch {
    return null;
  }
}

export default function StoreProductCard({
  product,
}: {
  product: StoreApiProduct;
}) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const price = useMemo(() => formatStorePrice(product), [product]);
  const regularPrice = useMemo(() => getFormattedRegularPrice(product), [product]);
  const showSale = Boolean(regularPrice && regularPrice !== price);

  const mappedProductForQuickView = useMemo<QuickViewProduct>(() => ({
    id: String(product.id),
    name: product.name,
    price: price,
    regularPrice: regularPrice,
    description: product.description || product.short_description,
    imageUrl: product.images[0]?.src,
    slug: product.slug,
    inStock: product.is_in_stock,
    category: product.categories[0]?.name,
  }), [product, price, regularPrice]);

  const mappedProductForButton = useMemo<Product>(() => ({
    id: String(product.id),
    databaseId: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.short_description || "",
    description: product.description || "",
    price: price,
    regularPrice: regularPrice,
    salePrice: null,
    stockStatus: product.is_in_stock ? "IN_STOCK" : "OUT_OF_STOCK",
    averageRating: 0,
    reviewCount: 0,
    image: product.images[0] ? {
      id: String(product.images[0].id),
      sourceUrl: product.images[0].src,
      thumbnailUrl: product.images[0].thumbnail || product.images[0].src,
      altText: product.images[0].alt || "",
    } : null,
    galleryImages: [],
  }), [product, price, regularPrice]);

  return (
    <article className="flex flex-col">
      <div className="group relative">
        {/* Image → product */}
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="block"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-transparent">
            <ProductImage
              src={product.images[0]?.thumbnail ?? product.images[0]?.src ?? null}
              alt={product.images[0]?.alt || product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
              unoptimized
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Category → category archive */}
        {product.categories[0]?.slug ? (
          <Link
            href={`/category/${product.categories[0].slug}`}
            className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-black/35 hover:text-[#d93b2e]"
          >
            {product.categories[0].name}
          </Link>
        ) : (
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
            Product
          </p>
        )}

        {/* Name → product */}
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="line-clamp-2 min-h-[42px] text-sm font-semibold leading-5 text-black hover:text-[#d93b2e]">
            {product.name}
          </h3>
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

      <div className="mt-3 flex items-center gap-2">
        <span className="text-lg font-black text-black">{price}</span>
        {showSale ? (
          <span className="text-sm text-black/40 line-through">{regularPrice}</span>
        ) : null}
      </div>

      <AddToCartButton
        product={mappedProductForButton}
        size="sm"
        showIcon={false}
        className="mt-4 h-9 rounded-none border border-black bg-transparent px-4 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-none hover:bg-black hover:text-white"
      />

      <QuickViewModal
        product={mappedProductForQuickView}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </article>
  );
}
