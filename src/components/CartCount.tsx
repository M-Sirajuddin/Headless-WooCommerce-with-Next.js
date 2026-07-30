"use client";

import dynamic from "next/dynamic";
import { useAppSelector } from "@/hooks/redux";

const AnimatedCartCount = dynamic(
  () =>
    import("framer-motion").then((mod) => {
      const { motion } = mod;
      return function CartCount() {
        const count = useAppSelector((state) =>
          state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        );

        if (count === 0) return null;

        return (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-brand px-1.5 text-[10px] font-bold text-white shadow-md ring-2 ring-background"
            aria-label={`${count} items in cart`}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        );
      };
    }),
  { ssr: false }
);

export default function CartCountWrapper() {
  return <AnimatedCartCount />;
}
