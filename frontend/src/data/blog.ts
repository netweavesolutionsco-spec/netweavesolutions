export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  content: string;
};

export const posts: Post[] = [
  {
    slug: "design-systems-that-scale",
    title: "Design systems that actually scale",
    excerpt:
      "Tokens, primitives and the discipline of saying no — how we build design systems that survive contact with real product teams.",
    category: "Design",
    date: "2026-06-14",
    readTime: "8 min",
    author: "Priya Menon",
    content:
      "A design system isn't a component library — it's a shared language. In this piece we cover the layered token model we use across client work, how to structure primitives so they don't ossify, and the review rituals that keep a system from drifting.\n\nWe'll walk through a real system we shipped for a fintech client: 6 tokens, 24 primitives, 40+ composed components, versioned and consumed across web, mobile and marketing.",
  },
  {
    slug: "shipping-fast-shipping-safe",
    title: "Shipping fast and shipping safe",
    excerpt:
      "The engineering practices we lean on to move quickly without waking up to a production incident on a Sunday.",
    category: "Engineering",
    date: "2026-05-30",
    readTime: "6 min",
    author: "Marcus Feld",
    content:
      "Speed and safety aren't a trade-off — they're a function of the same underlying practices. Trunk-based development, feature flags, small PRs, observability from day one. Here's how we set it up on new projects.",
  },
  {
    slug: "picking-the-right-stack",
    title: "How we pick the right stack for a new project",
    excerpt:
      "A framework for choosing between the boring option, the exciting option, and the option your team can actually maintain.",
    category: "Engineering",
    date: "2026-04-11",
    readTime: "7 min",
    author: "David Chen",
    content:
      "Every stack decision is a bet on the next three years. We use a simple scoring rubric — team fit, ecosystem maturity, hiring pool, operational cost — to keep the conversation grounded.",
  },
];

export const categories = ["All", "Design", "Engineering"];
