import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, ArrowRight, Calendar, Clock } from "lucide-react";
import { Section } from "@/components/section";
import { useCollection } from "@/hooks/useCollection";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { brand } from "@/data/brand";
import { posts as fallback, type Post } from "@/data/blog";

const CATS = [
  "All",
  "Software Engineering",
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
] as const;
type Cat = (typeof CATS)[number];

function matchCat(p: Post, c: Cat) {
  if (c === "All") return true;
  const cat = p.category.toLowerCase();
  const map: Record<Cat, string[]> = {
    All: [],
    "Software Engineering": ["engineering", "software"],
    "Web Development": ["web", "engineering", "development"],
    "Mobile Development": ["mobile"],
    "UI/UX Design": ["design", "ui", "ux"],
  };
  return map[c].some((m) => cat.includes(m));
}

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: `Engineering Blog — ${brand.name}` },
      {
        name: "description",
        content:
          "Deep dives into product engineering, custom software, web apps, mobile apps and UI/UX patterns.",
      },
      { property: "og:title", content: `Engineering Blog — ${brand.name}` },
      {
        property: "og:description",
        content: "Tech insights from the Netweavesolutions engineering team.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: Blog,
});

function Blog() {
  const list = useCollection<Post>("blog");
  const posts = (list && list.length > 0 ? list : fallback) as Post[];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return posts.filter(
      (p) =>
        matchCat(p, cat) &&
        (!query ||
          p.title.toLowerCase().includes(query) ||
          p.excerpt.toLowerCase().includes(query)),
    );
  }, [posts, cat, q]);

  const featured = cat === "All" && !q.trim() ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <Section className="pt-20 md:pt-28">
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
          Tech Insights
        </span>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-[-0.03em] text-foreground">
          Netweavesolutions{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Engineering Blog
          </span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Deep dives into product engineering, custom software, web apps, mobile apps and UI/UX
          design patterns.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all border",
                c === cat
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-transparent shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]"
                  : "border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:text-white",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles…"
            className="pl-9 rounded-full bg-white/5 border-white/10"
          />
        </div>
      </div>

      {featured && (
        <Link
          to="/blog/$slug"
          params={{ slug: featured.slug }}
          className="mt-10 group grid overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]/70 backdrop-blur md:grid-cols-2 hover:border-cyan-500/40 transition-all"
        >
          <div
            className={`relative aspect-[16/10] md:aspect-auto bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500`}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: "radial-gradient(circle at 30% 20%, white, transparent 55%)",
              }}
            />
            <span className="absolute top-4 left-4 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-bold px-2.5 py-1">
              Featured Article
            </span>
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5">
                {featured.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {featured.readTime}
              </span>
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold text-white group-hover:text-cyan-200 transition-colors">
              {featured.title}
            </h2>
            <p className="mt-3 text-white/70 leading-relaxed">{featured.excerpt}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-sm font-bold">
                  {featured.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="text-sm">
                  <div className="text-white font-medium">{featured.author}</div>
                  <div className="text-white/50 text-xs">
                    {new Date(featured.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold text-sm">
                Read Post{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((p, i) => (
          <motion.article
            key={p.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 3) * 0.05 }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/70 backdrop-blur hover:border-cyan-500/40 hover:-translate-y-1 transition-all"
          >
            <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: "radial-gradient(circle at 30% 20%, white, transparent 50%)",
                  }}
                />
                <span className="absolute top-3 left-3 rounded-full bg-black/40 backdrop-blur text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1">
                  {p.category}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(p.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {p.readTime}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-white/60 line-clamp-3">{p.excerpt}</p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-cyan-300 font-semibold text-sm">
                  Read Article{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center py-16 text-muted-foreground">
          No articles match your search.
        </div>
      )}
    </Section>
  );
}
