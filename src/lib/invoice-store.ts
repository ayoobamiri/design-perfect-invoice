export interface InvoiceEntry {
  id: string;
  savedAt: string;
  data: Record<string, string>;
}

const KEY = "power-inn-smog-entries";

export function getEntries(): InvoiceEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InvoiceEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: InvoiceEntry) {
  const all = getEntries();
  all.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteEntry(id: string) {
  localStorage.setItem(
    KEY,
    JSON.stringify(getEntries().filter((e) => e.id !== id)),
  );
}

export function entriesToCsv(entries: InvoiceEntry[]): string {
  const keys = Array.from(
    entries.reduce((set, e) => {
      Object.keys(e.data).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["saved_at", ...keys].map(esc).join(",");
  const rows = entries.map((e) =>
    [e.savedAt, ...keys.map((k) => e.data[k] ?? "")].map(esc).join(","),
  );
  return [header, ...rows].join("\n");
}
