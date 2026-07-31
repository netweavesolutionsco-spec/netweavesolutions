import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/client/google-auth-button";
import { Logo } from "@/components/logo";
import { ApiError } from "@/lib/client-api";
import { useClientAuth } from "@/hooks/use-client-auth";

const search = z.object({ redirect: z.string().optional(), email: z.string().optional() }).catch({});

export const Route = createFileRoute("/client/login")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Client Login — Netweavesolutions" },
      {
        name: "description",
        content: "Sign in to your Netweavesolutions client portal to manage projects, invoices and files.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login, configured, loading, resendVerification } = useClientAuth();
  const { redirect, email: emailParam } = useSearch({ from: "/client/login" });
  const navigate = useNavigate();
  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect || "/client", replace: true });
  }, [user, loading, navigate, redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate sign-in requests
    setSubmitting(true);
    setNeedsVerification(false);
    try {
      await login(email, password, remember);
      toast.success("Welcome back!");
      navigate({ to: redirect || "/client", replace: true });
    } catch (err) {
      // The backend returns 403 + requiresEmailVerification for a correct
      // password on an unverified account. Surface the resend prompt clearly
      // instead of a generic error.
      const requiresVerification =
        err instanceof ApiError &&
        err.status === 403 &&
        Boolean(
          err.data &&
            typeof err.data === "object" &&
            (err.data as { requiresEmailVerification?: boolean }).requiresEmailVerification,
        );
      if (requiresVerification) {
        setNeedsVerification(true);
        toast.error("Please verify your email before signing in. We can resend the link below.");
      } else {
        toast.error(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email) return toast.error("Enter your email first, then resend.");
    setResending(true);
    try {
      await resendVerification(email);
      toast.success("If that email needs verification, we've sent a new link.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resend right now.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <Link
        to="/"
        className="mb-4 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Website
      </Link>
      <Link to="/" aria-label="NetweaveSolutions" className="mb-6 inline-flex justify-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">Client Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your projects and invoices.</p>
        {!configured && (
          <p className="mt-3 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            Client API not configured. Set VITE_CLIENT_API_URL to your deployed API.
          </p>
        )}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/client/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !configured}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          {needsVerification && (
            <p className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
              Your email address isn&apos;t verified yet. Check your inbox for the verification link,
              or resend it below.
            </p>
          )}
          <div className="text-center text-xs text-muted-foreground">
            Didn&apos;t get the verification email?{" "}
            <button
              type="button"
              className="text-primary hover:underline disabled:opacity-60"
              onClick={onResend}
              disabled={resending || !configured}
            >
              {resending ? "Sending…" : "Resend it"}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or continue with
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleAuthButton />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New client?{" "}
          <Link
            to="/client/register"
            search={{ redirect } as never}
            className="text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

