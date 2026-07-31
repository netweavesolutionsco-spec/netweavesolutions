import {
  LayoutTemplate,
  Cpu,
  Wrench,
  ShieldCheck,
  Star,
  Images,
  Quote,
  BadgeDollarSign,
  HelpCircle,
  Phone,
  Mails,
  Type,
  Code2,
  Grid3x3,
  Megaphone,
  BarChart3,
} from "lucide-react";
import type { SectionDef } from "@/builder/types";

// Existing designed blocks — reused verbatim so the public design stays identical.
import { Hero } from "@/components/home/hero";
import { TechStackBadges } from "@/components/home/tech-stack-badges";
import { ServicesPreview } from "@/components/home/services-preview";
import { WhyChooseUs } from "@/components/home/why-choose";
import { FeaturedProject } from "@/components/home/featured-project";
import { PortfolioGrid } from "@/components/home/portfolio-grid";
import { TestimonialsSlider } from "@/components/home/testimonials";
import { PricingSection } from "@/components/home/pricing-section";
import { FaqSection } from "@/components/home/faq-section";
import { ContactCta } from "@/components/home/contact-cta";
import { ExpertAssistanceForm } from "@/components/home/expert-assistance-form";

// Generic content-driven blocks.
import {
  RichTextBlock,
  CustomHtmlBlock,
  ImageGridBlock,
  CtaBlock,
  StatsBlock,
} from "@/builder/registry/generic";

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

/**
 * The single source of truth for every section type the builder can place and
 * the public site can render. `type` strings match the seed in
 * 20260731170000_website_builder.sql. Wrapped blocks (category "Managed")
 * self-source from collections/settings for pixel-identical output; their
 * per-section `data` only fine-tunes what those components already accept.
 */
export const SECTION_DEFS: SectionDef[] = [
  // ---------------- Managed blocks (reuse existing design) ----------------
  {
    type: "hero",
    label: "Hero",
    category: "Managed",
    icon: LayoutTemplate,
    defaultData: { eyebrow: "", title: "", subtitle: "" },
    managedNote:
      "Falls back to global Hero settings when a field is left blank. Edit global copy in CMS → Settings.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "AI-Native Software Studio" },
      { key: "title", label: "Title", type: "textarea", placeholder: "Transforming ideas into…" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
    ],
    Render: ({ data }) => (
      <Hero
        overrides={{
          eyebrow: str(data.eyebrow),
          title: str(data.title),
          subtitle: str(data.subtitle),
        }}
      />
    ),
  },
  {
    type: "techStack",
    label: "Tech Stack",
    category: "Managed",
    icon: Cpu,
    defaultData: {},
    managedNote: "Renders the tech-stack badge marquee.",
    fields: [],
    Render: () => <TechStackBadges />,
  },
  {
    type: "services",
    label: "Services",
    category: "Managed",
    icon: Wrench,
    defaultData: {},
    managedNote: "Content managed in CMS → Services collection.",
    fields: [],
    Render: () => <ServicesPreview />,
  },
  {
    type: "whyChoose",
    label: "Why Choose Us",
    category: "Managed",
    icon: ShieldCheck,
    defaultData: {},
    managedNote: "Renders the Why-Choose-Us feature grid.",
    fields: [],
    Render: () => <WhyChooseUs />,
  },
  {
    type: "featuredProject",
    label: "Featured Project",
    category: "Managed",
    icon: Star,
    defaultData: {},
    managedNote: "Highlights a project from the Portfolio collection.",
    fields: [],
    Render: () => <FeaturedProject />,
  },
  {
    type: "portfolio",
    label: "Portfolio Grid",
    category: "Managed",
    icon: Images,
    defaultData: {},
    managedNote: "Content managed in CMS → Portfolio collection.",
    fields: [],
    Render: () => <PortfolioGrid />,
  },
  {
    type: "testimonials",
    label: "Testimonials",
    category: "Managed",
    icon: Quote,
    defaultData: {},
    managedNote: "Content managed in CMS → Testimonials collection.",
    fields: [],
    Render: () => <TestimonialsSlider />,
  },
  {
    type: "pricing",
    label: "Pricing",
    category: "Managed",
    icon: BadgeDollarSign,
    defaultData: { compact: true },
    managedNote: "Content managed in CMS → Pricing collection.",
    fields: [
      { key: "compact", label: "Compact layout", type: "switch" },
    ],
    Render: ({ data }) => <PricingSection compact={data.compact !== false} />,
  },
  {
    type: "faq",
    label: "FAQ",
    category: "Managed",
    icon: HelpCircle,
    defaultData: {},
    managedNote: "Content managed in CMS → FAQs collection.",
    fields: [],
    Render: () => <FaqSection />,
  },
  {
    type: "contactCta",
    label: "Contact CTA",
    category: "Managed",
    icon: Phone,
    defaultData: {},
    managedNote: "Renders the contact call-to-action band.",
    fields: [],
    Render: () => <ContactCta />,
  },
  {
    type: "expertForm",
    label: "Expert Assistance Form",
    category: "Managed",
    icon: Mails,
    defaultData: {},
    managedNote: "Renders the expert-assistance lead form.",
    fields: [],
    Render: () => <ExpertAssistanceForm />,
  },

  // ---------------- Generic content blocks ----------------
  {
    type: "richText",
    label: "Rich Text",
    category: "Content",
    icon: Type,
    defaultData: { heading: "Section heading", body: "Write your content here.", align: "left" },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      {
        key: "align",
        label: "Alignment",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
        ],
      },
    ],
    Render: RichTextBlock,
  },
  {
    type: "cta",
    label: "Call To Action",
    category: "Content",
    icon: Megaphone,
    defaultData: {
      heading: "Ready to get started?",
      subtitle: "",
      primaryLabel: "Get in touch",
      primaryTo: "/contact",
      secondaryLabel: "",
      secondaryTo: "/",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "primaryLabel", label: "Primary button label", type: "text" },
      { key: "primaryTo", label: "Primary button link", type: "link" },
      { key: "secondaryLabel", label: "Secondary button label", type: "text" },
      { key: "secondaryTo", label: "Secondary button link", type: "link" },
    ],
    Render: CtaBlock,
  },
  {
    type: "stats",
    label: "Stats",
    category: "Content",
    icon: BarChart3,
    defaultData: {
      heading: "",
      stats: [
        { value: "100+", label: "Projects" },
        { value: "99%", label: "Satisfaction" },
        { value: "24/7", label: "Support" },
        { value: "10+", label: "Experts" },
      ],
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "stats",
        label: "Stats",
        type: "list",
        itemFields: [
          { key: "value", label: "Value", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
    Render: StatsBlock,
  },
  {
    type: "imageGrid",
    label: "Image Grid",
    category: "Content",
    icon: Grid3x3,
    defaultData: { heading: "", columns: 3, images: [] },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "columns",
        label: "Columns",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      {
        key: "images",
        label: "Images",
        type: "list",
        itemFields: [
          { key: "url", label: "Image", type: "image" },
          { key: "alt", label: "Alt text", type: "text" },
        ],
      },
    ],
    Render: ImageGridBlock,
  },
  {
    type: "customHtml",
    label: "Custom HTML",
    category: "Advanced",
    icon: Code2,
    defaultData: { html: "<!-- your HTML -->" },
    fields: [{ key: "html", label: "HTML", type: "textarea", help: "Trusted admin-authored markup." }],
    Render: CustomHtmlBlock,
  },
];

/** Fast lookup by section type. */
export const SECTION_REGISTRY: Record<string, SectionDef> = Object.fromEntries(
  SECTION_DEFS.map((d) => [d.type, d]),
);

export const getSectionDef = (type: string): SectionDef | undefined => SECTION_REGISTRY[type];

/** Section types grouped by category, for the "+ Add Section" menu. */
export const SECTION_CATEGORIES: { category: string; defs: SectionDef[] }[] = (() => {
  const order = ["Managed", "Content", "Advanced"];
  const groups = new Map<string, SectionDef[]>();
  for (const def of SECTION_DEFS) {
    const list = groups.get(def.category) ?? [];
    list.push(def);
    groups.set(def.category, list);
  }
  return order
    .filter((c) => groups.has(c))
    .map((category) => ({ category, defs: groups.get(category)! }));
})();
