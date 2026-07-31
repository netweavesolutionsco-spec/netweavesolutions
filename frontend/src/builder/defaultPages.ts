import type { PageData, Section } from "@/builder/types";

/**
 * Bundled fallback composition for the home page. This mirrors the seed in
 * 20260731170000_website_builder.sql exactly, so if the DB is unreachable (SSR
 * cold start, network blip) the public site still renders its real design
 * instead of a blank page. Managed sections carry no data — they self-source
 * from collections/settings.
 */
const section = (id: string, type: string, name: string, data: Record<string, unknown> = {}): Section => ({
  id,
  type,
  name,
  enabled: true,
  data,
});

export const defaultHomePage: PageData = {
  sections: [
    section("s-hero", "hero", "Hero"),
    section("s-tech", "techStack", "Tech Stack"),
    section("s-services", "services", "Services"),
    section("s-why", "whyChoose", "Why Choose Us"),
    section("s-featured", "featuredProject", "Featured Project"),
    section("s-portfolio", "portfolio", "Portfolio Grid"),
    section("s-testimonials", "testimonials", "Testimonials"),
    section("s-pricing", "pricing", "Pricing", { compact: true }),
    section("s-faq", "faq", "FAQ"),
    section("s-contact", "contactCta", "Contact CTA"),
    section("s-expert", "expertForm", "Expert Assistance Form"),
  ],
  seo: {
    title: "Netweave Solutions — AI-Native Software Studio",
    description:
      "We design and build AI-native software, web platforms, and digital products that move businesses forward.",
  },
  og: { title: "", description: "", image: "" },
};

/** Fallback lookup by slug. Only the home page is bundled; others come from DB. */
export const defaultPages: Record<string, PageData> = {
  "/": defaultHomePage,
};
