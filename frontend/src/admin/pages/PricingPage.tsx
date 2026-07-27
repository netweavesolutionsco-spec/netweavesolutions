import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDraftCollection, saveDraftCollection, publishCollection } from "@/lib/collections.functions";
import { PageHeader } from "@/admin/components/PageHeader";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Pencil, Plus, Star, Save, Upload, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Plan } from "@/data/pricing";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";
import { invalidatePublishedContent } from "@/hooks/siteContentSync";

export function PricingPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  const draftFn = useServerFn(getDraftCollection);
  const saveFn = useServerFn(saveDraftCollection);
  const publishFn = useServerFn(publishCollection);

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formMonthlyPrice, setFormMonthlyPrice] = useState("");
  const [formMonthlyPeriod, setFormMonthlyPeriod] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formCta, setFormCta] = useState("");
  const [formFeaturesText, setFormFeaturesText] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    draftFn({ data: { key: "pricing" } })
      .then((data) => {
        setPlans(data as Plan[]);
      })
      .catch((e) => toast.error(e?.message ?? "Failed to load pricing plans"))
      .finally(() => setLoading(false));
  }, [isAdmin, draftFn]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { key: "pricing", items: plans as any[] } }),
    onSuccess: () => {
      toast.success("Draft saved");
      setDirty(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Save draft failed"),
  });

  const publish = useMutation({
    mutationFn: () => publishFn({ data: { key: "pricing", items: plans as any[] } }),
    onSuccess: () => {
      toast.success("Published live! Website updated.");
      setDirty(false);
      invalidatePublishedContent(qc);
    },
    onError: (e: any) => toast.error(e?.message ?? "Publish live failed"),
  });

  const openEdit = (plan: Plan, idx: number) => {
    setEditingPlan(plan);
    setEditingIndex(idx);
    setFormName(plan.name);
    setFormPrice(plan.price);
    setFormPeriod(plan.period);
    setFormMonthlyPrice(plan.monthlyPrice || "");
    setFormMonthlyPeriod(plan.monthlyPeriod || "");
    setFormTagline(plan.tagline);
    setFormFeatured(!!plan.featured);
    setFormCta(plan.cta || "Get Started");
    setFormFeaturesText(plan.features.join("\n"));
  };

  const savePlanEdit = () => {
    if (editingIndex === null) return;
    const updatedPlan: Plan = {
      name: formName,
      price: formPrice,
      period: formPeriod,
      monthlyPrice: formMonthlyPrice || undefined,
      monthlyPeriod: formMonthlyPeriod || undefined,
      tagline: formTagline,
      featured: formFeatured,
      cta: formCta,
      features: formFeaturesText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    const nextPlans = [...plans];
    nextPlans[editingIndex] = updatedPlan;
    setPlans(nextPlans);
    setDirty(true);
    setEditingPlan(null);
    setEditingIndex(null);
    toast.success("Plan updated (unsaved draft)");
  };

  const addPlan = () => {
    const newPlan: Plan = {
      name: "New Plan",
      price: "₹0",
      period: "one-time",
      tagline: "Description of the plan.",
      features: ["Feature 1", "Feature 2"],
      cta: "Get Started",
    };
    setPlans([...plans, newPlan]);
    setDirty(true);
    toast.success("New plan added. Click Edit to customize.");
  };

  const removePlan = (idx: number) => {
    setPlans(plans.filter((_, i) => i !== idx));
    setDirty(true);
    toast.success("Plan removed from draft");
  };

  const movePlan = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= plans.length) return;
    const next = [...plans];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setPlans(next);
    setDirty(true);
  };

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" />;

  return (
    <div>
      <PageHeader
        title="Pricing"
        description="Manage packages, tiers and public pricing shown on your website."
        actions={
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-xs text-muted-foreground mr-2 border border-dashed border-border/80 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
            <Button variant="outline" size="sm" onClick={addPlan}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Tier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save draft
            </Button>
            <Button
              className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
              size="sm"
              onClick={() => publish.mutate()}
              disabled={publish.isPending}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Publish Live
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((p, idx) => (
          <div
            key={idx}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-lg",
              p.featured &&
                "border-[var(--brand)]/40 shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--brand)_45%,transparent)]",
            )}
          >
            {p.featured && (
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] px-2 py-0.5 text-[10px] font-semibold text-white">
                <Star className="h-3 w-3" /> POPULAR
              </div>
            )}
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {p.name}
            </div>
            <div className="mt-3 flex flex-col">
              <div className="flex items-baseline gap-1">
                <div className="font-display text-4xl font-semibold">{p.price}</div>
                <div className="text-xs text-muted-foreground">/ {p.period}</div>
              </div>
              {p.monthlyPrice && (
                <div className="text-xs text-muted-foreground mt-1">
                  Monthly: {p.monthlyPrice} / {p.monthlyPeriod}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 h-8">
              {p.tagline}
            </p>
            <ul className="mt-5 space-y-2 text-sm border-t border-border/40 pt-4 min-h-[160px]">
              {p.features.map((f, fIdx) => (
                <li key={fIdx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-foreground/80 leading-tight">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => movePlan(idx, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={idx === plans.length - 1}
                  onClick={() => movePlan(idx, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removePlan(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(p, idx)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Editing Dialog */}
      <Dialog open={editingPlan !== null} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Tier</DialogTitle>
            <DialogDescription>Modify package rates and descriptions shown publicly.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-price">Price (One-Time / Base)</Label>
                <Input
                  id="plan-price"
                  value={formPrice}
                  placeholder="e.g. ₹15,000"
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-period">Period</Label>
                <Input
                  id="plan-period"
                  value={formPeriod}
                  placeholder="e.g. one-time"
                  onChange={(e) => setFormPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-mprice">Monthly Price (Optional)</Label>
                <Input
                  id="plan-mprice"
                  value={formMonthlyPrice}
                  placeholder="e.g. ₹3,500"
                  onChange={(e) => setFormMonthlyPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-mperiod">Monthly Period</Label>
                <Input
                  id="plan-mperiod"
                  value={formMonthlyPeriod}
                  placeholder="e.g. month"
                  onChange={(e) => setFormMonthlyPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan-tagline">Tagline</Label>
              <Input
                id="plan-tagline"
                value={formTagline}
                onChange={(e) => setFormTagline(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan-cta">CTA Button Label</Label>
              <Input
                id="plan-cta"
                value={formCta}
                onChange={(e) => setFormCta(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan-features">Features (One per line)</Label>
              <Textarea
                id="plan-features"
                rows={6}
                value={formFeaturesText}
                placeholder="Feature 1&#10;Feature 2"
                onChange={(e) => setFormFeaturesText(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <Label htmlFor="plan-featured" className="cursor-pointer">Highlight / Feature this Plan</Label>
              <Switch
                id="plan-featured"
                checked={formFeatured}
                onCheckedChange={(checked) => setFormFeatured(checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Cancel
            </Button>
            <Button onClick={savePlanEdit}>
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
