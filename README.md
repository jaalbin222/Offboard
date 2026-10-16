# Offboard

Offboard is a privacy-first account offboarding app. Enter an email, see the known data breaches it appears in, and work through a personal checklist to delete or lock each account.

The checklist is ranked by difficulty (easy, medium, limited, hard, impossible). Breached services move to the top with a change-password or delete recommendation, a direct deletion link, and step-by-step instructions. You can add services the catalog does not list. Progress is saved in this browser. There is no account and no server-side email storage.

## Setup

Requires Node.js 22+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

```bash
npm test
npm run lint
npm run build
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `HIBP_API_KEY` | No | Have I Been Pwned API key for `GET /api/v3/breachedaccount/{email}` |

Get a key at https://haveibeenpwned.com/API/Key. Put it in `.env.local`:

```bash
HIBP_API_KEY=your_32_character_hex_key
```

Leave it unset to run the full flow on **sample breaches**. Sample mode is labeled in the API response (`source: "demo"`) and with a banner in the checklist. It is not a lookup of the email you typed.

Do not prefix the key with `NEXT_PUBLIC_`. The key must stay on the server. `.env*` files are gitignored except `.env.example`. This repository is public. Never commit a real key.

The breached-account call sends:

- `hibp-api-key`: your key
- `user-agent`: `Offboard`
- `truncateResponse=false`, so each breach includes its domain, date, and data classes

A 404 from Have I Been Pwned means no breaches were returned. Invalid keys, rate limits, and outages are shown as errors and do not fall back to sample data.

## How a check works

1. The browser `POST`s the email to `/api/breaches`.
2. If `HIBP_API_KEY` is set, the server calls Have I Been Pwned and returns the breach list. The email is not logged, stored, or copied into the response.
3. If the key is missing, the server ignores the address and returns the labeled sample set.
4. The browser keeps the email and the result in `sessionStorage` for the tab.
5. Checklist status, dismissed accounts, and accounts you add live in `localStorage` under `offboard.state.v1`.

## Account catalog

`public/data/catalog.json` is a snapshot of the [JustDeleteMe](https://github.com/jdm-contrib/jdm) sites list (`_data/sites.json`, MIT). The default checklist is a curated popular subset (200+). Search can add any of the remaining services. See `THIRD_PARTY_NOTICES.md`.

Refresh the snapshot:

```bash
python3 scripts/build-catalog.py
```

`limited` is a JustDeleteMe difficulty for accounts that only allow partial deletion. It sits between medium and hard.

## Next steps

- **Inbox discovery.** A read-only mail connector (Gmail or IMAP) could scan for signup, receipt, and password-reset messages and pre-check the accounts you actually opened. That should stay opt-in, with the mailbox token stored locally or in a customer-controlled vault, and with the same rule: do not retain message bodies.
- **Password-manager import.** A CSV export from Bitwarden or 1Password is a second way to discover accounts without reading email.
- **Waiting-period reminders.** Some deletions (X, Yahoo) only finish after a cooling-off window. A local reminder, still without an account, would close that gap.
- **B2B employee offboarding.** A company tier could start from an HRIS or SSO roster (Okta, Google Workspace, Rippling), assign a departing employee a deadline, and collect deletion evidence for the admin. That tier needs real auth, tenant isolation, and a data-retention policy. The consumer app should stay email-free on the server.
- **Stronger breach privacy.** Have I Been Pwned also offers a k-anonymity range search on higher plans. Moving to that would send a hash prefix instead of the full email.

## License of the catalog

JustDeleteMe is MIT, copyright 2013–2020 Robb Lewis, the JDM Contrib Team, and contributors. The license text is in `THIRD_PARTY_NOTICES.md`.
