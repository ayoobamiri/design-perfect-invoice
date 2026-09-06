import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { shopStatus, unlockShop } from "@/lib/shop-gate.functions";

export function StaffGate({ children }: { children: ReactNode }) {
  const status = useServerFn(shopStatus);
  const unlock = useServerFn(unlockShop);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await status({});
      setUnlocked(res.unlocked);
    } catch {
      setUnlocked(false);
    }
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await unlock({ data: { passcode } });
    if (!res.ok) {
      setError("Incorrect passcode.");
      return;
    }
    setError("");
    setPasscode("");
    setUnlocked(true);
  }

  if (unlocked === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-paper/70">
        Loading…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form onSubmit={onSubmit} className="form-box w-full max-w-sm bg-paper px-7 py-9 text-ink">
          <h1 className="font-form-display text-[26px]">Staff Access</h1>
          <p className="mt-1 text-sm text-ink-soft">Enter the shop passcode to continue.</p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoComplete="current-password"
            className="mt-5 w-full rounded-sm border-2 border-ink bg-paper px-3 py-3 text-lg outline-none"
          />
          {error && <p className="mt-2 text-sm font-bold text-red-700">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-sm bg-ink px-4 py-3 font-bold text-paper uppercase"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
