"use client";

import { motion } from "framer-motion";
import type { Product, ProductConnection } from "@/types/woocommerce";
import ProductCard from "@/components/ProductCard";
import { Package } from "lucide-react";

interface ProductGridProps {
  products: Product[] | ProductConnection;
  emptyMessage?: string;
}

/**
 * Responsive grid for product cards. Accepts either a flat array or a
 * `ProductConnection` (the GraphQL edges/node shape) for convenience.
 */
export default function ProductGrid({
  products,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  const list: Product[] = Array.isArray(products)
    ? products
    : products.edges.map((edge) => edge.node);

  if (list.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-16 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {emptyMessage}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 md:grid-cols-4">
      {list.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < 4}
          index={i}
        />
      ))}
    </div>
  );
}
