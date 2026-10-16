"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AccountCard } from "@/components/account-card";
import { AddServiceDialog } from "@/components/add-service-dialog";
import { EmailForm } from "@/components/email-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatBreachDate, formatCount } from "@/lib/format";
import { DIFFICULTY_META, DIFFICULTY_ORDER, isDifficulty } from "@/lib/labels";
import { matchBreaches } from "@/lib/match";
import { groupKey, rankServices } from "@/lib/rank";
import {
  clearAllLocalData,
  getLookupSnapshot,
  getServerLookupSnapshot,
  getServerStateSnapshot,
  getStateSnapshot,
  subscribeLookup,
  subscribeState,
  writeLookup,
  writeState,
  type PersistedState,
} from "@/lib/storage";
import type { AccountStatus, BreachSource, Difficulty, Service } from "@/lib/types";

type Focus = "all" | "breached" | "remaining" | "decided";

export function ChecklistApp() {
  const [catalog, setCatalog] = useState<Service[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const state = useSyncExternalStore(subscribeState, getStateSnapshot, getServerStateSnapshot);
  const lookup = useSyncExternalStore(subscribeLookup, getLookupSnapshot, getServerLookupSnapshot);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [focus, setFocus] = useState<Focus>("all");
  const [openOverride, setOpenOverride] = useState<string[] | null>(null);
  const [undo, setUndo] = useState<Service | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((payload: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(payload)) throw new Error("catalog");
        setCatalog(payload as Service[]);
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allServices = useMemo(() => {
    if (!catalog) return [];
    return [...catalog, ...state.custom.map((service) => ({ ...service, custom: true }))];
  }, [catalog, state]);

  const matches = useMemo(
    () => matchBreaches(allServices, lookup?.result.breaches ?? []),
    [allServices, lookup],
  );

  const visible = useMemo(() => {
    if (!catalog) return [];
    const dismissed = new Set(state.dismissed);
    const byId = new Map(allServices.map((service) => [service.id, service]));
    const ids = new Set<string>();
    for (const service of catalog) {
      if (service.popular && !dismissed.has(service.id)) ids.add(service.id);
    }
    for (const id of state.addedIds) {
      if (!dismissed.has(id)) ids.add(id);
    }
    for (const id of matches.keys()) {
      if (!dismissed.has(id)) ids.add(id);
    }
    for (const service of state.custom) ids.add(service.id);
    const services = [...ids].flatMap((id) => {
      const service = byId.get(id);
      return service ? [service] : [];
    });
    return rankServices(services, matches);
  }, [allServices, catalog, matches, state]);

  const firstBreachedId = visible.find((service) => matches.has(service.id))?.id ?? null;
  const openIds = openOverride ?? (firstBreachedId ? [firstBreachedId] : []);

  function reveal(id: string) {
    setOpenOverride((current) => {
      const base = current ?? (firstBreachedId ? [firstBreachedId] : []);
      return base.includes(id) ? base : [...base, id];
    });
  }

  function updateState(recipe: (prev: PersistedState) => PersistedState) {
    writeState(recipe(state));
  }

  function setStatus(id: string, status: AccountStatus) {
    updateState((prev) => {
      const next = { ...prev.status };
      if (next[id] === status) delete next[id];
      else next[id] = status;
      return { ...prev, status: next };
    });
  }

  function addCatalog(service: Service) {
    updateState((prev) => ({
      ...prev,
      dismissed: prev.dismissed.filter((id) => id !== service.id),
      addedIds:
        service.popular || prev.addedIds.includes(service.id)
          ? prev.addedIds
          : [...prev.addedIds, service.id],
    }));
    reveal(service.id);
    window.setTimeout(() => {
      document.getElementById(`account-${service.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function addCustom(service: Service) {
    updateState((prev) => ({ ...prev, custom: [...prev.custom, service] }));
    reveal(service.id);
    window.setTimeout(() => {
      document.getElementById(`account-${service.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function removeService(service: Service) {
    setUndo(service);
    updateState((prev) => {
      if (service.custom) {
        return { ...prev, custom: prev.custom.filter((item) => item.id !== service.id) };
      }
      return {
        ...prev,
        dismissed: prev.dismissed.includes(service.id) ? prev.dismissed : [...prev.dismissed, service.id],
        addedIds: prev.addedIds.filter((id) => id !== service.id),
      };
    });
  }

  function restoreRemoved() {
    if (!undo) return;
    const service = undo;
    updateState((prev) => {
      if (service.custom) return { ...prev, custom: [...prev.custom, service] };
      return {
        ...prev,
        dismissed: prev.dismissed.filter((id) => id !== service.id),
        addedIds:
          service.popular || prev.addedIds.includes(service.id)
            ? prev.addedIds
            : [...prev.addedIds, service.id],
      };
    });
    setUndo(null);
  }

  const source = lookup?.result.source ?? null;
  const filtered = visible.filter((service) => {
    const needle = query.trim().toLowerCase();
    if (needle) {
      const haystack = `${service.name} ${service.domains.join(" ")}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (difficulty !== "all" && service.difficulty !== difficulty) return false;
    const marked = Boolean(state?.status[service.id]);
    if (focus === "breached" && !matches.has(service.id)) return false;
    if (focus === "remaining" && marked) return false;
    if (focus === "decided" && !marked) return false;
    return true;
  });

  const groups: { key: string; services: Service[] }[] = [];
  for (const service of filtered) {
    const key = groupKey(service, matches);
    const last = groups.at(-1);
    if (!last || last.key !== key) groups.push({ key, services: [service] });
    else last.services.push(service);
  }

  const decided = visible.filter((service) => state?.status[service.id]).length;
  const deleted = visible.filter((service) => state?.status[service.id] === "deleted").length;
  const locked = visible.filter((service) => state?.status[service.id] === "locked").length;
  const kept = visible.filter((service) => state?.status[service.id] === "kept").length;
  const breachedVisible = visible.filter((service) => matches.has(service.id)).length;
  const progress = visible.length === 0 ? 0 : decided / visible.length;
  const matchedBreachNames = new Set(
    [...matches.values()].flatMap((items) => items.map((breach) => breach.name)),
  );

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {!catalog && !catalogError ? (
          <p className="text-muted">Loading the account catalog…</p>
        ) : catalogError || !catalog ? (
          <div className="rounded-3xl border border-line bg-card p-6">
            <h1 className="font-display text-4xl font-medium">The catalog didn’t load</h1>
            <p className="mt-2 text-muted">Refresh the page to fetch the service list again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 h-10 rounded-full bg-pine px-4 text-sm font-semibold text-card"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-pine uppercase">
                  Account offboarding
                </p>
                <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                  Your checklist
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  {lookup
                    ? `Prepared for ${lookup.email}. This list is a starting point, not proof you have each account.`
                    : "No email checked yet. These are popular accounts. Check an email to move breach matches to the top."}
                </p>
              </div>
              <ProgressRing value={progress} label={`${decided} of ${visible.length}`} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Deleted" value={deleted} />
              <Stat label="Locked" value={locked} />
              <Stat label="Kept" value={kept} />
              <Stat label="Breach matches" value={breachedVisible} />
            </dl>

            {source === "demo" ? (
              <div role="status" className="mt-6 rounded-3xl border border-sienna/30 bg-sienna-soft px-5 py-4 text-sm leading-6 text-sienna">
                <p className="font-semibold tracking-[0.14em] uppercase">Sample data</p>
                <p className="mt-1">{lookup?.result.disclaimer}</p>
              </div>
            ) : null}

            {source === "hibp" ? (
              <div role="status" className="mt-6 rounded-3xl border border-pine/20 bg-mist px-5 py-4 text-sm leading-6 text-pine">
                <p className="font-semibold">Checked with Have I Been Pwned</p>
                <p className="mt-1 text-ink">
                  {lookup?.result.breaches.length
                    ? `${lookup.result.breaches.length} breaches came back. Matching accounts are first, with a change-password or delete recommendation. This server does not keep the email.`
                    : "No breaches came back for this email. Old accounts can still be open, so work the list and close the ones you do not want. This server does not keep the email."}
                </p>
              </div>
            ) : null}

            {lookup && lookup.result.breaches.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {lookup.result.breaches.map((breach) => {
                  const matched = matchedBreachNames.has(breach.name);
                  return (
                    <li key={breach.name} className="rounded-2xl border border-line bg-card px-4 py-3">
                      <p className="font-semibold">{breach.title}</p>
                      <p className="text-sm text-muted">
                        {formatBreachDate(breach.breachDate)} · {formatCount(breach.pwnCount)} accounts
                        {breach.domain ? ` · ${breach.domain}` : ""}
                      </p>
                      {!matched ? (
                        <p className="mt-1 text-sm text-sienna">No deletion guide in the catalog.</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <details className="mt-6 rounded-2xl border border-line bg-card px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">
                {lookup ? "Check another email" : "Check an email"}
              </summary>
              <EmailForm
                id="checklist-email"
                appearance="inline"
                onResult={() => setOpenOverride(null)}
              />
            </details>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="sr-only" htmlFor="filter-accounts">
                Filter accounts
              </label>
              <input
                id="filter-accounts"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name or domain"
                className="h-10 w-full rounded-full border border-line bg-card px-4 text-sm outline-none focus:border-pine sm:max-w-xs"
              />
              <AddServiceDialog
                catalog={catalog}
                existingIds={new Set(visible.map((service) => service.id))}
                onAddCatalog={addCatalog}
                onAddCustom={addCustom}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Chip pressed={focus === "all"} onClick={() => setFocus("all")}>
                All
              </Chip>
              <Chip pressed={focus === "breached"} onClick={() => setFocus("breached")}>
                {source === "demo" ? "Sample matches" : "Breached"}
              </Chip>
              <Chip pressed={focus === "remaining"} onClick={() => setFocus("remaining")}>
                Still open
              </Chip>
              <Chip pressed={focus === "decided"} onClick={() => setFocus("decided")}>
                Decided
              </Chip>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip pressed={difficulty === "all"} onClick={() => setDifficulty("all")}>
                Any difficulty
              </Chip>
              {DIFFICULTY_ORDER.map((item) => (
                <Chip key={item} pressed={difficulty === item} onClick={() => setDifficulty(item)}>
                  {DIFFICULTY_META[item].label}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-sm text-faint">
              Showing {filtered.length} of {visible.length}. Click a status again to clear it.
              Progress is saved in this browser.
            </p>

            <div className="mt-6 space-y-8">
              {groups.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-line px-5 py-8 text-center text-muted">
                  Nothing matches that filter.
                </p>
              ) : (
                groups.map((group) => (
                  <section key={group.key}>
                    <GroupHeading groupKey={group.key} count={group.services.length} source={source} />
                    <div className="mt-3 space-y-3">
                      {group.services.map((service) => (
                        <AccountCard
                          key={service.id}
                          service={service}
                          breaches={matches.get(service.id) ?? []}
                          source={source}
                          status={state.status[service.id]}
                          open={openIds.includes(service.id)}
                          onToggle={() =>
                            setOpenOverride(
                              openIds.includes(service.id)
                                ? openIds.filter((id) => id !== service.id)
                                : [...openIds, service.id],
                            )
                          }
                          onStatus={(status) => setStatus(service.id, status)}
                          onRemove={() => removeService(service)}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
              {lookup ? (
                <button
                  type="button"
                  onClick={() => {
                    writeLookup(null);
                    setOpenOverride(null);
                  }}
                  className="h-10 rounded-full border border-line px-4 text-sm font-semibold"
                >
                  Forget this email
                </button>
              ) : null}
              {confirmClear ? (
                <>
                  <p className="text-sm text-muted">This clears statuses and accounts you added.</p>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllLocalData();
                      setUndo(null);
                      setConfirmClear(false);
                      setOpenOverride(null);
                    }}
                    className="h-10 rounded-full bg-sienna px-4 text-sm font-semibold text-card"
                  >
                    Confirm clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="h-10 px-2 text-sm font-semibold text-muted"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="h-10 rounded-full border border-line px-4 text-sm font-semibold"
                >
                  Clear saved progress
                </button>
              )}
            </div>
          </>
        )}
      </main>
      {undo ? (
        <div className="fixed right-4 bottom-4 left-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-card shadow-lg sm:left-auto">
          <p>Removed {undo.name}.</p>
          <button type="button" onClick={restoreRemoved} className="font-semibold text-mist">
            Undo
          </button>
        </div>
      ) : null}
      <SiteFooter />
    </>
  );
}

function GroupHeading({
  groupKey: key,
  count,
  source,
}: {
  groupKey: string;
  count: number;
  source: BreachSource | null;
}) {
  const sample = key === "breached" && source === "demo";
  const title = sample
    ? "Sample matches"
    : key === "breached"
      ? "Act first"
      : isDifficulty(key)
        ? DIFFICULTY_META[key].group
        : key;
  const detail = sample
    ? "Lined up with the example breaches. This is not a result for your email."
    : key === "breached"
      ? "Matched a Have I Been Pwned breach. Change the password or delete the account."
      : undefined;

  return (
    <div>
      <h2 className="font-display text-2xl font-medium tracking-tight">
        {title} <span className="text-faint">{count}</span>
      </h2>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <dt className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">{label}</dt>
      <dd className="mt-1 font-display text-3xl leading-none">{value}</dd>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-9 rounded-full px-3 text-sm font-semibold ${
        pressed ? "bg-ink text-card" : "border border-line bg-card text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)));
  return (
    <div className="flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e7e0d2" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#1b4d3e"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <p className="text-sm leading-5 text-muted">
        <span className="block font-semibold text-ink">{label}</span>
        marked
      </p>
    </div>
  );
}
