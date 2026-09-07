import { createServerFn } from "@tanstack/react-start";

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

async function isUnlocked(): Promise<boolean> {
  const { requireShopUnlocked } = await import("@/lib/shop-gate.server");
  return requireShopUnlocked();
}

export const shopStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { unlocked: await isUnlocked() };
});

export const unlockShop = createServerFn({ method: "POST" })
  .inputValidator((data: { passcode: string }) => ({
    passcode: String(data?.passcode ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const expected = process.env["SHOP_PASSCODE"];
    if (!expected) throw new Error("SHOP_PASSCODE is not set");
    const { passwordMatches, setShopUnlocked } = await import("@/lib/shop-gate.server");
    if (!passwordMatches(data.passcode, expected)) {
      return { ok: false as const };
    }
    await setShopUnlocked(true);
    return { ok: true as const };
  });

export const lockShop = createServerFn({ method: "POST" }).handler(async () => {
  const { setShopUnlocked } = await import("@/lib/shop-gate.server");
  await setShopUnlocked(false);
  return { ok: true as const };
});


export const listSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isUnlocked())) {
    return { unlocked: false as const, submissions: [] as CustomerSubmission[] };
  }
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
    if (!(await isUnlocked())) {
      throw new Error("Not authorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("customer_submissions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
