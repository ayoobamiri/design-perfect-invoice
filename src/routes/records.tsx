import { createFileRoute, Link } from "@tanstack/react-router";
import { StaffGate } from "@/components/StaffGate";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  entriesToCsv,
  type InvoiceEntry,
  BRANDS,
  toBrand,
} from "@/lib/invoice-store";
import { deleteInvoice, listInvoices } from "@/lib/invoices.functions";
import { unlockShop } from "@/lib/shop-gate.functions";


export const Route = createFileRoute("/records")({
  validateSearch: (s: Record<string, unknown>): { brand?: string } => ({
    ...(s["brand"] === "auto" ? { brand: "auto" } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Saved Entries — Power Inn Smog & Automotive" },
      {
        name: "description",
        content: "Sheet of all saved repair order and smog invoice entries for Power Inn Smog.",
      },
      { property: "og:title", content: "Saved Entries — Power Inn Smog" },
      {
        property: "og:description",
        content: "Sheet of all saved repair order and smog invoice entries for Power Inn Smog.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <StaffGate>
      <RecordsPage />
    </StaffGate>
  ),
});

const COLS: Array<[string, string]> = [
  ["invoice_id", "Invoice ID"],
  ["date_in", "Date In"],
  ["name", "Name"],
  ["year", "Year"],
  ["make", "Make"],
  ["model", "Model"],
  ["license_plate", "Plate"],
  ["vin", "VIN"],
  ["odometer", "Odometer"],
  ["invoice_total", "Total"],
];


function RecordsPage() {
  const { brand: brandParam } = Route.useSearch();
  const brand = toBrand(brandParam);
  const search = brand === "auto" ? { brand: "auto" as const } : {};
  const [entries, setEntries] = useState<InvoiceEntry[]>([]);
  const list = useServerFn(listInvoices);
  const remove = useServerFn(deleteInvoice);
  const uploadLegacy = useServerFn(importLegacyInvoices);
  const unlock = useServerFn(unlockShop);
  const [access, setAccess] = useState<"loading" | "locked" | "unlocked" | "error">(
    "loading",
  );
  const [passcode, setPasscode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [legacyCount, setLegacyCount] = useState(0);

  const legacyKey = brand === "auto" ? "power-inn-auto-entries" : "power-inn-smog-entries";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(legacyKey);
      const parsed = raw ? (JSON.parse(raw) as InvoiceEntry[]) : [];
      setLegacyCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setLegacyCount(0);
    }
  }, [legacyKey]);


  const importSubmissions = useCallback(async () => {
    const res = await list({ data: { brand } });
    if (!res.unlocked) {
      setAccess("locked");
      return;
    }
    setEntries(
      res.invoices.map((row) => ({ id: row.id, savedAt: row.saved_at, data: row.data })),
    );
    setAccess("unlocked");
  }, [brand, list]);

  useEffect(() => {
    setEntries([]);
    setExpandedSafe(null);

    let cancelled = false;
    (async () => {
      try {
        await importSubmissions();
      } catch {
        if (!cancelled) setAccess("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand, importSubmissions]);

  useEffect(() => {
    if (access !== "unlocked") return;
    const timer = window.setInterval(() => {
      void importSubmissions();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [access, importSubmissions]);
  const [expanded, setExpanded] = useState<string | null>(null);
  function setExpandedSafe(v: string | null) {
    setExpanded(v);
  }

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    setAccessError("");
    try {
      const result = await unlock({ data: { passcode } });
      if (!result.ok) {
        setAccessError("Incorrect passcode.");
        return;
      }
      setPasscode("");
      await importSubmissions();
    } catch {
      setAccessError("Unable to connect. Please try again.");
    }
  }

  const downloadCsv = () => {
    const blob = new Blob([entriesToCsv(entries)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brand === "auto" ? "power-inn-automotive" : "power-inn-smog"}-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [pendingDelete, setPendingDelete] = useState<InvoiceEntry | null>(null);

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await remove({ data: { id } });
    } catch {
      /* ignore */
    }
    await importSubmissions();
  };


  return (
    <div className="min-h-screen bg-background px-2 py-6 text-paper sm:px-4">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-form-display)" }}
          >
            SAVED ENTRIES — {BRANDS[brand].label.toUpperCase()}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={downloadCsv}
              disabled={entries.length === 0}
              className="rounded-sm bg-paper px-4 py-2 font-form-condensed text-xs font-bold text-ink uppercase hover:opacity-90 disabled:opacity-40"
            >
              Download Sheet (CSV)
            </button>
            <Link
              to="/invoice"
              search={{ ...search, new: "1" }}
              className="rounded-sm border border-paper/60 px-4 py-2 font-form-condensed text-xs font-bold uppercase hover:bg-paper/10"
            >
              New Invoice
            </Link>
            <Link
              to="/staff"
              search={{}}
              className="rounded-sm border border-paper/60 px-4 py-2 font-form-condensed text-xs font-bold uppercase hover:bg-paper/10"
            >
              Staff Home
            </Link>

          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {(["smog", "auto"] as const).map((b) => (
            <Link
              key={b}
              to="/records"
              search={b === "auto" ? { brand: "auto" } : {}}
              className={`rounded-sm px-4 py-2 font-form-condensed text-xs font-bold uppercase ${
                brand === b
                  ? "bg-paper text-ink"
                  : "border border-paper/60 hover:bg-paper/10"
              }`}
            >
              {BRANDS[b].label}
            </Link>
          ))}
        </div>

        {access === "locked" && (
          <form
            onSubmit={onUnlock}
            className="mt-4 flex flex-col gap-3 rounded-sm border border-paper/40 bg-paper/10 p-4 sm:flex-row sm:items-end"
          >
            <label className="flex-1">
              <span className="font-form-condensed block text-sm font-bold uppercase">
                Staff passcode to receive customer check-ins
              </span>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-sm border-2 border-paper bg-background px-4 py-3 text-lg text-paper outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-sm bg-paper px-6 py-3 font-form-condensed text-sm font-bold text-ink uppercase"
            >
              Unlock &amp; Import
            </button>
            {accessError && <p className="text-sm font-bold text-destructive">{accessError}</p>}
          </form>
        )}

        {access === "error" && (
          <p className="mt-4 border border-paper/40 px-4 py-3 text-sm font-bold">
            Customer check-ins could not be loaded. Please refresh and try again.
          </p>
        )}

        {access === "unlocked" && (
          <div className="mt-4 flex items-center justify-between gap-3 border-y border-paper/20 py-3">
            <p className="font-form-condensed text-sm font-bold uppercase">
              Customer check-ins are connected and update automatically.
            </p>
            <button
              type="button"
              onClick={() => void importSubmissions()}
              className="rounded-sm border border-paper/60 px-4 py-2 font-form-condensed text-xs font-bold uppercase hover:bg-paper/10"
            >
              Import New Check-Ins
            </button>
          </div>
        )}

        {entries.length === 0 ? (
          <p className="mt-10 text-center font-form-condensed text-sm text-paper/70">
            {access === "locked"
              ? "Unlock above to receive customer check-ins."
              : "No entries yet — customer check-ins will appear here automatically."}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-sm border border-paper/30">
            <table className="w-full text-left font-form-mono text-[11px]">
              <thead>
                <tr className="border-b border-paper/30 bg-paper/10">
                  <th className="px-2 py-1.5 font-form-condensed font-bold uppercase">Saved</th>
                  {COLS.map(([k, label]) => (
                    <th key={k} className="px-2 py-1.5 font-form-condensed font-bold uppercase">
                      {label}
                    </th>
                  ))}
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <Fragment key={e.id}>
                    <tr
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                      className="cursor-pointer border-b border-paper/15 hover:bg-paper/5"
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {new Date(e.savedAt).toLocaleString()}
                      </td>
                      {COLS.map(([k]) => (
                        <td key={k} className="max-w-[140px] truncate px-2 py-1.5">
                          {e.data[k] || "—"}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-right whitespace-nowrap">
                        <Link
                          to="/invoice"
                          search={{ ...search, edit: e.id }}
                          onClick={(ev) => ev.stopPropagation()}
                          className="mr-1 rounded-sm border border-paper/40 px-2 py-0.5 font-form-condensed text-[10px] font-bold uppercase hover:bg-paper/10"
                        >
                          Edit
                        </Link>
                        <Link
                          to="/invoice"
                          search={{ ...search, edit: e.id, print: "1" }}
                          onClick={(ev) => ev.stopPropagation()}
                          className="mr-1 rounded-sm bg-paper px-2 py-0.5 font-form-condensed text-[10px] font-bold text-ink uppercase hover:opacity-90"
                        >
                          Save PDF / Print
                        </Link>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setPendingDelete(e);
                          }}
                          className="rounded-sm border border-paper/40 px-2 py-0.5 font-form-condensed text-[10px] font-bold uppercase hover:bg-paper/10"
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                    {expanded === e.id && (
                      <tr key={`${e.id}-detail`} className="border-b border-paper/15 bg-paper/5">
                        <td colSpan={COLS.length + 2} className="px-3 py-2">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                            {Object.entries(e.data)
                              .filter(([, v]) => v)
                              .map(([k, v]) => (
                                <div key={k} className="truncate">
                                  <span className="font-form-condensed font-bold uppercase opacity-70">
                                    {k.replace(/_/g, " ")}:
                                  </span>{" "}
                                  {v}
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-sm border border-paper/40 bg-background p-6 text-paper"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--font-form-display)" }}
            >
              Do you want to delete this invoice?
            </h2>
            <p className="mt-2 font-form-mono text-sm text-paper/80">
              {pendingDelete.data["invoice_id"] || "Invoice"}
              {pendingDelete.data["name"] ? ` — ${pendingDelete.data["name"]}` : ""}
              <br />
              This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-sm border border-paper/60 px-6 py-2 font-form-condensed text-sm font-bold uppercase hover:bg-paper/10"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                className="rounded-sm bg-paper px-6 py-2 font-form-condensed text-sm font-bold text-ink uppercase hover:opacity-90"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
