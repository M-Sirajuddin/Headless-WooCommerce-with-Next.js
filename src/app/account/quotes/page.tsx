"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchQuoteRequests, submitQuoteRequest, submitMultiQuoteRequest } from "@/lib/auth-api";
import { removeQuoteItem, updateQuoteQuantity, clearQuote } from "@/store/quoteSlice";
import ProductImage from "@/components/ProductImage";
import { FileText, Plus, X, Loader2, CheckCircle2, AlertCircle, Minus, Trash2, Send } from "lucide-react";

interface QuoteRequest {
  id: number;
  date: string;
  status: string;
  product_name: string;
  quantity: number;
  notes: string;
  admin_response?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending Review",
  reviewing: "Under Review",
  quoted: "Quote Sent",
  accepted: "Accepted",
  declined: "Declined",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  quoted: "bg-purple-100 text-purple-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
};

export default function QuotesPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const quoteItems = useAppSelector((state) => state.quote.items);
  const searchParams = useSearchParams();
  const prefilledProduct = searchParams.get("product") ?? "";

  const [listNotes, setListNotes] = useState("");
  const [listSubmitting, setListSubmitting] = useState(false);
  const [listError, setListError] = useState("");

  async function handleListSubmit() {
    if (!token || quoteItems.length === 0) return;
    setListSubmitting(true);
    setListError("");
    try {
      await submitMultiQuoteRequest(token, {
        items: quoteItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        notes: listNotes,
      });
      dispatch(clearQuote());
      setListNotes("");
      const updated = await fetchQuoteRequests(token);
      setQuotes(updated);
    } catch (err: any) {
      setListError(err.message || "Failed to submit quote request.");
    } finally {
      setListSubmitting(false);
    }
  }

  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!prefilledProduct);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    product_name: prefilledProduct,
    quantity: "",
    notes: "",
  });

  useEffect(() => {
    if (!token) return;
    fetchQuoteRequests(token)
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSubmitStatus("idle");
    try {
      await submitQuoteRequest(token, {
        product_name: form.product_name,
        quantity: Number(form.quantity) || 1,
        notes: form.notes,
      });
      setSubmitStatus("success");
      setForm({ product_name: "", quantity: "", notes: "" });
      setShowForm(false);
      // Refresh list
      const updated = await fetchQuoteRequests(token);
      setQuotes(updated);
    } catch (err: any) {
      setSubmitStatus("error");
      setSubmitError(err.message || "Failed to submit quote request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            Quote Requests
          </h2>
          <p className="mt-1 text-sm text-black/55">
            Request custom pricing for bulk or special orders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setSubmitStatus("idle"); }}
          className="inline-flex items-center gap-2 bg-black px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {submitStatus === "success" && (
        <div className="mt-4 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Quote request submitted. We'll review it and get back to you shortly.
        </div>
      )}

      {/* Quote list — products added from product pages, submitted as ONE request */}
      {quoteItems.length > 0 && (
        <div className="mt-6 border border-black/15 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-black">
              Your Quote List ({quoteItems.length})
            </h3>
            <button
              type="button"
              onClick={() => dispatch(clearQuote())}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d93b2e]"
            >
              Clear list
            </button>
          </div>

          <div className="divide-y divide-black/8">
            {quoteItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-black/10 bg-[#f5f5f5]">
                  <ProductImage src={item.imageUrl || null} alt={item.name} fill sizes="56px" unoptimized className="object-contain p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-black">{item.name}</p>
                  {item.price && <p className="text-xs text-black/50">{item.price}</p>}
                </div>
                <div className="inline-flex items-center border border-black/10">
                  <button type="button" aria-label="Decrease" onClick={() => dispatch(updateQuoteQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))} className="inline-flex h-8 w-8 items-center justify-center">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="inline-flex min-w-8 items-center justify-center text-sm font-bold">{item.quantity}</span>
                  <button type="button" aria-label="Increase" onClick={() => dispatch(updateQuoteQuantity({ id: item.id, quantity: item.quantity + 1 }))} className="inline-flex h-8 w-8 items-center justify-center">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button type="button" aria-label={`Remove ${item.name}`} onClick={() => dispatch(removeQuoteItem(item.id))} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition hover:bg-black hover:text-white">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <textarea
            rows={3}
            value={listNotes}
            onChange={(e) => setListNotes(e.target.value)}
            placeholder="Additional notes for this quote (delivery timeline, special requirements, etc.)"
            className="mt-4 w-full resize-none border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black"
          />

          {listError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {listError}
            </div>
          )}

          <button
            type="button"
            onClick={handleListSubmit}
            disabled={listSubmitting}
            className="mt-4 inline-flex h-11 items-center gap-2 bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e] disabled:opacity-50"
          >
            {listSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Quote Request ({quoteItems.length} item{quoteItems.length === 1 ? "" : "s"})
          </button>
        </div>
      )}

      {showForm && (
        <div className="mt-6 border border-black/10 bg-[#f9f9f9] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-black">
              New Quote Request
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-black/40 transition hover:text-black"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-black/60">
                Product Name / SKU *
              </label>
              <input
                required
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                placeholder="e.g. Dazed THCA Collection - 10pk"
                className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-black/60">
                Quantity *
              </label>
              <input
                required
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 100"
                className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-black/60">
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Delivery timeline, special requirements, etc."
                className="w-full border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black resize-none"
              />
            </div>
            {submitStatus === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex h-11 items-center px-6 text-xs font-bold uppercase tracking-[0.16em] text-black/60 transition hover:text-black"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-black/30" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <FileText className="h-12 w-12 text-black/15" />
            <div>
              <p className="font-bold text-black">No quote requests yet</p>
              <p className="mt-1 text-sm text-black/55">
                Submit a request to get custom wholesale pricing.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
              <div key={q.id} className="border border-black/10 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-black">{q.product_name}</p>
                    <p className="mt-0.5 text-sm text-black/55">
                      Qty: {q.quantity} &nbsp;·&nbsp; Submitted{" "}
                      {new Date(q.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {q.notes && (
                      <p className="mt-2 text-sm text-black/65 italic">"{q.notes}"</p>
                    )}
                    {q.admin_response && (
                      <div className="mt-3 border-l-2 border-black/20 pl-3 text-sm text-black/70">
                        <span className="font-bold text-black">Response: </span>
                        {q.admin_response}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_COLOR[q.status] ?? "bg-black/10 text-black/60"}`}
                  >
                    {STATUS_LABEL[q.status] ?? q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
