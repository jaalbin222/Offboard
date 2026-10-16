"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { DIFFICULTY_META, DIFFICULTY_ORDER } from "@/lib/labels";
import { displayDomain } from "@/lib/format";
import { isSafeHttpUrl } from "@/lib/urls";
import type { Difficulty, Service } from "@/lib/types";

export function AddServiceDialog({
  catalog,
  existingIds,
  onAddCatalog,
  onAddCustom,
}: {
  catalog: Service[];
  existingIds: Set<string>;
  onAddCatalog: (service: Service) => void;
  onAddCustom: (service: Service) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return catalog
      .filter((service) => {
        const haystack = `${service.name} ${service.domains.join(" ")}`.toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 8);
  }, [catalog, query]);

  function close() {
    dialogRef.current?.close();
  }

  function reset() {
    setQuery("");
    setManual(false);
    setName("");
    setUrl("");
    setDifficulty("easy");
    setNotes("");
    setFormError("");
  }

  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (trimmedName.length < 2) {
      setFormError("Enter the service name.");
      return;
    }
    if (!isSafeHttpUrl(trimmedUrl)) {
      setFormError("Enter an http or https link to the deletion page.");
      return;
    }
    onAddCustom({
      id: `custom-${crypto.randomUUID()}`,
      name: trimmedName,
      url: trimmedUrl,
      difficulty,
      domains: [],
      notes: notes.trim() || undefined,
      popular: false,
      custom: true,
    });
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-card hover:bg-pine"
      >
        Add an account
      </button>
      <dialog
        ref={dialogRef}
        onClose={reset}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-medium tracking-tight">Add an account</h2>
              <p className="mt-1 text-sm text-muted">
                Search the JustDeleteMe catalog, or add a service it does not list.
              </p>
            </div>
            <button type="button" onClick={close} className="text-sm font-semibold text-muted hover:text-ink">
              Close
            </button>
          </div>

          <label htmlFor="catalog-search" className="mt-5 block text-sm font-medium">
            Search {catalog.length.toLocaleString("en-US")} services
          </label>
          <input
            id="catalog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Netflix, github.com…"
            className="mt-2 h-12 w-full rounded-2xl border border-line bg-paper px-4 outline-none focus:border-pine"
          />

          {query.trim().length >= 2 ? (
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
              {results.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">No services match that search.</li>
              ) : (
                results.map((service) => {
                  const already = existingIds.has(service.id);
                  return (
                    <li key={service.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted">{displayDomain(service)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DifficultyBadge difficulty={service.difficulty} />
                        <button
                          type="button"
                          disabled={already}
                          onClick={() => {
                            onAddCatalog(service);
                            close();
                          }}
                          className="h-9 rounded-full border border-line px-3 text-sm font-semibold disabled:text-faint"
                        >
                          {already ? "Added" : "Add"}
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-faint">Type at least two letters.</p>
          )}

          <button
            type="button"
            onClick={() => setManual((value) => !value)}
            className="mt-5 text-sm font-semibold text-pine"
          >
            {manual ? "Hide the manual form" : "Can’t find it? Add it manually"}
          </button>

          {manual ? (
            <form onSubmit={submitCustom} className="mt-4 space-y-3" noValidate>
              <div>
                <label htmlFor="custom-name" className="text-sm font-medium">
                  Service name
                </label>
                <input
                  id="custom-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-pine"
                />
              </div>
              <div>
                <label htmlFor="custom-url" className="text-sm font-medium">
                  Deletion page URL
                </label>
                <input
                  id="custom-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://"
                  className="mt-1 h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-pine"
                />
              </div>
              <div>
                <label htmlFor="custom-difficulty" className="text-sm font-medium">
                  Difficulty
                </label>
                <select
                  id="custom-difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3"
                >
                  {DIFFICULTY_ORDER.map((item) => (
                    <option key={item} value={item}>
                      {DIFFICULTY_META[item].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="custom-notes" className="text-sm font-medium">
                  Notes, optional
                </label>
                <textarea
                  id="custom-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-pine"
                />
              </div>
              {formError ? (
                <p role="alert" className="text-sm font-medium text-sienna">
                  {formError}
                </p>
              ) : null}
              <button type="submit" className="h-11 rounded-full bg-pine px-5 text-sm font-semibold text-card">
                Add to checklist
              </button>
            </form>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
