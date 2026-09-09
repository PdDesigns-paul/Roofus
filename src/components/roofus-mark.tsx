export function RoofusMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/roofus.png"
      alt=""
      aria-hidden
      className={
        className ||
        "pointer-events-none fixed bottom-0 left-0 z-0 w-[46vw] max-w-[240px] select-none opacity-40 dark:opacity-50"
      }
    />
  );
}

export function RoofusHero() {
  return (
    <div className="relative isolate min-h-[220px] overflow-hidden">
      <img
        src="/roofus.png"
        alt=""
        className="pointer-events-none absolute -right-8 -top-6 h-[280px] w-auto select-none object-contain sm:h-[320px]"
      />
      <div className="relative z-10 max-w-[62%] pb-6 pt-8">
        <h1 className="font-display text-4xl leading-[0.95] tracking-tight">Porch Dawg.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Coach in the truck. Walk on the roof. Ask him the next line.
        </p>
      </div>
    </div>
  );
}
