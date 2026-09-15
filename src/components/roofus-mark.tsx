/** Porch-dog face. The faded mark lives in chat so they can see who they're talking to. */

export function RoofusFace({
  className = "size-10",
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
