"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Check } from "lucide-react";
import { useAppDispatch } from "@/hooks/redux";
import { addItem } from "@/store/cartSlice";

export interface QuickViewProduct {
  id: string;
  name: string;
  price: string;
  regularPrice?: string | null;
  description?: string;
  imageUrl?: string;
  slug: string;
  inStock: boolean;
  category?: string;
}

interface QuickViewModalProps {
  product: QuickViewProduct;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    dispatch(
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || "",
        quantity,
      })
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const showSale = false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity cursor-default w-full h-full"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-3xl border border-black/10 bg-white shadow-2xl transition-all md:flex">
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close Quick View"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left: Image */}
        <div className="relative aspect-square w-full bg-[#f9f9f9] p-8 md:w-1/2 flex items-center justify-center">
          {product.imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-contain p-4"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-black/20">
              No image
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex w-full flex-col p-6 md:w-1/2 md:p-8 justify-between">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
              {product.category || "Product"}
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-black leading-7">
              {product.name}
            </h2>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-xl font-black text-black">{product.price}</span>
            </div>

            {/* Description */}
            {product.description && (
              <div
                className="prose prose-sm mt-6 line-clamp-4 text-sm leading-6 text-black/60"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 border-t border-black/10 pt-6">
            {product.inStock ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-black/50">
                    Quantity:
                  </span>
                  <div className="inline-flex items-center border border-black/10">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="inline-flex h-9 w-9 items-center justify-center hover:bg-black/5"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="inline-flex min-w-9 items-center justify-center text-sm font-bold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="inline-flex h-9 w-9 items-center justify-center hover:bg-black/5"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex flex-1 h-12 items-center justify-center gap-2 bg-black text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#d93b2e]"
                  >
                    {added ? (
                      <>
                        <Check className="h-4 w-4" /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" /> Add to cart
                      </>
                    )}
                  </button>
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="inline-flex h-12 items-center justify-center border border-black px-6 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
                  >
                    View Info
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-red-500">Out of Stock</p>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="inline-flex h-12 w-full items-center justify-center border border-black text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
                >
                  View Details
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
