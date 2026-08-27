import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { saveEntry, type InvoiceEntry } from "@/lib/invoice-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Power Inn Smog — Repair Order & Invoice" },
      {
        name: "description",
        content:
          "Digital repair order and smog inspection invoice for Power Inn Smog Test Only Center, 4095 Power Inn Rd, Sacramento, CA.",
      },
      { property: "og:title", content: "Power Inn Smog — Repair Order & Invoice" },
      {
        property: "og:description",
        content:
          "Digital repair order and smog inspection invoice for Power Inn Smog Test Only Center, 4095 Power Inn Rd, Sacramento, CA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvoicePage,
});

/* ---------- helpers ---------- */

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const money = (n: number) => (n ? n.toFixed(2) : "");

/* ---------- tiny building blocks ---------- */

function Cb({ label, name }: { label?: string; name?: string }) {
  const n = name ?? `cb_${slug(label ?? "box")}`;
  return (
    <label className="inline-flex cursor-pointer items-center gap-1">
      <input
        type="checkbox"
        name={n}
        value="yes"
        className="size-[10px] appearance-none border border-ink bg-paper checked:bg-ink"
      />
      {label && <span className="form-label">{label}</span>}
    </label>
  );
}

function Field({
  label,
  className = "",
  name,
}: {
  label: string;
  className?: string;
  name?: string;
}) {
  return (
    <div className={`flex flex-col px-1.5 pt-0.5 pb-1 ${className}`}>
      <span className="form-label">{label}</span>
      <input className="form-input" name={name ?? slug(label)} aria-label={label} />
    </div>
  );
}

function Computed({ name, value }: { name: string; value: string }) {
  return (
    <input
      readOnly
      name={name}
      value={value}
      aria-label={name}
      className="form-input bg-ink/5 text-right font-bold"
    />
  );
}

/* ---------- page ---------- */

const EMISSIONS = [
  "PCV", "TAC", "EVP", "O.C.", "EGR", "SPK", "CARB",
  "INJ", "ASI", "C. CO", "O. E.", "FPR",
];

function InvoicePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  const [testFee, setTestFee] = useState("");
  const [certFee, setCertFee] = useState("");
  const [salesTax, setSalesTax] = useState("");
  const [revEst1, setRevEst1] = useState("");
  const [revEst2, setRevEst2] = useState("");
  const [partAmounts, setPartAmounts] = useState<string[]>(Array(12).fill(""));
  const [laborAmounts, setLaborAmounts] = useState<string[]>(Array(9).fill(""));

  const estTotal = useMemo(() => num(testFee) + num(certFee), [testFee, certFee]);
  const totalParts = useMemo(
    () => partAmounts.reduce((s, v) => s + num(v), 0),
    [partAmounts],
  );
  const totalLabor = useMemo(
    () => laborAmounts.reduce((s, v) => s + num(v), 0),
    [laborAmounts],
  );
  const grandTotal =
    totalParts + totalLabor + num(salesTax) + num(testFee) + num(certFee) +
    num(revEst1) + num(revEst2);

  const collect = (): InvoiceEntry => {
    const fd = new FormData(formRef.current!);
    const data: Record<string, string> = {};
    fd.forEach((v, k) => {
      data[k] = data[k] ? `${data[k]}, ${String(v)}` : String(v);
    });
    return { id: crypto.randomUUID(), savedAt: new Date().toISOString(), data };
  };

  const onSavePdf = (e: React.FormEvent) => {
    e.preventDefault();
    saveEntry(collect());
    window.print();
  };

  const onSaveOnly = () => {
    saveEntry(collect());
    navigate({ to: "/records" });
  };

  return (
    <div className="min-h-screen bg-background px-2 py-6 sm:px-4">
      {/* action bar (not printed) */}
      <div className="no-print mx-auto mb-3 flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-2">
        <span className="font-form-condensed text-sm font-bold tracking-wide text-primary-foreground uppercase">
          Power Inn Smog — Digital Invoice
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveOnly}
            className="rounded-sm bg-paper px-4 py-2 font-form-condensed text-xs font-bold text-ink uppercase hover:opacity-90"
          >
            Save Entry
          </button>
          <button
            type="submit"
            form="invoice-form"
            className="rounded-sm bg-ink px-4 py-2 font-form-condensed text-xs font-bold text-paper uppercase ring-1 ring-paper hover:opacity-90"
          >
            Submit &amp; Save PDF
          </button>
          <Link
            to="/records"
            className="rounded-sm border border-paper/60 px-4 py-2 font-form-condensed text-xs font-bold text-paper uppercase hover:bg-paper/10"
          >
            View Sheet
          </Link>
        </div>
      </div>

      <form
        id="invoice-form"
        ref={formRef}
        onSubmit={onSavePdf}
        className="invoice-sheet mx-auto w-full max-w-[1100px] bg-paper p-3 text-ink shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] sm:p-5 print:shadow-none"
        style={{ fontFamily: "var(--font-form-body)" }}
      >
        {/* ===== HEADER ===== */}
        <div className="flex flex-col gap-3 lg:flex-row print:flex-row">
          <div className="text-center lg:w-[46%] lg:pt-2">
            <h1 className="font-form-display text-[34px] leading-none tracking-tight sm:text-[40px]">
              POWER INN SMOG
            </h1>
            <p className="font-form-display mt-1 text-[15px] tracking-[0.28em]">
              TEST ONLY CENTER
            </p>
            <p className="mt-1 text-[13px] font-semibold tracking-wide">
              4095 Power Inn Rd, Sacramento, CA 95826
            </p>
            <p className="text-[12px] font-semibold">ARD 307549</p>
            <p className="mt-0.5 text-[17px] font-bold">(916) 877-SMOG (7664)</p>
          </div>

          <div className="form-box grid flex-1 grid-cols-2 text-left">
            <Field label="Date In" name="date_in" className="border-r border-b border-ink" />
            <Field label="Type of Vehicle" className="border-b border-ink" />
            <div className="col-span-2 flex items-center gap-2 px-1.5 py-1">
              <span className="form-label shrink-0 bg-ink px-1 text-paper">Fuel used in vehicle</span>
              <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <Cb label="Gasoline" />
                <Cb label="Liquid Prop. Gas" name="fuel_lpg" />
                <Cb label="Methanol" />
                <Cb label="Natural Gas" name="fuel_natural_gas" />
                <Cb label="Hwy. Duty" name="duty_hwy" />
                <Cb label="Lt. Duty" name="duty_lt" />
              </div>
              <Field label="G.V.W.R." name="gvwr" className="w-20 shrink-0 border-l border-ink pl-2" />
            </div>
          </div>
        </div>

        {/* ===== CUSTOMER / VEHICLE + RIGHT META COLUMN ===== */}
        <div className="mt-2 flex flex-col gap-3 lg:flex-row print:flex-row">
          {/* left column */}
          <div className="lg:w-[54%] print:w-[54%]">
            <div className="form-box">
              <Field label="Name" className="border-b border-ink" />
              <Field label="Address" className="border-b border-ink" />
              <div className="grid grid-cols-[1fr_120px] border-b border-ink">
                <Field label="City" className="border-r border-ink" />
                <Field label="Zip" />
              </div>
              <div className="grid grid-cols-[110px_1fr_1fr] border-b border-ink">
                <Field label="Written By" className="border-r border-ink" />
                <Field label="Res. Phone" className="border-r border-ink" />
                <Field label="Bus. Phone" />
              </div>
              <div className="grid grid-cols-[70px_1fr_1fr_1.2fr]">
                <Field label="Year" className="border-r border-ink" />
                <Field label="Make" className="border-r border-ink" />
                <Field label="Model" className="border-r border-ink" />
                <Field label="License Plate No." name="license_plate" />
              </div>
            </div>

            <p className="mt-1.5 text-[9.5px] leading-snug font-semibold">
              <span className="font-form-condensed font-bold">NOTE :</span> By law, you may
              choose another facility to perform any needed repairs or adjustments which smog
              check test indicates are necessary.
            </p>

            {/* ORIGINAL ESTIMATE — three sections */}
            <div className="form-box mt-1 grid grid-cols-[auto_1fr]">
              <div className="bg-ink px-2 py-1 text-center">
                <span className="font-form-condensed block text-[11px] font-bold text-paper uppercase">
                  Original
                </span>
                <span className="font-form-condensed block text-[11px] font-bold text-paper uppercase">
                  Estimate
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-1">
                <div className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-baseline gap-1">
                    <span className="font-form-mono text-sm">$</span>
                    <input
                      className="form-input border-b border-ink text-right"
                      name="est_test_fee"
                      value={testFee}
                      onChange={(e) => setTestFee(e.target.value)}
                      aria-label="Inspection and test fee"
                    />
                  </div>
                  <span className="form-label mt-0.5">Inspection &amp; Test Fee</span>
                </div>
                <span className="text-base font-bold">+</span>
                <div className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-baseline gap-1">
                    <span className="font-form-mono text-sm">$</span>
                    <input
                      className="form-input border-b border-ink text-right"
                      name="est_cert_fee"
                      value={certFee}
                      onChange={(e) => setCertFee(e.target.value)}
                      aria-label="Certificate fee"
                    />
                  </div>
                  <span className="form-label mt-0.5">Cert. Fee</span>
                </div>
                <span className="text-base font-bold">=</span>
                <div className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-baseline gap-1">
                    <span className="font-form-mono text-sm">$</span>
                    <Computed name="est_total" value={money(estTotal)} />
                  </div>
                  <span className="form-label mt-0.5">Estimate Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="flex-1">
            <div className="form-box">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] border-b border-ink">
                <div className="flex flex-col gap-1 border-r border-ink px-1.5 py-1">
                  <Cb label="Biennal Inspection" name="insp_biennal" />
                  <Cb label="Change of Ownership" name="insp_change_ownership" />
                </div>
                <div className="flex flex-col gap-1 border-r border-ink px-1.5 py-1">
                  <span className="form-label bg-ink px-1 text-center text-paper">
                    Type of Test
                  </span>
                  <Cb label="Initial" name="test_initial" />
                  <Cb label="After" name="test_after" />
                </div>
                <div className="flex flex-col gap-1 border-r border-ink px-1.5 py-1">
                  <span className="form-label">Exhaust Pipe</span>
                  <Cb label="Single" name="exhaust_single" />
                  <Cb label="Dual" name="exhaust_dual" />
                </div>
                <div className="flex flex-col gap-1 px-1.5 py-1">
                  <span className="form-label">Transmission</span>
                  <Cb label="Man." name="trans_man" />
                  <Cb label="Auto." name="trans_auto" />
                </div>
              </div>

              {/* VIN */}
              <div className="border-b border-ink px-1.5 py-1">
                <span className="form-label bg-ink px-1 text-paper">
                  Vehicle Identification No.
                </span>
                <div className="mt-1 grid grid-cols-17 gap-[2px]">
                  {Array.from({ length: 17 }).map((_, i) => (
                    <input
                      key={i}
                      maxLength={1}
                      name={`vin_${i}`}
                      className="form-input h-6 border border-ink text-center uppercase"
                      aria-label={`VIN character ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* odometer / last insp (+ INV #) */}
              <div className="grid grid-cols-[1fr_auto_1fr_90px] border-b border-ink">
                <Field label="Odometer" className="border-r border-ink" />
                <span className="form-label bg-ink self-stretch px-1 py-1 text-paper">
                  Last
                  <br />
                  Insp.
                </span>
                <Field label="Date" name="last_insp_date" className="border-r border-ink" />
                <Field label="Inv. #" name="inv_no" />
              </div>

              {/* cert status / engine info / engine size */}
              <div className="grid grid-cols-[1fr_1.3fr_auto] border-b border-ink">
                <div className="border-r border-ink px-1.5 py-1">
                  <span className="form-label">Certification Status</span>
                  <p className="mt-0.5 text-[9px] leading-snug font-semibold">
                    C = Calif&nbsp;&nbsp;&nbsp;F = Federal
                    <br />R = B.A.R. Referee
                    <br />N = Unknown
                  </p>
                  <input
                    className="form-input mt-1 w-10 border border-ink text-center uppercase"
                    name="cert_status"
                    maxLength={1}
                    aria-label="Certification status"
                  />
                </div>
                <div className="border-r border-ink px-1.5 py-1">
                  <span className="form-label">Engine Information</span>
                  <div className="mt-0.5 grid grid-cols-3 gap-1">
                    <Cb label="3 Cyl" name="eng_3cyl" />
                    <Cb label="5 Cyl" name="eng_5cyl" />
                    <Cb label="8 Cyl" name="eng_8cyl" />
                    <Cb label="4 Cyl" name="eng_4cyl" />
                    <Cb label="6 Cyl" name="eng_6cyl" />
                    <Cb label="Rotary" name="eng_rotary" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 px-1.5 py-1">
                  <span className="form-label">Engine Size:</span>
                  <input
                    className="form-input w-16 border-b border-ink"
                    name="engine_size"
                    aria-label="Engine size"
                  />
                  <div className="flex gap-2">
                    <Cb label="I" name="engsz_i" />
                    <Cb label="C" name="engsz_c" />
                    <Cb label="L" name="engsz_l" />
                  </div>
                </div>
              </div>

              <p className="px-1.5 py-1 text-[8.5px] leading-snug font-semibold">
                <span className="font-form-condensed font-bold">COST LIMIT DOES NOT APPLY</span>{" "}
                if the required certified motor vehicle pollution control is modified,
                disconnected or missing.
              </p>
            </div>

            {/* REVISED ESTIMATE — matches original form layout */}
            <div className="form-box mt-1 grid grid-cols-[auto_1fr]">
              <div className="flex flex-col justify-center bg-ink px-2 text-center">
                <span className="font-form-condensed block text-[11px] font-bold text-paper uppercase">
                  Revised
                </span>
                <span className="font-form-condensed block text-[11px] font-bold text-paper uppercase">
                  Estimate
                </span>
              </div>
              <div>
                {/* row 1 */}
                <div className="grid grid-cols-[110px_1fr_90px_1fr] border-b border-ink">
                  <div className="flex items-end gap-1 border-r border-ink px-1.5 pb-1">
                    <span className="font-form-mono text-sm">$</span>
                    <input className="form-input text-right" name="rev_amount" aria-label="Revised estimate amount" />
                  </div>
                  <Field label="Additional Cost" name="rev_additional_cost" className="border-r border-ink" />
                  <Field label="Reason" name="rev_reason" className="border-r border-ink" />
                  <div className="flex flex-col px-1.5 pt-0.5 pb-1">
                    <span className="form-label">Authorized By</span>
                    <div className="mt-1 flex gap-3">
                      <Cb label="In person" name="rev_auth_person" />
                      <Cb label="Phone" name="rev_auth_phone" />
                    </div>
                  </div>
                </div>
                {/* row 2 */}
                <div className="grid grid-cols-[110px_1fr_90px_1fr]">
                  <div className="flex items-end gap-1 border-r border-ink px-1.5 pb-1">
                    <span className="font-form-mono text-sm">$</span>
                    <input className="form-input text-right" name="rev_total" aria-label="Revised total" />
                  </div>
                  <Field label="Contacted By" name="rev_contacted_by" className="border-r border-ink" />
                  <Field label="Date" name="rev_date" className="border-r border-ink" />
                  <div className="grid grid-cols-[1fr_auto]">
                    <Field label="Time" name="rev_time" />
                    <div className="flex flex-col justify-center gap-1 pr-1.5">
                      <Cb label="AM" name="rev_am" />
                      <Cb label="PM" name="rev_pm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FULL-WIDTH TEST STRIP (single row) ===== */}
        <div className="form-box mt-2 grid grid-cols-[repeat(14,minmax(0,1fr))_1.6fr_1.5fr]">
          {EMISSIONS.map((t) => (
            <div key={t} className="flex flex-col items-center border-r border-ink">
              <span className="form-label py-0.5">{t}</span>
              <input className="form-input h-5 text-center" name={`check_${slug(t)}`} aria-label={t} />
            </div>
          ))}
          <div className="flex flex-col items-center border-r border-ink">
            <span className="form-label py-0.5">EGR</span>
            <input className="form-input h-5 text-center" name="egr_2" aria-label="EGR secondary" />
          </div>
          <div className="flex flex-col items-center border-r border-ink">
            <span className="form-label py-0.5">Tim.Spec</span>
            <input className="form-input h-5 text-center" name="tim_spec" aria-label="Tim.Spec" />
          </div>
          <div className="flex items-center gap-1 border-r border-ink px-1.5">
            <span className="form-label">Timing</span>
            <input className="form-input border-b border-ink" name="timing" aria-label="Timing" />
            <span className="form-label">Deg.</span>
            <div className="flex flex-col gap-0.5">
              <Cb label="A" name="timing_a" />
              <Cb label="B" name="timing_b" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-1.5">
            <span className="form-label">Maint. Lt.</span>
            <Cb label="Warning" name="maint_warning" />
            <Cb label="Maint." name="maint_maint" />
          </div>
        </div>

        {/* ===== PARTS & LABOR TABLES ===== */}
        <div className="mt-2 flex flex-col gap-3 lg:flex-row print:flex-row">
          {/* parts */}
          <div className="lg:w-[54%] print:w-[54%]">
            <div className="form-box">
              <div className="grid grid-cols-[44px_40px_1fr_110px] bg-ink text-paper">
                <span className="form-label border-r border-paper/40 px-1 py-0.5 text-paper">Qty</span>
                <span className="form-label border-r border-paper/40 px-1 py-0.5 text-paper">*</span>
                <span className="form-label border-r border-paper/40 px-1 py-0.5 text-center text-paper">
                  Part No. and Description
                </span>
                <span className="form-label px-1 py-0.5 text-paper">Amount</span>
              </div>
              {partAmounts.map((amt, i) => (
                <div key={i} className="grid h-[26px] grid-cols-[44px_40px_1fr_110px] border-t border-ink">
                  <input className="form-input border-r border-ink text-center" name={`part_${i}_qty`} aria-label={`Part ${i + 1} qty`} />
                  <input className="form-input border-r border-ink text-center" name={`part_${i}_code`} aria-label={`Part ${i + 1} code`} />
                  <input className="form-input border-r border-ink" name={`part_${i}_desc`} aria-label={`Part ${i + 1} description`} />
                  <input
                    className="form-input text-right"
                    name={`part_${i}_amount`}
                    value={amt}
                    onChange={(e) =>
                      setPartAmounts((p) => p.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    aria-label={`Part ${i + 1} amount`}
                  />
                </div>
              ))}
              <div className="grid grid-cols-[1fr_110px] border-t border-ink">
                <div className="border-r border-ink p-1.5 text-[8px] leading-snug font-semibold">
                  All parts are new unless otherwise noted. None of the parts used in this
                  facility is of origin manufacturer specifications unless otherwise requested
                  by customer.&nbsp;&nbsp;* CODE:&nbsp; N = New&nbsp;&nbsp; U = Used&nbsp;&nbsp; R = Rebuilt
                </div>
                <div className="flex items-stretch">
                  <span className="form-label flex items-center bg-ink px-1.5 text-paper">
                    Total Parts
                  </span>
                  <Computed name="total_parts" value={money(totalParts)} />
                </div>
              </div>
            </div>

            <p className="mt-1.5 text-[8.5px] leading-snug font-semibold italic">
              I hereby authorize the above smog test to be done according to current smog test
              laws. You and your employees may operate above listed vehicle for purposes of
              testing, inspection, or delivery at my risk. An express Mechanic&apos;s Lien is
              acknowledged on above listed vehicle to secure the amount of test thereto. You will
              not be held responsible for loss or damage to above listed vehicle, or articles
              left in it, in case of fire, theft, accident or any other cause beyond your
              control. I acknowledge receipt of a copy hereof.
            </p>

            {/* signature — typed, handwriting font */}
            <div className="form-box mt-1 flex items-end gap-2 px-2 pt-1 pb-1.5">
              <span className="form-label">Cust. Sign</span>
              <span className="font-form-mono text-sm font-bold">X</span>
              <input
                name="customer_signature"
                aria-label="Customer signature"
                placeholder="Type full name to sign"
                className="w-full flex-1 border-b border-ink bg-transparent pb-0.5 text-[20px] leading-tight text-ink outline-none placeholder:text-[11px] placeholder:font-normal placeholder:text-ink/35"
                style={{ fontFamily: "var(--font-hand)" }}
              />
            </div>
          </div>

          {/* labor */}
          <div className="flex-1">
            <div className="form-box">
              <div className="grid grid-cols-[1fr_110px] bg-ink text-paper">
                <span className="form-label border-r border-paper/40 px-1 py-0.5 text-center text-paper">
                  Repair Order - Labor Instructions
                </span>
                <span className="form-label px-1 py-0.5 text-paper">Amount</span>
              </div>
              {laborAmounts.map((amt, i) => (
                <div key={i} className="grid h-[26px] grid-cols-[1fr_110px] border-t border-ink">
                  <input className="form-input border-r border-ink" name={`labor_${i}_desc`} aria-label={`Labor ${i + 1}`} />
                  <input
                    className="form-input text-right"
                    name={`labor_${i}_amount`}
                    value={amt}
                    onChange={(e) =>
                      setLaborAmounts((p) => p.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    aria-label={`Labor ${i + 1} amount`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <div className="flex items-center bg-ink px-4 text-center">
                <span className="font-form-condensed text-[13px] leading-tight font-bold text-paper uppercase">
                  IF THE TEST FAILS
                  <br />
                  OR IS ABORTED
                  <br />
                  YOU STILL MUST PAY
                  <br />
                  THE TEST FEE
                </span>
              </div>
              <div className="form-box flex-1">
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">Total Labor</span>
                  <Computed name="total_labor" value={money(totalLabor)} />
                </div>
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">Total Parts</span>
                  <Computed name="total_parts_summary" value={money(totalParts)} />
                </div>
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">Sales Tax</span>
                  <input
                    className="form-input text-right"
                    name="sales_tax"
                    value={salesTax}
                    onChange={(e) => setSalesTax(e.target.value)}
                    aria-label="Sales tax"
                  />
                </div>
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">
                    Inspection &amp; Test Fee
                  </span>
                  <Computed name="inspection_test_fee" value={money(num(testFee))} />
                </div>
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">Certificate Fee</span>
                  <Computed name="certificate_fee" value={money(num(certFee))} />
                </div>
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">
                    Revised Estimate
                  </span>
                  <input
                    className="form-input text-right"
                    name="rev_estimate_1"
                    value={revEst1}
                    onChange={(e) => setRevEst1(e.target.value)}
                    aria-label="Revised estimate 1"
                  />
                </div>
                <div className="grid grid-cols-[1fr_100px] border-b border-ink">
                  <span className="form-label border-r border-ink px-1.5 py-1">
                    Revised Estimate
                  </span>
                  <input
                    className="form-input text-right"
                    name="rev_estimate_2"
                    value={revEst2}
                    onChange={(e) => setRevEst2(e.target.value)}
                    aria-label="Revised estimate 2"
                  />
                </div>
                <div className="grid grid-cols-[1fr_100px]">
                  <span className="form-label flex items-center bg-ink px-1.5 py-1.5 text-[11px] text-paper">
                    Total
                  </span>
                  <Computed name="invoice_total" value={money(grandTotal)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-3 grid gap-3 border-t-2 border-ink pt-2 lg:grid-cols-2 print:grid-cols-2">
          <p className="text-[8.5px] leading-snug font-semibold italic">
            Any warranties on the products sold hereby are those made by manufacturer. The
            seller (above named dealership) hereby expressly disclaims all warranties, either
            express or implied warranty of merchantability or fitness for a particular purpose,
            and neither assumes nor authorizes any other person to assume for it any liability
            in connection with the sale of said products.
            <span className="mt-1 block not-italic">All Rights Reserved</span>
          </p>
          <div>
            <span className="form-label">Recommended Services:</span>
            {[1, 2, 3].map((n) => (
              <input
                key={n}
                className="form-input mt-1 border-b border-ink"
                name={`rec_service_${n}`}
                aria-label={`Recommended service ${n}`}
              />
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
