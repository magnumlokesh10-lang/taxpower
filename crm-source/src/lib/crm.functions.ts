// Server functions for the internal CRM (leads dashboard).
// Every function requires an authenticated user AND the 'admin' role.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdminContext = { supabase: any; userId: string };

async function assertAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AdminContext);
    const { data, error } = await (context as AdminContext).supabase
      .from("leads")
      .select(
        "id, submitted_at, submitted_at_text, name, company, mobile, email, gstin, address, city, state, product, purpose, page, status, notes, followup_date, followup_note, converted_at, purchase_product, purchase_amount, invoice_no",
      )
      .order("submitted_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return { leads: data ?? [] };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "converted", "closed"]).optional(),
  notes: z.string().max(5000).optional(),
  followup_date: z.string().max(20).nullable().optional(),
  followup_note: z.string().max(5000).optional(),
  purchase_product: z.string().max(500).optional(),
  purchase_amount: z.number().nonnegative().nullable().optional(),
  invoice_no: z.string().max(120).optional(),
  mark_converted: z.boolean().optional(),
});

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AdminContext);
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch["status"] = data.status;
    if (data.notes !== undefined) patch["notes"] = data.notes;
    if (data.followup_date !== undefined)
      patch["followup_date"] = data.followup_date ? data.followup_date : null;
    if (data.followup_note !== undefined) patch["followup_note"] = data.followup_note;
    if (data.purchase_product !== undefined) patch["purchase_product"] = data.purchase_product;
    if (data.purchase_amount !== undefined) patch["purchase_amount"] = data.purchase_amount;
    if (data.invoice_no !== undefined) patch["invoice_no"] = data.invoice_no;
    if (data.mark_converted) {
      patch["status"] = "converted";
      patch["converted_at"] = new Date().toISOString();
    }
    if (data.status !== undefined && data.status !== "converted" && !data.mark_converted) {
      patch["converted_at"] = null;
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await (context as AdminContext).supabase
      .from("leads")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
