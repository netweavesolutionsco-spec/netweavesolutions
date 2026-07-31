import { useEffect } from "react";
import { getSectionDef } from "@/builder/registry";
import type { PageData, Section } from "@/builder/types";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isCmsPreview, PREVIEW_SECTION_CLICK } from "@/hooks/useCmsPreview";

/**
 * Renders a page's sections from CMS data using the section registry. This is
 * the single component the public site uses to display any builder-managed
 * page — its output is the composition of the registered blocks, so the
 * design stays identical to the hand-written pages they wrap.
 *
 * In CMS preview mode each section is wrapped in a click target that reports
 * selection back to the builder (click-to-edit) and highlights the section
 * currently selected in the editor.
 */
export function SectionRenderer({
  page,
  selectedId,
}: {
  page: PageData;
  selectedId?: string | null;
}) {
  const settings = useSiteSettings();
  const preview = isCmsPreview();
  const sections = (page?.sections ?? []).filter((s) => s && s.enabled !== false);

  return (
    <>
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          settings={settings}
          preview={preview}
          selected={preview && selectedId === section.id}
        />
      ))}
    </>
  );
}

function SectionBlock({
  section,
  settings,
  preview,
  selected,
}: {
  section: Section;
  settings: ReturnType<typeof useSiteSettings>;
  preview: boolean;
  selected: boolean;
}) {
  const def = getSectionDef(section.type);
  if (!def) {
    if (preview) {
      return (
        <div className="mx-auto my-4 max-w-3xl rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Unknown section type: <code>{section.type}</code>
        </div>
      );
    }
    return null;
  }

  const content = <def.Render data={section.data ?? {}} settings={settings} />;

  if (!preview) return content;

  return (
    <div
      data-cms-section-id={section.id}
      onClick={(e) => {
        e.stopPropagation();
        window.parent?.postMessage(
          { type: PREVIEW_SECTION_CLICK, id: section.id },
          "*",
        );
      }}
      className={
        "relative cursor-pointer outline-offset-[-2px] transition-[outline] hover:outline hover:outline-2 hover:outline-primary/40 " +
        (selected ? "outline outline-2 outline-primary" : "")
      }
    >
      {selected ? (
        <span className="pointer-events-none absolute left-2 top-2 z-50 rounded bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow">
          {section.name || def.label}
        </span>
      ) : null}
      {content}
    </div>
  );
}

/**
 * In preview mode, scrolls the selected section into view when the editor
 * changes selection. Mounted alongside SectionRenderer by the preview page.
 */
export function useScrollToSelected(selectedId?: string | null) {
  useEffect(() => {
    if (!isCmsPreview() || !selectedId || typeof document === "undefined") return;
    const el = document.querySelector(`[data-cms-section-id="${selectedId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId]);
}
