import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { BackToTop } from "@/components/back-to-top";
import { CostEstimatorModal } from "@/components/cost-estimator-modal";
import { SeoAuditDrawer } from "@/components/seo-audit-drawer";
import { AIChatWidget } from "@/components/ai-chat-widget";
import { ClientAuthProvider } from "@/hooks/use-client-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Netweavesolutions — Premium Software Development Agency" },
      {
        name: "description",
        content:
          "Netweavesolutions builds premium websites, apps and custom software. Transforming ideas into powerful digital solutions.",
      },
      { name: "author", content: "Netweavesolutions" },
      { name: "theme-color", content: "#4F46E5" },
      { property: "og:site_name", content: "Netweavesolutions" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Netweavesolutions — Premium Software Development Agency" },
      {
        property: "og:description",
        content: "Websites, apps and custom software crafted by a senior team.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Netweavesolutions" },
      {
        name: "twitter:description",
        content: "Transforming ideas into powerful digital solutions.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Netweavesolutions",
          description: "Premium software development agency.",
          email: "netweavesolutions.co@gmail.com",
          telephone: "+918434554873",
          address: { "@type": "PostalAddress", addressCountry: "IN" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  const isClient = pathname.startsWith("/client");
  const chromeless = isAdmin || isClient;
  return (
    <QueryClientProvider client={queryClient}>
      <ClientAuthProvider>
        <ThemeProvider>
          <div className="relative min-h-screen bg-background text-foreground antialiased">
            {!chromeless && (
              <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10"
                style={{ background: "var(--gradient-radial)" }}
              />
            )}
            {!chromeless && <Navbar />}
            {chromeless ? (
              <Outlet />
            ) : (
              <main className="pt-24">
                <Outlet />
              </main>
            )}
            {!chromeless && <Footer />}
            {!chromeless && <FloatingWhatsApp />}
            {!chromeless && <BackToTop />}
            {!chromeless && <CostEstimatorModal />}
            <SeoAuditDrawer />
            {!chromeless && <AIChatWidget />}
            <Toaster richColors position="top-right" />
          </div>
        </ThemeProvider>
      </ClientAuthProvider>
    </QueryClientProvider>
  );
}
