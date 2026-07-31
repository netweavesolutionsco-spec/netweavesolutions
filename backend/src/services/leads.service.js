import { supabaseAdmin } from "../config/supabase.js";
import { insertAdminNotification } from "./portal.service.js";

/**
 * Error thrown when the same enquiry was already submitted very recently.
 * The controller maps this to HTTP 409.
 */
export class DuplicateLeadError extends Error {
  constructor(message = "This enquiry looks like a duplicate of one you just sent.") {
    super(message);
    this.name = "DuplicateLeadError";
  }
}

/** How recent an identical enquiry must be to count as a duplicate. */
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Persists a lead to the Supabase `leads` table.
 *
 * Duplicate handling: before inserting, we look for a row with the same email
 * and message created within the last few minutes. This catches double-clicks
 * and retried requests without needing a DB-level unique constraint. We also
 * translate a Postgres unique-violation (23505) into a DuplicateLeadError in
 * case a constraint is added later.
 *
 * @returns {Promise<{ id: string, created_at: string }>}
 * @throws {DuplicateLeadError} when a matching recent enquiry already exists
 * @throws {Error} for any other persistence failure (controller maps to 500)
 */
export async function createLeadRecord(lead) {
  const sinceIso = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("email", lead.email)
    .eq("message", lead.message)
    .gte("created_at", sinceIso)
    .limit(1);

  // A failed lookup shouldn't block a genuine enquiry — log via the thrown
  // error only if it's fatal. Here we simply continue if the lookup errored,
  // because the insert is the operation that actually matters.
  if (!lookupError && existing && existing.length > 0) {
    throw new DuplicateLeadError();
  }

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      service: lead.service,
      budget: lead.budget,
      message: lead.message,
      source: lead.source,
      status: "New",
    })
    .select("id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new DuplicateLeadError();
    }
    const err = new Error(error.message || "Failed to save lead");
    err.cause = error;
    throw err;
  }

  await insertAdminNotification({
    title: "New lead received",
    description: `${lead.name} (${lead.email})${lead.service ? ` · ${lead.service}` : ""}${
      lead.company ? ` · ${lead.company}` : ""
    }`,
    userName: lead.name,
    relatedModule: "leads",
    type: "lead",
    actionUrl: "/admin/leads",
  });

  return data;
}
