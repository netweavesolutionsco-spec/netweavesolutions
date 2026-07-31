import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SectionRenderer, useScrollToSelected } from "@/builder/SectionRenderer";
import { usePage } from "@/hooks/usePage";
import { isCmsPreview, PREVIEW_SELECT } from "@/hooks/useCmsPreview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Netweavesolutions — Premium Software Development Agency" },
      {
        name: "description",
        content:
          "Websites, apps and custom software crafted by a senior team. Transforming ideas into powerful digital solutions.",
      },
      { property: "og:title", content: "Netweavesolutions" },
      { property: "og:description", content: "Premium software development agency." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  // The home page renders from CMS page data (seeded to the exact current
  // composition, so the design is unchanged). usePage is preview-aware: in the
  // builder iframe it reads the streamed draft instead of published data.
  const page = usePage("/");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // In preview, the builder tells us which section is selected so we can
  // highlight it and scroll it into view.
  useEffect(() => {
    if (!isCmsPreview() || typeof window === "undefined") return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return;
      const msg = e.data as { type?: string; id?: string | null } | null;
      if (msg?.type === PREVIEW_SELECT) setSelectedId(msg.id ?? null);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useScrollToSelected(selectedId);

  return <SectionRenderer page={page} selectedId={selectedId} />;
}
