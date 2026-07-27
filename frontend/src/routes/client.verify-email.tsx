import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/client/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify Email — Netweavesolutions" },
      { name: "description", content: "Your Netweavesolutions client account is ready to use." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Preparing your account…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setState("error");
      setMessage("The approval link is missing a valid token.");
      return;
    }

    const apiUrl = import.meta.env.VITE_CLIENT_API_URL as string | undefined;
    if (!apiUrl) {
      setState("error");
      setMessage("Client API is not configured.");
      return;
    }

    fetch(`${apiUrl}/auth/verify-email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error((data as { error?: string })?.error || "Verification failed");
        }
        setState("ok");
        setMessage("Your account has been approved. You can sign in now.");
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Verification failed");
      });
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      {state === "loading" ? (
        <p className="text-sm text-muted-foreground">Preparing your account…</p>
      ) : state === "ok" ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Account approved</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link to="/client/login" className="mt-6 text-primary hover:underline">
            Continue to sign in
          </Link>
        </>
      ) : (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Approval failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link to="/client/login" className="mt-6 text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

