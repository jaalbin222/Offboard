import type { Breach, Service } from "./types";

export type ServiceHit = {
  service: Service;
  breaches: Breach[];
};

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesMatch(serviceName: string, title: string): boolean {
  const titleKey = normalizeName(title);
  const serviceKey = normalizeName(serviceName);
  if (!titleKey || !serviceKey) return false;
  if (serviceKey === titleKey) return true;
  if (titleKey.length < 3) return false;
  const parts = serviceName
    .split(/[/|,&]/)
    .map(normalizeName)
    .filter((part) => part.length >= 3);
  return parts.some(
    (part) => part === titleKey || part.includes(titleKey) || titleKey.includes(part),
  );
}

type Candidate = {
  service: Service;
  score: number;
  nameMatch: number;
};

function indexDomains(services: Service[]): Map<string, Service[]> {
  const index = new Map<string, Service[]>();
  for (const service of services) {
    for (const domain of service.domains) {
      const key = normalizeDomain(domain);
      if (!key) continue;
      const list = index.get(key) ?? [];
      list.push(service);
      index.set(key, list);
    }
  }
  return index;
}

function candidatesForDomain(
  index: Map<string, Service[]>,
  breachDomain: string,
  title: string,
): Candidate[] {
  const found = new Map<string, Candidate>();

  const add = (service: Service, score: number) => {
    const current = found.get(service.id);
    const nameMatch = namesMatch(service.name, title) ? 0 : 1;
    if (!current || score < current.score || (score === current.score && nameMatch < current.nameMatch)) {
      found.set(service.id, { service, score, nameMatch });
    }
  };

  for (const service of index.get(breachDomain) ?? []) {
    const primary = normalizeDomain(service.domains[0] ?? "") === breachDomain;
    add(service, primary ? 0 : 1);
  }

  const parts = breachDomain.split(".");
  for (let i = 1; i < parts.length - 1; i += 1) {
    const parent = parts.slice(i).join(".");
    for (const service of index.get(parent) ?? []) {
      add(service, 2);
    }
  }

  if (found.size === 0) {
    const suffix = `.${breachDomain}`;
    for (const [domain, services] of index) {
      if (!domain.endsWith(suffix)) continue;
      for (const service of services) add(service, 3);
    }
  }

  return [...found.values()];
}

function pickWinners(candidates: Candidate[]): Service[] {
  if (candidates.length === 0) return [];
  candidates.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.nameMatch !== b.nameMatch) return a.nameMatch - b.nameMatch;
    if (a.service.domains.length !== b.service.domains.length) {
      return a.service.domains.length - b.service.domains.length;
    }
    return a.service.name.localeCompare(b.service.name);
  });
  const best = candidates[0];
  const winners = candidates.filter(
    (candidate) => candidate.score === best.score && candidate.nameMatch === best.nameMatch,
  );
  return (winners.length > 4 ? winners.slice(0, 1) : winners).map((candidate) => candidate.service);
}

function byName(services: Service[], title: string): Service[] {
  const named = services.filter((service) => namesMatch(service.name, title));
  if (named.length === 1) return named;
  const exact = named.filter((service) => normalizeName(service.name) === normalizeName(title));
  return exact.length === 1 ? exact : [];
}

export function matchBreaches(services: Service[], breaches: Breach[]): Map<string, Breach[]> {
  const index = indexDomains(services);
  const matches = new Map<string, Breach[]>();

  for (const breach of breaches) {
    const domain = normalizeDomain(breach.domain);
    const winners = domain
      ? pickWinners(candidatesForDomain(index, domain, breach.title || breach.name))
      : [];
    const chosen = winners.length > 0 ? winners : byName(services, breach.title || breach.name);
    for (const service of chosen) {
      const list = matches.get(service.id) ?? [];
      list.push(breach);
      matches.set(service.id, list);
    }
  }

  return matches;
}

export function unmatchedBreaches(services: Service[], breaches: Breach[]): Breach[] {
  const matches = matchBreaches(services, breaches);
  const matchedNames = new Set(
    [...matches.values()].flatMap((items) => items.map((breach) => breach.name)),
  );
  return breaches.filter((breach) => !matchedNames.has(breach.name));
}
