import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-ink">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-pine text-card" aria-hidden>
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
          <path
            d="M8 16.5h11M15.2 12.2 19.8 16.5 15.2 20.8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-[1.35rem] leading-none tracking-tight">Offboard</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Brand />
        <nav className="flex items-center gap-4 text-sm font-medium text-muted sm:gap-5">
          <Link href="/#how" className="hidden hover:text-ink sm:inline">
            How it works
          </Link>
          <Link href="/#privacy" className="hidden hover:text-ink sm:inline">
            Privacy
          </Link>
          <Link
            href="/checklist"
            className="rounded-full bg-ink px-3.5 py-1.5 text-card hover:bg-pine"
          >
            Checklist
          </Link>
        </nav>
      </div>
    </header>
  );
}
