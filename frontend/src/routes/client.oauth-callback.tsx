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
  const { completeOAuth, user, loading } = useClientAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "syncing" | "error">("loading");
  const [message, setMessage] = useState("Completing your Google sign-in…");
  const ran = useRef(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    console.log("[OAuth] Callback page mounted");

    // Supabase needs a beat to persist the session from the redirect hash.
    const timer = setTimeout(() => {
      console.log("[OAuth] Starting completeOAuth");
      completeOAuth()
        .then(() => {
          console.log("[OAuth] completeOAuth succeeded, waiting for user state");
          setState("syncing");
          setMessage("Loading your profile…");
        })
        .catch((error) => {
          console.error("[OAuth] completeOAuth failed:", error);
          setState("error");
          setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [completeOAuth]);

  // Wait for the user to be set in context, then redirect. Guarded so a
  // re-render can't fire the toast/navigate twice.
  useEffect(() => {
    if (state === "syncing" && !loading && user && !redirected.current) {
      redirected.current = true;
      console.log("[OAuth] User loaded in context, redirecting to dashboard");
      toast.success("Signed in with Google.");
      navigate({ to: "/client", replace: true });
    }
  }, [state, loading, user, navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      {state === "error" ? (
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
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Almost there</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </>
      )}
    </div>
  );
}
