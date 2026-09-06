import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  deleteSubmission,
  listSubmissions,
  lockShop,
  unlockShop,
  type CustomerSubmission,
} from "@/lib/shop-gate.functions";
import { PENDING_CUSTOMER_KEY } from "@/lib/pending-customer";
import { saveEntry } from "@/lib/invoice-store";

export const Route = createFileRoute("/submissions")({
  head: () => ({
    meta: [
      { title: "Customer Submissions — Power Inn Smog & Automotive" },
      {
        name: "description",
        content:
          "Staff view of customer information submitted from the shop iPad, ready to load into a smog or automotive invoice.",
      },
      { property: "og:title", content: "Customer Submissions — Power Inn" },
      {
        property: "og:description",
        content: "Staff view of customer check-in submissions from the shop iPad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const navigate = useNavigate();
  const list = useServerFn(listSubmissions);
  const unlock = useServerFn(unlockShop);
  const lock = useServerFn(lockShop);
  const remove = useServerFn(deleteSubmission);

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [rows, setRows] = useState<CustomerSubmission[]>([]);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const res = await list({});
    setUnlocked(res.unlocked);
    setRows(res.submissions);
  }, [list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    const res = await unlock({ data: { passcode } });
    if (!res.ok) {
      setError("Incorrect passcode.");
      return;
    }
    setError("");
    setPasscode("");
    await refresh();
  }

  function toInvoiceData(row: CustomerSubmission): Record<string, string> {
    return {
      name: row.name,
      address: row.address,
      city: row.city,
      zip: row.zip,
      written_by: row.written_by,
      res_phone: row.res_phone,
      bus_phone: row.bus_phone,
      year: row.year,
      make: row.make,
      model: row.model,
      license_plate: row.license_plate,
      email: row.email,
    };
  }

  function sendToInvoice(row: CustomerSubmission, brand: "smog" | "auto") {
    const data = toInvoiceData(row);
    sessionStorage.setItem(PENDING_CUSTOMER_KEY, JSON.stringify(data));
    navigate({
      to: "/invoice",
      search: brand === "auto" ? { brand: "auto", new: "1" } : { new: "1" },
    });
  }

  function addToSheet(row: CustomerSubmission, brand: "smog" | "auto") {
    const data = toInvoiceData(row);
    data["date_in"] = new Date().toLocaleDateString();
    data["invoice_id"] = brand === "auto" ? "PIA" : "PIS";
    saveEntry(
      {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        data,
      },
      brand,
    );
    setNotice(
      `${row.name || "Customer"} added to the ${brand === "auto" ? "Automotive" : "Smog"} sheet.`,
    );
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
        <form
          onSubmit={onUnlock}
          className="form-box w-full max-w-sm bg-paper px-7 py-9 text-ink"
        >
          <h1 className="font-form-display text-[26px]">Staff Access</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Enter the shop passcode to view customer submissions.
          </p>
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
          <Link
            to="/staff"
            search={{}}
            className="mt-4 block text-center text-xs font-semibold underline"
          >
            Back to Staff
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-form-display text-[26px] text-paper">
            Customer Submissions
          </h1>
          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
            <Link
              to="/staff"
              search={{}}
              className="rounded-sm border border-paper/40 px-3 py-2 text-paper"
            >
              Staff Home
            </Link>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-sm border border-paper/40 px-3 py-2 text-paper"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={async () => {
                await lock({});
                setUnlocked(false);
                setRows([]);
              }}
              className="rounded-sm border border-paper/40 px-3 py-2 text-paper"
            >
              Lock
            </button>
          </div>
        </div>

        {notice && (
          <p className="mb-3 rounded-sm bg-paper px-4 py-2 text-sm font-bold text-ink">
            {notice}{" "}
            <Link to="/records" search={{}} className="underline">
              Open Smog Sheet
            </Link>{" "}
            ·{" "}
            <Link to="/records" search={{ brand: "auto" }} className="underline">
              Open Automotive Sheet
            </Link>
          </p>
        )}

        {rows.length === 0 ? (
          <div className="form-box bg-paper px-6 py-10 text-center text-ink">
            No customer submissions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="form-box bg-paper px-5 py-4 text-ink">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-form-condensed text-lg font-bold uppercase">
                    {r.name || "No name"}
                  </span>
                  <span className="font-form-mono text-[11px] text-ink-soft">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-3">
                  <Info label="Address" value={r.address} />
                  <Info label="City" value={r.city} />
                  <Info label="Zip" value={r.zip} />
                  <Info label="Written By" value={r.written_by} />
                  <Info label="Res. Phone" value={r.res_phone} />
                  <Info label="Bus. Phone" value={r.bus_phone} />
                  <Info label="Year" value={r.year} />
                  <Info label="Make" value={r.make} />
                  <Info label="Model" value={r.model} />
                  <Info label="License Plate" value={r.license_plate} />
                  <Info label="Email" value={r.email} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => sendToInvoice(r, "smog")}
                    className="rounded-sm bg-ink px-3 py-2 text-paper"
                  >
                    Use in Smog Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToInvoice(r, "auto")}
                    className="rounded-sm bg-ink px-3 py-2 text-paper"
                  >
                    Use in Automotive Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => addToSheet(r, "smog")}
                    className="rounded-sm border-2 border-ink px-3 py-2"
                  >
                    Add to Smog Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => addToSheet(r, "auto")}
                    className="rounded-sm border-2 border-ink px-3 py-2"
                  >
                    Add to Automotive Sheet
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete submission for ${r.name || "this customer"}?`))
                        return;
                      await remove({ data: { id: r.id } });
                      await refresh();
                    }}
                    className="rounded-sm border-2 border-ink px-3 py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-form-condensed text-[10px] tracking-wide text-ink-soft uppercase">
        {label}:{" "}
      </span>
      <span className="font-semibold">{value || "—"}</span>
    </p>
  );
}
