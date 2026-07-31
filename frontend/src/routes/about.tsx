import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Target,
  Eye,
  Zap,
  ShieldCheck,
  Lock,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { team as fallbackTeam } from "@/data/team";
import { brand } from "@/data/brand";
import { openEstimator } from "@/components/cost-estimator-modal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${brand.name}` },
      {
        name: "description",
        content:
          "Engineers building the future of software. Meet the Netweavesolutions team, mission, values and 6-step delivery process.",
      },
      { property: "og:title", content: `About — ${brand.name}` },
      { property: "og:description", content: "Engineers building the future of software." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const values = [
  {
    icon: Zap,
    title: "Speed & Optimization",
    body: "Sub-second page loads, zero cold starts, edge-first delivery on every build.",
  },
  {
    icon: Lock,
    title: "Full IP Transparency",
    body: "100% repository, asset and infrastructure ownership handed over on day one.",
  },
  {
    icon: ShieldCheck,
    title: "Security First",
    body: "Server-side API keys, CORS protection, encryption at rest and in transit.",
  },
  {
    icon: Users,
    title: "Agile Collaboration",
    body: "Bi-weekly demo builds with direct access to the engineering lead — no proxies.",
  },
  {
    icon: Sparkles,
    title: "Product-Led Delivery",
    body: "Clear product decisions, focused scope and maintainable systems from the first sprint.",
  },
  {
    icon: Clock,
    title: "24/7 SLA Reliability",
    body: "99.9% uptime guarantee with proactive monitoring and on-call rotation.",
  },
];

const steps = [
  {
    title: "Technical Discovery",
    body: "Deep audit of goals, constraints, workflows and compliance requirements.",
  },
  {
    title: "UI/UX & Prototyping",
    body: "High-fidelity Figma prototypes, tokens and a systemised visual language.",
  },
  {
    title: "System Architecture",
    body: "Data model, service boundaries, infra topology and observability strategy.",
  },
  {
    title: "Agile Development",
    body: "Small, testable increments on staging with bi-weekly demos and code walkthroughs.",
  },
  {
    title: "Quality & Speed Audit",
    body: "Lighthouse, security scan, load tests and accessibility review before launch.",
  },
  {
    title: "Launch & Handoff",
    body: "Production-ready release, documentation and ownership handoff for your team.",
  },
];

export default undefined;

function About() {
  type TeamMember = (typeof fallbackTeam)[number];
  const teamData = useCollection<TeamMember>("team");
  const displayTeam = (
    teamData && teamData.length > 0 ? teamData : fallbackTeam
  ) as typeof fallbackTeam;

  return (
    <>
      {/* Hero */}
      <Section className="pt-20 md:pt-28">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            About Netweavesolutions
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-[-0.03em] text-foreground">
            We Are Engineers Building the{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Future of Software
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Netweavesolutions exists to build world-class digital products for startups,
            enterprises, schools and hospitals — combining modern server-side rendering,
            maintainable engineering and full source code transparency.
          </p>
        </div>

        {/* Story + Mission/Vision split */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-3xl p-8 border border-white/10 bg-white/[0.03] backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Our Story
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Founded to eliminate agency code bloat.
            </h3>
            <div className="mt-4 space-y-4 text-white/70 leading-relaxed">
              <p>
                Netweavesolutions was started by a group of cloud architects and senior developers
                who were done watching great product ideas die in slow, opaque agency delivery
                cycles.
              </p>
              <p>
                We built the studio we always wished existed — modern server-side rendering by
                default, clean architecture, sub-second page loads, and 100% source code
                transparency on every project.
              </p>
              <p>
                Every public number on this site now comes from live CMS data, not inflated agency
                counters. The team is still small on purpose.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-8">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 80% 20%, rgba(99,102,241,0.5), transparent 55%)",
                }}
              />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 border border-white/20">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">Our Mission</h3>
                <p className="mt-2 text-white/75 leading-relaxed">
                  Build high-performance, secure digital applications that measurably drive revenue
                  and operational efficiency for the businesses we partner with.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-700 via-slate-900 to-slate-950 p-8">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(6,182,212,0.5), transparent 55%)",
                }}
              />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 border border-white/20">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">Our Vision</h3>
                <p className="mt-2 text-white/75 leading-relaxed">
                  To become the most trusted global engineering partner for AI-native software — the
                  studio product teams call when the outcome actually matters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Core values */}
      <Section
        eyebrow="What we stand for"
        title={<>Our Core Values</>}
        subtitle="Six principles we hold ourselves to on every project — visible in code reviews, standups and shipping decisions."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-white/10 bg-[#0b1220]/60 backdrop-blur p-6 hover:border-cyan-500/40 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30">
                  <v.icon className="h-5 w-5 text-cyan-300" />
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{v.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 6-step process */}
      <Section
        eyebrow="How We Work"
        title={<>Our 6-Step Development Process</>}
        subtitle="A predictable engagement model from first workshop to production SLA."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/60 backdrop-blur p-6"
            >
              <div className="absolute -top-4 -right-2 text-[110px] leading-none font-extrabold text-white/[0.04] select-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="relative">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Leadership */}
      <Section eyebrow="Leadership" title={<>Meet Our Core Team</>}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayTeam.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/10 bg-[#0b1220]/60 backdrop-blur p-6 text-center"
            >
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-xl font-bold">
                {m.initials ??
                  m.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{m.name}</h3>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-8 md:p-14 text-center">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(6,182,212,0.4), transparent 50%), radial-gradient(circle at 80% 60%, rgba(139,92,246,0.4), transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-[-0.02em]">
              Ready to build something together?
            </h2>
            <p className="mt-3 text-white/80 max-w-2xl mx-auto">
              Get a free scoped quote or explore open engineering roles.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={openEstimator}
                size="lg"
                className="rounded-full bg-white text-slate-900 hover:bg-white/90"
              >
                <Sparkles className="h-4 w-4" /> Get Free Quote
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 text-white hover:bg-white/10"
              >
                <Link to="/careers">View Open Careers</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
