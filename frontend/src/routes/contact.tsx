import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { brand } from "@/data/brand";
import { useClientAuth } from "@/hooks/use-client-auth";
import { useCreateRequirement } from "@/lib/portal-api";

const services = [
  "Website Development",
  "School/Hospital ERP",
  "Mobile App",
  "Custom Software",
  "UI/UX Design",
];
const budgets = ["₹15,000 - ₹35,000", "₹35,000 - ₹75,000", "₹75,000 - ₹1,50,000", "₹1,50,000+"];
const timelines = [
  "ASAP (within 2 weeks)",
  "2 - 4 weeks",
  "1 - 2 months",
  "3 - 6 months",
  "Flexible",
];

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  service: z.string().trim().min(1, "Choose a service"),
  budget: z.string().trim().min(1, "Choose a budget"),
  timeline: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a bit more").max(2000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${brand.name}` },
      {
        name: "description",
        content:
          "Schedule a technical discovery call or send a direct project brief to Netweavesolutions.",
      },
      { property: "og:title", content: `Contact — ${brand.name}` },
      { property: "og:description", content: "Let's discuss your project." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<{ name: string; email: string } | null>(null);
  // The brief is a client-portal submission, so it reuses the existing client
  // session rather than the anonymous /leads endpoint.
  const { user, loading: authLoading } = useClientAuth();
  const navigate = useNavigate();
  const createRequirement = useCreateRequirement();
  const loading = createRequirement.isPending;

  // Sending the current path as `redirect` is what brings the client back to
  // this page (and this form) once they finish logging in or registering.
  const authRedirect = { redirect: "/contact" } as never;

  const fireConfetti = () => {
    const end = Date.now() + 800;
    const colors = ["#6366f1", "#22d3ee", "#a855f7", "#10b981"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Defence in depth: the form is only rendered for signed-in clients, but a
    // session can expire while the page is open.
    if (!user) {
      toast.info("Please login or create an account to send your brief.");
      navigate({ to: "/client/login", search: authRedirect });
      return;
    }
    if (loading) return;

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const data = Object.fromEntries(form) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const es: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (es[i.path[0] as string] = i.message));
      setErrors(es);
      return;
    }
    setErrors({});
    try {
      await createRequirement.mutateAsync({
        name: parsed.data.name,
        phone: parsed.data.phone || undefined,
        company: user.companyName || undefined,
        service: parsed.data.service,
        budget: parsed.data.budget,
        timeline: parsed.data.timeline || undefined,
        requirement: parsed.data.message,
        source: "contact-page",
      });
      setSuccess({ name: parsed.data.name, email: parsed.data.email });
      fireConfetti();
      formEl.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your brief.");
    }
  };

  const waLink = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("Hi Netweavesolutions, I'd like to discuss a project.")}`;

  return (
    <Section className="pt-20 md:pt-28">
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
          Get In Touch
        </span>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-[-0.03em] text-foreground">
          Let's Discuss{" "}
          <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Your Project
          </span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Schedule a technical discovery call, inquire about custom ERP/Mobile solutions, or request
          a detailed proposal.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: contact info */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-700 via-indigo-900 to-slate-950 p-8">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 20%, rgba(6,182,212,0.4), transparent 55%)",
              }}
            />
            <div className="relative">
              <h3 className="text-xl font-semibold text-white">Engineering HQ</h3>
              <p className="mt-1 text-sm text-white/60">Reach us on your preferred channel.</p>

              <div className="mt-6 space-y-4">
                <a
                  href={`mailto:netweavesolutions.co@gmail.com`}
                  className="flex items-start gap-3 group"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 border border-white/15">
                    <Mail className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white/60 text-xs">Direct Email</div>
                    <div className="text-white group-hover:text-cyan-200 transition-colors">
                      netweavesolutions.co@gmail.com
                    </div>
                  </div>
                </a>
                <a href={`tel:+918434554873`} className="flex items-start gap-3 group">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 border border-white/15">
                    <Phone className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white/60 text-xs">Phone / WhatsApp</div>
                    <div className="text-white group-hover:text-cyan-200 transition-colors">
                      +91 84345 54873
                    </div>
                  </div>
                </a>
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 border border-white/15">
                    <MapPin className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white/60 text-xs">Location HQ</div>
                    <div className="text-white">Bangalore & Delhi NCR, India</div>
                  </div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="mt-6 w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
              >
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Instant Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]/60 backdrop-blur p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Currently
                Open
              </span>
              <span className="text-xs text-white/50">Mon–Sat · 10am–8pm IST</span>
            </div>

            <div className="relative mt-5 h-56 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-6, 4, -6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative">
                  <div className="absolute inset-0 -m-4 rounded-full bg-cyan-500/30 blur-xl animate-pulse" />
                  <div className="relative grid h-12 w-12 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 shadow-[0_10px_30px_-5px_rgba(6,182,212,0.6)]">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-4">
              <div className="font-semibold text-white">Netweavesolutions Tech Park</div>
              <div className="text-sm text-white/60">Bangalore & Delhi NCR, India</div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="rounded-3xl border border-white/10 bg-[#0b1220]/70 backdrop-blur p-6 md:p-8">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center"
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-white">Thanks, {success.name}! 🎉</h3>
              <p className="mt-3 text-white/70 max-w-md mx-auto">
                Your project brief has landed in our inbox. Our engineering lead will reply to{" "}
                <span className="text-cyan-300 font-medium">{success.email}</span> within one
                working day.
              </p>
              <Button
                onClick={() => setSuccess(null)}
                variant="outline"
                className="mt-8 rounded-full"
              >
                Send Another Inquiry
              </Button>
            </motion.div>
          ) : authLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : !user ? (
            <div className="py-10 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-indigo-500/40 bg-indigo-500/20">
                <Lock className="h-7 w-7 text-indigo-300" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-white">Sign in to send your brief</h3>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                Project briefs are tied to your client account so you can track our reply, share
                files and receive quotations in your portal. It only takes a minute — we'll bring
                you straight back here.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-linear-to-r from-indigo-500 to-cyan-500 font-semibold text-white hover:from-indigo-400 hover:to-cyan-400 sm:w-auto"
                >
                  <Link to="/client/login" search={authRedirect}>
                    Login to Continue
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full sm:w-auto"
                >
                  <Link to="/client/register" search={authRedirect}>
                    Create an Account
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-white/50">
                Prefer not to sign in? Email us at{" "}
                <a
                  className="text-cyan-300 hover:underline"
                  href="mailto:netweavesolutions.co@gmail.com"
                >
                  netweavesolutions.co@gmail.com
                </a>{" "}
                or message us on WhatsApp.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-white">Send Us a Direct Brief</h3>
                <p className="text-sm text-white/60">
                  Signed in as <span className="font-medium text-cyan-300">{user.email}</span> · we
                  reply within one working day.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={user.fullName}
                    placeholder="Jane Doe"
                    className="mt-1.5 bg-white/5 border-white/10"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    readOnly
                    placeholder="jane@company.com"
                    className="mt-1.5 bg-white/5 border-white/10 text-white/70"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={user.phone}
                    placeholder="+91 98765 43210"
                    className="mt-1.5 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="service">Service Required *</Label>
                  <select
                    id="service"
                    name="service"
                    defaultValue=""
                    className="mt-1.5 w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white"
                  >
                    <option value="" disabled className="bg-slate-900">
                      Choose a service…
                    </option>
                    {services.map((s) => (
                      <option key={s} value={s} className="bg-slate-900">
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.service && <p className="mt-1 text-xs text-red-400">{errors.service}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="budget">Estimated Budget *</Label>
                  <select
                    id="budget"
                    name="budget"
                    defaultValue=""
                    className="mt-1.5 w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white"
                  >
                    <option value="" disabled className="bg-slate-900">
                      Select a budget range…
                    </option>
                    {budgets.map((b) => (
                      <option key={b} value={b} className="bg-slate-900">
                        {b}
                      </option>
                    ))}
                  </select>
                  {errors.budget && <p className="mt-1 text-xs text-red-400">{errors.budget}</p>}
                </div>
                <div>
                  <Label htmlFor="timeline">Expected Timeline</Label>
                  <select
                    id="timeline"
                    name="timeline"
                    defaultValue=""
                    className="mt-1.5 w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white"
                  >
                    <option value="" className="bg-slate-900">
                      Not sure yet
                    </option>
                    {timelines.map((t) => (
                      <option key={t} value={t} className="bg-slate-900">
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.timeline && (
                    <p className="mt-1 text-xs text-red-400">{errors.timeline}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="message">Project Details *</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us about goals, timelines, and required features…"
                  className="mt-1.5 bg-white/5 border-white/10"
                />
                {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full rounded-full bg-linear-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Project Brief
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
