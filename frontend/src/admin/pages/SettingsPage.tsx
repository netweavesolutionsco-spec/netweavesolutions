import { useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Settings2,
  Palette,
  Shield,
  Bell,
  Mail,
  MessageCircle,
  Database,
  KeyRound,
  HardDrive,
  Save,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "database", label: "Database", icon: Database },
  { id: "api", label: "API", icon: KeyRound },
  { id: "storage", label: "Storage", icon: HardDrive },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SettingsPage() {
  const [tab, setTab] = useState<TabId>("general");

  return (
    <div>
      <PageHeader title="Settings" description="Configure your admin console and site." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-border/60 bg-card/70 p-2 shadow-sm backdrop-blur-xl">
          <nav className="space-y-0.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-linear-to-r from-[color-mix(in_oklab,var(--brand)_18%,transparent)] to-transparent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "text-(--brand)")} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
          {tab === "general" && <GeneralSettings />}
          {tab === "branding" && <BrandingSettings />}
          {tab === "appearance" && <AppearanceSettings />}
          {tab === "security" && <SecuritySettings />}
          {tab === "notifications" && <NotificationSettings />}
          {tab === "email" && <EmailSettings />}
          {tab === "whatsapp" && <WhatsAppSettings />}
          {tab === "database" && <DatabaseSettings />}
          {tab === "api" && <ApiSettings />}
          {tab === "storage" && <StorageSettings />}
          <div className="mt-6 flex justify-end">
            <Button className="bg-linear-to-r from-(--brand) to-(--brand-3) text-white">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Label>{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="sm:w-80">{children}</div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <Section title="General" description="Basic site information.">
      <Row label="Site Name">
        <Input defaultValue="Netweavesolutions" />
      </Row>
      <Row label="Tagline">
        <Input defaultValue="Transforming Ideas Into Powerful Digital Solutions" />
      </Row>
      <Row label="Contact Email">
        <Input defaultValue="netweavesolutions.co@gmail.com" />
      </Row>
      <Row label="Timezone">
        <Input defaultValue="Asia/Kolkata" />
      </Row>
    </Section>
  );
}

function BrandingSettings() {
  return (
    <Section title="Branding" description="Logo, colors and identity.">
      <Row label="Primary Color">
        <Input type="color" defaultValue="#4F46E5" className="h-10 w-full" />
      </Row>
      <Row label="Secondary Color">
        <Input type="color" defaultValue="#06B6D4" className="h-10 w-full" />
      </Row>
      <Row label="Accent Color">
        <Input type="color" defaultValue="#8B5CF6" className="h-10 w-full" />
      </Row>
      <Row label="Logo URL">
        <Input defaultValue="/logo.svg" />
      </Row>
    </Section>
  );
}

function AppearanceSettings() {
  return (
    <Section title="Appearance" description="Theme and layout preferences.">
      <Row label="Default Theme">
        <Input defaultValue="System" />
      </Row>
      <Row label="Compact Mode" description="Denser tables and cards">
        <Switch />
      </Row>
      <Row label="Glassmorphism" description="Frosted surfaces">
        <Switch defaultChecked />
      </Row>
    </Section>
  );
}

function SecuritySettings() {
  return (
    <Section title="Security" description="Account safety and access.">
      <Row label="Two-factor Authentication" description="Adds an extra layer of security">
        <Switch />
      </Row>
      <Row label="Session Timeout (minutes)">
        <Input type="number" defaultValue={60} />
      </Row>
      <Row label="Force HTTPS">
        <Switch defaultChecked />
      </Row>
    </Section>
  );
}

function NotificationSettings() {
  return (
    <Section title="Notifications" description="Which events reach your inbox.">
      <Row label="New Leads">
        <Switch defaultChecked />
      </Row>
      <Row label="Deployments">
        <Switch defaultChecked />
      </Row>
      <Row label="Weekly Reports">
        <Switch defaultChecked />
      </Row>
      <Row label="Marketing">
        <Switch />
      </Row>
    </Section>
  );
}

function EmailSettings() {
  return (
    <Section title="Email" description="SMTP and transactional email.">
      <Row label="SMTP Host">
        <Input placeholder="smtp.example.com" />
      </Row>
      <Row label="SMTP Port">
        <Input type="number" defaultValue={587} />
      </Row>
      <Row label="From Address">
        <Input defaultValue="netweavesolutions.co@gmail.com" />
      </Row>
    </Section>
  );
}

function WhatsAppSettings() {
  return (
    <Section title="WhatsApp" description="Business messaging integration.">
      <Row label="Business Number">
        <Input defaultValue="+91 98765 43210" />
      </Row>
      <Row label="Default Message">
        <Textarea defaultValue="Hi, I'd like to know more about Netweavesolutions." />
      </Row>
    </Section>
  );
}

function DatabaseSettings() {
  return (
    <Section title="Database" description="Connection details (UI preview).">
      <Row label="Provider">
        <Input defaultValue="MongoDB" />
      </Row>
      <Row label="Cluster URL">
        <Input placeholder="mongodb+srv://…" />
      </Row>
      <Row label="Automated Backups">
        <Switch defaultChecked />
      </Row>
    </Section>
  );
}

function ApiSettings() {
  return (
    <Section title="API Keys" description="Manage integrations.">
      <Row label="Public API Key">
        <Input readOnly defaultValue="pk_live_••••••••••••••" />
      </Row>
      <Row label="Secret Key">
        <Input readOnly type="password" defaultValue="sk_live_••••••••••••••" />
      </Row>
      <Row label="Webhook URL">
        <Input placeholder="https://…" />
      </Row>
    </Section>
  );
}

function StorageSettings() {
  return (
    <Section title="Storage" description="Assets and CDN.">
      <Row label="Provider">
        <Input defaultValue="Cloudflare R2" />
      </Row>
      <Row label="Bucket">
        <Input defaultValue="codenest-media" />
      </Row>
      <Row label="Max Upload Size (MB)">
        <Input type="number" defaultValue={50} />
      </Row>
    </Section>
  );
}

