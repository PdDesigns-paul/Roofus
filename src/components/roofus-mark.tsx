/** Porch-dog face. Default is 56px — never ship a 40px chip as the brand face. */

import { useEffect } from "react";
import { useChromePack } from "@/lib/office-mark";
import { currentPack } from "@/lib/tenant";

export function RoofusFace({
  className = "size-14",
  alt,
}: {
  className?: string;
  alt?: string;
}) {
  const pack = currentPack();
  const chrome = useChromePack(pack);
  return (
    <img
      src={chrome.markSrc}
      alt={alt ?? chrome.productName}
      data-brand-mark=""
      className={`object-contain ${className}`}
    />
  );
}

export function RoofusMark({ className = "" }: { className?: string }) {
  const pack = currentPack();
  const chrome = useChromePack(pack);
  return (
    <img
      src={chrome.markSrc}
      alt=""
      aria-hidden
      className={
        className ||
        "pointer-events-none absolute bottom-0 left-0 z-0 w-[48%] max-w-[220px] select-none object-contain opacity-50 dark:opacity-60"
      }
    />
  );
}

/** Title / apple-mobile-web-app-title follow the office name after hydrate. */
export function OfficeChrome() {
  const pack = currentPack();
  const chrome = useChromePack(pack);
  useEffect(() => {
    document.title = chrome.productName;
    const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (meta) meta.setAttribute("content", chrome.productName);
  }, [chrome.productName]);
  return null;
}
