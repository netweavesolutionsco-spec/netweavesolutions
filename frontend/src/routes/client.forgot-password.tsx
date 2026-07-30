import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/hooks/use-client-auth";

export const Route = createFileRoute("/client/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Netweavesolutions" },
      { name: "description", content: "Reset your Netweavesolutions client account password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const { forgotPassword } = useClientAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("If that email exists, a reset link was sent.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll email you a link to set a new one.
        </p>
        {sent ? (
          <p className="mt-6 rounded-md bg-primary/10 p-4 text-sm text-primary">
            Check your inbox for a password reset link.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/client/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

