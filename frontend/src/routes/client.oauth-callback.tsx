import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useClientAuth } from "@/hooks/use-client-auth";
export const Route = createFileRoute("/client/oauth-callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — Netweavesolutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const { completeOAuth } = useClientAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Completing your Google sign-in…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Supabase needs a beat to persist the session from the redirect hash.
    const timer = setTimeout(() => {
      completeOAuth()
        .then(() => {
          toast.success("Signed in with Google.");
          navigate({ to: "/client", replace: true });
        })
        .catch((error) => {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [completeOAuth, navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      {state === "loading" ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Almost there</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </>
      ) : (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Sign-in failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <button
            type="button"
            className="mt-6 text-primary hover:underline"
            onClick={() => navigate({ to: "/client/login" })}
          >
            Back to sign in
          </button>
        </>
      )}
    </div>
  );
}
