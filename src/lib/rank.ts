import { DIFFICULTY_ORDER } from "./labels";
import type { Breach, BreachSource, Difficulty, Service } from "./types";

const DIFFICULTY_RANK = new Map<Difficulty, number>(
  DIFFICULTY_ORDER.map((difficulty, index) => [difficulty, index]),
);

export function recommendation(
  service: Service,
  breaches: Breach[],
  source: BreachSource = "hibp",
): string | null {
  if (breaches.length === 0) return null;
  const names = breaches.map((breach) => breach.title || breach.name);
  const list = formatList(names);
  const lead =
    source === "demo"
      ? `Sample match for ${list}. This is not a result for the email you entered.`
      : `Shows up in ${list}.`;
  if (service.difficulty === "impossible") {
    return `${lead} This account cannot be deleted. Change the password, turn on two-factor authentication, and lock it down.`;
  }
  return `${lead} Change the password if you still use it, or delete the account.`;
}

function formatList(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique.at(-1)}`;
}

export function rankServices(services: Service[], matches: Map<string, Breach[]>): Service[] {
  return [...services].sort((a, b) => {
    const aBreached = matches.has(a.id) ? 0 : 1;
    const bBreached = matches.has(b.id) ? 0 : 1;
    if (aBreached !== bBreached) return aBreached - bBreached;
    const byDifficulty =
      (DIFFICULTY_RANK.get(a.difficulty) ?? 9) - (DIFFICULTY_RANK.get(b.difficulty) ?? 9);
    if (byDifficulty !== 0) return byDifficulty;
    return a.name.localeCompare(b.name);
  });
}

export function groupKey(service: Service, matches: Map<string, Breach[]>): string {
  return matches.has(service.id) ? "breached" : service.difficulty;
}
