import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/hooks/use-client-auth";

const search = z.object({ token: z.string().optional() }).catch({});

export const Route = createFileRoute("/client/reset-password")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Reset Password — Netweavesolutions" },
      { name: "description", content: "Set a new password for your Netweavesolutions client account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { updatePassword } = useClientAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/client/reset-password" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    setSubmitting(true);
    try {
      await updatePassword(password, search.token);
      toast.success("Password reset successfully. Please sign in.");
      navigate({ to: "/client/login" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Reset password"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/client/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

