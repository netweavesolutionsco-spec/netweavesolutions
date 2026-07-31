import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mergeSettings } from "@/data/defaultSettings";
import { pageQueryKey } from "@/hooks/usePage";
import type { PageData } from "@/builder/types";

/**
 * CMS Live Preview bridge.
 *
 * The admin CMS editor renders the real public site inside a same-origin
 * iframe at `/?preview=cms` and streams the current *unpublished* draft into
 * it via postMessage. Inside the iframe we write that draft straight into the
 * shared site-settings query cache — the same key the whole public site reads
 * from — so every section re-renders with the draft instantly. Nothing is
 * published: the database and the live site are untouched.
 *
 * The Website Builder reuses the same channel: alongside global settings it
 * also streams the working PageData (sections) for the page being edited, and
 * receives SECTION_CLICK messages when a section is clicked in the preview so
 * clicking a block selects it in the editor.
 */

export const SITE_SETTINGS_KEY = ["site-settings", "public", "latest"] as const;

export const PREVIEW_READY = "cms-preview-ready";
export const PREVIEW_SETTINGS = "cms-preview-settings";
/** Editor → iframe: the working page (sections/seo/og) + its slug. */
export const PREVIEW_PAGE = "cms-preview-page";
/** iframe → editor: a section was clicked in the preview. */
export const PREVIEW_SECTION_CLICK = "cms-preview-section-click";
/** Editor → iframe: which section is currently selected (for highlight/scroll). */
export const PREVIEW_SELECT = "cms-preview-select";

/** True when the current document is the CMS preview iframe. */
export function isCmsPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("preview") === "cms";
  } catch {
    return false;
  }
}

/**
 * Mounted once at the app root. In preview mode it receives draft settings
 * and (for the builder) draft page data from the parent editor and feeds them
 * into the query caches.
 */
export function useCmsPreviewBridge(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isCmsPreview() || typeof window === "undefined") return;

    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return;
      const msg = e.data as { type?: string; settings?: unknown; page?: PageData; slug?: string } | null;
      if (!msg) return;
      if (msg.type === PREVIEW_SETTINGS) {
        queryClient.setQueryData(SITE_SETTINGS_KEY, mergeSettings(msg.settings));
      } else if (msg.type === PREVIEW_PAGE && msg.page && typeof msg.slug === "string") {
        queryClient.setQueryData(pageQueryKey(msg.slug), msg.page);
      }
    };

    window.addEventListener("message", onMessage);
    // Ask the editor to send the current draft now that we're listening.
    window.parent?.postMessage({ type: PREVIEW_READY }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);
}
