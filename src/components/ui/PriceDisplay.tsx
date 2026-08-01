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
  sm: { price: "text-sm" },
  md: { price: "text-base" },
  lg: { price: "text-2xl" },
  xl: { price: "text-3xl md:text-4xl" },
} as const;

/**
 * Renders the active price. It ignores regularPrice cross-outs to ensure
 * customer-specific prices are displayed directly without default regular prices showing up.
 */
export default function PriceDisplay({
  price,
  className,
  size = "md",
  animated = false,
}: PriceDisplayProps) {
  const { price: priceSize } = sizeMap[size];

  const PriceEl = (
    <span
      className={cn(
        "font-semibold tracking-tight text-foreground",
        priceSize
      )}
    >
      {price}
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
    </div>
  );
}
