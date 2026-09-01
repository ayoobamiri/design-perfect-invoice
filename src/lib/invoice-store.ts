export interface InvoiceEntry {
  id: string;
  savedAt: string;
  data: Record<string, string>;
}

export type Brand = "smog" | "auto";

export const BRANDS: Record<Brand, { title: string; subtitle: string; prefix: string; label: string }> = {
  smog: {
    title: "POWER INN SMOG",
    subtitle: "TEST ONLY CENTER",
    prefix: "PIS",
    label: "Power Inn Smog",
  },
  auto: {
    title: "POWER INN AUTOMOTIVE",
    subtitle: "",
    prefix: "PIA",
    label: "Power Inn Automotive",
  },
};

export function toBrand(v: unknown): Brand {
  return v === "auto" ? "auto" : "smog";
}

const KEYS: Record<Brand, { entries: string; seq: string; draft: string }> = {
  smog: {
    entries: "power-inn-smog-entries",
    seq: "power-inn-smog-invoice-seq",
    draft: "power-inn-smog-draft",
  },
  auto: {
    entries: "power-inn-auto-entries",
    seq: "power-inn-auto-invoice-seq",
    draft: "power-inn-auto-draft",
  },
};

const SEQ_START = 100;

export function getEntries(brand: Brand = "smog"): InvoiceEntry[] {
  try {
    const raw = localStorage.getItem(KEYS[brand].entries);
    return raw ? (JSON.parse(raw) as InvoiceEntry[]) : [];
  } catch {
    return [];
  }
}

export function getEntry(id: string, brand: Brand = "smog"): InvoiceEntry | undefined {
  return getEntries(brand).find((e) => e.id === id);
}

export function saveEntry(entry: InvoiceEntry, brand: Brand = "smog") {
  const all = getEntries(brand);
  all.unshift(entry);
  localStorage.setItem(KEYS[brand].entries, JSON.stringify(all));
}

export function updateEntry(id: string, data: Record<string, string>, brand: Brand = "smog") {
  const all = getEntries(brand).map((e) =>
    e.id === id ? { ...e, data, savedAt: new Date().toISOString() } : e,
  );
  localStorage.setItem(KEYS[brand].entries, JSON.stringify(all));
}

export function deleteEntry(id: string, brand: Brand = "smog") {
  localStorage.setItem(
    KEYS[brand].entries,
    JSON.stringify(getEntries(brand).filter((e) => e.id !== id)),
  );
}

/* ---------- invoice id sequence (PIS100, PIS101, ...) ---------- */

function currentSeq(brand: Brand): number {
  const raw = Number(localStorage.getItem(KEYS[brand].seq));
  return Number.isFinite(raw) && raw >= SEQ_START ? raw : SEQ_START;
}

export function peekNextInvoiceId(brand: Brand = "smog"): string {
  return `${BRANDS[brand].prefix}${currentSeq(brand)}`;
}

export function commitInvoiceId(id: string, brand: Brand = "smog") {
  const n = Number(id.replace(/[^0-9]/g, ""));
  if (Number.isFinite(n)) {
    localStorage.setItem(KEYS[brand].seq, String(Math.max(currentSeq(brand), n + 1)));
  }
}

/* ---------- draft (keeps the current invoice while navigating) ---------- */

export function saveDraft(data: Record<string, string>, brand: Brand = "smog") {
  try {
    localStorage.setItem(KEYS[brand].draft, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getDraft(brand: Brand = "smog"): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(KEYS[brand].draft);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export function clearDraft(brand: Brand = "smog") {
  localStorage.removeItem(KEYS[brand].draft);
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
