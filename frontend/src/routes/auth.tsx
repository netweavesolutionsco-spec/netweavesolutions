import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Netweavesolutions Admin" },
      { name: "description", content: "Admin sign in for Netweavesolutions." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin/cms", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/admin/cms", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Signed in");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { 
          display_name: displayName,
          is_admin: true,
        },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — check your email if confirmation is required.");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/70 p-8 shadow-2xl backdrop-blur">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Admin Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your website content.
        </p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={onSignIn} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="si-email">Email</Label>
                <Input
                  id="si-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="si-pass">Password</Label>
                <Input
                  id="si-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={onSignUp} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="su-name">Display name</Label>
                <Input
                  id="su-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="su-pass">Password</Label>
                <Input
                  id="su-pass"
                  type="password"
                  required
                  minLength={1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <p className="text-xs text-muted-foreground">
                The first account created automatically becomes the admin.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

