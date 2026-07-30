"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import OutOfStockBadge from "@/components/ui/OutOfStockBadge";

export interface GalleryImage {
  id: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  altText?: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  outOfStock?: boolean;
}

export default function ProductGallery({
  images,
  productName,
  outOfStock = false,
}: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full max-w-[540px] mx-auto overflow-hidden border border-black/10">
        <ProductImage src={null} alt={productName} fill className="object-contain p-4" />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  const go = (dir: number) =>
    setActive((i) => (i + dir + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Main viewer */}
      <div className="group relative aspect-square w-full max-w-[540px] mx-auto overflow-hidden border border-black/10 bg-white flex items-center justify-center p-8">
        {outOfStock && <OutOfStockBadge />}
        <ProductImage
          key={current.id}
          src={current.sourceUrl ?? null}
          alt={current.altText || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-4"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-sm transition hover:bg-black hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-sm transition hover:bg-black hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails — includes the main image first */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3 max-w-[540px] mx-auto">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.id}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden border bg-[#f9f9f9] transition-all ${
                i === active ? "border-black ring-1 ring-black" : "border-black/10 hover:border-black/40"
              }`}
            >
              <ProductImage
                src={img.thumbnailUrl ?? img.sourceUrl ?? null}
                alt={img.altText || productName}
                fill
                sizes="120px"
                unoptimized
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
