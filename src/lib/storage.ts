import { isDifficulty } from "./labels";
import type { AccountStatus, LookupSession, Service } from "./types";

const STATE_KEY = "offboard.state.v1";
const LOOKUP_KEY = "offboard.lookup.v1";
const STATE_EVENT = "offboard-state";
const LOOKUP_EVENT = "offboard-lookup";

export type PersistedState = {
  status: Record<string, AccountStatus>;
  dismissed: string[];
  addedIds: string[];
  custom: Service[];
};

const STATUSES = new Set<AccountStatus>(["deleted", "locked", "kept"]);
const EMPTY_STATE: PersistedState = { status: {}, dismissed: [], addedIds: [], custom: [] };

let stateSnapshot: PersistedState = EMPTY_STATE;
let stateRaw: string | null = null;
let lookupSnapshot: LookupSession | null = null;
let lookupRaw: string | null = null;

export function emptyState(): PersistedState {
  return EMPTY_STATE;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function isService(value: unknown): value is Service {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<Service>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.url === "string" &&
    typeof record.difficulty === "string" &&
    isDifficulty(record.difficulty) &&
    Array.isArray(record.domains)
  );
}

function parseState(raw: string | null): PersistedState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const status: Record<string, AccountStatus> = {};
    if (parsed.status && typeof parsed.status === "object") {
      for (const [id, value] of Object.entries(parsed.status)) {
        if (typeof value === "string" && STATUSES.has(value as AccountStatus)) {
          status[id] = value as AccountStatus;
        }
      }
    }
    return {
      status,
      dismissed: stringList(parsed.dismissed),
      addedIds: stringList(parsed.addedIds),
      custom: Array.isArray(parsed.custom) ? parsed.custom.filter(isService) : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function parseLookup(raw: string | null): LookupSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LookupSession>;
    if (!parsed || typeof parsed.email !== "string" || !parsed.result) return null;
    if (parsed.result.source !== "hibp" && parsed.result.source !== "demo") return null;
    if (!Array.isArray(parsed.result.breaches)) return null;
    return { email: parsed.email, result: parsed.result };
  } catch {
    return null;
  }
}

export function subscribeState(callback: () => void) {
  const onChange = () => callback();
  window.addEventListener(STATE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STATE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getStateSnapshot(): PersistedState {
  const raw = window.localStorage.getItem(STATE_KEY);
  if (raw === stateRaw) return stateSnapshot;
  stateRaw = raw;
  stateSnapshot = parseState(raw);
  return stateSnapshot;
}

export function getServerStateSnapshot(): PersistedState {
  return EMPTY_STATE;
}

export function writeState(state: PersistedState) {
  const raw = JSON.stringify(state);
  window.localStorage.setItem(STATE_KEY, raw);
  stateRaw = raw;
  stateSnapshot = state;
  window.dispatchEvent(new Event(STATE_EVENT));
}

export function subscribeLookup(callback: () => void) {
  const onChange = () => callback();
  window.addEventListener(LOOKUP_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOOKUP_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getLookupSnapshot(): LookupSession | null {
  const raw = window.sessionStorage.getItem(LOOKUP_KEY);
  if (raw === lookupRaw) return lookupSnapshot;
  lookupRaw = raw;
  lookupSnapshot = parseLookup(raw);
  return lookupSnapshot;
}

export function getServerLookupSnapshot(): LookupSession | null {
  return null;
}

export function writeLookup(session: LookupSession | null) {
  if (!session) {
    window.sessionStorage.removeItem(LOOKUP_KEY);
    lookupRaw = null;
    lookupSnapshot = null;
  } else {
    const raw = JSON.stringify(session);
    window.sessionStorage.setItem(LOOKUP_KEY, raw);
    lookupRaw = raw;
    lookupSnapshot = session;
  }
  window.dispatchEvent(new Event(LOOKUP_EVENT));
}

export function clearAllLocalData() {
  window.localStorage.removeItem(STATE_KEY);
  window.sessionStorage.removeItem(LOOKUP_KEY);
  stateRaw = null;
  stateSnapshot = EMPTY_STATE;
  lookupRaw = null;
  lookupSnapshot = null;
  window.dispatchEvent(new Event(STATE_EVENT));
  window.dispatchEvent(new Event(LOOKUP_EVENT));
}
