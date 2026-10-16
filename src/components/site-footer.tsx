import meta from "../../public/data/catalog-meta.json";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm leading-6 text-muted sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl">
          Deletion links, difficulty ratings, and notes are adapted from{" "}
          <a className="underline decoration-line underline-offset-2 hover:text-ink" href={meta.source}>
            JustDeleteMe
          </a>{" "}
          by Robb Lewis, the JDM Contrib Team, and contributors, used under the MIT License.
          Breach lookups use the{" "}
          <a
            className="underline decoration-line underline-offset-2 hover:text-ink"
            href="https://haveibeenpwned.com/API/v3"
          >
            Have I Been Pwned API
          </a>
          .
        </p>
        <p className="shrink-0">Offboard keeps the checklist on this device.</p>
      </div>
    </footer>
  );
}
