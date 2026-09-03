import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/customer")({
  validateSearch: (s: Record<string, unknown>): { brand?: "smog" | "auto" } => ({
    brand: s["brand"] === "auto" ? "auto" : "smog",
  }),
  head: () => ({
    meta: [
      { title: "Customer Check-In — Power Inn Smog & Automotive" },
      {
        name: "description",
        content:
          "Enter your contact and vehicle information for your smog check or automotive service at Power Inn, Sacramento.",
      },
      { property: "og:title", content: "Customer Check-In — Power Inn Smog & Automotive" },
      {
        property: "og:description",
        content:
          "Enter your contact and vehicle information for your smog check or automotive service at Power Inn, Sacramento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerPage,
});

const BRAND_LABEL: Record<"smog" | "auto", string> = {
  smog: "Smog",
  auto: "Automotive",
};

const FIELDS: { name: string; label: string; type?: string; required?: boolean }[] = [
  { name: "name", label: "Full Name", required: true },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "zip", label: "Zip" },
  { name: "email", label: "Email", type: "email" },
  { name: "written_by", label: "Written By" },
  { name: "res_phone", label: "Res. Phone", type: "tel" },
  { name: "bus_phone", label: "Bus. Phone", type: "tel" },
  { name: "year", label: "Vehicle Year" },
  { name: "make", label: "Make" },
  { name: "model", label: "Model" },
  { name: "license_plate", label: "License Plate No." },
];

function CustomerPage() {
  const { brand } = Route.useSearch();
  const label = BRAND_LABEL[brand ?? "smog"];


  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "saving") return;
    const name = (values["name"] ?? "").trim();
    if (!name) {
      window.alert("Please enter your name.");
      return;
    }
    setState("saving");
    const row: Record<string, string> = {};
    FIELDS.forEach((f) => {
      row[f.name] = (values[f.name] ?? "").trim().slice(0, 200);
    });
    const { error } = await supabase.from("customer_submissions").insert(row);
    if (error) {
      console.error(error);
      setState("error");
      return;
    }
    setValues({});
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <div className="form-box w-full max-w-xl bg-paper px-8 py-14 text-center text-ink">
          <h1 className="font-form-display text-[34px] leading-tight">Thank you.</h1>
          <p className="mt-4 text-lg font-semibold">
            Your information has been submitted.
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Please hand the iPad back to our staff.
          </p>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="mt-10 w-full rounded-sm bg-ink px-6 py-5 text-lg font-bold text-paper uppercase"
          >
            New Customer Form
          </button>
          <Link
            to="/"
            search={{}}
            className="mt-4 block text-center font-form-mono text-[12px] font-semibold text-ink-soft underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="form-box bg-paper px-5 py-8 text-ink sm:px-10">
          <div className="mb-4">
            <Link
              to="/checkin"
              className="font-form-mono text-[12px] font-semibold text-ink-soft underline"
            >
              ← Back
            </Link>
          </div>
          <header className="text-center">
            <h1 className="font-form-display text-[30px] leading-none sm:text-[38px]">
              POWER INN SMOG &amp; AUTOMOTIVE
            </h1>
            <p className="mt-2 text-sm font-semibold">
              4095 Power Inn Rd, Sacramento, CA 95826
            </p>
            <p className="font-form-condensed mt-4 text-[13px] font-bold tracking-[0.3em] uppercase">
              Customer Check-In — {label}
            </p>
          </header>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {FIELDS.map((f) => (
              <label key={f.name} className="block">
                <span className="font-form-condensed block text-[13px] font-bold tracking-wide uppercase">
                  {f.label}
                  {f.required && " *"}
                </span>
                <input
                  type={f.type ?? "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  autoComplete="off"
                  autoCapitalize="words"
                  className="mt-1 w-full rounded-sm border-2 border-ink bg-paper px-4 py-4 text-[19px] outline-none focus:bg-ink/5"
                />
              </label>
            ))}

            {state === "error" && (
              <p className="text-center text-sm font-bold text-red-700">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={state === "saving"}
              className="w-full rounded-sm bg-ink px-6 py-6 text-xl font-bold tracking-wide text-paper uppercase disabled:opacity-60"
            >
              {state === "saving" ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
