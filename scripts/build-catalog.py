#!/usr/bin/env python3
"""Build public/data/catalog.json from the JustDeleteMe sites list.

JustDeleteMe (https://github.com/jdm-contrib/jdm) is MIT licensed.
This script keeps the English fields we show in the product and drops
translations. Re-run it to refresh the snapshot:

    python3 scripts/build-catalog.py
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

SOURCE_URL = "https://raw.githubusercontent.com/jdm-contrib/jdm/master/_data/sites.json"
SOURCE_PAGE = "https://github.com/jdm-contrib/jdm/blob/master/_data/sites.json"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "catalog.json"
META = ROOT / "public" / "data" / "catalog-meta.json"

# Domains that put a service on the default checklist. The full catalog
# stays searchable. x.com and twitter.com belong to the same JDM entry.
POPULAR_DOMAINS = {
    "1password.com",
    "aa.com",
    "acorns.com",
    "adidas.com",
    "adobe.com",
    "airbnb.com",
    "aliexpress.com",
    "amazon.com",
    "ancestry.com",
    "aol.com",
    "apple.com",
    "archive.org",
    "arstechnica.com",
    "asana.com",
    "atlassian.com",
    "audible.com",
    "badoo.com",
    "bandcamp.com",
    "basecamp.com",
    "battle.net",
    "bbc.co.uk",
    "bbc.com",
    "behance.net",
    "bestbuy.com",
    "betterment.com",
    "binance.com",
    "bitbucket.org",
    "bitwarden.com",
    "blizzard.com",
    "blogger.com",
    "bloomberg.com",
    "booking.com",
    "box.com",
    "britishairways.com",
    "bsky.app",
    "canva.com",
    "chegg.com",
    "classpass.com",
    "clickup.com",
    "cloudflare.com",
    "cnn.com",
    "codecademy.com",
    "codepen.io",
    "coinbase.com",
    "coursera.org",
    "craigslist.org",
    "creditkarma.com",
    "crunchyroll.com",
    "dailymotion.com",
    "dashlane.com",
    "deezer.com",
    "delta.com",
    "depop.com",
    "deviantart.com",
    "dev.to",
    "digitalocean.com",
    "discord.com",
    "disneyplus.com",
    "doordash.com",
    "dribbble.com",
    "dropbox.com",
    "duolingo.com",
    "ea.com",
    "ebay.com",
    "economist.com",
    "edx.org",
    "engadget.com",
    "epicgames.com",
    "etsy.com",
    "eventbrite.com",
    "evernote.com",
    "expedia.com",
    "facebook.com",
    "feedly.com",
    "figma.com",
    "fitbit.com",
    "fiverr.com",
    "flickr.com",
    "freecodecamp.org",
    "funimation.com",
    "gemini.com",
    "getpocket.com",
    "github.com",
    "gitlab.com",
    "gizmodo.com",
    "glassdoor.com",
    "gmail.com",
    "godaddy.com",
    "gog.com",
    "goodreads.com",
    "google.com",
    "grindr.com",
    "groupon.com",
    "grubhub.com",
    "hackerrank.com",
    "headspace.com",
    "heroku.com",
    "homedepot.com",
    "hotels.com",
    "houzz.com",
    "hulu.com",
    "humblebundle.com",
    "icloud.com",
    "iheart.com",
    "ikea.com",
    "imgur.com",
    "indeed.com",
    "inoreader.com",
    "instacart.com",
    "instagram.com",
    "instapaper.com",
    "itch.io",
    "jdate.com",
    "keepersecurity.com",
    "khanacademy.org",
    "kick.com",
    "klarna.com",
    "kraken.com",
    "last.fm",
    "lastpass.com",
    "leetcode.com",
    "lifehacker.com",
    "linkedin.com",
    "lufthansa.com",
    "lyft.com",
    "mailchimp.com",
    "mapmyrun.com",
    "mastodon.social",
    "masterclass.com",
    "match.com",
    "mcdonalds.com",
    "medium.com",
    "meetup.com",
    "mega.nz",
    "microsoft.com",
    "minecraft.net",
    "mint.com",
    "monday.com",
    "monster.com",
    "myfitnesspal.com",
    "myheritage.com",
    "namecheap.com",
    "nerdwallet.com",
    "netflix.com",
    "netlify.com",
    "news.ycombinator.com",
    "nextdoor.com",
    "nike.com",
    "nintendo.com",
    "notion.so",
    "nytimes.com",
    "offerup.com",
    "okcupid.com",
    "onlyfans.com",
    "opentable.com",
    "opera.com",
    "pandora.com",
    "paramountplus.com",
    "patreon.com",
    "paypal.com",
    "peacocktv.com",
    "pinboard.in",
    "pinterest.com",
    "playstation.com",
    "pluralsight.com",
    "pof.com",
    "postmates.com",
    "producthunt.com",
    "proton.me",
    "protonmail.com",
    "quizlet.com",
    "quora.com",
    "reddit.com",
    "redfin.com",
    "replit.com",
    "revolut.com",
    "riotgames.com",
    "roblox.com",
    "rockstargames.com",
    "robinhood.com",
    "rumble.com",
    "shein.com",
    "signal.org",
    "skillshare.com",
    "slack.com",
    "snapchat.com",
    "soundcloud.com",
    "spotify.com",
    "squareup.com",
    "stackoverflow.com",
    "starbucks.com",
    "steampowered.com",
    "strava.com",
    "stripe.com",
    "substack.com",
    "surveymonkey.com",
    "target.com",
    "telegram.org",
    "theatlantic.com",
    "theguardian.com",
    "tidal.com",
    "tiktok.com",
    "tinder.com",
    "todoist.com",
    "trello.com",
    "tripadvisor.com",
    "tumblr.com",
    "tutanota.com",
    "tuta.com",
    "twitch.tv",
    "twitter.com",
    "typeform.com",
    "uber.com",
    "ubereats.com",
    "ubisoft.com",
    "udacity.com",
    "udemy.com",
    "upwork.com",
    "venmo.com",
    "vercel.com",
    "vimeo.com",
    "vivaldi.com",
    "vrbo.com",
    "vsco.co",
    "walmart.com",
    "washingtonpost.com",
    "waze.com",
    "webflow.com",
    "weebly.com",
    "whatsapp.com",
    "wikipedia.org",
    "wikihow.com",
    "wise.com",
    "wish.com",
    "wix.com",
    "wordpress.com",
    "x.com",
    "xbox.com",
    "yahoo.com",
    "yelp.com",
    "youtube.com",
    "zoho.com",
    "zoom.us",
}

DIFFICULTIES = {"easy", "medium", "hard", "impossible", "limited"}


def plain(value: object) -> str:
    if not isinstance(value, str):
        return ""
    text = re.sub(r"\[([^\]]+)\]\((?:[^)]+)\)", r"\1", value)
    text = re.sub(r"<[^>]+>", " ", text)
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
    )
    text = re.sub(r"\s+", " ", text).strip()
    return text[:1000]


def slugify(name: str) -> str:
    slug = name.lower().replace("&", " and ")
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug or "service"


def load_sites() -> list[dict]:
    request = urllib.request.Request(
        SOURCE_URL,
        headers={"user-agent": "Offboard catalog builder"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.load(response)
    if not isinstance(payload, list):
        raise SystemExit("Expected sites.json to be a list")
    return payload


def main() -> None:
    sites = load_sites()
    used: dict[str, int] = {}
    catalog: list[dict] = []
    missing = set(POPULAR_DOMAINS)

    for site in sites:
        name = plain(site.get("name"))
        url = plain(site.get("url"))
        difficulty = site.get("difficulty")
        domains = [
            str(domain).strip().lower()
            for domain in site.get("domains") or []
            if str(domain).strip()
        ]
        if not name or not url or difficulty not in DIFFICULTIES or not domains:
            continue
        base = slugify(name)
        used[base] = used.get(base, 0) + 1
        service_id = base if used[base] == 1 else f"{base}-{used[base]}"
        popular = any(domain in POPULAR_DOMAINS for domain in domains)
        if popular:
            missing -= set(domains)
        entry = {
            "id": service_id,
            "name": name,
            "url": url,
            "difficulty": difficulty,
            "domains": domains,
            "popular": popular,
        }
        notes = plain(site.get("notes"))
        email = plain(site.get("email"))
        subject = plain(site.get("email_subject"))
        if notes:
            entry["notes"] = notes
        if email:
            entry["email"] = email
        if subject:
            entry["emailSubject"] = subject
        catalog.append(entry)

    catalog.sort(key=lambda item: item["id"])
    popular_count = sum(1 for item in catalog if item["popular"])
    if popular_count < 100:
        raise SystemExit(f"Only {popular_count} popular services. Need at least 100.")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    meta = {
        "name": "JustDeleteMe",
        "source": "https://github.com/jdm-contrib/jdm",
        "sourceFile": SOURCE_PAGE,
        "license": "MIT",
        "copyright": "Copyright (c) 2013-2020 Robb Lewis, The JDM Contrib Team, & various contributors",
        "retrieved": "2026-10-16",
        "serviceCount": len(catalog),
        "popularCount": popular_count,
        "unmatchedPopularDomains": sorted(missing),
    }
    META.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(catalog)} services ({popular_count} popular) to {OUT}")
    if missing:
        print("Popular domains not found:")
        for domain in sorted(missing):
            print(f"  {domain}")


if __name__ == "__main__":
    main()
