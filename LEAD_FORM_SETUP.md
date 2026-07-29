# Lead Enquiry Form — Setup Guide

The homepage now ends with a **Reach Out for Expert Assistance** section. When a visitor
submits it, three things happen:

1. The enquiry is saved to the Supabase `leads` table and appears in **Admin → Leads**.
2. An alert email goes to the company inbox, and a thank-you auto-reply goes to the client.
3. A WhatsApp message is sent to the company number via the Meta WhatsApp Cloud API.

Steps 2 and 3 are best-effort — if SMTP or WhatsApp is misconfigured, the lead is still
saved and the visitor still sees a success message. Failures are logged to the backend
console, so check Render logs if a notification doesn't arrive.

---

## 1. Run the database migration

The form writes columns that didn't exist before (`phone`, `service`, `budget`, `source`),
and the admin Leads page previously couldn't read anything because the table had no SELECT
policy. Both are fixed by `supabase/migrations/20260729120000_leads_enquiry_form.sql`.

Apply it either with the CLI:

```sh
supabase db push
```

or by pasting the file's contents into the Supabase dashboard SQL editor and running it.

Until this migration runs, submissions will fail and the Leads page will stay empty.

---

## 2. Configure email (SMTP)

The backend already uses nodemailer for account verification, so if login emails work today,
lead emails will too. Set these on your Render service:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Your mail provider credentials |
| `SMTP_FROM` | Sender shown to recipients, e.g. `Netweavesolutions <noreply@netweavesolutions.tech>` |
| `LEAD_NOTIFY_EMAIL` | Inbox that receives enquiry alerts. Defaults to `netweavesolutions.co@gmail.com` |

If `SMTP_HOST` is empty the backend logs emails to the console instead of sending them,
which is handy in local development.

Gmail note: use an **App Password**, not the account password, with
`SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`.

---

## 3. Configure WhatsApp (Meta Cloud API)

Go to [Meta for Developers](https://developers.facebook.com/) → create or open your app →
add the **WhatsApp** product. From the **API Setup** page you get a Phone number ID and a
temporary access token.

Set these on Render:

```
WHATSAPP_PHONE_NUMBER_ID=<from API Setup>
WHATSAPP_ACCESS_TOKEN=<permanent token, see below>
WHATSAPP_TO=918434554873
WHATSAPP_TEMPLATE_NAME=new_lead_alert
WHATSAPP_TEMPLATE_LANG=en
```

`WHATSAPP_TO` is E.164 without the `+`. Comma-separate to alert several people.

### Get a permanent access token

The token on the API Setup page expires in 24 hours. For production, create a System User
in **Business Settings → Users → System Users**, assign it your WhatsApp app with
`whatsapp_business_messaging` permission, and generate a non-expiring token.

### Create the message template

Meta does not allow free-form messages to a number that hasn't messaged you in the last 24
hours, so the alert is sent as an approved template. In **WhatsApp Manager → Message
Templates**, create one named `new_lead_alert`, category **Utility**, with this body:

```
New project enquiry received.

Name: {{1}}
Service: {{2}}
Phone: {{3}}

Message: {{4}}
```

The four placeholders are filled with name, service, phone, and message in that order.
Approval usually takes a few minutes to a few hours.

### Local testing shortcut

If you send a WhatsApp message to your business number first, you can skip templates for
24 hours by setting `WHATSAPP_USE_TEXT=true`. This sends a nicely formatted plain-text
message instead. Don't use it in production — it will silently fail outside the 24h window.

### Leaving WhatsApp off

Leave `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` blank. The backend logs
`[whatsapp] not configured — skipping notification` and everything else works normally.

---

## 4. Verify it works

1. Open the homepage, scroll to the bottom, and submit the form with a real email address.
2. Confirm the success state with confetti appears.
3. Check **Admin → Leads** — the enquiry should be at the top with status **New**.
4. Check the company inbox for the alert and the submitter's inbox for the auto-reply.
5. Check WhatsApp for the alert.

If the enquiry saves but notifications don't arrive, the backend logs will name the exact
failure (`[leads] admin email failed: …`).

---

## Spam protection

Three layers, all already active:

- A hidden honeypot field. Bots fill it, humans can't see it. Filled submissions are
  silently discarded and still return success so scrapers get no feedback.
- Rate limiting of 5 submissions per IP per 15 minutes on `POST /leads`.
- Zod validation on both the browser and the server — the server never trusts the client.

---

## Files involved

| File | Role |
| --- | --- |
| `supabase/migrations/20260729120000_leads_enquiry_form.sql` | New columns, indexes, admin RLS policies |
| `backend/src/routes/leads.routes.js` | `POST /leads` with rate limiting |
| `backend/src/controllers/leads.controller.js` | Validation, Supabase insert, notification fan-out |
| `backend/src/utils/mailer.js` | `newLead` and `leadThankYou` email templates |
| `backend/src/utils/whatsapp.js` | Meta Cloud API client |
| `frontend/src/routes/leads.ts` | Same-origin proxy so the browser never hits CORS |
| `frontend/src/lib/leads.ts` | Shared schema, service/budget options, submit helper |
| `frontend/src/components/home/expert-assistance-form.tsx` | The form section |
| `frontend/src/admin/pages/LeadsPage.tsx` | Admin table, status editing, detail dialog |

The `/contact` page form was previously a mock that discarded submissions — it now posts
through the same endpoint, tagged with `source: contact-page`.
