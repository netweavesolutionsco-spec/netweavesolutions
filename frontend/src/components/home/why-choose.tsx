import { motion } from "motion/react";
import { Shield, Zap, Users, Award } from "lucide-react";
import { Section } from "@/components/section";
import { Counter } from "@/components/counter";
import { useLiveSiteStats } from "@/hooks/use-live-site-stats";

const reasons = [
  {
    icon: Shield,
    title: "Security first",
    body: "SOC2-aware practices, audited dependencies and secrets that never see the client.",
  },
  {
    icon: Zap,
    title: "Ship in weeks",
    body: "Small teams, tight loops, weekly demos on staging. Momentum by design.",
  },
  {
    icon: Users,
    title: "Senior only",
    body: "No hand-offs to juniors. The people you meet are the people who build.",
  },
  {
    icon: Award,
    title: "Own the outcome",
    body: "We measure success in metrics, not deliverables. Your goal becomes ours.",
  },
];

export function WhyChooseUs() {
  const { counts, loading } = useLiveSiteStats();
  const stats = [
    { value: counts.portfolio, label: "Published projects" },
    { value: counts.services, label: "Active services" },
    { value: counts.blog, label: "Published articles" },
    { value: counts.testimonials, label: "Client testimonials" },
  ];

  return (
    <Section
      eyebrow="Why teams pick us"
      title={
        <>
          Built to outlast the next <span className="text-gradient">framework of the week.</span>
        </>
      }
      subtitle="Fast where it matters, boring where it counts. A partner you can trust with the roadmap."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <r.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 rounded-3xl glass p-8 shadow-soft">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-4xl md:text-5xl font-display font-bold text-gradient">
              {loading ? "—" : <Counter to={s.value} />}
            </div>
            <div className="mt-2 text-xs md:text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
