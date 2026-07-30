import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calculator,
  Check,
  ArrowRight,
  User,
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const PROJECT_TYPES = [
  { id: "web", label: "Web Application", base: 15000 },
  { id: "mobile", label: "Mobile App", base: 35000 },
  { id: "erp", label: "School / Hospital ERP", base: 45000 },
  { id: "custom", label: "Custom Software", base: 60000 },
  { id: "uiux", label: "UI / UX Design", base: 12000 },
];

const SCOPES = [
  { id: "mvp", label: "MVP / Basic", desc: "Essential core features", mult: 1.0 },
  { id: "pro", label: "Standard Pro", desc: "Recommended business scale", mult: 1.35 },
  { id: "enterprise", label: "Enterprise", desc: "Full custom & high SLA", mult: 2.0 },
];

const FEATURES = [
  { id: "responsive", label: "Responsive Mobile & Tablet Layout", cost: 0 },
  { id: "cms", label: "Admin CMS & Content Management", cost: 5000 },
  { id: "auth", label: "User Authentication & OAuth SSO", cost: 6000 },
  { id: "erpMod", label: "School / Hospital ERP Module", cost: 20000 },
  { id: "realtime", label: "Real-time Push Notifications & WebSockets", cost: 7000 },
  { id: "i18n", label: "Multi-Language Localization", cost: 5000 },
  { id: "mobileSync", label: "iOS & Android Mobile App Sync", cost: 25000 },
];

const EVENT = "codenest:open-estimator";
export function openEstimator() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function CostEstimatorModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("web");
  const [scope, setScope] = useState("pro");
  const [features, setFeatures] = useState<string[]>(["responsive", "auth"]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const h = () => {
      setOpen(true);
      setDone(false);
    };
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const total = useMemo(() => {
    const base = PROJECT_TYPES.find((p) => p.id === type)?.base ?? 0;
    const add = features.reduce((n, id) => n + (FEATURES.find((f) => f.id === id)?.cost ?? 0), 0);
    const mult = SCOPES.find((s) => s.id === scope)?.mult ?? 1;
    return Math.round((base + add) * mult);
  }, [type, scope, features]);

  const toggleFeature = (id: string) =>
    setFeatures((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const fireConfetti = () => {
    const end = Date.now() + 800;
    const colors = ["#4F46E5", "#06B6D4", "#10B981", "#ffffff"];
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1100));
    setSubmitting(false);
    setDone(true);
    fireConfetti();
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      setForm({ name: "", email: "", phone: "", notes: "" });
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden rounded-3xl border border-primary/30 bg-slate-950 text-slate-100 shadow-[0_0_80px_-10px_rgba(79,70,229,0.5)]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 400px at 10% -10%, rgba(79,70,229,0.25), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(6,182,212,0.18), transparent 60%)",
        }}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                Interactive Cost Estimator
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                Get an instant project estimate and custom proposal
              </DialogDescription>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid lg:grid-cols-5 gap-0 max-h-[75vh] overflow-y-auto"
            >
              {/* LEFT */}
              <div className="lg:col-span-3 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10">
                {/* Step 1 */}
                <div>
                  <StepLabel n={1} title="Project Type" />
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROJECT_TYPES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setType(p.id)}
                        className={cn(
                          "rounded-xl border px-3 py-3 text-left transition-all",
                          type === p.id
                            ? "border-primary bg-primary/15 shadow-[0_0_20px_-5px_rgba(79,70,229,0.6)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                        )}
                      >
                        <div className="text-sm font-medium text-white">{p.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Base {inr(p.base)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <StepLabel n={2} title="Scope Level" />
                  <div className="mt-3 grid sm:grid-cols-3 gap-2">
                    {SCOPES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setScope(s.id)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          scope === s.id
                            ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_-5px_rgba(6,182,212,0.55)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white">{s.label}</div>
                          <span className="text-[11px] font-mono text-cyan-300">×{s.mult}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3 */}
                <div>
                  <StepLabel n={3} title="Key Modules & Features" />
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {FEATURES.map((f) => {
                      const active = features.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleFeature(f.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                            active
                              ? "border-emerald-400/60 bg-emerald-400/10"
                              : "border-white/10 bg-white/5 hover:border-white/20",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-4 w-4 shrink-0 place-items-center rounded border",
                              active ? "bg-emerald-400 border-emerald-400" : "border-white/30",
                            )}
                          >
                            {active && <Check className="h-3 w-3 text-slate-950" />}
                          </span>
                          <span className="flex-1 text-slate-100">{f.label}</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {f.cost === 0 ? "Free" : `+${inr(f.cost)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-2 p-6 space-y-5 bg-slate-950/40">
                <motion.div
                  key={total}
                  initial={{ scale: 0.98, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-primary/40 bg-linear-to-br from-primary/20 via-slate-900 to-cyan-500/10 p-5"
                >
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" /> Live Estimate
                  </div>
                  <div className="mt-2 text-4xl font-bold tracking-tight text-white">
                    {inr(total)}{" "}
                    <span className="text-base font-normal text-slate-400">INR approx.</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    Includes 100% source code ownership, testing, and launch setup.
                  </p>
                </motion.div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-xs">Full Name *</Label>
                    <div className="relative mt-1">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Business Email *</Label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@company.com"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Phone / WhatsApp</Label>
                    <div className="relative mt-1">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Project Goals / Notes</Label>
                    <Textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Tell us about your goals…"
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-linear-to-r from-indigo-600 via-primary to-cyan-500 hover:opacity-95 text-white border-0 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.7)]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing Estimate...
                    </>
                  ) : (
                    <>
                      Get Final Official Proposal <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8 text-center"
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-white">Estimate Submitted!</h3>
              <p className="mt-2 text-slate-300 max-w-md mx-auto">
                Thanks {form.name.split(" ")[0]}! Your estimated project cost is approximately{" "}
                <span className="font-semibold text-cyan-300">{inr(total)} INR</span>. Our team will
                reach out within 24 hours with a detailed proposal.
              </p>

              <div className="mt-6 mx-auto max-w-md grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <SummaryCell
                  label="Project"
                  value={PROJECT_TYPES.find((p) => p.id === type)!.label}
                />
                <SummaryCell label="Scope" value={SCOPES.find((s) => s.id === scope)!.label} />
                <SummaryCell label="Features" value={`${features.length} selected`} />
              </div>

              <Button
                onClick={close}
                className="mt-6 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-500 text-white border-0"
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 border border-primary/40 text-[11px] font-semibold text-primary">
        {n}
      </span>
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-white leading-tight">{value}</div>
    </div>
  );
}
