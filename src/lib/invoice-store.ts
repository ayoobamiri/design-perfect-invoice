export interface InvoiceEntry {
  id: string;
  savedAt: string;
  data: Record<string, string>;
}

const KEY = "power-inn-smog-entries";
const SEQ_KEY = "power-inn-smog-invoice-seq";
const DRAFT_KEY = "power-inn-smog-draft";
const SEQ_START = 100;

export function getEntries(): InvoiceEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InvoiceEntry[]) : [];
  } catch {
    return [];
  }
}

export function getEntry(id: string): InvoiceEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

export function saveEntry(entry: InvoiceEntry) {
  const all = getEntries();
  all.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function updateEntry(id: string, data: Record<string, string>) {
  const all = getEntries().map((e) =>
    e.id === id ? { ...e, data, savedAt: new Date().toISOString() } : e,
  );
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteEntry(id: string) {
  localStorage.setItem(
    KEY,
    JSON.stringify(getEntries().filter((e) => e.id !== id)),
  );
}

/* ---------- invoice id sequence (PIS100, PIS101, ...) ---------- */

function currentSeq(): number {
  const raw = Number(localStorage.getItem(SEQ_KEY));
  return Number.isFinite(raw) && raw >= SEQ_START ? raw : SEQ_START;
}

export function peekNextInvoiceId(): string {
  return `PIS${currentSeq()}`;
}

export function commitInvoiceId(id: string) {
  const n = Number(id.replace(/[^0-9]/g, ""));
  if (Number.isFinite(n)) {
    localStorage.setItem(SEQ_KEY, String(Math.max(currentSeq(), n + 1)));
  }
}

/* ---------- draft (keeps the current invoice while navigating) ---------- */

export function saveDraft(data: Record<string, string>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getDraft(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

/* ---------- naming / export ---------- */

export function invoiceFileName(data: Record<string, string>, when = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())} ${pad(when.getHours())}-${pad(when.getMinutes())}`;
  const name = (data["name"] || "No Name").replace(/[\\/:*?"<>|]/g, "").trim();
  return `${data["invoice_id"] || "PIS"} - ${name} - ${stamp}`;

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
