import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SiteContentRow = {
  id: string;
  published_data: unknown;
};

type SupabaseLoose = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[],
      ) => Promise<{ data: SiteContentRow[] | null; error: { message?: string } | null }>;
    };
  };
  channel: (name: string) => {
    on: (
      type: "postgres_changes",
      filter: Record<string, string>,
      callback: () => void,
    ) => { subscribe: () => unknown };
  };
  removeChannel: (channel: unknown) => void;
};

const db = supabase as unknown as SupabaseLoose;

const COLLECTION_IDS = ["col_portfolio", "col_services", "col_blog", "col_testimonials"];

function countItems(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) ? items.length : 0;
}

export function useLiveSiteStats() {
  const [counts, setCounts] = useState({
    portfolio: 0,
    services: 0,
    blog: 0,
    testimonials: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("site_content")
      .select("id, published_data")
      .in("id", COLLECTION_IDS);

    if (error) {
      console.warn("Live site stats could not be loaded:", error.message);
      setLoading(false);
      return;
    }

    const byId = new Map((data ?? []).map((row) => [row.id, row.published_data]));
    setCounts({
      portfolio: countItems(byId.get("col_portfolio")),
      services: countItems(byId.get("col_services")),
      blog: countItems(byId.get("col_blog")),
      testimonials: countItems(byId.get("col_testimonials")),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = db
      .channel("home-live-site-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [load]);

  return { counts, loading };
}
