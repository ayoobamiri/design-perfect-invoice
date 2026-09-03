import { createFileRoute, Link } from "@tanstack/react-router";
import { getEntries } from "@/lib/invoice-store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Portal — Power Inn Smog & Automotive" },
      {
        name: "description",
        content:
          "Staff portal for Power Inn Smog Test Only Center: create smog and automotive invoices and view saved sheets.",
      },
      { property: "og:title", content: "Staff Portal — Power Inn Smog & Automotive" },
      {
        property: "og:description",
        content:
          "Staff portal for Power Inn Smog Test Only Center: create smog and automotive invoices and view saved sheets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const [smog, setSmog] = useState({ id: "PIS", count: 0 });
  const [auto, setAuto] = useState({ id: "PIA", count: 0 });
  useEffect(() => {
    setSmog({ id: "PIS", count: getEntries("smog").length });
    setAuto({ id: "PIA", count: getEntries("auto").length });
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* backdrop accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.5 0.03 90 / 0.35), transparent 70%), radial-gradient(40% 35% at 85% 90%, oklch(0.5 0.03 90 / 0.25), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, oklch(0.98 0 0) 0 1px, transparent 1px 14px)",
        }}
      />

      <div className="relative w-full max-w-[760px]">
        {/* layered frame */}
        <div className="absolute -inset-2 rounded-md border border-paper/20" aria-hidden />
        <div className="form-box relative bg-paper px-6 py-10 text-center text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:px-14 sm:py-14">
          {/* corner screws */}
          {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map(
            (pos) => (
              <span
                key={pos}
                aria-hidden
                className={`absolute ${pos} size-1.5 rounded-full bg-ink/25`}
              />
            ),
          )}

          <p className="font-form-condensed text-[11px] font-bold tracking-[0.45em] text-ink-soft uppercase">
            Repair Order &amp; Smog Invoice System
          </p>

          <h1 className="font-form-display mt-4 text-[44px] leading-[0.95] tracking-tight sm:text-[64px]">
            POWER INN
            <span className="block">SMOG and AUTOMOTIVE</span>
          </h1>

          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-[2px] w-14 bg-ink" />
            <p className="font-form-display text-[14px] tracking-[0.35em] sm:text-[16px]">
              TEST ONLY CENTER
            </p>
            <span className="h-[2px] w-14 bg-ink" />
          </div>

          <div className="mt-6 space-y-0.5">
            <p className="text-[13px] font-semibold tracking-wide">
              4095 Power Inn Rd, Sacramento, CA 95826
            </p>
            <p className="text-[12px] font-semibold text-ink-soft">ARD 307549</p>
            <p className="font-form-mono mt-1 text-[19px] font-bold">
              (916) 877-SMOG (7664)
            </p>
          </div>

          <div className="mx-auto mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Link
              to="/invoice"
              search={{}}
              className="group rounded-sm bg-ink px-6 py-4 text-left text-paper ring-1 ring-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_-8px_rgba(0,0,0,0.5)]"
            >
              <span className="font-form-condensed block text-base font-bold uppercase">
                New Smog Invoice →
              </span>
              <span className="font-form-mono mt-1 block text-[11px] opacity-70">
                Power Inn Smog · {smog.id} number
              </span>
            </Link>
            <Link
              to="/invoice"
              search={{ brand: "auto" }}
              className="group rounded-sm bg-ink px-6 py-4 text-left text-paper ring-1 ring-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_-8px_rgba(0,0,0,0.5)]"
            >
              <span className="font-form-condensed block text-base font-bold uppercase">
                New Automotive Invoice →
              </span>
              <span className="font-form-mono mt-1 block text-[11px] opacity-70">
                Power Inn Automotive · {auto.id} number
              </span>
            </Link>
            <Link
              to="/records"
              search={{}}
              className="group rounded-sm border-2 border-ink px-6 py-4 text-left transition hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
            >
              <span className="font-form-condensed block text-base font-bold uppercase">
                Smog Sheet →
              </span>
              <span className="font-form-mono mt-1 block text-[11px] opacity-70">
                {smog.count} saved {smog.count === 1 ? "entry" : "entries"}
              </span>
            </Link>
            <Link
              to="/records"
              search={{ brand: "auto" }}
              className="group rounded-sm border-2 border-ink px-6 py-4 text-left transition hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
            >
              <span className="font-form-condensed block text-base font-bold uppercase">
                Automotive Sheet →
              </span>
              <span className="font-form-mono mt-1 block text-[11px] opacity-70">
                {auto.count} saved {auto.count === 1 ? "entry" : "entries"}
              </span>
            </Link>
          </div>

          <div className="mx-auto mt-4 grid max-w-2xl gap-3">
            <Link
              to="/submissions"
              search={{}}
              className="group rounded-sm border-2 border-ink px-6 py-4 text-left transition hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
            >
              <span className="font-form-condensed block text-base font-bold uppercase">
                Customer Submissions →
              </span>
              <span className="font-form-mono mt-1 block text-[11px] opacity-70">
                Staff only · passcode required
              </span>
            </Link>
          </div>

          <Link
            to="/"
            search={{}}
            className="mt-8 inline-block font-form-mono text-[11px] font-semibold text-ink-soft underline"
          >
            ← Back to home
          </Link>

          <p className="mt-4 font-form-mono text-[11px] text-ink-soft">
            Invoice numbers are entered manually —{" "}
            <span className="font-bold text-ink">PIS</span> for Smog,{" "}
            <span className="font-bold text-ink">PIA</span> for Automotive.
          </p>
        </div>
      </div>
    </div>
  );
}
