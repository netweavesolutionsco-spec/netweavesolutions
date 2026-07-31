import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

let liveSyncRegistered = false;
const collectionKeys = [
  "services",
  "portfolio",
  "blog",
  "pricing",
  "testimonials",
  "team",
  "values",
  "processSteps",
  "jobs",
  "benefits",
  "faqs",
] as const;

function invalidatePublicContent(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["site-settings", "public"] });
  collectionKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: ["collection", key] });
  });
  // Builder-managed pages (cms_pages) share this live-sync path.
  queryClient.invalidateQueries({ queryKey: ["cms-page", "public"] });
}

export function ensureSiteContentLiveSync(queryClient: QueryClient) {
  if (liveSyncRegistered) return;
  liveSyncRegistered = true;

  supabase
    .channel("site-content-live-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_content" },
      () => {
        invalidatePublicContent(queryClient);
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cms_pages" },
      () => {
        // A page publish/unpublish/edit landed — refresh all page queries so
        // the live site updates instantly with no rebuild.
        queryClient.invalidateQueries({ queryKey: ["cms-page", "public"] });
      },
    )
    .subscribe();
}

export function invalidatePublishedContent(queryClient: QueryClient) {
  invalidatePublicContent(queryClient);
}
