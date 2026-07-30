"use client";

import { motion } from "framer-motion";
import { Truck, Shield, RefreshCcw, Headphones } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Free shipping",
    description: "On orders over $75",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Secure payment",
    description: "100% protected checkout",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: RefreshCcw,
    title: "Easy returns",
    description: "30-day return policy",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    description: "Here whenever you need",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function Features() {
  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-soft p-8 md:p-12"
      >
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-gradient-brand opacity-10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-gradient-brand opacity-10 blur-3xl"
        />

        <div className="relative grid gap-8 md:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex flex-col items-start gap-3"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
