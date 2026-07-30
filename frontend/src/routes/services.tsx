import { createFileRoute } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { Section } from "@/components/section";
import { ContactCta } from "@/components/home/contact-cta";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { brand } from "@/data/brand";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: `Services — ${brand.name}` },
      {
        name: "description",
        content:
          "Web, mobile, custom software, design and growth services from Netweavesolutions.",
      },
      { property: "og:title", content: `Services — ${brand.name}` },
      {
        property: "og:description",
        content: "Everything we ship — websites, apps, custom software and more.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

const TECH_STACKS: Record<string, string[]> = {
  Frontend: ["React", "Next.js", "TanStack", "Tailwind CSS", "Motion", "Vite"],
  Backend: ["Node.js", "Bun", "Hono", "tRPC", "GraphQL", "REST"],
  Mobile: ["Flutter", "React Native", "Swift", "Kotlin", "Expo"],
  Cloud: ["AWS", "GCP", "Cloudflare", "Vercel", "Docker", "Kubernetes"],
  Database: ["PostgreSQL", "MongoDB", "Supabase", "Redis", "Prisma", "Drizzle"],
  AI: ["Gemini", "OpenAI", "LangChain", "Vector DBs", "RAG", "Whisper"],
};

const COMPARE = [
  { feature: "Senior engineers only", codenest: true, freelancer: false, inhouse: true },
  { feature: "Fixed monthly cost", codenest: true, freelancer: false, inhouse: false },
  { feature: "Product + design + engineering", codenest: true, freelancer: false, inhouse: false },
  { feature: "SLA-backed support", codenest: true, freelancer: false, inhouse: true },
  { feature: "No hiring overhead", codenest: true, freelancer: true, inhouse: false },
  { feature: "Ship in weeks, not months", codenest: true, freelancer: false, inhouse: false },
  { feature: "IP ownership transfer", codenest: true, freelancer: false, inhouse: true },
];

function Services() {
  const services = useCollection<any>("services");
  const [stackTab, setStackTab] = useState<string>("Frontend");
  return (
    <>
      <Section
        eyebrow="Services"
        title={
          <>
            Everything you need to <span className="text-gradient">ship, scale and grow.</span>
          </>
        }
        subtitle="Pick one, pick a few, or run your whole product engineering with us."
      >
        <div className="space-y-6">
          {services.map((s, i) => {
            const Icon =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                s.icon
              ] ?? Icons.Sparkles;
            return (
              <motion.article
                id={s.slug}
                key={s.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-10 scroll-mt-28"
              >
                <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      <span className="h-1 w-8 bg-gradient-brand rounded-full" /> {s.category}
                    </div>
                    <div className="mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                      <Icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h2 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight">
                      {s.title}
                    </h2>
                    <p className="mt-3 text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 content-start">
                    {s.items.map((it: any) => (
                      <div
                        key={it}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {i === 0 && (
                  <div
                    aria-hidden
                    className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-brand opacity-10 blur-3xl"
                  />
                )}
              </motion.article>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow="Tech stack"
        title={
          <>
            Modern tools, <span className="text-gradient">production-grade.</span>
          </>
        }
      >
        <Tabs value={stackTab} onValueChange={setStackTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1">
            {Object.keys(TECH_STACKS).map((k) => (
              <TabsTrigger key={k} value={k} className="rounded-lg">
                {k}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(TECH_STACKS).map(([k, items]) => (
            <TabsContent key={k} value={k} className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {items.map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-center hover:border-primary hover:shadow-glow transition-all"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      <Section
        eyebrow="Comparison"
        title={
          <>
            Why teams pick <span className="text-gradient">Netweavesolutions.</span>
          </>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="inline-block rounded-md bg-gradient-brand px-2 py-0.5 text-primary-foreground text-xs">
                    Netweavesolutions
                  </span>
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Freelancers</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">In-House Team</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.feature} className={cn(i % 2 && "bg-muted/20")}>
                  <td className="px-4 py-3 font-medium">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    {row.codenest ? (
                      <Check className="mx-auto h-5 w-5 text-primary" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.freelancer ? (
                      <Check className="mx-auto h-5 w-5 text-primary" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.inhouse ? (
                      <Check className="mx-auto h-5 w-5 text-primary" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-muted-foreground" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <ContactCta />
    </>
  );
}

