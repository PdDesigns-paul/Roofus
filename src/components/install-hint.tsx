import { useEffect, useState } from "react";

function isStandalone() {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallHint() {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [promptEvent, setPromptEvent] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [hidden, setHidden] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem("roofus-install-hide") === "1";
  });

  useEffect(() => {
    setStandalone(isStandalone());
    setReady(true);
    function onPrompt(e: Event) {
      e.preventDefault();
      setPromptEvent(e as Event & { prompt: () => Promise<void> });
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!ready || standalone || hidden) return null;

  function dismiss() {
    localStorage.setItem("roofus-install-hide", "1");
    setHidden(true);
  }

  return (
    <div className="mt-4 rounded-2xl border border-border px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Install this</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {isIos()
          ? "Share, then Add to Home Screen. Next time it opens like any other app. Your day stays on this phone."
          : "Add Roofus to your Home Screen. Next time it opens like any other app. Your day stays on this phone."}
      </p>
      <div className="mt-3 flex gap-2">
        {promptEvent ? (
          <button
            type="button"
            className="h-11 flex-1 rounded-full bg-fg text-sm text-paper"
            onClick={() => void promptEvent.prompt()}
          >
            Install
          </button>
        ) : null}
        <button type="button" className="h-11 flex-1 rounded-full border border-border text-sm" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
