import { createFileRoute, Link } from "@tanstack/react-router";
import { peekNextInvoiceId } from "@/lib/invoice-store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Power Inn Smog — Test Only Center" },
      {
        name: "description",
        content:
          "Digital repair orders and smog inspection invoices for Power Inn Smog Test Only Center, 4095 Power Inn Rd, Sacramento, CA.",
      },
      { property: "og:title", content: "Power Inn Smog — Test Only Center" },
      {
        property: "og:description",
        content:
          "Digital repair orders and smog inspection invoices for Power Inn Smog Test Only Center, 4095 Power Inn Rd, Sacramento, CA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const [nextId, setNextId] = useState("PIS100");
  useEffect(() => {
    setNextId(peekNextInvoiceId());
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[720px]">
        <div className="form-box bg-paper px-6 py-10 text-center text-ink shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] sm:px-12">
          <p className="font-form-condensed text-xs font-bold tracking-[0.35em] text-ink-soft uppercase">
            Repair Order &amp; Smog Invoice System
          </p>
          <h1 className="font-form-display mt-3 text-[42px] leading-none tracking-tight sm:text-[56px]">
            POWER INN SMOG
          </h1>
          <p className="font-form-display mt-2 text-[16px] tracking-[0.3em] sm:text-[18px]">
            TEST ONLY CENTER
          </p>

          <div className="mx-auto mt-4 h-[2px] w-24 bg-ink" />

          <p className="mt-4 text-[13px] font-semibold tracking-wide">
            4095 Power Inn Rd, Sacramento, CA 95826
          </p>
          <p className="text-[12px] font-semibold">ARD 307549</p>
          <p className="mt-1 text-[18px] font-bold">(916) 877-SMOG (7664)</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/invoice"
              search={{}}
              className="w-full rounded-sm bg-ink px-8 py-3 font-form-condensed text-sm font-bold text-paper uppercase ring-1 ring-ink transition hover:opacity-90 sm:w-auto"
            >
              New Invoice
            </Link>
            <Link
              to="/records"
              className="w-full rounded-sm border-2 border-ink px-8 py-3 font-form-condensed text-sm font-bold uppercase transition hover:bg-ink hover:text-paper sm:w-auto"
            >
              View Sheet
            </Link>
          </div>

          <p className="mt-6 font-form-mono text-[11px] text-ink-soft">
            Next invoice: <span className="font-bold text-ink">{nextId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
