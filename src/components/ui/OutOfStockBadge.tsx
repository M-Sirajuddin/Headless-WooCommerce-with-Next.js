"use client";

import { motion } from "framer-motion";

export default function OutOfStockBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-sm"
      aria-label="Out of stock"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Out of stock
    </motion.span>
  );
}
