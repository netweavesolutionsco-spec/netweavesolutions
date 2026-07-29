import { useState } from "react";
import { cn } from "@/lib/utils";
import logoImage from "../assets/logo.png";

/**
 * Official NetweaveSolutions logo mark.
 *
 * Renders the real brand image (imported so Vite fingerprints + serves it at
 * the right resolution, which keeps it crisp on retina displays). Height is
 * responsive — 36px on mobile, 42px on desktop — with width:auto so the
 * source aspect ratio (353×204) is preserved and the image never distorts.
 *
 * If the image fails to load, we fall back to the "NW" initials inside a
 * styled brand circle rather than showing a broken image or a code glyph.
 */
export function LogoMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-(--brand) via-(--brand-3) to-(--brand-2) text-white shadow-md md:h-[42px] md:w-[42px]",
          className,
        )}
        role="img"
        aria-label="NetweaveSolutions"
      >
        <span className="text-sm font-semibold tracking-tight md:text-base">NW</span>
      </span>
    );
  }

  return (
    <img
      src={logoImage}
      alt="NetweaveSolutions"
      width={353}
      height={204}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-9 w-auto shrink-0 object-contain md:h-[42px]", className)}
    />
  );
}

export function Logo({
  className,
  showWordmark = true,
  wordmark = "Netweavesolutions",
}: {
  className?: string;
  showWordmark?: boolean;
  wordmark?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="font-display font-semibold text-[15px] tracking-tight text-foreground">
          {wordmark}
        </span>
      )}
    </span>
  );
}
