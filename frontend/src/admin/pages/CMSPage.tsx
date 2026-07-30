import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Send, Plus, Trash2, GripVertical, Eye, Monitor, Smartphone, RefreshCw, X } from "lucide-react";
import { PageHeader } from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { getDraftSettings, saveDraftSettings, publishSettings } from "@/lib/cms.functions";
import { defaultSettings, mergeSettings, type SiteSettings, type NavItem } from "@/data/defaultSettings";
import { invalidatePublishedContent } from "@/hooks/siteContentSync";
import { PREVIEW_READY, PREVIEW_SETTINGS } from "@/hooks/useCmsPreview";

export function CMSPage() {
  const loadDraft = useServerFn(getDraftSettings);
  const saveDraft = useServerFn(saveDraftSettings);
  const publish = useServerFn(publishSettings);
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewPath, setPreviewPath] = useState("/");
  const previewRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    loadDraft()
      .then((r) => {
        setSettings(r.settings);
        setIsAdmin(r.isAdmin);
      })
      .catch((e) => toast.error(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [loadDraft]);

  // Stream the current draft into the preview iframe whenever it changes or the
  // iframe (re)loads. Nothing is persisted or published — the live site is
  // untouched until "Publish" is clicked.
  const pushPreview = () => {
    previewRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_SETTINGS, settings },
      window.location.origin,
    );
  };

  useEffect(() => {
    if (!previewOpen) return;
    pushPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === PREVIEW_READY) pushPreview();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen, settings]);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveDraft({ data: settings as unknown as Record<string, unknown> });
      toast.success("Draft saved");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    setPublishing(true);
    try {
      await publish({ data: settings as unknown as Record<string, unknown> });
      queryClient.setQueryData(["site-settings", "public", "latest"], mergeSettings(settings));
      await queryClient.invalidateQueries({ queryKey: ["site-settings", "public"] });
      await queryClient.refetchQueries({ queryKey: ["site-settings", "public"] });
      invalidatePublishedContent(queryClient);
      toast.success("Published — public site updated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Content Management" description="Edit your live website." />
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You are signed in but do not have the <span className="font-semibold">admin</span> role.
            Ask an existing admin to promote your account.
          </p>
        </Card>
      </div>
    );
  }

  const update = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Content Management"
        description="Edit your live website — every change goes to draft, then Publish pushes it live."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Live Preview
            </Button>
            <Button variant="outline" onClick={onSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save draft
            </Button>
            <Button onClick={onPublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="brand" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="brand">Brand</TabsTrigger>
          <TabsTrigger value="nav">Navigation</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="mt-4">
          <Card className="p-6 space-y-4">
            <Row label="Company Name">
              <Input
                value={settings.brand.name}
                onChange={(e) => update("brand", { ...settings.brand, name: e.target.value })}
              />
            </Row>
            <Row label="Short Name">
              <Input
                value={settings.brand.short}
                onChange={(e) => update("brand", { ...settings.brand, short: e.target.value })}
              />
            </Row>
            <Row label="Tagline">
              <Input
                value={settings.brand.tagline}
                onChange={(e) => update("brand", { ...settings.brand, tagline: e.target.value })}
              />
            </Row>
            <Row label="Description">
              <Textarea
                value={settings.brand.description}
                onChange={(e) =>
                  update("brand", { ...settings.brand, description: e.target.value })
                }
              />
            </Row>
            <Row label="Logo URL (Light)">
              <Input
                placeholder="https://…"
                value={settings.brand.logoUrl ?? ""}
                onChange={(e) => update("brand", { ...settings.brand, logoUrl: e.target.value })}
              />
            </Row>
            <Row label="Logo URL (Dark)">
              <Input
                placeholder="https://…"
                value={settings.brand.logoDarkUrl ?? ""}
                onChange={(e) =>
                  update("brand", { ...settings.brand, logoDarkUrl: e.target.value })
                }
              />
            </Row>
            <Row label="Favicon URL">
              <Input
                placeholder="https://…"
                value={settings.brand.faviconUrl ?? ""}
                onChange={(e) => update("brand", { ...settings.brand, faviconUrl: e.target.value })}
              />
            </Row>
          </Card>
        </TabsContent>

        <TabsContent value="nav" className="mt-4">
          <Card className="p-6">
            <NavEditor items={settings.nav} onChange={(nav) => update("nav", nav)} />
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="mt-4">
          <Card className="p-6 space-y-4">
            <Row label="Eyebrow">
              <Input
                value={settings.hero.eyebrow}
                onChange={(e) => update("hero", { ...settings.hero, eyebrow: e.target.value })}
              />
            </Row>
            <Row label="Title">
              <Input
                value={settings.hero.title}
                onChange={(e) => update("hero", { ...settings.hero, title: e.target.value })}
              />
            </Row>
            <Row label="Subtitle">
              <Textarea
                value={settings.hero.subtitle}
                onChange={(e) => update("hero", { ...settings.hero, subtitle: e.target.value })}
              />
            </Row>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Primary CTA
                </div>
                <Input
                  placeholder="Label"
                  value={settings.hero.ctaPrimary.label}
                  onChange={(e) =>
                    update("hero", {
                      ...settings.hero,
                      ctaPrimary: { ...settings.hero.ctaPrimary, label: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="URL"
                  value={settings.hero.ctaPrimary.to}
                  onChange={(e) =>
                    update("hero", {
                      ...settings.hero,
                      ctaPrimary: { ...settings.hero.ctaPrimary, to: e.target.value },
                    })
                  }
                />
              </Card>
              <Card className="p-4 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Secondary CTA
                </div>
                <Input
                  placeholder="Label"
                  value={settings.hero.ctaSecondary.label}
                  onChange={(e) =>
                    update("hero", {
                      ...settings.hero,
                      ctaSecondary: { ...settings.hero.ctaSecondary, label: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="URL"
                  value={settings.hero.ctaSecondary.to}
                  onChange={(e) =>
                    update("hero", {
                      ...settings.hero,
                      ctaSecondary: { ...settings.hero.ctaSecondary, to: e.target.value },
                    })
                  }
                />
              </Card>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card className="p-6 space-y-4">
            <Row label="Email">
              <Input
                value={settings.brand.email}
                onChange={(e) => update("brand", { ...settings.brand, email: e.target.value })}
              />
            </Row>
            <Row label="Phone">
              <Input
                value={settings.brand.phone}
                onChange={(e) => update("brand", { ...settings.brand, phone: e.target.value })}
              />
            </Row>
            <Row label="WhatsApp (E.164 no +)">
              <Input
                value={settings.brand.whatsapp}
                onChange={(e) => update("brand", { ...settings.brand, whatsapp: e.target.value })}
              />
            </Row>
            <Row label="Address">
              <Input
                value={settings.brand.address}
                onChange={(e) => update("brand", { ...settings.brand, address: e.target.value })}
              />
            </Row>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <Card className="p-6 space-y-4">
            {(["twitter", "linkedin", "github", "instagram"] as const).map((k) => (
              <Row key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <Input
                  value={settings.social[k]}
                  onChange={(e) => update("social", { ...settings.social, [k]: e.target.value })}
                />
              </Row>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <Card className="p-6 space-y-4">
            <Row label="Default Page Title">
              <Input
                value={settings.seo.title}
                onChange={(e) => update("seo", { ...settings.seo, title: e.target.value })}
              />
            </Row>
            <Row label="Default Meta Description">
              <Textarea
                value={settings.seo.description}
                onChange={(e) => update("seo", { ...settings.seo, description: e.target.value })}
              />
            </Row>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <Card className="p-6 space-y-4">
            {(["primary", "accent", "highlight"] as const).map((k) => (
              <Row key={k} label={k[0].toUpperCase() + k.slice(1) + " Color"}>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-16 p-1"
                    value={settings.theme[k]}
                    onChange={(e) => update("theme", { ...settings.theme, [k]: e.target.value })}
                  />
                  <Input
                    value={settings.theme[k]}
                    onChange={(e) => update("theme", { ...settings.theme, [k]: e.target.value })}
                  />
                </div>
              </Row>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="mt-4">
          <Card className="p-6 space-y-4">
            <Row label="Copyright">
              <Input
                value={settings.footer.copyright}
                onChange={(e) =>
                  update("footer", { ...settings.footer, copyright: e.target.value })
                }
              />
            </Row>
            <Row label="Show Newsletter Section">
              <Switch
                checked={settings.footer.showNewsletter}
                onCheckedChange={(v) => update("footer", { ...settings.footer, showNewsletter: v })}
              />
            </Row>
          </Card>
        </TabsContent>
      </Tabs>

      {previewOpen && (
        <PreviewOverlay
          device={previewDevice}
          setDevice={setPreviewDevice}
          path={previewPath}
          setPath={setPreviewPath}
          iframeRef={previewRef}
          onClose={() => setPreviewOpen(false)}
          onRefresh={pushPreview}
        />
      )}
    </div>
  );
}

const PREVIEW_PAGES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/services", label: "Services" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/pricing", label: "Pricing" },
  { path: "/contact", label: "Contact" },
];

function PreviewOverlay({
  device,
  setDevice,
  path,
  setPath,
  iframeRef,
  onClose,
  onRefresh,
}: {
  device: "desktop" | "mobile";
  setDevice: (d: "desktop" | "mobile") => void;
  path: string;
  setPath: (p: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const src = `${path}${path.includes("?") ? "&" : "?"}preview=cms`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-card/80 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="h-4 w-4 text-(--brand)" />
          Live Preview
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Unpublished draft
          </span>
        </div>

        <div className="ml-2 flex items-center gap-1 rounded-lg border border-border/60 p-1">
          {PREVIEW_PAGES.map((p) => (
            <button
              key={p.path}
              onClick={() => setPath(p.path)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                path === p.path
                  ? "bg-(--brand) text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={device === "desktop" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            title="Desktop"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={device === "mobile" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            title="Mobile"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" title="Refresh preview" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-stretch justify-center overflow-auto bg-muted/40 p-4">
        <div
          className={`mx-auto h-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl transition-all ${
            device === "mobile" ? "w-[390px] max-w-full" : "w-full"
          }`}
        >
          <iframe
            ref={iframeRef}
            key={path}
            src={src}
            title="Live preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
      <Label className="text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function NavEditor({
  items,
  onChange,
}: {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}) {
  const update = (i: number, patch: Partial<NavItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...items, { to: "/new", label: "New Link", enabled: true }]);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 p-3">
          <div className="flex flex-col">
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => move(i, -1)}
              aria-label="Move up"
            >
              ▲
            </button>
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => move(i, 1)}
              aria-label="Move down"
            >
              ▼
            </button>
          </div>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Input
            className="flex-1"
            placeholder="Label"
            value={item.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <Input
            className="flex-1"
            placeholder="/path"
            value={item.to}
            onChange={(e) => update(i, { to: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Switch checked={item.enabled} onCheckedChange={(v) => update(i, { enabled: v })} />
            <span className="text-xs text-muted-foreground">Show</span>
          </div>
          <Button size="icon" variant="ghost" onClick={() => remove(i)} aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={add}>
        <Plus className="mr-2 h-4 w-4" /> Add link
      </Button>
    </div>
  );
}
