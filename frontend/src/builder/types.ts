import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/data/defaultSettings";

/**
 * Per-section JSON payload. Uses `any` values because it round-trips through
 * Supabase JSONB and TanStack server-fn (de)serialization, which reject the
 * non-serializable `unknown`. Section renderers coerce fields explicitly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SectionData = Record<string, any>;

/** A single placed section on a page. `data` holds per-section overrides. */
export type Section = {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  data: SectionData;
};

export type PageSeo = { title: string; description: string };
export type PageOg = { title: string; description: string; image: string };

/** The JSONB payload stored in cms_pages.data / .published_data. */
export type PageData = {
  sections: Section[];
  seo: PageSeo;
  og: PageOg;
};

export type PageRecord = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  data: PageData;
  is_system: boolean;
  sort: number;
  updated_at?: string;
};

/** Declarative property-panel field. Drives auto-generated editing UI. */
export type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "color" | "slider" | "select" | "switch" | "link" | "list";
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  /** For type "list": the shape of each item's fields. */
  itemFields?: FieldSpec[];
  help?: string;
};

/** Everything the builder + renderer need for one section type. */
export type SectionDef = {
  type: string;
  label: string;
  category: string;
  icon: LucideIcon;
  /** Seed data when a new section of this type is added. */
  defaultData: SectionData;
  /** Property-panel fields. Empty = content managed elsewhere (see `managedNote`). */
  fields: FieldSpec[];
  /** Optional note shown in the panel when content is sourced from a collection/settings. */
  managedNote?: string;
  Render: (props: { data: SectionData; settings: SiteSettings }) => ReactNode;
};

export const emptyPageData = (): PageData => ({
  sections: [],
  seo: { title: "", description: "" },
  og: { title: "", description: "", image: "" },
});
