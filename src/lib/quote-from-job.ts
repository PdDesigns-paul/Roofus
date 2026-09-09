import { computeQuote, type PriceBook, type QuoteResult } from "@/lib/roofing";
import type { Job } from "@/lib/jobs-store";

export function quoteJob(job: Job, book: PriceBook): QuoteResult | null {
  const analysis = job.analysis;
  if (!analysis) return null;
  const instant = job.instant;
  const orderSquares = instant?.squares ?? 0;
  const measured = instant?.measuredSqFt ?? orderSquares * 100;
  const roofSquares = measured > 0 ? measured / 100 : orderSquares;
  if (orderSquares < 4 && roofSquares < 4) return null;
  return computeQuote(
    {
      product: job.product,
      roofSquares,
      orderSquares: orderSquares || roofSquares,
      planSqFt: instant?.aerialSqFt || measured,
      wastePct: instant?.wastePct ?? analysis.wastePct,
      confidenceLabel: instant?.confidenceLabel ?? "Medium",
    },
    book,
  );
}