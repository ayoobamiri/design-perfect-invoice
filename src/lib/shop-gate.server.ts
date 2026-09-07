import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "shop-gate",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function requireShopUnlocked(): Promise<boolean> {
  const session = await useSession<GateSession>(sessionConfig());
  return session.data.unlocked === true;
}

export async function setShopUnlocked(value: boolean): Promise<void> {
  const session = await useSession<GateSession>(sessionConfig());
  if (value) await session.update({ unlocked: true });
  else await session.clear();
}
