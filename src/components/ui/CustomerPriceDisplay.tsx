"use client";

import PriceDisplay from "@/components/ui/PriceDisplay";
import { useAppSelector } from "@/hooks/redux";
import { useCustomerPrice, formatCustomerMoney } from "@/context/CustomerPricing";

interface Props {
  productId: number;
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Client wrapper around PriceDisplay that overlays the customer-specific
 * price (from the WisdmLabs pricing plugin) once it resolves for the
 * logged-in user. Falls back to the server-rendered price for guests.
 */
export default function CustomerPriceDisplay({
  productId,
  price,
  regularPrice,
  salePrice,
  className,
  size,
}: Props) {
  const token = useAppSelector((s) => s.auth.token);
  const cp = useCustomerPrice(productId);

  // For logged-in users, don't flash the default price while the real one loads.
  if (token && cp === undefined) {
    return <span className="inline-block h-7 w-24 animate-pulse rounded bg-black/10" aria-label="Loading price" />;
  }

  const finalPrice = cp?.price != null ? formatCustomerMoney(cp.price, cp.currency) : price;
  const finalRegular =
    cp?.regularPrice != null ? formatCustomerMoney(cp.regularPrice, cp.currency) : regularPrice;
  const finalSale =
    cp?.salePrice != null ? formatCustomerMoney(cp.salePrice, cp.currency) : salePrice;

  return (
    <PriceDisplay
      price={finalPrice}
      regularPrice={finalRegular}
      salePrice={finalSale}
      className={className}
      size={size}
    />
  );
}
