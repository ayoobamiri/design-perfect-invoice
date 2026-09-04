import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

export type CustomerSubmission = {
  id: string;
  created_at: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  written_by: string;
  res_phone: string;
  bus_phone: string;
  year: string;
  make: string;
  model: string;
  license_plate: string;
  email: string;
  brand: string;
};

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "shop-gate",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

// Passcode gate temporarily disabled — staff access is open.
export const shopStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { unlocked: true };
});

export const unlockShop = createServerFn({ method: "POST" })
  .inputValidator((data: { passcode: string }) => ({
    passcode: String(data?.passcode ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    void data;
    const session = await useSession<GateSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockShop = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const listSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("customer_submissions")
    .select(
      "id, created_at, name, address, city, zip, written_by, res_phone, bus_phone, year, make, model, license_plate, email, brand",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return { unlocked: true as const, submissions: (data ?? []) as CustomerSubmission[] };
});

export const deleteSubmission = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("customer_submissions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
