import { createServerFn } from "@tanstack/react-start";
import { requireShopUnlocked } from "@/lib/shop-gate.functions";

export type InvoiceRow = {
  id: string;
  brand: string;
  saved_at: string;
  data: Record<string, string>;
};

function normBrand(v: unknown): "smog" | "auto" {
  return v === "auto" ? "auto" : "smog";
}

function normData(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val == null) continue;
      out[k] = String(val);
    }
  }
  return out;
}

/** Pull new customer check-ins into the shared invoice sheet (once each). */
async function importCheckIns(brand: "smog" | "auto") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: subs, error } = await supabaseAdmin
    .from("customer_submissions")
    .select("*")
    .eq("brand", brand)
    .is("used_at", null)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  if (!subs || subs.length === 0) return;

  const rows = subs.map((s) => ({
    brand,
    submission_id: s.id,
    saved_at: s.created_at,
    data: {
      submission_id: s.id,
      invoice_id: brand === "auto" ? "PIA" : "PIS",
      date_in: new Date(s.created_at).toLocaleDateString("en-US"),
      name: s.name,
      address: s.address,
      city: s.city,
      zip: s.zip,
      written_by: s.written_by,
      res_phone: s.res_phone,
      bus_phone: s.bus_phone,
      year: s.year,
      make: s.make,
      model: s.model,
      license_plate: s.license_plate,
      email: s.email,
    },
  }));

  const { error: insertError } = await supabaseAdmin
    .from("invoices")
    .upsert(rows, { onConflict: "submission_id", ignoreDuplicates: true });
  if (insertError) throw new Error(insertError.message);

  const { error: markError } = await supabaseAdmin
    .from("customer_submissions")
    .update({ used_at: new Date().toISOString() })
    .in(
      "id",
      subs.map((s) => s.id),
    );
  if (markError) throw new Error(markError.message);
}

export const listInvoices = createServerFn({ method: "GET" })
  .inputValidator((data: { brand?: string }) => ({ brand: normBrand(data?.brand) }))
  .handler(async ({ data }) => {
    if (!(await requireShopUnlocked())) {
      return { unlocked: false as const, invoices: [] as InvoiceRow[] };
    }
    await importCheckIns(data.brand);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("invoices")
      .select("id, brand, saved_at, data")
      .eq("brand", data.brand)
      .order("saved_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return {
      unlocked: true as const,
      invoices: (rows ?? []).map((r) => ({
        id: r.id,
        brand: r.brand,
        saved_at: r.saved_at,
        data: normData(r.data),
      })) as InvoiceRow[],
    };
  });

export const getInvoice = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    if (!(await requireShopUnlocked())) return { invoice: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("invoices")
      .select("id, brand, saved_at, data")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      invoice: row
        ? ({ id: row.id, brand: row.brand, saved_at: row.saved_at, data: normData(row.data) } as InvoiceRow)
        : null,
    };
  });

export const saveInvoice = createServerFn({ method: "POST" })
  .inputValidator((input: { id?: string; brand?: string; data: Record<string, string> }) => ({
    id: input?.id ? String(input.id) : null,
    brand: normBrand(input?.brand),
    data: normData(input?.data),
  }))
  .handler(async ({ data }) => {
    if (!(await requireShopUnlocked())) throw new Error("Not authorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const invoiceNumber = (data.data["invoice_id"] ?? "").trim().toUpperCase();
    if (invoiceNumber && invoiceNumber !== "PIS" && invoiceNumber !== "PIA") {
      const { data: existing, error: clashError } = await supabaseAdmin
        .from("invoices")
        .select("id, data")
        .eq("brand", data.brand)
        .limit(500);
      if (clashError) throw new Error(clashError.message);
      const clash = (existing ?? []).some(
        (row) =>
          row.id !== data.id &&
          String((row.data as Record<string, unknown>)?.["invoice_id"] ?? "")
            .trim()
            .toUpperCase() === invoiceNumber,
      );
      if (clash) return { ok: false as const, reason: "duplicate" as const };
    }

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("invoices")
        .update({ data: data.data, saved_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, id: data.id };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("invoices")
      .insert({ brand: data.brand, data: data.data, saved_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: inserted.id };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    if (!(await requireShopUnlocked())) throw new Error("Not authorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const countInvoices = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireShopUnlocked())) return { smog: 0, auto: 0 };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await supabaseAdmin.from("invoices").select("brand").limit(1000);
  if (error) throw new Error(error.message);
  return {
    smog: (rows ?? []).filter((r) => r.brand !== "auto").length,
    auto: (rows ?? []).filter((r) => r.brand === "auto").length,
  };
});
