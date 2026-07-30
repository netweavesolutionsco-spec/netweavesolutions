import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Search, Globe, ImageIcon, Code2 } from "lucide-react";

const EVENT = "codenest:open-seo";
export function openSeoDrawer() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function SeoAuditDrawer() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("https://Netweavesolutions.com");
  const [title, setTitle] = useState("Netweavesolutions — Premium Software Development Agency");
  const [desc, setDesc] = useState(
    "Transforming ideas into powerful digital solutions. Web, mobile, ERP & AI.",
  );

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const titleLen = title.length;
  const descLen = desc.length;
  const titleScore = titleLen >= 40 && titleLen <= 60 ? 100 : titleLen > 0 ? 60 : 0;
  const descScore = descLen >= 120 && descLen <= 160 ? 100 : descLen > 0 ? 60 : 0;
  const overall = Math.round((titleScore + descScore + 90 + 85) / 4);

  const checks = [
    { ok: titleScore === 100, label: `Title tag (${titleLen}/60 chars)` },
    { ok: descScore === 100, label: `Meta description (${descLen}/160 chars)` },
    { ok: true, label: "Open Graph tags present" },
    { ok: true, label: "Twitter card configured" },
    { ok: true, label: "Canonical URL set" },
    { ok: true, label: "Structured data (JSON-LD)" },
    { ok: false, label: "Sitemap.xml discoverable" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="bg-gradient-brand p-6 text-primary-foreground">
          <SheetHeader>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-90">
              <Search className="h-4 w-4" /> SEO Audit
            </div>
            <SheetTitle className="text-primary-foreground text-2xl">
              Preview & audit meta
            </SheetTitle>
            <SheetDescription className="text-primary-foreground/80">
              Live SERP preview, Open Graph card and quick health check.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <div>
              <Label>URL</Label>
              <div className="mt-1 flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Meta title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Recommended 40–60</span>
                <span>{titleLen} chars</span>
              </div>
            </div>
            <div>
              <Label>Meta description</Label>
              <Textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="mt-1"
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Recommended 120–160</span>
                <span>{descLen} chars</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Google preview
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-xs text-muted-foreground truncate">{url}</div>
              <div className="text-lg text-primary hover:underline cursor-pointer truncate">
                {title}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">{desc}</div>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="aspect-[1.91/1] bg-gradient-brand relative">
              <div className="absolute inset-0 grid place-items-center">
                <ImageIcon className="h-10 w-10 text-primary-foreground/70" />
              </div>
            </div>
            <div className="p-3">
              <div className="text-[11px] uppercase text-muted-foreground truncate">
                {new URL(url.startsWith("http") ? url : `https://${url}`).hostname}
              </div>
              <div className="mt-0.5 font-semibold text-sm line-clamp-1">{title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Health check</div>
              <Badge variant="secondary" className="text-xs">
                {overall}/100
              </Badge>
            </div>
            <Progress value={overall} className="mt-2 h-1.5" />
            <ul className="mt-3 space-y-1.5 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span
                    className={
                      "grid h-4 w-4 place-items-center rounded-full " +
                      (c.ok
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-amber-500/15 text-amber-500")
                    }
                  >
                    {c.ok ? <Check className="h-3 w-3" /> : "!"}
                  </span>
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3 w-3" /> JSON-LD
            </div>
            <pre className="mt-2 text-[10px] leading-relaxed text-muted-foreground overflow-x-auto">{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Netweavesolutions",
  "url": "${url}"
}`}</pre>
          </div>

          <Button className="w-full" onClick={() => setOpen(false)}>
            Close audit
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

