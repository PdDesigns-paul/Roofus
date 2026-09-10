import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { AskFab } from "@/components/ask-fab";
import { ChatHistory } from "@/components/chat-history";
import { ChatSheet } from "@/components/chat-sheet";
import { OnboardOverlay } from "@/components/onboard-overlay";
import { TabBar } from "@/components/tab-bar";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ensurePushWorker } from "@/lib/remind-client";
import appCss from "../styles.css?url";

const APP_NAME = "Roofus";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0c0c0d" },
      { name: "description", content: "Ride-along coach for door-to-door roofers and storm restoration crews." },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Sans+3:wght@400;500;600&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var v=localStorage.getItem("roofus-dark-v2");var s=JSON.parse(localStorage.getItem("roofus-settings")||"{}");var t=s.state&&s.state.theme;if(!v||t==="dark"||!t)document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`,
          }}
        />
      </head>
      <body>
        <PreviewHostBridge />
        <PushBoot />
        <AuthProvider>
          <TooltipProvider delayDuration={350} skipDelayDuration={0}>
            <Outlet />
            <TabBar />
            <AskFab />
            <ChatSheet />
            <ChatHistory />
            <OnboardOverlay />
          </TooltipProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

function PushBoot() {
  useEffect(() => {
    void ensurePushWorker();
  }, []);
  return null;
}