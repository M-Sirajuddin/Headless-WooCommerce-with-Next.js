"use client";

import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

const sizeMap = {
  sm: { price: "text-sm", old: "text-xs" },
  md: { price: "text-base", old: "text-sm" },
  lg: { price: "text-2xl", old: "text-base" },
  xl: { price: "text-3xl md:text-4xl", old: "text-lg" },
} as const;

/**
 * Renders a product price. If `salePrice` is set and differs from the regular
 * price, both are shown with the sale price highlighted. WooCommerce returns
 * already-formatted strings (e.g. "$29.99") so we display them as-is.
 */
export default function PriceDisplay({
  price,
  regularPrice,
  salePrice,
  className,
  size = "md",
  animated = false,
}: PriceDisplayProps) {
  const onSale =
    salePrice &&
    regularPrice &&
    salePrice !== regularPrice &&
    salePrice.length > 0;

  const { price: priceSize, old: oldSize } = sizeMap[size];

  const PriceEl = (
    <span
      className={cn(
        "font-semibold tracking-tight",
        priceSize,
        onSale ? "text-red-500" : "text-foreground"
      )}
    >
      {onSale ? salePrice : price}
    </span>
  );

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      {animated ? (
        <span className="animate-fade-in">
          {PriceEl}
        </span>
      ) : (
        PriceEl
      )}
      {onSale && regularPrice && (
        <span
          className={cn(
            "text-muted-foreground line-through decoration-1",
            oldSize
          )}
        >
          {regularPrice}
        </span>
      )}
      {onSale && (
        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
          Sale
        </span>
      )}
    </div>
  );
}
