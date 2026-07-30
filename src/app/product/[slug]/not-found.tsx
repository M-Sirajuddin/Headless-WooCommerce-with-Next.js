"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-brand text-white shadow-lg">
          <Package className="h-10 w-10" />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-2xl"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-bold tracking-tight md:text-4xl"
      >
        Product not found
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md text-muted-foreground"
      >
        The product you're looking for has either moved or is no longer
        available.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href="/products"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-brand px-7 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Browse all products
        </Link>
      </motion.div>
    </div>
  );
}
