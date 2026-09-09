import type { AerialResult } from "@/lib/takeoff";

export function AerialFrame({ aerial }: { aerial: AerialResult; outline?: null }) {
  return (
    <div className="overflow-hidden rounded-xl outline outline-1 -outline-offset-1 outline-black/10">
      <img src={aerial.url} alt="Roof from above" className="aspect-[4/3] w-full object-cover" />
    </div>
  );
}