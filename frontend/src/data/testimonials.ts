export type Testimonial = {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Priya Menon",
    role: "Head of Product",
    company: "Northwind Health",
    quote:
      "Netweavesolutions rebuilt our patient portal in ten weeks. Load time dropped 62%, appointment completion is up 34%. They ship like a product team, not an agency.",
    avatar: "PM",
  },
  {
    name: "Marcus Feld",
    role: "Founder",
    company: "Lumen Retail",
    quote:
      "Every deliverable felt considered — design system, code, docs, handover. Two years in and we're still building on the foundation they laid.",
    avatar: "MF",
  },
  {
    name: "Aditi Rao",
    role: "COO",
    company: "Bright Coaching",
    quote:
      "Our school ERP handles 40k students without a hiccup. Support is fast, updates are painless. Best decision we made this year.",
    avatar: "AR",
  },
  {
    name: "David Chen",
    role: "CTO",
    company: "Vertex Fintech",
    quote:
      "Their engineers plugged into our team seamlessly. Security-first, calm under pressure, and genuinely great to work with.",
    avatar: "DC",
  },
  {
    name: "Sara Ali",
    role: "Marketing Director",
    company: "Kite & Co.",
    quote:
      "The site is stunning, but the impact is what matters — organic traffic up 3.1x and demo bookings doubled in the first quarter.",
    avatar: "SA",
  },
];

