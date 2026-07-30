"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // 0.0 – 5.0
  reviewCount: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

const sizeMap = {
  sm: { star: "h-3.5 w-3.5", text: "text-xs" },
  md: { star: "h-4 w-4", text: "text-sm" },
  lg: { star: "h-5 w-5", text: "text-base" },
} as const;

export default function StarRating({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(Math.max(rating - i, 0), 1);
    return fill;
  });

  const { star, text } = sizeMap[size];

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating.toFixed(1)} out of 5 stars, ${reviewCount} reviews`}
    >
      <div className="flex">
        {stars.map((fill, i) => (
          <div key={i} className="relative">
            <Star
              className={cn(star, "fill-muted stroke-muted-foreground/30")}
            />
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${fill * 100}%` }}
              transition={{ duration: 0.6, delay: 0.05 * i, ease: "easeOut" }}
            >
              <Star
                className={cn(
                  star,
                  "fill-amber-400 stroke-amber-400"
                )}
                style={{ width: "1em", height: "1em" }}
              />
            </motion.div>
          </div>
        ))}
      </div>
      {showCount && (
        <span className={cn("text-muted-foreground ml-1", text)}>
          {reviewCount > 0 ? `(${reviewCount})` : ""}
        </span>
      )}
    </div>
  );
}
