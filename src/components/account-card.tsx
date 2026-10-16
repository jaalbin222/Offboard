"use client";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { displayDomain, formatBreachDate, formatCount } from "@/lib/format";
import { recommendation } from "@/lib/rank";
import { deletionSteps } from "@/lib/steps";
import { mailtoLink, isSafeHttpUrl } from "@/lib/urls";
import type { AccountStatus, Breach, BreachSource, Service } from "@/lib/types";

const STATUS_OPTIONS: { id: AccountStatus; label: string; active: string }[] = [
  { id: "deleted", label: "Deleted", active: "bg-pine text-card border-pine" },
  { id: "locked", label: "Locked", active: "bg-sea text-card border-sea" },
  { id: "kept", label: "Kept", active: "bg-ink text-card border-ink" },
];

export function AccountCard({
  service,
  breaches,
  source,
  status,
  open,
  onToggle,
  onStatus,
  onRemove,
}: {
  service: Service;
  breaches: Breach[];
  source: BreachSource | null;
  status?: AccountStatus;
  open: boolean;
  onToggle: () => void;
  onStatus: (status: AccountStatus) => void;
  onRemove: () => void;
}) {
  const steps = deletionSteps(service);
  const advice = recommendation(service, breaches, source ?? "hibp");
  const domain = displayDomain(service);
  const href = isSafeHttpUrl(service.url) ? service.url : "";
  const sample = source === "demo" && breaches.length > 0;
  const accent =
    status === "deleted"
      ? "border-l-pine"
      : status === "locked"
        ? "border-l-sea"
        : status === "kept"
          ? "border-l-stone"
          : breaches.length > 0
            ? "border-l-sienna"
            : "border-l-transparent";

  return (
    <article
      id={`account-${service.id}`}
      className={`scroll-mt-24 rounded-3xl border border-line border-l-4 bg-card p-5 ${accent}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={service.difficulty} />
        {breaches.length > 0 ? (
          <span className="inline-flex items-center rounded-full bg-sienna-soft px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] text-sienna uppercase">
            {sample ? "Sample match" : "Breached"}
          </span>
        ) : null}
        {service.custom ? (
          <span className="text-xs font-medium text-faint">Added by you</span>
        ) : null}
        {status ? (
          <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {status}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-[1.7rem] leading-none font-medium tracking-tight">
        {service.name}
      </h3>
      <p className="mt-1 text-sm text-muted">{domain}</p>

      {advice ? (
        <p className="mt-4 rounded-2xl bg-sienna-soft px-4 py-3 text-sm leading-6 text-sienna">
          {advice}
        </p>
      ) : null}

      {breaches.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {breaches.map((breach) => (
            <li key={breach.name}>
              {breach.title} · {formatBreachDate(breach.breachDate)} · {formatCount(breach.pwnCount)}{" "}
              accounts
              {breach.dataClasses.length > 0
                ? ` · ${breach.dataClasses.slice(0, 3).join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="mt-4 text-sm font-semibold text-pine"
      >
        {open ? "Hide steps" : `Show ${steps.length} steps`}
      </button>
      {open ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold text-card hover:bg-pine-2"
            >
              {service.difficulty === "impossible" ? "Open account page" : "Open deletion page"}
            </a>
          ) : null}
          {service.email ? (
            <a
              href={mailtoLink(service.email, service.emailSubject)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold hover:border-ink"
            >
              Email support
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Status for ${service.name}`}>
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onStatus(option.id)}
                className={`h-10 rounded-full border px-3.5 text-sm font-semibold ${
                  active ? option.active : "border-line bg-card text-ink hover:border-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
          <button type="button" onClick={onRemove} className="h-10 px-2 text-sm font-medium text-muted hover:text-ink">
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
