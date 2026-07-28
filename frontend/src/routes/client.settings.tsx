import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, KeyRound, Shield } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalPanel } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useClientAuth } from "@/hooks/use-client-auth";

export const Route = createFileRoute("/client/settings")({
  head: () => ({
    meta: [{ title: "Settings — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { changePassword } = useClientAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [meetingAlerts, setMeetingAlerts] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password updated");
      setCurrent("");
      setNext("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientPortalShell title="Settings">
      <div className="grid gap-6 xl:grid-cols-2">
        <PortalPanel icon={KeyRound} title="Password Change">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cp">Current password</Label>
              <Input id="cp" type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="np">New password</Label>
              <Input id="np" type="password" required minLength={8} value={newPassword} onChange={(e) => setNext(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Update password"}</Button>
          </form>
        </PortalPanel>

        <PortalPanel icon={Bell} title="Notification Settings">
          <div className="space-y-4">
            {[
              ["Email alerts", emailAlerts, setEmailAlerts],
              ["Message alerts", messageAlerts, setMessageAlerts],
              ["Billing alerts", billingAlerts, setBillingAlerts],
              ["Meeting reminders", meetingAlerts, setMeetingAlerts],
            ].map(([label, value, setter]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3 rounded-lg bg-background/45 p-3">
                <Label>{String(label)}</Label>
                <Switch checked={Boolean(value)} onCheckedChange={setter as (checked: boolean) => void} />
              </div>
            ))}
          </div>
        </PortalPanel>

        <PortalPanel icon={Shield} title="Security Settings" className="xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-background/45 p-4">
              <p className="text-sm font-medium">Session protection</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">JWT access tokens and httpOnly refresh cookies are used by the existing API session.</p>
            </div>
            <div className="rounded-lg bg-background/45 p-4">
              <p className="text-sm font-medium">Server validation</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Portal requests are validated server-side before Supabase writes occur.</p>
            </div>
            <div className="rounded-lg bg-background/45 p-4">
              <p className="text-sm font-medium">Private files</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Client file downloads use short-lived signed storage URLs.</p>
            </div>
          </div>
        </PortalPanel>
      </div>
    </ClientPortalShell>
  );
}
