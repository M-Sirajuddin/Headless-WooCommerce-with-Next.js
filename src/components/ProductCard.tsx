"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Heart } from "lucide-react";
import type { Product } from "@/types/woocommerce";
import { cn } from "@/lib/utils";
import StarRating from "@/components/ui/StarRating";
import PriceDisplay from "@/components/ui/PriceDisplay";
import OutOfStockBadge from "@/components/ui/OutOfStockBadge";
import ProductImage from "@/components/ProductImage";
import { useAppDispatch } from "@/hooks/redux";
import { addItem } from "@/store/cartSlice";
import QuickViewModal, { QuickViewProduct } from "@/components/ui/QuickViewModal";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
  index?: number;
}

export default function ProductCard({
  product,
  className,
  priority = false,
  index = 0,
}: ProductCardProps) {
  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
  const dispatch = useAppDispatch();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const onSale =
    product.salePrice &&
    product.regularPrice &&
    product.salePrice !== product.regularPrice &&
    product.salePrice.length > 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    dispatch(
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageUrl: product.image?.sourceUrl ?? "",
        quantity: 1,
      })
    );
  };

  const mappedProductForQuickView = useMemo<QuickViewProduct>(() => ({
    id: product.id,
    name: product.name,
    price: product.price,
    regularPrice: product.regularPrice,
    description: product.description || product.shortDescription || "",
    imageUrl: product.image?.sourceUrl ?? undefined,
    slug: product.slug,
    inStock: product.stockStatus === "IN_STOCK",
    category: product.image?.altText || "Product",
  }), [product]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 8) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground transition-shadow shadow-sm hover:shadow-glow",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/30 to-muted">
        <Link
          href={`/product/${product.slug}`}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          {isOutOfStock && <OutOfStockBadge />}

          {onSale && (
            <div className="absolute top-3 right-3 z-10">
              <div className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                Sale
              </div>
            </div>
          )}

          <ProductImage
            src={product.image?.sourceUrl ?? null}
            alt={product.image?.altText || product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />

          {/* Hover overlay gradient */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </Link>

        {/* Quick action buttons - appear on hover (positioned relative to card, not link) */}
        <div className="pointer-events-none absolute right-3 bottom-3 z-20 flex translate-y-2 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="pointer-events-auto"
          >
            <button
              type="button"
              onClick={quickAdd}
              disabled={isOutOfStock}
              aria-label={`Quick add ${product.name} to cart`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-white shadow-lg transition disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="pointer-events-auto"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              aria-label={`Quick view ${product.name}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-background"
            >
              <Eye className="h-4 w-4" />
            </button>
          </motion.span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold leading-tight transition-colors hover:text-brand-1"
        >
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <StarRating
            rating={product.averageRating}
            reviewCount={product.reviewCount}
            size="sm"
          />
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <PriceDisplay
            price={product.price}
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
          />
          <button
            type="button"
            aria-label="Add to wishlist"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <QuickViewModal
        product={mappedProductForQuickView}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </motion.article>
  );
}
