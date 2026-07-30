"use client";

import { useState } from "react";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/hooks/redux";
import { addItem } from "@/store/cartSlice";
import { useServerStatus } from "@/context/ServerStatus";
import { useCustomerPrice, formatCustomerMoney } from "@/context/CustomerPricing";
import type { Product } from "@/types/woocommerce";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  size = "lg",
  className,
  showIcon = true,
  fullWidth = false,
}: AddToCartButtonProps) {
  const dispatch = useAppDispatch();
  const { serverDown } = useServerStatus();
  const customerPrice = useCustomerPrice(product.databaseId);
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";

  // Use the customer-specific price (if resolved) so the cart reflects it.
  const effectivePrice =
    customerPrice?.price != null
      ? formatCustomerMoney(customerPrice.price, customerPrice.currency)
      : product.price;

  const handleAdd = () => {
    if (isOutOfStock) return;
    setState("loading");
    // Simulate brief processing for premium feel
    window.setTimeout(() => {
      dispatch(
        addItem({
          id: String(product.databaseId),
          slug: product.slug,
          name: product.name,
          price: effectivePrice,
          imageUrl: product.image?.thumbnailUrl ?? product.image?.sourceUrl ?? "",
          quantity,
        })
      );
      setState("success");
      window.setTimeout(() => setState("idle"), 1600);
    }, 350);
  };

  const label = serverDown
    ? "Unavailable"
    : isOutOfStock
      ? "Out of Stock"
      : state === "success"
        ? "Added to Cart"
        : "Add to Cart";

  return (
    <Button
      type="button"
      size={size}
      onClick={handleAdd}
      disabled={isOutOfStock || serverDown}
      className={cn(
        "relative overflow-hidden transition-all",
        fullWidth && "w-full",
        // gradient default look
        !isOutOfStock &&
          "bg-gradient-brand text-white shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95",
        state === "success" &&
          "bg-emerald-500 text-white shadow-md hover:brightness-100",
        className
      )}
      aria-label={
        isOutOfStock
          ? "Out of stock"
          : state === "success"
            ? "Added to cart"
            : `Add ${product.name} to cart`
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Adding…</span>
          </motion.span>
        ) : state === "success" ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{label}</span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            {showIcon && <ShoppingBag className="h-4 w-4" />}
            <span>{label}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
