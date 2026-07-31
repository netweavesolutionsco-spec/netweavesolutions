import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Settings2,
  Copy,
  Check,
  Loader2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  listPages,
  getDraftPage,
  saveDraftPage,
  publishPage,
  createPage,
  duplicatePage,
  deletePage,
  renamePage,
  listVersions,
  restoreVersion,
  type PageVersion,
} from "@/lib/pages.functions";
import { getPublicSettings } from "@/lib/cms.functions";
import { emptyPageData, type PageData, type PageRecord, type Section } from "@/builder/types";
import { SECTION_CATEGORIES, getSectionDef } from "@/builder/registry";
import { PropertyPanel } from "@/builder/PropertyPanel";
import { MediaLibrary } from "@/builder/MediaLibrary";
import { defaultSettings, type SiteSettings } from "@/data/defaultSettings";
import {
  PREVIEW_READY,
  PREVIEW_PAGE,
  PREVIEW_SETTINGS,
  PREVIEW_SELECT,
  PREVIEW_SECTION_CLICK,
} from "@/hooks/useCmsPreview";

type SaveState = "idle" | "saving" | "saved";

let seq = 0;
const newId = () => `s-${Date.now().toString(36)}-${seq++}`;

export function BuilderPage() {
  const loadList = useServerFn(listPages);
  const loadDraft = useServerFn(getDraftPage);
  const saveDraft = useServerFn(saveDraftPage);
  const publish = useServerFn(publishPage);
  const createFn = useServerFn(createPage);
  const duplicateFn = useServerFn(duplicatePage);
  const deleteFn = useServerFn(deletePage);
  const renameFn = useServerFn(renamePage);
  const versionsFn = useServerFn(listVersions);
  const restoreFn = useServerFn(restoreVersion);
  const settingsFn = useServerFn(getPublicSettings);
  const queryClient = useQueryClient();

  const [pages, setPages] = useState<PageRecord[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [data, setData] = useState<PageData>(emptyPageData());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rightTab, setRightTab] = useState("content");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishing, setPublishing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [mediaPicker, setMediaPicker] = useState<((url: string) => void) | null>(null);

  // In-memory undo/redo of the working page data (the DB draft is the durable
  // store; this is just for editing convenience within the session).
  const historyRef = useRef<PageData[]>([]);
  const cursorRef = useRef(-1);
  const [histLen, setHistLen] = useState(0);
  const [cursor, setCursor] = useState(-1);
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "editor";
  const activePage = pages.find((p) => p.id === activeId) ?? null;
  const selected = data.sections.find((s) => s.id === selectedId) ?? null;

  // ---- initial load ----
  useEffect(() => {
    Promise.all([loadList(), settingsFn()])
      .then(([list, s]) => {
        const l = list as { pages: PageRecord[]; role: string | null };
        setPages(l.pages);
        setRole(l.role);
        setSettings(s as SiteSettings);
        const first = l.pages.find((p) => p.slug === "/") ?? l.pages[0];
        if (first) {
          setActiveId(first.id);
          resetTo(first.data);
        }
      })
      .catch((e) => toast.error(String(e?.message ?? e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetTo = (d: PageData) => {
    historyRef.current = [d];
    cursorRef.current = 0;
    setHistLen(1);
    setCursor(0);
    setData(d);
  };

  // ---- history + mutation ----
  const commit = useCallback(
    (next: PageData) => {
      const trimmed = historyRef.current.slice(0, cursorRef.current + 1);
      trimmed.push(next);
      // Cap history to avoid unbounded growth in long sessions.
      const capped = trimmed.slice(-50);
      historyRef.current = capped;
      cursorRef.current = capped.length - 1;
      setHistLen(capped.length);
      setCursor(cursorRef.current);
      setData(next);
      scheduleSave(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeId],
  );

  const scheduleSave = useCallback(
    (next: PageData) => {
      if (!activeId || !canEdit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          await saveDraft({ data: { id: activeId, data: next } });
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 1500);
        } catch (e) {
          setSaveState("idle");
          toast.error(String((e as Error)?.message ?? e));
        }
      }, 800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeId, canEdit],
  );

  const undo = () => {
    if (cursorRef.current > 0) {
      cursorRef.current -= 1;
      const d = historyRef.current[cursorRef.current];
      setCursor(cursorRef.current);
      setData(d);
      scheduleSave(d);
    }
  };
  const redo = () => {
    if (cursorRef.current < historyRef.current.length - 1) {
      cursorRef.current += 1;
      const d = historyRef.current[cursorRef.current];
      setCursor(cursorRef.current);
      setData(d);
      scheduleSave(d);
    }
  };

  const setSections = (sections: Section[]) => commit({ ...data, sections });
  const updateSection = (id: string, patch: Partial<Section>) =>
    setSections(data.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const updateSectionData = (id: string, sectionData: Record<string, unknown>) =>
    setSections(data.sections.map((s) => (s.id === id ? { ...s, data: sectionData } : s)));

  const move = (id: string, dir: -1 | 1) => {
    const idx = data.sections.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= data.sections.length) return;
    const arr = [...data.sections];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setSections(arr);
  };

  const removeSection = (id: string) => {
    setSections(data.sections.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateSection = (id: string) => {
    const s = data.sections.find((x) => x.id === id);
    if (!s) return;
    const clone: Section = { ...s, id: newId(), name: `${s.name} (copy)`, data: { ...s.data } };
    const idx = data.sections.findIndex((x) => x.id === id);
    const arr = [...data.sections];
    arr.splice(idx + 1, 0, clone);
    setSections(arr);
    setSelectedId(clone.id);
  };

  const addSection = (type: string) => {
    const def = getSectionDef(type);
    if (!def) return;
    const s: Section = {
      id: newId(),
      type,
      name: def.label,
      enabled: true,
      data: { ...def.defaultData },
    };
    setSections([...data.sections, s]);
    setSelectedId(s.id);
    setRightTab("content");
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const arr = [...data.sections];
    const from = arr.findIndex((s) => s.id === dragId);
    const to = arr.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setSections(arr);
    setDragId(null);
  };

  // ---- preview streaming ----
  const previewPath = activePage ? `${activePage.slug}${activePage.slug.includes("?") ? "&" : "?"}preview=cms` : "";

  const pushPreview = useCallback(() => {
    const win = previewRef.current?.contentWindow;
    if (!win || !activePage) return;
    win.postMessage({ type: PREVIEW_SETTINGS, settings }, window.location.origin);
    win.postMessage({ type: PREVIEW_PAGE, page: data, slug: activePage.slug }, window.location.origin);
    win.postMessage({ type: PREVIEW_SELECT, id: selectedId }, window.location.origin);
  }, [data, settings, selectedId, activePage]);

  useEffect(() => {
    pushPreview();
  }, [pushPreview]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const t = (e.data as { type?: string; id?: string })?.type;
      if (t === PREVIEW_READY) pushPreview();
      else if (t === PREVIEW_SECTION_CLICK) {
        const id = (e.data as { id?: string }).id;
        if (id) {
          setSelectedId(id);
          setRightTab("content");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushPreview]);

  // ---- page ops ----
  const switchPage = async (id: string) => {
    setActiveId(id);
    setSelectedId(null);
    const existing = pages.find((p) => p.id === id);
    if (existing) resetTo(existing.data);
    try {
      const fresh = (await loadDraft({ data: { id } })) as PageRecord | null;
      if (fresh) {
        setPages((prev) => prev.map((p) => (p.id === id ? fresh : p)));
        resetTo(fresh.data);
      }
    } catch {
      /* keep the list copy */
    }
  };

  const refreshList = async () => {
    const list = (await loadList()) as { pages: PageRecord[]; role: string | null };
    setPages(list.pages);
    setRole(list.role);
  };

  const onCreatePage = async () => {
    const title = window.prompt("New page title", "New Page");
    if (!title) return;
    const slug = window.prompt("URL slug (e.g. /landing)", "/" + title.toLowerCase().replace(/\s+/g, "-"));
    if (!slug) return;
    try {
      const res = (await createFn({ data: { title, slug } })) as { id?: string };
      await refreshList();
      if (res.id) await switchPage(res.id);
      toast.success("Page created");
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const onDuplicatePage = async () => {
    if (!activeId) return;
    try {
      const res = (await duplicateFn({ data: { id: activeId } })) as { id?: string };
      await refreshList();
      if (res.id) await switchPage(res.id);
      toast.success("Page duplicated");
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const onDeletePage = async () => {
    if (!activeId || !activePage) return;
    if (activePage.is_system) return toast.error("System pages cannot be deleted.");
    if (!window.confirm(`Delete page "${activePage.title}"? This cannot be undone.`)) return;
    try {
      await deleteFn({ data: { id: activeId } });
      const remaining = pages.filter((p) => p.id !== activeId);
      setPages(remaining);
      if (remaining[0]) await switchPage(remaining[0].id);
      toast.success("Page deleted");
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const onRenamePage = async () => {
    if (!activeId || !activePage) return;
    const title = window.prompt("Page title", activePage.title);
    if (title == null) return;
    try {
      await renameFn({ data: { id: activeId, title } });
      setPages((prev) => prev.map((p) => (p.id === activeId ? { ...p, title } : p)));
      toast.success("Renamed");
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const onSaveDraft = async () => {
    if (!activeId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    try {
      await saveDraft({ data: { id: activeId, data } });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
      toast.success("Draft saved");
    } catch (e) {
      setSaveState("idle");
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const onPublish = async () => {
    if (!activeId) return;
    setPublishing(true);
    try {
      await publish({ data: { id: activeId, data } });
      setPages((prev) =>
        prev.map((p) => (p.id === activeId ? { ...p, status: "published", data } : p)),
      );
      // Live-refresh the public query for this page so it goes live immediately.
      await queryClient.invalidateQueries({ queryKey: ["cms-page", "public"] });
      toast.success("Published live");
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    } finally {
      setPublishing(false);
    }
  };

  const openVersions = async () => {
    setShowVersions((v) => !v);
    if (!activeId) return;
    try {
      setVersions((await versionsFn({ data: { pageId: activeId } })) as PageVersion[]);
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const onRestore = async (versionId: string) => {
    if (!activeId) return;
    if (!window.confirm("Restore this version? It will be republished live.")) return;
    try {
      await restoreFn({ data: { pageId: activeId, versionId } });
      const fresh = (await loadDraft({ data: { id: activeId } })) as PageRecord | null;
      if (fresh) resetTo(fresh.data);
      await queryClient.invalidateQueries({ queryKey: ["cms-page", "public"] });
      toast.success("Version restored & published");
      setShowVersions(false);
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    }
  };

  const selectedDef = selected ? getSectionDef(selected.type) : null;
  const deviceClass =
    device === "mobile" ? "w-[390px]" : device === "tablet" ? "w-[820px] max-w-full" : "w-full";

  const saveLabel = useMemo(
    () => (saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""),
    [saveState],
  );

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-4.5rem)] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="grid h-[calc(100vh-4.5rem)] place-items-center">
        <div className="max-w-md rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          You need an <strong>editor</strong> or <strong>admin</strong> role to use the Website
          Builder.
        </div>
      </div>
    );
  }

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
                  activePage?.status === "published" ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {activePage?.status === "published" ? "Published" : "Draft"}
            </Badge>
            {saveLabel ? (
              <span className="text-xs text-muted-foreground">{saveLabel}</span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={undo} disabled={cursor <= 0}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={cursor >= histLen - 1}>
              Redo
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={openVersions}>
              <History className="mr-1 h-4 w-4" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => activePage && window.open(activePage.slug, "_blank")}
            >
              <Eye className="mr-1 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={onSaveDraft}>
              <Save className="mr-1 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              size="sm"
              className="bg-linear-to-r from-indigo-500 to-cyan-500 text-white"
              onClick={onPublish}
              disabled={publishing || !isAdmin}
              title={isAdmin ? "" : "Only an admin can publish"}
            >
              {publishing ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-1 h-4 w-4" />
              )}
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
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCreatePage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select value={activeId ?? ""} onValueChange={switchPage}>
              <SelectTrigger className="mt-2 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} <span className="text-muted-foreground">— {p.slug}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex gap-1">
              <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs" onClick={onRenamePage}>
                Rename
              </Button>
              <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs" onClick={onDuplicatePage}>
                <Copy className="mr-1 h-3 w-3" /> Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-red-500"
                onClick={onDeletePage}
                disabled={!isAdmin || activePage?.is_system}
                title={activePage?.is_system ? "System page" : isAdmin ? "" : "Admin only"}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-b p-3">
            <div className="text-sm font-semibold">Sections</div>
            <span className="text-xs text-muted-foreground">{data.sections.length}</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {data.sections.map((s, i) => {
              const def = getSectionDef(s.type);
              return (
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
                      {def?.label ?? s.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      className="rounded p-1 hover:bg-accent disabled:opacity-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        move(s.id, -1);
                      }}
                      disabled={i === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="rounded p-1 hover:bg-accent disabled:opacity-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        move(s.id, 1);
                      }}
                      disabled={i === data.sections.length - 1}
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
                      {s.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
              );
            })}
            {data.sections.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No sections yet. Add one below.
              </div>
            ) : null}
          </div>

          <div className="border-t p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Section
            </div>
            <div className="max-h-48 space-y-3 overflow-y-auto">
              {SECTION_CATEGORIES.map((group) => (
                <div key={group.category}>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {group.category}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.defs.map((d) => (
                      <button
                        key={d.type}
                        onClick={() => addSection(d.type)}
                        className="flex flex-col items-center gap-1 rounded-lg border border-border/60 p-2 text-[11px] transition hover:border-indigo-500/40 hover:bg-indigo-500/5"
                        title={d.label}
                      >
                        <d.icon className="h-4 w-4 text-indigo-500" />
                        <span className="w-full truncate text-center">{d.label.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER — live iframe canvas */}
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
              {activePage?.title} <span className="mx-1">·</span> {activePage?.slug}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => previewRef.current?.contentWindow?.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          <div className="relative flex-1 overflow-auto bg-muted/40 p-4">
            {showVersions && (
              <div className="absolute right-4 top-4 z-20 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border bg-card p-3 shadow-xl">
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
                  {versions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No published versions yet.
                    </div>
                  ) : (
                    versions.map((v, i) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {v.label ? `${v.label} · ` : `v${versions.length - i} · `}
                          <span className="text-muted-foreground">
                            {v.created_at.replace("T", " ").slice(0, 16)}
                          </span>
                        </span>
                        <button
                          className="ml-2 rounded px-2 py-0.5 text-[11px] text-indigo-500 hover:bg-indigo-500/10 disabled:opacity-40"
                          onClick={() => onRestore(v.id)}
                          disabled={!isAdmin}
                          title={isAdmin ? "Restore" : "Admin only"}
                        >
                          Restore
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div
              className={cn(
                "mx-auto h-full overflow-hidden rounded-xl border bg-background shadow-2xl transition-all",
                deviceClass,
              )}
            >
              {previewPath ? (
                <iframe
                  ref={previewRef}
                  key={activeId}
                  src={previewPath}
                  title="Live preview"
                  className="h-full w-full border-0"
                  onLoad={pushPreview}
                />
              ) : null}
            </div>
          </div>
        </main>

        {/* RIGHT — properties */}
        <aside className="flex min-h-0 flex-col rounded-2xl border bg-card/60 backdrop-blur">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b p-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">
                  <Type className="mr-1 h-3.5 w-3.5" /> Section
                </TabsTrigger>
                <TabsTrigger value="page">
                  <Settings2 className="mr-1 h-3.5 w-3.5" /> Page
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <TabsContent value="content" className="m-0 space-y-4">
                {!selected ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Select a section — click a block in the preview or pick one on the left.
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Section name
                      </Label>
                      <Input
                        value={selected.name}
                        onChange={(e) => updateSection(selected.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="text-sm">Visible on page</div>
                      <Switch
                        checked={selected.enabled}
                        onCheckedChange={(v) => updateSection(selected.id, { enabled: v })}
                      />
                    </div>
                    {selectedDef ? (
                      <PropertyPanel
                        fields={selectedDef.fields}
                        managedNote={selectedDef.managedNote}
                        data={selected.data}
                        onChange={(next) => updateSectionData(selected.id, next)}
                        onPickImage={(setUrl) => setMediaPicker(() => setUrl)}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Unknown section type: <code>{selected.type}</code>
                      </p>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="page" className="m-0 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  SEO &amp; Metadata
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Meta title</Label>
                  <Input
                    value={data.seo?.title ?? ""}
                    onChange={(e) => commit({ ...data, seo: { ...data.seo, title: e.target.value } })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Meta description
                  </Label>
                  <Textarea
                    rows={3}
                    value={data.seo?.description ?? ""}
                    onChange={(e) =>
                      commit({ ...data, seo: { ...data.seo, description: e.target.value } })
                    }
                  />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Open Graph
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">OG title</Label>
                  <Input
                    value={data.og?.title ?? ""}
                    onChange={(e) => commit({ ...data, og: { ...data.og, title: e.target.value } })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">OG description</Label>
                  <Textarea
                    rows={2}
                    value={data.og?.description ?? ""}
                    onChange={(e) =>
                      commit({ ...data, og: { ...data.og, description: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">OG image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://…"
                      value={data.og?.image ?? ""}
                      onChange={(e) => commit({ ...data, og: { ...data.og, image: e.target.value } })}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setMediaPicker(() => (url: string) =>
                          commit({ ...data, og: { ...data.og, image: url } }),
                        )
                      }
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>

      {mediaPicker ? (
        <MediaLibrary
          asModal
          onPick={(url) => {
            mediaPicker(url);
            setMediaPicker(null);
          }}
          onClose={() => setMediaPicker(null)}
        />
      ) : null}
    </div>
  );
}
