export type Plan = {
  name: string;
  price: string;
  period: string;
  monthlyPrice?: string;
  monthlyPeriod?: string;
  tagline: string;
  featured?: boolean;
  features: string[];
  cta: string;
};

export const plans: Plan[] = [
  {
    name: "Starter Plan",
    price: "₹15,000",
    period: "one-time",
    monthlyPrice: "₹3,500",
    monthlyPeriod: "month",
    tagline: "Ideal for startups, small businesses & MVPs needing quick market launch.",
    features: [
      "Up to 5 Pages Responsive Website",
      "Modern Clean UI/UX Design",
      "Mobile-First Responsive Layout",
      "Contact Form & WhatsApp Lead Widget",
      "1 Month Post-Launch Maintenance",
      "Sub-1 Second Page Speeds",
    ],
    cta: "Get Started",
  },
  {
    name: "Professional Plan",
    price: "₹49,000",
    period: "one-time",
    monthlyPrice: "₹9,900",
    monthlyPeriod: "month",
    tagline: "Perfect for growing companies requiring custom features, apps, or ERPs.",
    featured: true,
    features: [
      "Up to 15 Pages / Complex Web App",
      "Custom Database & Express Backend",
      "Admin CMS & Roles Dashboard",
      "School/Hospital ERP or CRM Base Module",
      "Mobile App (iOS or Android Flutter)",
      "3 Months Free Priority Maintenance",
      "Dedicated Technical Project Lead",
    ],
    cta: "Start Pro Project",
  },
  {
    name: "Enterprise Plan",
    price: "₹1,49,000",
    period: "one-time",
    monthlyPrice: "₹29,900",
    monthlyPeriod: "month",
    tagline: "Comprehensive digital transformation for high-concurrency enterprise applications.",
    features: [
      "Unlimited Pages & Full Stack Cloud SaaS",
      "Dual Mobile Apps (iOS + Android Native/Flutter)",
      "Custom Business Software / ERP Modules",
      "Multi-Tenant Database Architecture",
      "12 Months Priority Product Support",
      "Full Source Code & IP Ownership Rights",
      "Dedicated Engineering Team (3-5 Engineers)",
    ],
    cta: "Schedule Discovery Call",
  },
];

export const comparison = [
  { feature: "Custom design", starter: "Template-based", pro: true, enterprise: true },
  { feature: "Pages included", starter: "5", pro: "15", enterprise: "Unlimited" },
  { feature: "CMS", starter: false, pro: true, enterprise: true },
  { feature: "Custom modules", starter: false, pro: "Core", enterprise: "Advanced" },
  { feature: "Support", starter: "30 days", pro: "90 days", enterprise: "Ongoing" },
  { feature: "Dedicated team", starter: false, pro: false, enterprise: true },
];
