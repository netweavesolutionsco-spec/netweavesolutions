import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/data/defaultSettings";

/**
 * Generic, content-driven blocks the builder can add to any page.
 * Unlike the wrapped `components/home/*` blocks (which self-source from
 * collections/settings for pixel-identical output), these render purely from
 * their per-section `data`. All are SSR-safe: no Math.random / Date.now.
 */

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Rich Text — a heading + prose body. */
export function RichTextBlock({ data }: { data: Record<string, unknown>; settings: SiteSettings }) {
  const heading = str(data.heading);
  const body = str(data.body);
  const align = str(data.align, "left");
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className={align === "center" ? "text-center" : "text-left"}>
        {heading ? (
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{heading}</h2>
        ) : null}
        {body ? (
          <div className="mt-4 whitespace-pre-line text-muted-foreground leading-relaxed">
            {body}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Custom HTML — trusted admin-authored markup. */
export function CustomHtmlBlock({ data }: { data: Record<string, unknown>; settings: SiteSettings }) {
  const html = str(data.html);
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      {/* Admin-authored, RLS-gated content. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

type ImageItem = { url?: string; alt?: string };

/** Image Grid — responsive gallery. */
export function ImageGridBlock({ data }: { data: Record<string, unknown>; settings: SiteSettings }) {
  const heading = str(data.heading);
  const images = arr<ImageItem>(data.images).filter((i) => i && str(i.url));
  const cols = Number(data.columns) || 3;
  const colClass =
    cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {heading ? (
        <h2 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">{heading}</h2>
      ) : null}
      <div className={`grid grid-cols-1 gap-4 ${colClass}`}>
        {images.map((img, i) => (
          <img
            key={`${str(img.url)}-${i}`}
            src={str(img.url)}
            alt={str(img.alt)}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
          />
        ))}
      </div>
    </section>
  );
}

/** CTA — headline + primary/secondary buttons. */
export function CtaBlock({ data }: { data: Record<string, unknown>; settings: SiteSettings }) {
  const heading = str(data.heading, "Ready to get started?");
  const subtitle = str(data.subtitle);
  const primaryLabel = str(data.primaryLabel, "Get in touch");
  const primaryTo = str(data.primaryTo, "/contact");
  const secondaryLabel = str(data.secondaryLabel);
  const secondaryTo = str(data.secondaryTo, "/");
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-3xl border border-border bg-card/60 p-10 text-center backdrop-blur">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {heading}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link to={primaryTo}>{primaryLabel}</Link>
          </Button>
          {secondaryLabel ? (
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to={secondaryTo}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type StatItem = { value?: string; label?: string };

/** Stats — a row of metric tiles. */
export function StatsBlock({ data }: { data: Record<string, unknown>; settings: SiteSettings }) {
  const heading = str(data.heading);
  const stats = arr<StatItem>(data.stats).filter((s) => s && (str(s.value) || str(s.label)));
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {heading ? (
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-foreground">
          {heading}
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={`${str(s.label)}-${i}`}
            className="rounded-2xl border border-border bg-card/50 px-6 py-8 text-center backdrop-blur"
          >
            <div className="text-3xl font-bold text-gradient md:text-4xl">{str(s.value)}</div>
            <div className="mt-2 text-sm font-medium text-muted-foreground">{str(s.label)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
