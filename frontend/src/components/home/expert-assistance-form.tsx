import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send, Mail, Phone, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { brand } from "@/data/brand";
import { BUDGETS, SERVICES, leadSchema, submitLead } from "@/lib/leads";

const selectClass =
  "mt-1.5 w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";

const fieldClass = "mt-1.5 h-11 rounded-lg bg-background";

export function ExpertAssistanceForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ name: string; email: string } | null>(null);

  const fireConfetti = () => {
    const end = Date.now() + 700;
    const colors = ["#6366f1", "#22d3ee", "#a855f7", "#10b981"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const raw = Object.fromEntries(new FormData(formEl)) as Record<string, string>;

    const parsed = leadSchema.safeParse(raw);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const key = i.path[0] as string;
        if (!next[key]) next[key] = i.message;
      });
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await submitLead({
        ...parsed.data,
        source: "home-expert-form",
        botField: raw.botField ?? "",
      });
      setSuccess({ name: parsed.data.name, email: parsed.data.email });
      fireConfetti();
      formEl.reset();
      toast.success("Enquiry sent! We'll be in touch within 24 hours.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your enquiry.");
    } finally {
      setLoading(false);
    }
  };

  const waLink = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(
    "Hi Netweavesolutions, I'd like to discuss a project.",
  )}`;

  return (
    <section id="expert-assistance" className="border-t border-border bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* ---------------------------- Left: pitch ---------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              Free consultation
            </span>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-[-0.025em] text-foreground">
              Reach Out for{" "}
              <span className="bg-linear-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Expert Assistance
              </span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Tell us what you want to build. Our engineering lead reviews every enquiry personally
              and replies with a clear scope and a written quote — usually within 24 hours.
            </p>

            <ul className="mt-8 space-y-3.5 text-sm">
              {[
                "No obligation, no sales pressure",
                "Fixed-price written proposal in 48 hours",
                "Direct access to the senior team, not a call centre",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-2.5 border-t border-border pt-6 text-sm">
              <a
                href={`mailto:${brand.email}`}
                className="flex items-center gap-2.5 text-muted-foreground transition hover:text-foreground"
              >
                <Mail className="h-4 w-4 text-primary" /> {brand.email}
              </a>
              <a
                href={`tel:${brand.phone}`}
                className="flex items-center gap-2.5 text-muted-foreground transition hover:text-foreground"
              >
                <Phone className="h-4 w-4 text-primary" /> {brand.phone}
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-muted-foreground transition hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 text-emerald-500" /> Chat on WhatsApp
              </a>
            </div>
          </motion.div>

          {/* ---------------------------- Right: form ---------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="py-12 text-center"
                >
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-foreground">
                    Thanks, {success.name}! 🎉
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm text-muted-foreground leading-relaxed">
                    Your enquiry is with our team. We've sent a confirmation to{" "}
                    <span className="font-medium text-foreground">{success.email}</span> and will
                    reply within 24 hours.
                  </p>
                  <Button
                    onClick={() => setSuccess(null)}
                    variant="outline"
                    className="mt-8 rounded-full"
                  >
                    Send another enquiry
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={onSubmit}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Start your project</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fields marked * are required.
                    </p>
                  </div>

                  {/* Honeypot — hidden from humans, catches naive bots. */}
                  <div className="absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
                    <label htmlFor="botField">Do not fill this field</label>
                    <input id="botField" name="botField" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ea-name">Full name *</Label>
                      <Input
                        id="ea-name"
                        name="name"
                        placeholder="Jane Doe"
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        className={fieldClass}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="ea-email">Email *</Label>
                      <Input
                        id="ea-email"
                        name="email"
                        type="email"
                        placeholder="jane@company.com"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        className={fieldClass}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ea-phone">Phone / WhatsApp</Label>
                      <Input
                        id="ea-phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ea-company">Company</Label>
                      <Input
                        id="ea-company"
                        name="company"
                        placeholder="Acme Pvt Ltd"
                        autoComplete="organization"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ea-service">Service required *</Label>
                      <select
                        id="ea-service"
                        name="service"
                        defaultValue=""
                        aria-invalid={!!errors.service}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Choose a service…
                        </option>
                        {SERVICES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.service && (
                        <p className="mt-1 text-xs text-destructive">{errors.service}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="ea-budget">Estimated budget *</Label>
                      <select
                        id="ea-budget"
                        name="budget"
                        defaultValue=""
                        aria-invalid={!!errors.budget}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Select a range…
                        </option>
                        {BUDGETS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      {errors.budget && (
                        <p className="mt-1 text-xs text-destructive">{errors.budget}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ea-message">What's your project about? *</Label>
                    <Textarea
                      id="ea-message"
                      name="message"
                      rows={5}
                      placeholder="Describe your idea, the features you need, and any deadline you're working towards…"
                      aria-invalid={!!errors.message}
                      className="mt-1.5 resize-y rounded-lg bg-background"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-destructive">{errors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full rounded-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Submit enquiry <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Your details stay private. No spam, ever.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
