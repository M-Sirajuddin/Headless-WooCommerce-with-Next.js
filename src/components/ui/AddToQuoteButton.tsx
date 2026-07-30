"use client";

import Link from "next/link";
import { FileText, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addQuoteItem, type QuoteItem } from "@/store/quoteSlice";

export default function AddToQuoteButton({
  product,
}: {
  product: Omit<QuoteItem, "quantity">;
}) {
  const dispatch = useAppDispatch();
  const inQuote = useAppSelector((s) =>
    s.quote.items.some((i) => i.id === product.id)
  );

  return (
    <div className="mt-1 flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => dispatch(addQuoteItem({ ...product, quantity: 1 }))}
        className="inline-flex flex-1 items-center justify-center gap-2 border border-black/20 py-3 text-xs font-black uppercase tracking-[0.16em] text-black/70 transition hover:border-black hover:text-black"
      >
        {inQuote ? <Check className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4" />}
        {inQuote ? "Added to Quote" : "Add to Quote Request"}
      </button>
      {inQuote && (
        <Link
          href="/account/quotes"
          className="inline-flex items-center justify-center gap-2 border border-black bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
        >
          View Quote
        </Link>
      )}
    </div>
  );
}
