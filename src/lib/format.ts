const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatBreachDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : iso;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "Unknown size";
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    const rounded = billions >= 10 ? Math.round(billions) : Math.round(billions * 10) / 10;
    return `${rounded} billion`;
  }
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)} million`;
  }
  return value.toLocaleString("en-US");
}

export function displayDomain(service: { name: string; domains: string[]; custom?: boolean }): string {
  if (service.custom || service.domains.length === 0) return "Added by you";
  const tokens = service.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
  const scored = service.domains.map((domain) => {
    const host = (domain.split(".")[0] ?? domain).toLowerCase();
    let score = 0;
    if (tokens.some((token) => token === host || host.includes(token) || token.includes(host))) {
      score += 5;
    }
    if (domain.endsWith(".com")) score += 2;
    if (domain.split(".").length === 2) score += 1;
    score -= domain.length / 100;
    return { domain, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.domain ?? service.domains[0];
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
