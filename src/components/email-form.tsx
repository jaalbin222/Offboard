"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import { writeLookup } from "@/lib/storage";
import type { BreachLookup, LookupSession } from "@/lib/types";

type EmailFormProps = {
  id?: string;
  appearance?: "hero" | "inline";
  onResult?: (session: LookupSession) => void;
};

export function EmailForm({ id = "email", appearance = "hero", onResult }: EmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hero = appearance === "hero";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Enter a valid email address.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/breaches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (BreachLookup & { error?: string })
        | null;
      if (!response.ok || !payload || (payload.source !== "hibp" && payload.source !== "demo")) {
        setError(payload?.error || "The breach check failed. Try again.");
        return;
      }
      const session = { email: normalized, result: payload };
      writeLookup(session);
      if (onResult) onResult(session);
      else router.push("/checklist");
    } catch {
      setError("The breach check failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={hero ? "mt-8" : "mt-4"} noValidate>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        Email address
      </label>
      <div className={`mt-2 flex gap-3 ${hero ? "flex-col sm:flex-row" : "flex-col"}`}>
        <input
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-14 w-full rounded-2xl border border-line bg-card px-4 text-base text-ink outline-none placeholder:text-faint focus:border-pine"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-14 shrink-0 rounded-2xl bg-pine px-6 text-base font-semibold text-card transition hover:bg-pine-2 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Checking…" : hero ? "Build my checklist" : "Check this email"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-sienna">
          {error}
        </p>
      ) : null}
    </form>
  );
}
