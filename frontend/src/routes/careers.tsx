import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "motion/react";
import { MapPin, Clock, ArrowUpRight, Briefcase, Check } from "lucide-react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/hooks/useCollection";
import { brand } from "@/data/brand";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  role: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: `Careers — ${brand.name}` },
      { name: "description", content: "Join a small, senior team building software that matters." },
      { property: "og:title", content: `Careers — ${brand.name}` },
      { property: "og:description", content: "Open roles at Netweavesolutions." },
      { property: "og:url", content: "/careers" },
    ],
    links: [{ rel: "canonical", href: "/careers" }],
  }),
  component: Careers,
});

type Job = {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  description?: string;
};

function Careers() {
  const jobs = useCollection<Job>("jobs");
  const benefits = useCollection<any>("benefits");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<Job | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const es: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (es[i.path[0] as string] = i.message));
      setErrors(es);
      return;
    }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    toast.success("Application received — we'll be in touch soon.");
    (e.target as HTMLFormElement).reset();
    setActive(null);
  };

  return (
    <>
      <Section
        eyebrow="Careers"
        title={
          <>
            Do the best work of <span className="text-gradient">your career.</span>
          </>
        }
        subtitle="Small team, real ownership, work you'd be proud to show your mum."
      >
        <div className="grid gap-3">
          {jobs.map((j, i) => (
            <motion.button
              key={j.slug}
              onClick={() => setActive(j)}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-left hover:shadow-glow hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="text-xs text-muted-foreground">{j.team}</div>
                <div className="mt-1 font-semibold text-lg">{j.title}</div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {j.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {j.type}
                  </span>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </motion.button>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Benefits"
        title={
          <>
            Perks that <span className="text-gradient">actually matter.</span>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <Briefcase className="h-4 w-4" /> {active.team}
                </div>
                <DialogTitle className="text-2xl">{active.title}</DialogTitle>
                <DialogDescription>
                  <span className="inline-flex items-center gap-3 mt-1">
                    <Badge variant="secondary">
                      <MapPin className="mr-1 h-3 w-3" />
                      {active.location}
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      {active.type}
                    </Badge>
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {active.description ||
                    `Join our team as a ${active.title}. Work on ambitious products with senior engineers, ship real value, and grow fast.`}
                </p>
                <div>
                  <div className="font-semibold mb-2">What you'll do</div>
                  <ul className="space-y-1.5">
                    {[
                      "Own features end-to-end",
                      "Collaborate with designers & PMs",
                      "Ship weekly to real users",
                      "Mentor and be mentored",
                    ].map((x) => (
                      <li key={x} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="font-semibold mb-3">Apply now</div>
                <form onSubmit={onSubmit} className="space-y-3" noValidate>
                  <input type="hidden" name="role" value={active.title} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" className="mt-1" />
                      {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" className="mt-1" />
                      {errors.email && (
                        <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Why you? Portfolio / GitHub links welcome.</Label>
                    <Textarea id="message" name="message" rows={4} className="mt-1" />
                    {errors.message && (
                      <p className="mt-1 text-xs text-destructive">{errors.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Submit application"}
                  </Button>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

