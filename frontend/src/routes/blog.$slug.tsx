import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, Share2, Check } from "lucide-react";
import { posts } from "@/data/blog";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { brand } from "@/data/brand";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = posts.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.title} — ${brand.name}`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${loaderData.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/blog/${loaderData.slug}` }],
    };
  },
  notFoundComponent: () => (
    <Section title="Post not found">
      <Link to="/blog" className="text-primary">
        ← Back to blog
      </Link>
    </Section>
  ),
  errorComponent: ({ error }) => (
    <Section title="Error">
      <p>{error.message}</p>
    </Section>
  ),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData() as (typeof posts)[number];
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const tags = [
    `#${post.category.replace(/\s+/g, "")}`,
    "#Engineering",
    "#React",
    "#AI",
    "#Netweavesolutions",
  ];

  return (
    <article className="mx-auto max-w-3xl px-6 pt-20 md:pt-28 pb-20">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="rounded-full text-white/70 hover:text-white"
      >
        <Link to="/blog">
          <ArrowLeft className="h-4 w-4" /> Back to All Articles
        </Link>
      </Button>

      <div className="mt-6 flex items-center gap-3 text-xs">
        <span className="rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 font-semibold">
          {post.category}
        </span>
        <span className="inline-flex items-center gap-1 text-white/60">
          <Clock className="h-3 w-3" /> {post.readTime}
        </span>
      </div>

      <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-white">
        {post.title}
      </h1>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold">
            {post.author
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="text-sm">
            <div className="text-white font-medium">{post.author}</div>
            <div className="text-white/50 text-xs">
              Engineering ·{" "}
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        <Button onClick={share} variant="outline" size="sm" className="rounded-full">
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" /> Share Link
            </>
          )}
        </Button>
      </div>

      <div className="my-10 aspect-[16/8] rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white, transparent 55%)" }}
        />
      </div>

      <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 pl-6 py-4 my-8 rounded-r-xl">
        <p className="text-lg text-white/85 italic leading-relaxed">{post.excerpt}</p>
      </blockquote>

      <div className="prose prose-invert prose-neutral max-w-none text-white/80 leading-relaxed">
        {post.content.split("\n\n").map((para, i) => (
          <p key={i} className="mb-5 text-base md:text-lg">
            {para}
          </p>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-2 border-t border-white/10 pt-6">
        {tags.map((t) => (
          <span
            key={t}
            className="text-xs rounded-full border border-white/10 bg-white/5 text-white/70 px-3 py-1"
          >
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

