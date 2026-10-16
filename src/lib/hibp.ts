import { demoLookup } from "./demo-breaches";
import { stripHtml } from "./format";
import type { Breach, BreachLookup } from "./types";

const HIBP_URL = "https://haveibeenpwned.com/api/v3/breachedaccount";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function mapBreach(raw: unknown): Breach | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const title = text(record.Title ?? record.title);
  const name = text(record.Name ?? record.name) || title;
  if (!name && !title) return null;
  const description = stripHtml(text(record.Description ?? record.description));
  return {
    name: name || title,
    title: title || name,
    domain: text(record.Domain ?? record.domain).toLowerCase(),
    breachDate: text(record.BreachDate ?? record.breachDate),
    pwnCount: number(record.PwnCount ?? record.pwnCount),
    dataClasses: stringList(record.DataClasses ?? record.dataClasses),
    description: description.length > 420 ? `${description.slice(0, 417)}...` : description,
    isVerified: (record.IsVerified ?? record.isVerified) !== false,
  };
}

export function mapBreaches(payload: unknown): Breach[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((item) => {
    const breach = mapBreach(item);
    return breach ? [breach] : [];
  });
}

export function hibpErrorMessage(status: number): string {
  if (status === 401) return "Have I Been Pwned rejected the API key. Check HIBP_API_KEY.";
  if (status === 403) {
    return "Have I Been Pwned refused the request. Offboard sends a User-Agent named Offboard.";
  }
  if (status === 429) return "Have I Been Pwned rate-limited this check. Wait a moment and try again.";
  if (status === 400) return "Have I Been Pwned could not search that address.";
  return "Have I Been Pwned could not complete the lookup. Try again in a moment.";
}

export async function lookupAccount(email: string, apiKey: string): Promise<BreachLookup> {
  const url = `${HIBP_URL}/${encodeURIComponent(email)}?truncateResponse=false`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "hibp-api-key": apiKey,
        "user-agent": "Offboard",
        accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new LookupError("Have I Been Pwned did not respond. Try again in a moment.", 504);
  }

  if (response.status === 404) {
    return { source: "hibp", breaches: [] };
  }

  if (!response.ok) {
    throw new LookupError(hibpErrorMessage(response.status), 502);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new LookupError("Have I Been Pwned returned a response Offboard could not read.", 502);
  }

  return { source: "hibp", breaches: mapBreaches(payload) };
}

export function lookupWithoutKey(): BreachLookup {
  return demoLookup();
}

export class LookupError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LookupError";
    this.status = status;
  }
}
