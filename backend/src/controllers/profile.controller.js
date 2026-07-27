import { z } from "zod";
import { updateClient, toSafeClient } from "../services/clientService.js";

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  companyName: z.string().trim().max(200).optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  gstNumber: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),
  website: z.string().trim().url().max(300).optional().nullable().or(z.literal("")),
  linkedin: z.string().trim().url().max(300).optional().nullable().or(z.literal("")),
  timezone: z.string().trim().max(80).optional().nullable(),
  profilePhotoUrl: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
  companyLogoUrl: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
});

export async function getProfile(req, res) {
  return res.json({ client: toSafeClient(req.client) });
}

export async function updateProfile(req, res) {
  const updatedClient = await updateClient(req.client.id, req.body);
  return res.json({ ok: true, client: toSafeClient(updatedClient) });
}
