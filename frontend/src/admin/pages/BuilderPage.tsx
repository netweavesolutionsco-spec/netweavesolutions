import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Save,
  Rocket,
  History,
  Plus,
  Trash2,
  GripVertical,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Type,
  Palette,
  LayoutGrid,
  Sparkles,
  Image as ImageIcon,
  Video,
  MousePointerClick,
  Layers,
  FileText,
  Search,
  Settings2,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SectionType =
  | "hero"
  | "features"
  | "services"
  | "portfolio"
  | "pricing"
  | "testimonials"
  | "faq"
  | "cta"
  | "blog"
  | "team"
  | "logos"
  | "contact";

type Section = {
  id: string;
  type: SectionType;
  name: string;
  enabled: boolean;
  bg: string;
  padding: number;
  animation: "none" | "fade" | "slide-up" | "zoom" | "blur";
  heading?: string;
  subheading?: string;
  media?: string;
};

type Page = { id: string; name: string; slug: string; sections: Section[] };

const SECTION_LIBRARY: { type: SectionType; label: string; icon: typeof Type }[] = [
  { type: "hero", label: "Hero", icon: Sparkles },
  { type: "features", label: "Features", icon: LayoutGrid },
  { type: "services", label: "Services", icon: Layers },
  { type: "portfolio", label: "Portfolio", icon: ImageIcon },
  { type: "pricing", label: "Pricing", icon: FileText },
  { type: "testimonials", label: "Testimonials", icon: MousePointerClick },
  { type: "faq", label: "FAQ", icon: FileText },
  { type: "cta", label: "Call To Action", icon: Rocket },
  { type: "blog", label: "Blog", icon: FileText },
  { type: "team", label: "Team", icon: Layers },
  { type: "logos", label: "Logos Marquee", icon: LayoutGrid },
  { type: "contact", label: "Contact", icon: MousePointerClick },
];

const initialPages: Page[] = [
  {
    id: "home",
    name: "Homepage",
    slug: "/",
    sections: [
      {
        id: "s1",
        type: "hero",
        name: "Hero — Transforming Ideas",
        enabled: true,
        bg: "#0B1220",
        padding: 96,
        animation: "fade",
        heading: "Transforming Ideas Into Powerful Digital Solutions",
        subheading: "Premium software development agency crafting scalable products.",
      },
      {
        id: "s2",
        type: "logos",
        name: "Trusted By Logos",
        enabled: true,
        bg: "#0F172A",
        padding: 48,
        animation: "slide-up",
      },
      {
        id: "s3",
        type: "services",
        name: "Services Grid",
        enabled: true,
        bg: "#111827",
        padding: 80,
        animation: "fade",
        heading: "What We Do",
      },
      {
        id: "s4",
        type: "portfolio",
        name: "Featured Work",
        enabled: true,
        bg: "#0B1220",
        padding: 80,
        animation: "zoom",
        heading: "Selected Projects",
      },
      {
        id: "s5",
        type: "testimonials",
        name: "Client Voices",
        enabled: true,
        bg: "#0F172A",
        padding: 80,
        animation: "fade",
      },
      {
        id: "s6",
        type: "cta",
        name: "Contact CTA",
        enabled: true,
        bg: "#4F46E5",
        padding: 96,
        animation: "slide-up",
        heading: "Ready to build with us?",
      },
    ],
  },
  {
    id: "about",
    name: "About",
    slug: "/about",
    sections: [
      {
        id: "a1",
        type: "hero",
        name: "About Hero",
        enabled: true,
        bg: "#0B1220",
        padding: 96,
        animation: "fade",
        heading: "We build the future",
      },
      {
        id: "a2",
        type: "team",
        name: "Team",
        enabled: true,
        bg: "#111827",
        padding: 80,
        animation: "slide-up",
      },
    ],
  },
  {
    id: "services",
    name: "Services",
    slug: "/services",
    sections: [
      {
        id: "sv1",
        type: "hero",
        name: "Services Hero",
        enabled: true,
        bg: "#0B1220",
        padding: 80,
        animation: "fade",
      },
      {
        id: "sv2",
        type: "services",
        name: "All Services",
        enabled: true,
        bg: "#0F172A",
        padding: 80,
        animation: "fade",
      },
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    slug: "/portfolio",
    sections: [
      {
        id: "p1",
        type: "portfolio",
        name: "Portfolio Grid",
        enabled: true,
        bg: "#0B1220",
        padding: 80,
        animation: "zoom",
      },
    ],
  },
  {
    id: "blog",
    name: "Blog",
    slug: "/blog",
    sections: [
      {
        id: "b1",
        type: "blog",
        name: "Latest Posts",
        enabled: true,
        bg: "#0B1220",
        padding: 80,
        animation: "fade",
      },
    ],
  },
  {
    id: "pricing",
    name: "Pricing",
    slug: "/pricing",
    sections: [
      {
        id: "pr1",
        type: "pricing",
        name: "Pricing Tiers",
        enabled: true,
        bg: "#0B1220",
        padding: 80,
        animation: "slide-up",
      },
      {
        id: "pr2",
        type: "faq",
        name: "Pricing FAQ",
        enabled: true,
        bg: "#0F172A",
        padding: 80,
        animation: "fade",
      },
    ],
  },
  {
    id: "faq",
    name: "FAQ",
    slug: "/faq",
    sections: [
      {
        id: "f1",
        type: "faq",
        name: "Frequently Asked",
        enabled: true,
        bg: "#0B1220",
        padding: 80,
        animation: "fade",
      },
    ],
  },
];

type Theme = {
  primary: string;
  accent: string;
  bg: string;
  text: string;
  radius: number;
  font: string;
  headerStyle: "transparent" | "solid" | "glass";
  footerStyle: "minimal" | "columns" | "mega";
  buttonStyle: "rounded" | "pill" | "square";
  buttonSize: number;
  navLinks: string[];
};

const initialTheme: Theme = {
  primary: "#4F46E5",
  accent: "#06B6D4",
  bg: "#0B1220",
  text: "#F8FAFC",
  radius: 12,
  font: "Inter",
  headerStyle: "glass",
  footerStyle: "columns",
  buttonStyle: "rounded",
  buttonSize: 44,
  navLinks: ["Home", "About", "Services", "Portfolio", "Blog", "Pricing", "Contact"],
};

type Snapshot = { pages: Page[]; theme: Theme };

export function BuilderPage() {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [activePageId, setActivePageId] = useState("home");
  const [selectedId, setSelectedId] = useState<string | null>("s1");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rightTab, setRightTab] = useState("content");
  const [history, setHistory] = useState<Snapshot[]>([
    { pages: initialPages, theme: initialTheme },
  ]);
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [showVersions, setShowVersions] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const activePage = pages.find((p) => p.id === activePageId)!;
  const selected = activePage.sections.find((s) => s.id === selectedId) ?? null;

  const commit = (next: { pages?: Page[]; theme?: Theme }) => {
    const snap: Snapshot = { pages: next.pages ?? pages, theme: next.theme ?? theme };
    if (next.pages) setPages(next.pages);
    if (next.theme) setTheme(next.theme);
    const trimmed = history.slice(0, cursor + 1);
    setHistory([...trimmed, snap]);
    setCursor(trimmed.length);
  };

  const undo = () => {
    if (cursor > 0) {
      const s = history[cursor - 1];
      setPages(s.pages);
      setTheme(s.theme);
      setCursor(cursor - 1);
    }
  };
  const redo = () => {
    if (cursor < history.length - 1) {
      const s = history[cursor + 1];
      setPages(s.pages);
      setTheme(s.theme);
      setCursor(cursor + 1);
    }
  };

  const updateSection = (id: string, patch: Partial<Section>) => {
    const nextPages = pages.map((p) =>
      p.id !== activePageId
        ? p
        : {
            ...p,
            sections: p.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          },
    );
    commit({ pages: nextPages });
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = activePage.sections.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= activePage.sections.length) return;
    const arr = [...activePage.sections];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    commit({ pages: pages.map((p) => (p.id === activePageId ? { ...p, sections: arr } : p)) });
  };

  const removeSection = (id: string) => {
    commit({
      pages: pages.map((p) =>
        p.id !== activePageId ? p : { ...p, sections: p.sections.filter((s) => s.id !== id) },
      ),
    });
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateSection = (id: string) => {
    const s = activePage.sections.find((x) => x.id === id);
    if (!s) return;
    const clone = { ...s, id: `${s.id}-${Date.now()}`, name: `${s.name} (copy)` };
    commit({
      pages: pages.map((p) =>
        p.id !== activePageId ? p : { ...p, sections: [...p.sections, clone] },
      ),
    });
  };

  const addSection = (type: SectionType) => {
    const meta = SECTION_LIBRARY.find((s) => s.type === type)!;
    const s: Section = {
      id: `n-${Date.now()}`,
      type,
      name: `${meta.label} Section`,
      enabled: true,
      bg: theme.bg,
      padding: 80,
      animation: "fade",
      heading: `${meta.label} heading`,
      subheading: "Add a compelling subheading here.",
    };
    commit({
      pages: pages.map((p) => (p.id !== activePageId ? p : { ...p, sections: [...p.sections, s] })),
    });
    setSelectedId(s.id);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const arr = [...activePage.sections];
    const from = arr.findIndex((s) => s.id === dragId);
    const to = arr.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    commit({ pages: pages.map((p) => (p.id === activePageId ? { ...p, sections: arr } : p)) });
    setDragId(null);
  };

  const versions = useMemo(
    () =>
      history.map((_, i) => ({
        v: i + 1,
        when: `${i === history.length - 1 ? "Current" : `${history.length - i - 1} step${history.length - i - 1 === 1 ? "" : "s"} ago`}`,
      })),
    [history],
  );

  const deviceWidth = device === "desktop" ? "100%" : device === "tablet" ? 820 : 390;

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col">
      <PageHeader
        title="Website Builder"
        description="Design, arrange and publish every page — no coding required."
        actions={
          <>
            <Badge variant="secondary" className="gap-1">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "published" ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {status === "published" ? "Published" : "Draft"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={undo} disabled={cursor === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={cursor >= history.length - 1}
            >
              Redo
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowVersions((v) => !v)}>
              <History className="mr-1 h-4 w-4" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Preview opened in new tab (mock)")}
            >
              <Eye className="mr-1 h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("draft");
                toast.success("Saved as draft");
              }}
            >
              <Save className="mr-1 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              size="sm"
              className="bg-linear-to-r from-indigo-500 to-cyan-500 text-white"
              onClick={() => {
                setStatus("published");
                toast.success("Published live");
              }}
            >
              <Rocket className="mr-1 h-4 w-4" />
              Publish
            </Button>
          </>
        }
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_320px]">
        {/* LEFT — pages + sections */}
        <aside className="flex min-h-0 flex-col rounded-2xl border bg-card/60 backdrop-blur">
          <div className="border-b p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Pages</div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => toast.info("Add page (mock)")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={activePageId}
              onValueChange={(v) => {
                setActivePageId(v);
                setSelectedId(null);
              }}
            >
              <SelectTrigger className="mt-2 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} <span className="text-muted-foreground">— {p.slug}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between border-b p-3">
            <div className="text-sm font-semibold">Sections</div>
            <span className="text-xs text-muted-foreground">{activePage.sections.length}</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {activePage.sections.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={() => setDragId(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(s.id)}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm transition",
                  selectedId === s.id
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "hover:bg-accent/60",
                  !s.enabled && "opacity-60",
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.type}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(s.id, -1);
                    }}
                    disabled={i === 0}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(s.id, 1);
                    }}
                    disabled={i === activePage.sections.length - 1}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSection(s.id);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSection(s.id, { enabled: !s.enabled });
                    }}
                  >
                    {s.enabled ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    className="rounded p-1 text-red-500 hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(s.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Section
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SECTION_LIBRARY.map((s) => (
                <button
                  key={s.type}
                  onClick={() => addSection(s.type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border/60 p-2 text-[11px] transition hover:border-indigo-500/40 hover:bg-indigo-500/5"
                >
                  <s.icon className="h-4 w-4 text-indigo-500" />
                  {s.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER — canvas */}
        <main className="flex min-h-0 flex-col rounded-2xl border bg-muted/30">
          <div className="flex items-center justify-between border-b bg-card/60 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
              {(["desktop", "tablet", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs capitalize transition",
                    device === d
                      ? "bg-indigo-500/10 text-indigo-500"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d === "desktop" && <Monitor className="mr-1 inline h-3.5 w-3.5" />}
                  {d === "tablet" && <Tablet className="mr-1 inline h-3.5 w-3.5" />}
                  {d === "mobile" && <Smartphone className="mr-1 inline h-3.5 w-3.5" />}
                  {d}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {activePage.name} <span className="mx-1">·</span> {activePage.slug}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="h-3.5 w-3.5" /> zoom 100%
            </div>
          </div>

          <div className="relative flex-1 overflow-auto p-4">
            {showVersions && (
              <div className="absolute right-4 top-4 z-10 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border bg-card p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Version History</div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowVersions(false)}
                  >
                    close
                  </button>
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {versions
                    .slice()
                    .reverse()
                    .map((v, i) => {
                      const idx = history.length - 1 - i;
                      return (
                        <button
                          key={v.v}
                          onClick={() => {
                            const s = history[idx];
                            setPages(s.pages);
                            setTheme(s.theme);
                            setCursor(idx);
                            toast.success(`Restored v${v.v}`);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent",
                            idx === cursor && "bg-indigo-500/10",
                          )}
                        >
                          <span>
                            v{v.v} · {v.when}
                          </span>
                          {idx === cursor && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <div
              className="mx-auto overflow-hidden rounded-xl border shadow-2xl transition-all"
              style={{
                width: deviceWidth,
                background: theme.bg,
                color: theme.text,
                fontFamily: theme.font,
              }}
            >
              {/* Fake header */}
              <div
                className={cn(
                  "flex items-center justify-between px-6 py-4",
                  theme.headerStyle === "glass" && "backdrop-blur bg-white/5",
                  theme.headerStyle === "solid" && "bg-black/40",
                )}
              >
                <div
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: theme.text }}
                >
                  <span
                    className="grid h-6 w-6 place-items-center rounded-md text-white"
                    style={{ background: theme.primary }}
                  >
                    C
                  </span>
                  Netweavesolutions
                </div>
                <div
                  className="hidden gap-4 text-xs md:flex"
                  style={{ color: theme.text, opacity: 0.8 }}
                >
                  {theme.navLinks.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
                <button
                  className="text-xs text-white"
                  style={{
                    background: theme.primary,
                    borderRadius:
                      theme.buttonStyle === "pill"
                        ? 999
                        : theme.buttonStyle === "square"
                          ? 4
                          : theme.radius,
                    padding: "6px 14px",
                  }}
                >
                  Get Started
                </button>
              </div>

              {activePage.sections
                .filter((s) => s.enabled)
                .map((s) => (
                  <SectionPreview
                    key={s.id}
                    section={s}
                    theme={theme}
                    selected={s.id === selectedId}
                    onSelect={() => setSelectedId(s.id)}
                  />
                ))}

              {/* Fake footer */}
              <div className="border-t border-white/10 px-6 py-8 text-xs" style={{ opacity: 0.7 }}>
                <div
                  className={cn(
                    "grid gap-6",
                    theme.footerStyle === "mega"
                      ? "md:grid-cols-5"
                      : theme.footerStyle === "columns"
                        ? "md:grid-cols-4"
                        : "md:grid-cols-2",
                  )}
                >
                  <div>© 2026 Netweavesolutions</div>
                  {theme.footerStyle !== "minimal" && (
                    <div>
                      Company
                      <br />
                      About
                      <br />
                      Careers
                      <br />
                      Contact
                    </div>
                  )}
                  {theme.footerStyle !== "minimal" && (
                    <div>
                      Services
                      <br />
                      Web
                      <br />
                      Mobile
                      <br />
                      AI
                    </div>
                  )}
                  {theme.footerStyle !== "minimal" && (
                    <div>
                      Legal
                      <br />
                      Privacy
                      <br />
                      Terms
                    </div>
                  )}
                  {theme.footerStyle === "mega" && (
                    <div>
                      Newsletter
                      <br />
                      Subscribe to updates
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT — properties */}
        <aside className="flex min-h-0 flex-col rounded-2xl border bg-card/60 backdrop-blur">
          <Tabs
            value={rightTab}
            onValueChange={setRightTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="border-b p-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">
                  <Type className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="style">
                  <Palette className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="theme">
                  <Settings2 className="h-3.5 w-3.5" />
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!selected && rightTab !== "theme" && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Select a section from the left to edit it.
                </div>
              )}

              {selected && (
                <>
                  <TabsContent value="content" className="m-0 space-y-4">
                    <PropRow label="Section name">
                      <Input
                        value={selected.name}
                        onChange={(e) => updateSection(selected.id, { name: e.target.value })}
                      />
                    </PropRow>
                    <PropRow label="Heading">
                      <Input
                        value={selected.heading ?? ""}
                        onChange={(e) => updateSection(selected.id, { heading: e.target.value })}
                      />
                    </PropRow>
                    <PropRow label="Subheading">
                      <Textarea
                        rows={3}
                        value={selected.subheading ?? ""}
                        onChange={(e) => updateSection(selected.id, { subheading: e.target.value })}
                      />
                    </PropRow>
                    <PropRow label="Image URL">
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://…"
                          value={selected.media ?? ""}
                          onChange={(e) => updateSection(selected.id, { media: e.target.value })}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toast.info("Media library (mock)")}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toast.info("Video picker (mock)")}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </PropRow>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="text-sm">Section enabled</div>
                      <Switch
                        checked={selected.enabled}
                        onCheckedChange={(v) => updateSection(selected.id, { enabled: v })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="style" className="m-0 space-y-4">
                    <PropRow label="Background">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selected.bg}
                          onChange={(e) => updateSection(selected.id, { bg: e.target.value })}
                          className="h-9 w-12 cursor-pointer rounded border"
                        />
                        <Input
                          value={selected.bg}
                          onChange={(e) => updateSection(selected.id, { bg: e.target.value })}
                        />
                      </div>
                    </PropRow>
                    <PropRow label={`Padding — ${selected.padding}px`}>
                      <Slider
                        value={[selected.padding]}
                        min={16}
                        max={200}
                        step={4}
                        onValueChange={([v]) => updateSection(selected.id, { padding: v })}
                      />
                    </PropRow>
                    <PropRow label="Animation">
                      <Select
                        value={selected.animation}
                        onValueChange={(v) =>
                          updateSection(selected.id, { animation: v as Section["animation"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["none", "fade", "slide-up", "zoom", "blur"].map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </PropRow>
                  </TabsContent>

                  <TabsContent value="layout" className="m-0 space-y-4">
                    <PropRow label="Order">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => move(selected.id, -1)}
                        >
                          <ChevronUp className="mr-1 h-4 w-4" />
                          Up
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => move(selected.id, 1)}
                        >
                          <ChevronDown className="mr-1 h-4 w-4" />
                          Down
                        </Button>
                      </div>
                    </PropRow>
                    <PropRow label="Actions">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => duplicateSection(selected.id)}
                        >
                          <Copy className="mr-1 h-4 w-4" />
                          Duplicate
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => removeSection(selected.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </PropRow>
                  </TabsContent>
                </>
              )}

              <TabsContent value="theme" className="m-0 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Global Theme
                </div>
                <PropRow label="Primary">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme.primary}
                      onChange={(e) => commit({ theme: { ...theme, primary: e.target.value } })}
                      className="h-9 w-12 rounded border"
                    />
                    <Input
                      value={theme.primary}
                      onChange={(e) => commit({ theme: { ...theme, primary: e.target.value } })}
                    />
                  </div>
                </PropRow>
                <PropRow label="Accent">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(e) => commit({ theme: { ...theme, accent: e.target.value } })}
                      className="h-9 w-12 rounded border"
                    />
                    <Input
                      value={theme.accent}
                      onChange={(e) => commit({ theme: { ...theme, accent: e.target.value } })}
                    />
                  </div>
                </PropRow>
                <PropRow label="Background">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme.bg}
                      onChange={(e) => commit({ theme: { ...theme, bg: e.target.value } })}
                      className="h-9 w-12 rounded border"
                    />
                    <Input
                      value={theme.bg}
                      onChange={(e) => commit({ theme: { ...theme, bg: e.target.value } })}
                    />
                  </div>
                </PropRow>
                <PropRow label={`Radius — ${theme.radius}px`}>
                  <Slider
                    value={[theme.radius]}
                    min={0}
                    max={32}
                    step={1}
                    onValueChange={([v]) => commit({ theme: { ...theme, radius: v } })}
                  />
                </PropRow>
                <PropRow label="Font">
                  <Select
                    value={theme.font}
                    onValueChange={(v) => commit({ theme: { ...theme, font: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Inter", "Sora", "Manrope", "Space Grotesk", "DM Sans"].map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropRow>
                <PropRow label="Header style">
                  <Select
                    value={theme.headerStyle}
                    onValueChange={(v) =>
                      commit({ theme: { ...theme, headerStyle: v as Theme["headerStyle"] } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["transparent", "solid", "glass"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropRow>
                <PropRow label="Footer style">
                  <Select
                    value={theme.footerStyle}
                    onValueChange={(v) =>
                      commit({ theme: { ...theme, footerStyle: v as Theme["footerStyle"] } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["minimal", "columns", "mega"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropRow>
                <PropRow label="Button shape">
                  <Select
                    value={theme.buttonStyle}
                    onValueChange={(v) =>
                      commit({ theme: { ...theme, buttonStyle: v as Theme["buttonStyle"] } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["rounded", "pill", "square"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropRow>
                <PropRow label="Navigation links">
                  <Textarea
                    rows={4}
                    value={theme.navLinks.join("\n")}
                    onChange={(e) =>
                      commit({
                        theme: { ...theme, navLinks: e.target.value.split("\n").filter(Boolean) },
                      })
                    }
                  />
                </PropRow>
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionPreview({
  section,
  theme,
  selected,
  onSelect,
}: {
  section: Section;
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer transition",
        selected && "ring-2 ring-inset ring-indigo-500",
      )}
      style={{ background: section.bg, padding: section.padding }}
    >
      {selected && (
        <div className="absolute left-2 top-2 z-10 rounded-md bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
          {section.type} · editing
        </div>
      )}
      <SectionBody section={section} theme={theme} />
    </div>
  );
}

function SectionBody({ section, theme }: { section: Section; theme: Theme }) {
  const t = theme.text;
  const dim = { color: t, opacity: 0.7 };
  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: theme.radius,
  };
  switch (section.type) {
    case "hero":
      return (
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold md:text-5xl" style={{ color: t }}>
            {section.heading || "Powerful headline"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl" style={dim}>
            {section.subheading || "Supporting subheading text goes here."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="px-5 py-2 text-sm text-white"
              style={{ background: theme.primary, borderRadius: theme.radius }}
            >
              Get Started
            </button>
            <button
              className="px-5 py-2 text-sm"
              style={{ border: `1px solid ${t}33`, color: t, borderRadius: theme.radius }}
            >
              Learn more
            </button>
          </div>
        </div>
      );
    case "logos":
      return (
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
          {["ACME", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map((l) => (
            <span key={l} className="text-sm font-semibold" style={{ color: t }}>
              {l}
            </span>
          ))}
        </div>
      );
    case "features":
    case "services":
      return (
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-semibold" style={{ color: t }}>
            {section.heading || "Our services"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {["Web Apps", "Mobile", "AI & ML", "DevOps", "UI/UX", "Consulting"].map((s) => (
              <div key={s} className="p-5" style={card}>
                <div className="mb-2 h-8 w-8 rounded-md" style={{ background: theme.accent }} />
                <div className="font-semibold" style={{ color: t }}>
                  {s}
                </div>
                <div className="mt-1 text-sm" style={dim}>
                  Short description of the service offering.
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "portfolio":
      return (
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-semibold" style={{ color: t }}>
            {section.heading || "Selected work"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-video"
                style={{
                  ...card,
                  background: `linear-gradient(135deg, ${theme.primary}55, ${theme.accent}55)`,
                }}
              />
            ))}
          </div>
        </div>
      );
    case "pricing":
      return (
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {["Starter", "Professional", "Enterprise"].map((p, i) => (
            <div
              key={p}
              className="p-6"
              style={{ ...card, borderColor: i === 1 ? theme.primary : undefined }}
            >
              <div className="text-sm font-semibold" style={{ color: t }}>
                {p}
              </div>
              <div className="mt-2 text-3xl font-bold" style={{ color: t }}>
                ${(i + 1) * 49}
              </div>
              <ul className="mt-4 space-y-1 text-sm" style={dim}>
                <li>Feature one</li>
                <li>Feature two</li>
                <li>Feature three</li>
              </ul>
            </div>
          ))}
        </div>
      );
    case "testimonials":
      return (
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5" style={card}>
              <p className="text-sm" style={{ color: t }}>
                “They delivered beyond expectations, on time and on budget.”
              </p>
              <div className="mt-3 text-xs" style={dim}>
                — Client {i}, CEO
              </div>
            </div>
          ))}
        </div>
      );
    case "faq":
      return (
        <div className="mx-auto max-w-3xl space-y-2">
          {[
            "What services do you offer?",
            "How long does a project take?",
            "Do you offer support?",
          ].map((q) => (
            <div key={q} className="p-4" style={card}>
              <div className="font-medium" style={{ color: t }}>
                {q}
              </div>
              <div className="mt-1 text-sm" style={dim}>
                Answer text preview.
              </div>
            </div>
          ))}
        </div>
      );
    case "cta":
      return (
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold md:text-4xl" style={{ color: t }}>
            {section.heading || "Ready to get started?"}
          </h2>
          <button
            className="mt-4 px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: theme.primary, borderRadius: theme.radius }}
          >
            Contact us
          </button>
        </div>
      );
    case "blog":
      return (
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden" style={card}>
              <div
                className="aspect-video"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}55, ${theme.accent}55)`,
                }}
              />
              <div className="p-4">
                <div className="font-semibold" style={{ color: t }}>
                  Blog post title {i}
                </div>
                <div className="mt-1 text-xs" style={dim}>
                  Aug 2026 · 5 min read
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    case "team":
      return (
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 text-center" style={card}>
              <div
                className="mx-auto h-16 w-16 rounded-full"
                style={{ background: theme.accent }}
              />
              <div className="mt-2 font-semibold" style={{ color: t }}>
                Member {i}
              </div>
              <div className="text-xs" style={dim}>
                Role
              </div>
            </div>
          ))}
        </div>
      );
    case "contact":
      return (
        <div className="mx-auto max-w-xl space-y-2">
          <input
            placeholder="Name"
            className="w-full px-3 py-2 text-sm"
            style={{ ...card, color: t }}
          />
          <input
            placeholder="Email"
            className="w-full px-3 py-2 text-sm"
            style={{ ...card, color: t }}
          />
          <textarea
            placeholder="Message"
            rows={4}
            className="w-full px-3 py-2 text-sm"
            style={{ ...card, color: t }}
          />
          <button
            className="w-full py-2 text-sm text-white"
            style={{ background: theme.primary, borderRadius: theme.radius }}
          >
            Send
          </button>
        </div>
      );
  }
}

