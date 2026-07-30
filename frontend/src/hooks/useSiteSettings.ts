import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/cms.functions";
import { defaultSettings, type SiteSettings } from "@/data/defaultSettings";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ensureSiteContentLiveSync } from "@/hooks/siteContentSync";
import { isCmsPreview } from "@/hooks/useCmsPreview";

export function useSiteSettings(): SiteSettings {
  const queryClient = useQueryClient();
  // In CMS preview mode the draft is streamed in via postMessage and written
  // straight to this query's cache — never fetch published data or it would
  // overwrite the unpublished preview.
  const preview = isCmsPreview();

  useEffect(() => {
    if (preview) return;
    ensureSiteContentLiveSync(queryClient);
  }, [queryClient, preview]);

  const { data } = useQuery({
    queryKey: ["site-settings", "public", "latest"],
    queryFn: () => getPublicSettings(),
    staleTime: preview ? Infinity : 0,
    gcTime: preview ? Infinity : 0,
    enabled: !preview,
    refetchOnMount: preview ? false : "always",
    refetchOnWindowFocus: !preview,
    initialData: defaultSettings,
  });
  return data;
}
