"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductImage from "@/components/ProductImage";

export interface HomeSlide {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string | null;
  imageAlt: string;
  accent: string;
  background: string;
}

export default function HomeSlider({ slides }: { slides: HomeSlide[] }) {
  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [safeSlides.length]);

  if (safeSlides.length === 0) {
    return null;
  }

  const current = safeSlides[index];

  const goTo = (nextIndex: number) => {
    const total = safeSlides.length;
    setIndex((nextIndex + total) % total);
  };

  return (
    <section className="relative border-b border-black/10 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-4">
        <div
          className={`relative overflow-hidden ${current.background} min-h-[420px]`}
        >
          <div className="absolute inset-y-0 left-[30%] w-px bg-white/40" />
          <div className="absolute inset-y-0 left-[56%] w-px bg-white/30" />
          <div className="grid min-h-[420px] items-center gap-8 px-6 py-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-[620px]">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/60">
                {current.eyebrow}
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.92] tracking-tight text-[#b0122c] md:text-7xl">
                {current.title}
              </h1>
              <p className="mt-4 text-lg font-bold uppercase tracking-[0.08em] text-black/80 md:text-2xl">
                {current.subtitle}
              </p>
              <Link
                href={current.ctaHref}
                className={`mt-8 inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:brightness-110 ${current.accent}`}
              >
                {current.ctaLabel}
              </Link>
            </div>

            <div className="relative mx-auto flex h-[300px] w-full max-w-[420px] items-center justify-center md:h-[360px]">
              <div className="absolute inset-y-8 right-[18%] w-20 rotate-[24deg] rounded-full bg-orange-500/20 blur-3xl" />
              <div className="absolute right-2 top-2 rotate-[56deg] text-4xl font-black uppercase leading-none tracking-tight text-orange-500/90 md:text-6xl">
                New
              </div>
              <div className="relative h-[250px] w-[180px] rotate-[24deg] rounded-[34px] bg-[linear-gradient(180deg,#341311_0%,#82231c_38%,#1f1f1f_100%)] shadow-[0_30px_60px_rgba(0,0,0,0.28)] md:h-[320px] md:w-[220px]">
                <div className="absolute left-1/2 top-6 h-10 w-10 -translate-x-1/2 rounded-full bg-yellow-300/80 blur-sm" />
                <div className="absolute inset-x-6 top-10 bottom-10 overflow-hidden rounded-[28px] bg-black/10">
                  <ProductImage
                    src={current.imageSrc}
                    alt={current.imageAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 50vw, 28vw"
                    className="object-contain p-5 mix-blend-screen"
                  />
                </div>
              </div>
            </div>
          </div>

          {safeSlides.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => goTo(index - 1)}
                className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black backdrop-blur transition hover:bg-black hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => goTo(index + 1)}
                className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black backdrop-blur transition hover:bg-black hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {safeSlides.map((slide, slideIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to slide ${slideIndex + 1}`}
                    onClick={() => goTo(slideIndex)}
                    className={`h-2.5 rounded-full transition-all ${
                      slideIndex === index ? "w-8 bg-black" : "w-2.5 bg-black/30"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
