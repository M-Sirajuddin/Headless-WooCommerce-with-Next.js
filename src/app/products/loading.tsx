import React from "react";

export default function ProductsLoading() {
  return (
    <div className="bg-[#f7f7f7] min-h-screen">
      <div className="mx-auto max-w-[1440px] px-4 py-4">
        <div className="h-4 w-32 animate-pulse bg-black/5" />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-14">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Skeleton */}
          <aside className="h-fit border border-black/10 bg-white p-6 space-y-8">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="h-7 w-20 animate-pulse bg-black/10" />
            </div>
            
            <div className="space-y-3">
              <div className="h-4 w-12 animate-pulse bg-black/10" />
              <div className="h-11 w-full animate-pulse bg-black/5" />
              <div className="h-10 w-full animate-pulse bg-black/5" />
            </div>

            <div className="space-y-3">
              <div className="h-4 w-16 animate-pulse bg-black/10" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full animate-pulse bg-black/10" />
                  <div className="h-4 w-24 animate-pulse bg-black/5" />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse bg-black/10" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full animate-pulse bg-black/10" />
                  <div className="h-4 w-28 animate-pulse bg-black/5" />
                </div>
              ))}
            </div>
          </aside>

          {/* Grid Skeleton */}
          <section>
            <div className="flex flex-col gap-4 border border-black/10 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between animate-pulse">
              <div className="h-8 w-60 bg-black/5" />
              <div className="h-8 w-40 bg-black/5" />
            </div>

            <div className="mt-6 grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-4">
                  <div className="aspect-square w-full animate-pulse bg-black/5" />
                  <div className="h-3 w-16 animate-pulse bg-black/10" />
                  <div className="h-5 w-full animate-pulse bg-black/10" />
                  <div className="h-6 w-24 animate-pulse bg-black/15" />
                  <div className="h-9 w-full animate-pulse bg-black/10" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
