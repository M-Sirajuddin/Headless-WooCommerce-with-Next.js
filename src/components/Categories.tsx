"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Tag, Crown } from "lucide-react";

const CATEGORIES = [
  {
    href: "/products?category=new",
    label: "New arrivals",
    description: "Just dropped this week",
    icon: Sparkles,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    href: "/products?category=bestsellers",
    label: "Bestsellers",
    description: "Customer favorites",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    href: "/products?category=sale",
    label: "On sale",
    description: "Up to 50% off",
    icon: Tag,
    gradient: "from-rose-500 to-pink-500",
  },
];

export default function Categories() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid gap-4 md:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.href}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              href={cat.href}
              className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-glow"
            >
              <div
                aria-hidden="true"
                className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${cat.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-md`}
                  >
                    <cat.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-all group-hover:bg-gradient-brand group-hover:text-white">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
