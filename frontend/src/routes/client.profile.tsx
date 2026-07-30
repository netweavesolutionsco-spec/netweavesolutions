import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientUser } from "@/lib/client-api";
import { useClientAuth } from "@/hooks/use-client-auth";

export const Route = createFileRoute("/client/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Netweavesolutions Client Portal" },
      {
        name: "description",
        content: "Manage your Netweavesolutions client profile, company details and preferences.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const FIELDS: Array<{ key: keyof ClientUser; label: string; type?: string }> = [
  { key: "fullName", label: "Full name" },
  { key: "phone", label: "Phone" },
  { key: "companyName", label: "Company name" },
  { key: "industry", label: "Industry" },
  { key: "gstNumber", label: "GST number" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "pincode", label: "Pincode" },
  { key: "website", label: "Website", type: "url" },
  { key: "linkedin", label: "LinkedIn", type: "url" },
  { key: "timezone", label: "Timezone" },
  { key: "profilePhotoUrl", label: "Profile photo URL", type: "url" },
  { key: "companyLogoUrl", label: "Company logo URL", type: "url" },
];

function ProfilePage() {
  const { user, refreshUser, updateProfile } = useClientAuth();
  const [form, setForm] = useState<Partial<ClientUser>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientPortalShell title="My Profile">
      <form onSubmit={onSubmit} className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="mb-6">
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="mt-1 font-medium">{user?.email}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELDS.map(({ key, label, type }) => (
            <div key={String(key)}>
              <Label htmlFor={String(key)}>{label}</Label>
              <Input
                id={String(key)}
                type={type || "text"}
                value={(form[key] as string | undefined) ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </ClientPortalShell>
  );
}

