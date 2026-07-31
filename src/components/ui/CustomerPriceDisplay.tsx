"use client";

import PriceDisplay from "@/components/ui/PriceDisplay";

interface Props {
  productId: number;
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Renders the price directly since customer pricing is resolved on the server-side.
 */
export default function CustomerPriceDisplay({
  price,
  regularPrice,
  salePrice,
  className,
  size,
}: Props) {
  return (
    <PriceDisplay
      price={price}
      regularPrice={regularPrice}
      salePrice={salePrice}
      className={className}
      size={size}
    />
  );
}
