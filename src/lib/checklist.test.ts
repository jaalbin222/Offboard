import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { POST } from "../app/api/breaches/route";
import { DEMO_BREACHES } from "./demo-breaches";
import { mapBreach } from "./hibp";
import { isValidEmail } from "./email";
import { matchBreaches } from "./match";
import { rankServices, recommendation } from "./rank";
import { deletionSteps } from "./steps";
import type { Breach, Service } from "./types";

function service(partial: Partial<Service> & Pick<Service, "id" | "name" | "domains">): Service {
  return {
    url: "https://example.com/delete",
    difficulty: "easy",
    popular: true,
    ...partial,
  };
}

const fixture: Service[] = [
  service({
    id: "x",
    name: "X",
    domains: ["x.com", "twitter.com"],
    difficulty: "easy",
  }),
  service({
    id: "google",
    name: "Google",
    domains: ["google.com", "blogger.com", "mail.google.com"],
    difficulty: "easy",
  }),
  service({
    id: "blogger",
    name: "Blogger",
    domains: ["blogger.com"],
    difficulty: "impossible",
  }),
  service({
    id: "gmail",
    name: "Gmail",
    domains: ["gmail.com", "mail.google.com"],
    difficulty: "medium",
  }),
  service({
    id: "adobe",
    name: "Adobe",
    domains: ["adobe.com"],
    difficulty: "easy",
  }),
  service({
    id: "spotify",
    name: "Spotify",
    domains: ["spotify.com"],
    difficulty: "medium",
  }),
];

describe("breach matching", () => {
  it("prefers the service that owns the domain", () => {
    const breaches: Breach[] = [
      {
        name: "Blogger",
        title: "Blogger",
        domain: "blogger.com",
        breachDate: "2011-01-01",
        pwnCount: 1,
        dataClasses: [],
        description: "",
        isVerified: true,
      },
      {
        name: "Twitter",
        title: "Twitter",
        domain: "twitter.com",
        breachDate: "2022-01-01",
        pwnCount: 5,
        dataClasses: [],
        description: "",
        isVerified: true,
      },
      {
        name: "Google",
        title: "Google",
        domain: "google.com",
        breachDate: "2014-01-01",
        pwnCount: 9,
        dataClasses: [],
        description: "",
        isVerified: true,
      },
    ];
    const matches = matchBreaches(fixture, breaches);
    assert.deepEqual(matches.get("blogger")?.map((breach) => breach.name), ["Blogger"]);
    assert.equal(matches.has("google"), true);
    assert.equal(matches.get("google")?.some((breach) => breach.name === "Blogger"), false);
    assert.deepEqual(matches.get("x")?.map((breach) => breach.name), ["Twitter"]);
    assert.equal(matches.has("gmail"), false);
  });

  it("ranks breached accounts ahead of easier untouched ones", () => {
    const matches = matchBreaches(fixture, [
      {
        name: "Adobe",
        title: "Adobe",
        domain: "adobe.com",
        breachDate: "2013-10-04",
        pwnCount: 10,
        dataClasses: ["Passwords"],
        description: "",
        isVerified: true,
      },
    ]);
    const ranked = rankServices(
      fixture.filter((item) => item.id === "adobe" || item.id === "spotify" || item.id === "x"),
      matches,
    );
    assert.equal(ranked[0]?.id, "adobe");
    assert.equal(ranked[1]?.difficulty, "easy");
    assert.match(recommendation(ranked[0], matches.get("adobe") ?? []) ?? "", /Change the password/);
    assert.match(
      recommendation(ranked[0], matches.get("adobe") ?? [], "demo") ?? "",
      /Sample match/,
    );
  });
});

describe("deletion steps", () => {
  it("splits numbered notes and keeps an email fallback", () => {
    const steps = deletionSteps({
      difficulty: "medium",
      notes:
        "1. Cancel your subscription. 2. Delete playlists you want gone. 3. Open the deletion page and confirm.",
      email: "support@example.com",
      emailSubject: "Delete my account",
    });
    assert.equal(steps[0], "Cancel your subscription.");
    assert.equal(steps.length >= 3, true);
    assert.match(steps.at(-1) ?? "", /support@example.com/);
    assert.match(steps.at(-1) ?? "", /Delete my account/);
  });

  it("uses a lock-down path when deletion is impossible", () => {
    const steps = deletionSteps({ difficulty: "impossible" });
    assert.match(steps.join(" "), /does not let you delete/);
    assert.match(steps.join(" "), /two-factor/);
  });
});

describe("Have I Been Pwned mapping", () => {
  it("strips HTML from descriptions and ignores the email in demo mode", async () => {
    const breach = mapBreach({
      Name: "Adobe",
      Title: "Adobe",
      Domain: "adobe.com",
      BreachDate: "2013-10-04",
      PwnCount: 10,
      Description: "Passwords were <em>encrypted</em> badly.",
      DataClasses: ["Email addresses"],
      IsVerified: true,
    });
    assert.equal(breach?.description, "Passwords were encrypted badly.");
    assert.equal(isValidEmail("not-an-email"), false);

    const previous = process.env.HIBP_API_KEY;
    delete process.env.HIBP_API_KEY;
    const response = await POST(
      new Request("http://localhost/api/breaches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.source, "demo");
    assert.match(body.disclaimer, /Sample data/);
    assert.equal(JSON.stringify(body).includes("person@example.com"), false);
    assert.equal(body.breaches.length, DEMO_BREACHES.length);
    if (previous === undefined) delete process.env.HIBP_API_KEY;
    else process.env.HIBP_API_KEY = previous;
  });

  it("rejects a missing email", async () => {
    const response = await POST(
      new Request("http://localhost/api/breaches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nope" }),
      }),
    );
    assert.equal(response.status, 400);
  });
});

describe("catalog snapshot", () => {
  it("ships at least 100 popular services and matches every sample breach", () => {
    const catalog = JSON.parse(
      readFileSync(new URL("../../public/data/catalog.json", import.meta.url), "utf8"),
    ) as Service[];
    const popular = catalog.filter((service) => service.popular);
    assert.equal(popular.length >= 100, true);
    const matches = matchBreaches(catalog, DEMO_BREACHES);
    for (const breach of DEMO_BREACHES) {
      const hit = [...matches.entries()].find(([, items]) =>
        items.some((item) => item.name === breach.name),
      );
      assert.ok(hit, `expected a service match for ${breach.name}`);
      assert.equal(hit[1][0]?.domain, breach.domain);
    }
  });
});
