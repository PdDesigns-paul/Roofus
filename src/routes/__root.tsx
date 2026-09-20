import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/lib/auth/provider";
import { AskFab } from "@/components/ask-fab";
import { ChatHistory } from "@/components/chat-history";
import { ChatSheet } from "@/components/chat-sheet";
import { OnboardOverlay } from "@/components/onboard-overlay";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { TabBar } from "@/components/tab-bar";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { pack, packStyle } from "@/lib/tenant";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: pack.productName },
      { name: "theme-color", content: pack.pwa.themeColor },
      { name: "description", content: `${pack.productName} field coach on this phone.` },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: pack.productName },
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
    <html lang="en" suppressHydrationWarning style={packStyle(pack) as CSSProperties}>
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
        <AuthProvider>
          <TooltipProvider delayDuration={350} skipDelayDuration={0}>
            <PullToRefresh>
              <Outlet />
            </PullToRefresh>
            <TabBar />
            <AskFab />
            <ChatSheet />
            <ChatHistory />
            <OnboardOverlay />
          </TooltipProvider>
        </AuthProvider>
        <Scripts />
        <Analytics />
      </body>
    </html>
  ),
});
