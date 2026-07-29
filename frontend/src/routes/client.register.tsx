import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/client/google-auth-button";
import { Logo } from "@/components/logo";
import { useClientAuth } from "@/hooks/use-client-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/register")({
  head: () => ({
    meta: [
      { title: "Create your Client Account — Netweavesolutions" },
      {
        name: "description",
        content:
          "Register a Netweavesolutions client account to request quotes, start projects, and track delivery.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

// Mirrors the backend's strongPassword rule so the UI can guide the user
// before they submit (the server still enforces it authoritatively).
const passwordChecks = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-emerald-500",
];

function RegisterPage() {
  const { register: registerFn, configured } = useClientAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    countryCode: "",
    whatsapp: "",
    companyName: "",
    website: "",
    industry: "",
    country: "",
    state: "",
    city: "",
    address: "",
    gstNumber: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    acceptTerms: false,
    newsletter: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const passed = useMemo(
    () => passwordChecks.filter((c) => c.test(form.password)).length,
    [form.password],
  );
  const passwordOk = passed === passwordChecks.length;
  const confirmMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acceptTerms) return toast.error("Please accept the terms");
    if (!passwordOk) return toast.error("Please choose a stronger password");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    setSubmitting(true);
    try {
      const res = await registerFn({ ...form, acceptTerms: true });
      toast.success(res.message || "Account created successfully. You can sign in now.");
      navigate({ to: "/client/login", search: { email: form.email } as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/" aria-label="NetweaveSolutions" className="mb-6 flex justify-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">Create your client account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Then you can request quotes, start projects and track delivery.
        </p>
        {!configured && (
          <p className="mt-3 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            Client API not configured. Set VITE_CLIENT_API_URL to your deployed API.
          </p>
        )}

        <div className="mt-6">
          <GoogleAuthButton label="Sign up with Google" />
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or register with email
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>

        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <div>
              <Label htmlFor="countryCode">Code</Label>
              <Input
                id="countryCode"
                placeholder="+91"
                value={form.countryCode}
                onChange={(e) => set("countryCode", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp number</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gstNumber">GST number</Label>
            <Input
              id="gstNumber"
              value={form.gstNumber}
              onChange={(e) => set("gstNumber", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="referralCode">Referral code</Label>
            <Input
              id="referralCode"
              value={form.referralCode}
              onChange={(e) => set("referralCode", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            {form.password.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {Array.from({ length: passwordChecks.length }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        i < passed ? STRENGTH_COLORS[Math.max(0, passed - 1)] : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: {STRENGTH_LABELS[Math.max(0, passed - 1)] ?? "Very weak"}
                </p>
                <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                  {passwordChecks.map((c) => {
                    const ok = c.test(form.password);
                    return (
                      <li
                        key={c.label}
                        className={cn(ok ? "text-emerald-600" : "text-muted-foreground")}
                      >
                        {ok ? "✓" : "○"} {c.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="confirmPassword">Confirm password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
            {confirmMismatch && (
              <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <label className="sm:col-span-2 flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) => set("acceptTerms", e.target.checked)}
            />
            <span>I accept the Terms of Service and Privacy Policy. *</span>
          </label>
          <label className="sm:col-span-2 flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.newsletter}
              onChange={(e) => set("newsletter", e.target.checked)}
            />
            <span>Send me occasional product updates and offers.</span>
          </label>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !configured || !passwordOk || !form.acceptTerms}
            >
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/client/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
