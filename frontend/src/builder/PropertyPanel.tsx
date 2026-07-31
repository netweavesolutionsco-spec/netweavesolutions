import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import type { FieldSpec } from "@/builder/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/**
 * Renders a single declarative field bound to a value, calling onChange with
 * the new value. Used for both top-level section fields and list item fields.
 */
export function FieldControl({
  field,
  value,
  onChange,
  onPickImage,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  onPickImage?: (setUrl: (url: string) => void) => void;
}) {
  switch (field.type) {
    case "text":
    case "link":
      return (
        <Row label={field.label}>
          <Input
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Row>
      );
    case "textarea":
      return (
        <Row label={field.label}>
          <Textarea
            rows={3}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.help ? (
            <p className="text-[11px] text-muted-foreground">{field.help}</p>
          ) : null}
        </Row>
      );
    case "color":
      return (
        <Row label={field.label}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={typeof value === "string" && value ? value : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
            />
            <Input
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </Row>
      );
    case "slider": {
      const num = typeof value === "number" ? value : (field.min ?? 0);
      return (
        <Row label={`${field.label} — ${num}`}>
          <Slider
            value={[num]}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            onValueChange={([v]) => onChange(v)}
          />
        </Row>
      );
    }
    case "select":
      return (
        <Row label={field.label}>
          <Select
            value={value != null ? String(value) : ""}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      );
    case "switch":
      return (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="text-sm">{field.label}</div>
          <Switch checked={value !== false} onCheckedChange={(v) => onChange(v)} />
        </div>
      );
    case "image":
      return (
        <Row label={field.label}>
          <div className="flex gap-2">
            <Input
              placeholder="https://…"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onPickImage?.((url) => onChange(url))}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {typeof value === "string" && value ? (
            <img
              src={value}
              alt=""
              className="mt-2 h-20 w-full rounded-md border object-cover"
            />
          ) : null}
        </Row>
      );
    case "list":
      return (
        <ListField
          field={field}
          value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
          onChange={(v) => onChange(v)}
          onPickImage={onPickImage}
        />
      );
    default:
      return null;
  }
}

function ListField({
  field,
  value,
  onChange,
  onPickImage,
}: {
  field: FieldSpec;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  onPickImage?: (setUrl: (url: string) => void) => void;
}) {
  const itemFields = field.itemFields ?? [];
  const addItem = () => {
    const blank: Record<string, unknown> = {};
    for (const f of itemFields) blank[f.key] = f.type === "switch" ? true : "";
    onChange([...value, blank]);
  };
  const updateItem = (i: number, key: string, v: unknown) => {
    onChange(value.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  };
  const removeItem = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={addItem}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
          No items yet.
        </div>
      ) : null}
      {value.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Item {i + 1}
            </span>
            <button
              type="button"
              className="rounded p-1 text-red-500 hover:bg-red-500/10"
              onClick={() => removeItem(i)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {itemFields.map((f) => (
            <FieldControl
              key={f.key}
              field={f}
              value={item[f.key]}
              onChange={(v) => updateItem(i, f.key, v)}
              onPickImage={onPickImage}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The full property panel for a selected section: renders every field in the
 * section's registry definition, bound to section.data. Emits a new data
 * object on any change.
 */
export function PropertyPanel({
  fields,
  data,
  onChange,
  onPickImage,
  managedNote,
}: {
  fields: FieldSpec[];
  data: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onPickImage?: (setUrl: (url: string) => void) => void;
  managedNote?: string;
}) {
  return (
    <div className="space-y-4">
      {managedNote ? (
        <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          {managedNote}
        </p>
      ) : null}
      {fields.length === 0 && !managedNote ? (
        <p className="text-xs text-muted-foreground">This section has no editable fields.</p>
      ) : null}
      {fields.map((f) => (
        <FieldControl
          key={f.key}
          field={f}
          value={data[f.key]}
          onChange={(v) => onChange({ ...data, [f.key]: v })}
          onPickImage={onPickImage}
        />
      ))}
    </div>
  );
}
