import { z } from "zod";
import { buildApiUrl } from "@/lib/client-api";

export const SERVICES = [
  "Website Development",
  "School/Hospital ERP",
  "Mobile App",
  "Custom Software",
  "UI/UX Design",
  "Other",
] as const;

export const BUDGETS = [
  "₹15,000 - ₹35,000",
  "₹35,000 - ₹75,000",
  "₹75,000 - ₹1,50,000",
  "₹1,50,000+",
  "Not sure yet",
] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  service: z.string().trim().min(1, "Choose a service"),
  budget: z.string().trim().min(1, "Choose a budget range"),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a bit more — at least 10 characters")
    .max(2000, "Please keep it under 2000 characters"),
});

export type LeadInput = z.infer<typeof leadSchema>;

export interface SubmitLeadResult {
  ok: true;
  id?: string;
  createdAt?: string;
}

/**
 * Posts an enquiry to the backend, which persists it to Supabase and fires the
 * email + WhatsApp notifications. `botField` is a honeypot — it is rendered
 * hidden and must stay empty.
 */
export async function submitLead(
  input: LeadInput & { source?: string; botField?: string },
): Promise<SubmitLeadResult> {
  const res = await fetch(buildApiUrl("/leads"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      source: input.source ?? "website",
      botField: input.botField ?? "",
    }),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const record = data as { error?: unknown; issues?: { message?: string }[] } | null;
    const issueMessage = record?.issues?.[0]?.message;
    const message =
      issueMessage ||
      (record?.error ? String(record.error) : "") ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as SubmitLeadResult;
}
