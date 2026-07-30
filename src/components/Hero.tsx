"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Star } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/types/woocommerce";

interface HeroProps {
  featured?: Product;
}

const FLOATING_BADGES = [
  { icon: Sparkles, label: "Curated", className: "top-12 -left-2 md:left-8" },
  { icon: Star, label: "Top Rated", className: "bottom-16 -right-2 md:right-4" },
  { icon: Zap, label: "Fast Ship", className: "top-1/2 -right-4 md:-right-8" },
];

export default function Hero({ featured }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 -z-10 bg-mesh" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]"
      />

      {/* Decorative animated blobs */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-20 -left-20 -z-10 h-80 w-80 rounded-full bg-gradient-brand opacity-20 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, 10, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-20 -right-20 -z-10 h-80 w-80 rounded-full bg-gradient-brand opacity-15 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
          y: [0, -10, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative mx-auto grid min-h-[640px] grid-cols-1 items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
        {/* Copy */}
        <div className="flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-1 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-1" />
            </span>
            New collection available now
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
          >
            Discover products
            <br />
            <span className="text-gradient">you'll actually love.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground"
          >
            Hand-picked essentials delivered to your door. Built on a blazing-fast
            headless stack — Next.js, WPGraphQL, and WooCommerce.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/products"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-brand px-7 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
            >
              Shop the collection
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#featured"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border/60 bg-background/60 px-6 text-sm font-semibold backdrop-blur transition-colors hover:bg-muted"
            >
              View featured
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex items-center gap-8"
          >
            {[
              { value: "10K+", label: "Happy customers" },
              { value: "4.9★", label: "Average rating" },
              { value: "Free", label: "Shipping $75+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Featured product showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative mx-auto aspect-square w-full max-w-md">
            {/* Background ring */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-8 rounded-full bg-gradient-brand opacity-10 blur-2xl"
            />

            {/* Animated rings */}
            <div className="absolute inset-0 rounded-full border border-border/40" />
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-dashed border-brand-1/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />

            {/* Image */}
            <div className="absolute inset-8 overflow-hidden rounded-full bg-gradient-to-br from-muted/30 to-muted shadow-2xl">
              {featured ? (
                <Link
                  href={`/product/${featured.slug}`}
                  className="block h-full w-full"
                >
                  <ProductImage
                    src={featured.image?.sourceUrl ?? null}
                    alt={featured.image?.altText || featured.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </Link>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Sparkles className="h-16 w-16 opacity-30" />
                </div>
              )}
            </div>

            {/* Floating badges */}
            {FLOATING_BADGES.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
                className={`absolute ${badge.className} animate-float`}
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur">
                  <badge.icon className="h-3.5 w-3.5 text-brand-1" />
                  {badge.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
