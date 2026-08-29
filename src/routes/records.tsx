import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import {
  deleteEntry,
  entriesToCsv,
  getEntries,
  type InvoiceEntry,
} from "@/lib/invoice-store";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Saved Entries — Power Inn Smog" },
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
  component: RecordsPage,
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
  const [entries, setEntries] = useState<InvoiceEntry[]>(() => getEntries());
  const [expanded, setExpanded] = useState<string | null>(null);

  const downloadCsv = () => {
    const blob = new Blob([entriesToCsv(entries)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `power-inn-smog-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = (entry: InvoiceEntry) => {
    const label = `${entry.data["invoice_id"] ?? "this invoice"}${
      entry.data["name"] ? ` — ${entry.data["name"]}` : ""
    }`;
    if (!window.confirm(`Delete ${label}?\n\nThis cannot be undone.`)) return;
    deleteEntry(entry.id);
    setEntries(getEntries());
  };

  return (
    <div className="min-h-screen bg-background px-2 py-6 text-paper sm:px-4">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-form-display)" }}
          >
            SAVED ENTRIES
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
              search={{}}
              className="rounded-sm border border-paper/60 px-4 py-2 font-form-condensed text-xs font-bold uppercase hover:bg-paper/10"
            >
              New Invoice
            </Link>
            <Link
              to="/"
              search={{}}
              className="rounded-sm border border-paper/60 px-4 py-2 font-form-condensed text-xs font-bold uppercase hover:bg-paper/10"
            >
              Home
            </Link>

          </div>
        </div>

        {entries.length === 0 ? (
          <p className="mt-10 text-center font-form-condensed text-sm text-paper/70">
            No entries yet — fill out the invoice and hit Save Entry.
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
                          search={{ edit: e.id }}
                          onClick={(ev) => ev.stopPropagation()}
                          className="mr-1 rounded-sm border border-paper/40 px-2 py-0.5 font-form-condensed text-[10px] font-bold uppercase hover:bg-paper/10"
                        >
                          Edit
                        </Link>
                        <Link
                          to="/invoice"
                          search={{ edit: e.id, print: "1" }}
                          onClick={(ev) => ev.stopPropagation()}
                          className="mr-1 rounded-sm bg-paper px-2 py-0.5 font-form-condensed text-[10px] font-bold text-ink uppercase hover:opacity-90"
                        >
                          Save PDF
                        </Link>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            remove(e);
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
    </div>
  );
}
