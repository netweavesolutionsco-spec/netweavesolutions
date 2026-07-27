import { PageHeader } from "@/admin/components/PageHeader";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { Plus, Pencil, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Testimonial } from "@/data/testimonials";

export function TestimonialsPage() {
  const testimonials = useCollection<Testimonial>("testimonials");

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Manage client testimonials shown on your website."
        actions={
          <Button asChild size="sm" className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white">
            <Link to="/admin/collections" search={{ tab: "testimonials" }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Edit Testimonials
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <StatusBadge status="Published" />
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/90 italic">"{t.quote}"</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/collections" search={{ tab: "testimonials" }}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Link>
              </Button>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No testimonials found.
          </div>
        )}
      </div>
    </div>
  );
}
