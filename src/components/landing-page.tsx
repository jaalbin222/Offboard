import { EmailForm } from "@/components/email-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DIFFICULTY_META, DIFFICULTY_ORDER } from "@/lib/labels";
import meta from "../../public/data/catalog-meta.json";

const STEPS = [
  {
    number: "01",
    title: "Check the email",
    body: "With an API key, Offboard asks Have I Been Pwned which breaches include that address. With no key, you get sample breaches and a banner that says so.",
  },
  {
    number: "02",
    title: "Put the risky ones first",
    body: "A starter list of popular accounts is ranked easy to impossible. Anything that matches a breach moves to the top, with a change-password or delete recommendation.",
  },
  {
    number: "03",
    title: "Delete, lock, or keep",
    body: "Each row has the deletion link and the steps. Mark it deleted, locked, or kept. Add anything the catalog missed. Progress stays in this browser.",
  },
];

const PRIVACY = [
  {
    title: "The email is not stored",
    body: "The address is used for the check and then discarded. It is not written to a database, and it is not put in the URL.",
  },
  {
    title: "Sample data stays labeled",
    body: "If HIBP_API_KEY is missing, the server returns example breaches from well-known public incidents. The page calls them sample data.",
  },
  {
    title: "The checklist lives on your device",
    body: "Statuses, accounts you add, and the email label sit in localStorage and sessionStorage. Clear them whenever you want.",
  },
];

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-pine uppercase">
              Account offboarding
            </p>
            <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.02] font-medium tracking-tight text-ink sm:text-6xl">
              See the breaches. Close the accounts.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Enter an email. Offboard checks Have I Been Pwned, then builds a checklist with a
              deletion link, a difficulty rating, and the steps. Breached services sit at the top.
            </p>
            <EmailForm />
            <p className="mt-3 max-w-xl text-sm leading-6 text-faint">
              The email is not saved on the server. Without an API key, the checklist runs on
              clearly labeled sample breaches.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink">
              <li>No signup</li>
              <li>{meta.popularCount} starter accounts</li>
              <li>{meta.serviceCount.toLocaleString("en-US")} services you can add</li>
            </ul>
          </div>
          <Preview />
        </section>

        <section id="how" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="font-display text-4xl font-medium tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.number} className="rounded-3xl border border-line bg-card p-6">
                  <p className="font-display text-3xl text-pine">{step.number}</p>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="font-display text-4xl font-medium tracking-tight">
              Ranked by how hard they are to leave
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Difficulty comes from JustDeleteMe. Impossible accounts stay on the list so you can
              lock them instead of hunting for a delete button that does not exist.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {DIFFICULTY_ORDER.map((difficulty) => (
                <li key={difficulty} className="rounded-2xl border border-line bg-card p-4">
                  <p className="text-sm font-semibold tracking-[0.12em] text-pine uppercase">
                    {DIFFICULTY_META[difficulty].label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {DIFFICULTY_META[difficulty].summary}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="privacy" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="font-display text-4xl font-medium tracking-tight">
              Built to forget the email
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {PRIVACY.map((item) => (
                <li key={item.title} className="rounded-3xl bg-pine px-6 py-6 text-card">
                  <h3 className="font-display text-2xl font-medium">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-mist">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Preview() {
  return (
    <div aria-hidden className="relative">
      <div className="absolute -top-3 right-6 rounded-full bg-sienna px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-card uppercase">
        Example
      </div>
      <div className="rounded-[1.75rem] border border-line bg-card p-4 shadow-[var(--shadow)] sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-faint uppercase">
              Checklist preview
            </p>
            <p className="mt-1 font-display text-2xl">3 of 8 decided</p>
          </div>
          <p className="text-sm text-muted">Sample layout</p>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full w-[37%] rounded-full bg-pine" />
        </div>
        <div className="mt-4 space-y-3">
          <PreviewRow
            name="Adobe"
            domain="adobe.com"
            difficulty="Easy"
            tone="bg-mist text-pine"
            note="Sample match. Change the password or delete the account."
            flagged
          />
          <PreviewRow
            name="Spotify"
            domain="spotify.com"
            difficulty="Medium"
            tone="bg-gold-soft text-gold"
            note="Cancel the plan, then close the account from the support page."
          />
          <PreviewRow
            name="Signal"
            domain="signal.org"
            difficulty="Easy"
            tone="bg-mist text-pine"
            note="Marked deleted on this device."
            done
          />
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  name,
  domain,
  difficulty,
  tone,
  note,
  flagged = false,
  done = false,
}: {
  name: string;
  domain: string;
  difficulty: string;
  tone: string;
  note: string;
  flagged?: boolean;
  done?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-paper px-4 py-3 ${flagged ? "border-sienna/40" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase ${tone}`}>
          {difficulty}
        </span>
        {flagged ? (
          <span className="rounded-full bg-sienna-soft px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-sienna uppercase">
            Sample match
          </span>
        ) : null}
        {done ? (
          <span className="rounded-full bg-pine px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-card uppercase">
            Deleted
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-xl">{name}</p>
      <p className="text-sm text-muted">{domain}</p>
      <p className="mt-2 text-sm leading-5 text-ink">{note}</p>
    </div>
  );
}
