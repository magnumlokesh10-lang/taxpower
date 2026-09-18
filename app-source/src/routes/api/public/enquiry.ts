// src/routes/api/public/enquiry.ts
// Receives TaxPower enquiry form submissions from the static site
// (public/js/form-backend.js) and appends a row to the connected
// Google Sheet "TaxPower Leads". Email/WhatsApp alerts stay with the
// existing Google Apps Script; this endpoint only writes the sheet row.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const SHEET_ID = "1SCQ0sruBLyi_GMcw4BEP9UvYJEkpPacCik0QZetFYRQ";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

const field = (max: number) => z.string().max(max).optional().default("");

const enquirySchema = z.object({
  submittedAt: field(60),
  name: z.string().min(1).max(120),
  company: field(160),
  mobile: field(20),
  email: field(160),
  gstin: field(20),
  address: field(500),
  city: field(120),
  state: field(120),
  product: field(300),
  purpose: field(120),
  page: field(300),
});

export const Route = createFileRoute("/api/public/enquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          const contentType = request.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            raw = await request.json();
          } else {
            const form = await request.formData();
            raw = Object.fromEntries(form.entries());
          }
        } catch {
          return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
        }

        const parsed = enquirySchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "Invalid enquiry data" }, { status: 400 });
        }
        const d = parsed.data;

        const lovableKey = process.env["LOVABLE_API_KEY"];
        const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
        if (!lovableKey || !sheetsKey) {
          console.error("enquiry: connector env vars missing");
          return Response.json({ ok: false, error: "Sheet connection not configured" }, { status: 500 });
        }

        const submittedAt =
          d.submittedAt ||
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        const row = [
          submittedAt,
          d.name,
          d.company,
          d.mobile,
          d.email,
          d.gstin,
          d.address,
          d.city,
          d.state,
          d.product,
          d.purpose,
          d.page,
        ];

        // Save the lead into the CRM database (independent of the sheet write).
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error: dbError } = await supabaseAdmin.from("leads").insert({
            submitted_at_text: submittedAt,
            name: d.name,
            company: d.company,
            mobile: d.mobile,
            email: d.email,
            gstin: d.gstin,
            address: d.address,
            city: d.city,
            state: d.state,
            product: d.product,
            purpose: d.purpose,
            page: d.page,
          });
          if (dbError) console.error(`enquiry: crm insert failed: ${dbError.message}`);
        } catch (dbErr) {
          console.error("enquiry: crm insert threw", dbErr);
        }

        const url = `${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values/Sheet1!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": sheetsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: [row] }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error(`enquiry: sheet append failed [${res.status}]: ${errBody}`);
          return Response.json({ ok: false, error: "Could not save to sheet" }, { status: 502 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
