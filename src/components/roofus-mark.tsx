/** Porch-dog face. Default is 56px — never ship a 40px chip as the brand face. */

import { pack } from "@/lib/tenant";

export function RoofusFace({
  className = "size-14",
  alt = pack.productName,
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={pack.markSrc}
      alt={alt}
      data-brand-mark=""
      className={`object-contain ${className}`}
    />
  );
}

export function RoofusMark({ className = "" }: { className?: string }) {
  return (
    <img
      src={pack.markSrc}
      alt=""
      aria-hidden
      className={
        className ||
        "pointer-events-none absolute bottom-0 left-0 z-0 w-[48%] max-w-[220px] select-none object-contain opacity-50 dark:opacity-60"
      }
    />
  );
}
