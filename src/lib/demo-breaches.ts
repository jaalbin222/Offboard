import type { Breach, BreachLookup } from "./types";

export const DEMO_DISCLAIMER =
  "Sample data only. No Have I Been Pwned API key is set, so this is not a lookup of the email you entered. Nothing here says that address was actually breached.";

/** Public historical incidents, used only as labeled sample data. */
export const DEMO_BREACHES: Breach[] = [
  {
    name: "Adobe",
    title: "Adobe",
    domain: "adobe.com",
    breachDate: "2013-10-04",
    pwnCount: 153000000,
    dataClasses: ["Email addresses", "Passwords", "Password hints", "Usernames"],
    description:
      "Sample record of the October 2013 Adobe breach, when roughly 153 million accounts were exposed, including weakly protected passwords and password hints.",
    isVerified: true,
  },
  {
    name: "LinkedIn",
    title: "LinkedIn",
    domain: "linkedin.com",
    breachDate: "2012-05-05",
    pwnCount: 164000000,
    dataClasses: ["Email addresses", "Passwords"],
    description:
      "Sample record of the 2012 LinkedIn breach. About 164 million email and password pairs later circulated publicly.",
    isVerified: true,
  },
  {
    name: "Dropbox",
    title: "Dropbox",
    domain: "dropbox.com",
    breachDate: "2012-07-01",
    pwnCount: 68000000,
    dataClasses: ["Email addresses", "Passwords"],
    description:
      "Sample record of the 2012 Dropbox breach, which exposed email addresses and hashed passwords for tens of millions of accounts.",
    isVerified: true,
  },
  {
    name: "Canva",
    title: "Canva",
    domain: "canva.com",
    breachDate: "2019-05-24",
    pwnCount: 137000000,
    dataClasses: ["Email addresses", "Names", "Usernames", "Passwords", "Cities"],
    description:
      "Sample record of the May 2019 Canva breach, which exposed account details for roughly 137 million users.",
    isVerified: true,
  },
  {
    name: "MyFitnessPal",
    title: "MyFitnessPal",
    domain: "myfitnesspal.com",
    breachDate: "2018-02-01",
    pwnCount: 150000000,
    dataClasses: ["Email addresses", "Usernames", "Passwords"],
    description:
      "Sample record of the February 2018 MyFitnessPal breach, which exposed usernames, email addresses, and password hashes.",
    isVerified: true,
  },
  {
    name: "Yahoo",
    title: "Yahoo",
    domain: "yahoo.com",
    breachDate: "2013-08-01",
    pwnCount: 3000000000,
    dataClasses: ["Email addresses", "Passwords", "Security questions", "Dates of birth"],
    description:
      "Sample record of the 2013 Yahoo breach, which later came to light as covering every Yahoo account at the time.",
    isVerified: true,
  },
  {
    name: "Facebook",
    title: "Facebook",
    domain: "facebook.com",
    breachDate: "2019-08-01",
    pwnCount: 533000000,
    dataClasses: ["Phone numbers", "Names", "Email addresses", "Dates of birth"],
    description:
      "Sample record of the 2019 Facebook scraping incident, in which phone numbers and profile details for hundreds of millions of users were collected.",
    isVerified: true,
  },
  {
    name: "Twitter",
    title: "Twitter",
    domain: "twitter.com",
    breachDate: "2022-01-01",
    pwnCount: 200000000,
    dataClasses: ["Email addresses", "Names", "Usernames"],
    description:
      "Sample record of a large Twitter user scrape disclosed in 2022, which included email addresses and public profile details.",
    isVerified: true,
  },
];

export function demoLookup(): BreachLookup {
  return {
    source: "demo",
    disclaimer: DEMO_DISCLAIMER,
    breaches: DEMO_BREACHES,
  };
}
