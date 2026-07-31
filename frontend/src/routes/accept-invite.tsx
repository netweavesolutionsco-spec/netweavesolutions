import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const search = z.object({ token: z.string().optional() }).catch({});

export const Route = createFileRoute("/accept-invite")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Accept Invitation — Netweavesolutions" },
      {
        name: "description",
        content: "Accept your invitation and set up your Netweavesolutions team account.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcceptInvitePage,
});

interface InviteInfo {
  email: string;
  fullName: string;
  role: string;
  department: string | null;
  invitedByName: string | null;
  expiresAt: string;
}

type LookupState =
  | { status: "loading" }
  | { status: "valid"; invite: InviteInfo }
  | { status: "invalid"; reason: string };

const REASON_COPY: Record<string, string> = {
  not_found: "This invitation link is invalid. Please ask your admin to send a new one.",
  expired: "This invitation has expired. Please ask your admin to resend it.",
  cancelled: "This invitation was cancelled. Please contact your admin.",
  accepted: "This invitation has already been accepted. Try signing in instead.",
  missing: "This link is missing its invitation token.",
};

function AcceptInvitePage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [lookup, setLookup] = useState<LookupState>({ status: "loading" });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLookup({ status: "invalid", reason: "missing" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/team/invitations/lookup?token=${encodeURIComponent(token)}`,
        );
        const data = (await res.json().catch(() => null)) as
          | { valid?: boolean; reason?: string; invitation?: InviteInfo }
          | null;
        if (cancelled) return;
        if (!res.ok || !data) {
          setLookup({ status: "invalid", reason: "not_found" });
          return;
        }
        if (data.valid && data.invitation) {
          setLookup({ status: "valid", invite: data.invitation });
          setFullName(data.invitation.fullName || "");
        } else {
          setLookup({ status: "invalid", reason: data.reason || "not_found" });
        }
      } catch {
        if (!cancelled) setLookup({ status: "invalid", reason: "not_found" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    // Mirror backend strong-password rule for a clear message before submitting.
    const strong = /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    if (!strong) {
      toast.error("Password needs an uppercase, lowercase, number and special character.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/team/invitations/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, fullName: fullName.trim(), password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Could not accept the invitation.");
      }
      setDone(true);
      toast.success("Account created. You can sign in now.");
      setTimeout(() => navigate({ to: "/auth" }), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      {lookup.status === "loading" ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking your invitation…</p>
        </div>
      ) : lookup.status === "invalid" ? (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 text-center backdrop-blur">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {REASON_COPY[lookup.reason] ?? REASON_COPY.not_found}
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      ) : done ? (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 text-center backdrop-blur">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h1 className="mt-4 text-xl font-semibold">You're all set</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is ready. Redirecting you to sign in…
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--brand)]">
            <ShieldCheck className="h-4 w-4" /> Team invitation
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Set up your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lookup.invite.invitedByName
              ? `${lookup.invite.invitedByName} invited you`
              : "You've been invited"}{" "}
            to join Netweavesolutions as <strong>{lookup.invite.role}</strong>.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <Label htmlFor="acc-email">Email</Label>
              <Input id="acc-email" type="email" value={lookup.invite.email} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="acc-name">Full name</Label>
              <Input
                id="acc-name"
                className="mt-1.5"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="acc-password">Password</Label>
              <Input
                id="acc-password"
                type="password"
                className="mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                At least 8 characters with an uppercase, lowercase, number and special character.
              </p>
            </div>
            <div>
              <Label htmlFor="acc-confirm">Confirm password</Label>
              <Input
                id="acc-confirm"
                type="password"
                className="mt-1.5"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
