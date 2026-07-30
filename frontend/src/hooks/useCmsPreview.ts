import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mergeSettings } from "@/data/defaultSettings";

/**
 * CMS Live Preview bridge.
 *
 * The admin CMS editor renders the real public site inside a same-origin
 * iframe at `/?preview=cms` and streams the current *unpublished* draft into
 * it via postMessage. Inside the iframe we write that draft straight into the
 * shared site-settings query cache — the same key the whole public site reads
 * from — so every section re-renders with the draft instantly. Nothing is
 * published: the database and the live site are untouched.
 */

export const SITE_SETTINGS_KEY = ["site-settings", "public", "latest"] as const;

export const PREVIEW_READY = "cms-preview-ready";
export const PREVIEW_SETTINGS = "cms-preview-settings";

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
 * from the parent CMS editor and feeds them into the settings cache.
 */
export function useCmsPreviewBridge(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isCmsPreview() || typeof window === "undefined") return;

    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return;
      const msg = e.data as { type?: string; settings?: unknown } | null;
      if (!msg || msg.type !== PREVIEW_SETTINGS) return;
      queryClient.setQueryData(SITE_SETTINGS_KEY, mergeSettings(msg.settings));
    };

    window.addEventListener("message", onMessage);
    // Ask the editor to send the current draft now that we're listening.
    window.parent?.postMessage({ type: PREVIEW_READY }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);
}
