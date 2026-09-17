/** Porch-dog face. Default is 56px — never ship a 40px chip as the brand face. */

export function RoofusFace({
  className = "size-14",
  alt = "Roofus",
}: {
  className?: string;
  alt?: string;
}) {
  return <img src="/roofus.png" alt={alt} className={`object-contain ${className}`} />;
}

export function RoofusMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/roofus.png"
      alt=""
      aria-hidden
      className={
        className ||
        "pointer-events-none absolute bottom-0 left-0 z-0 w-[48%] max-w-[220px] select-none object-contain opacity-50 dark:opacity-60"
      }
    />
  );
}
