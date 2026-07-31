import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPublicPage } from "@/lib/pages.functions";
import { emptyPageData, type PageData } from "@/builder/types";
import { defaultPages } from "@/builder/defaultPages";
import { ensureSiteContentLiveSync } from "@/hooks/siteContentSync";
import { isCmsPreview } from "@/hooks/useCmsPreview";

export const pageQueryKey = (slug: string) => ["cms-page", "public", slug] as const;

/**
 * Loads a published page's section data from the DB, mirroring useSiteSettings:
 * live-syncs on publish, and in CMS preview mode reads the draft that the
 * builder streams into this query's cache (never fetching published data).
 */
export function usePage(slug: string): PageData {
  const queryClient = useQueryClient();
  const preview = isCmsPreview();

  useEffect(() => {
    if (preview) return;
    ensureSiteContentLiveSync(queryClient);
  }, [queryClient, preview]);

  const fallback = defaultPages[slug] ?? emptyPageData();

  const { data } = useQuery({
    queryKey: pageQueryKey(slug),
    queryFn: () => getPublicPage({ data: { slug } }),
    staleTime: preview ? Infinity : 0,
    gcTime: preview ? Infinity : 0,
    enabled: !preview,
    refetchOnMount: preview ? false : "always",
    refetchOnWindowFocus: !preview,
    initialData: fallback,
  });
  return data ?? fallback;
}
