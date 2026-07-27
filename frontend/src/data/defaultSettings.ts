// Default site settings — mirrors the seed row in the DB.
// Used as the fallback when the CMS row is unavailable.
export type NavItem = { to: string; label: string; enabled: boolean };

export type SiteSettings = {
  brand: {
    name: string;
    short: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    logoUrl?: string;
    logoDarkUrl?: string;
    faviconUrl?: string;
  };
  social: {
    twitter: string;
    linkedin: string;
    github: string;
    instagram: string;
  };
  nav: NavItem[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: { label: string; to: string };
    ctaSecondary: { label: string; to: string };
  };
  footer: { copyright: string; showNewsletter: boolean };
  seo: { title: string; description: string };
  theme: { primary: string; accent: string; highlight: string };
};

export const defaultSettings: SiteSettings = {
  brand: {
    name: "Netweavesolutions",
    short: "Netweavesolutions",
    tagline: "Transforming Ideas Into Powerful Digital Solutions.",
    description:
      "Premium software development agency crafting websites, apps and custom software that scale.",
    email: "netweavesolutions.co@gmail.com",
    phone: "+918434554873",
    whatsapp: "918434554873",
    address: "India",
    logoUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
  },
  social: {
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    instagram: "https://instagram.com",
  },
  nav: [
    { to: "/", label: "Home", enabled: true },
    { to: "/about", label: "About", enabled: true },
    { to: "/services", label: "Services", enabled: true },
    { to: "/portfolio", label: "Portfolio", enabled: true },
    { to: "/pricing", label: "Pricing", enabled: true },
    { to: "/blog", label: "Blog", enabled: true },
    { to: "/careers", label: "Careers", enabled: true },
    { to: "/contact", label: "Contact", enabled: true },
  ],
  hero: {
    eyebrow: "Premium Software Agency",
    title: "Transforming Ideas Into Powerful Digital Solutions",
    subtitle: "We design, build and scale beautiful digital products for ambitious teams.",
    ctaPrimary: { label: "Get a Quote", to: "/contact" },
    ctaSecondary: { label: "View Work", to: "/portfolio" },
  },
  footer: {
    copyright: "© Netweavesolutions. All rights reserved.",
    showNewsletter: true,
  },
  seo: {
    title: "Netweavesolutions — Premium Software Development Agency",
    description: "Transforming Ideas Into Powerful Digital Solutions.",
  },
  theme: {
    primary: "#4F46E5",
    accent: "#06B6D4",
    highlight: "#8B5CF6",
  },
};

export function mergeSettings(partial: unknown): SiteSettings {
  if (!partial || typeof partial !== "object") return defaultSettings;
  const p = partial as Partial<SiteSettings>;
  return {
    brand: { ...defaultSettings.brand, ...(p.brand ?? {}) },
    social: { ...defaultSettings.social, ...(p.social ?? {}) },
    nav: Array.isArray(p.nav) && p.nav.length ? (p.nav as NavItem[]) : defaultSettings.nav,
    hero: { ...defaultSettings.hero, ...(p.hero ?? {}) },
    footer: { ...defaultSettings.footer, ...(p.footer ?? {}) },
    seo: { ...defaultSettings.seo, ...(p.seo ?? {}) },
    theme: { ...defaultSettings.theme, ...(p.theme ?? {}) },
  };
}

