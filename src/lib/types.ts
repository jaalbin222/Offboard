export type Difficulty = "easy" | "medium" | "limited" | "hard" | "impossible";

export type Service = {
  id: string;
  name: string;
  url: string;
  difficulty: Difficulty;
  domains: string[];
  notes?: string;
  email?: string;
  emailSubject?: string;
  popular?: boolean;
  custom?: boolean;
};

export type Breach = {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  pwnCount: number;
  dataClasses: string[];
  description: string;
  isVerified: boolean;
};

export type BreachSource = "hibp" | "demo";

export type BreachLookup = {
  source: BreachSource;
  breaches: Breach[];
  disclaimer?: string;
};

export type AccountStatus = "deleted" | "locked" | "kept";

export type LookupSession = {
  email: string;
  result: BreachLookup;
};
