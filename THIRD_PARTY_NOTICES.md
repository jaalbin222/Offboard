# Third-party notices

## JustDeleteMe

The account catalog in `public/data/catalog.json` is derived from the JustDeleteMe
sites list:

https://github.com/jdm-contrib/jdm

Snapshot retrieved 2026-10-16 from `_data/sites.json` on the `master` branch.
English notes, deletion URLs, domains, and difficulty ratings are kept.
Translations are omitted. Difficulty value `limited` is preserved from the source.

```
The MIT License (MIT)

Copyright (c) 2013-2020 Robb Lewis, The JDM Contrib Team, & various contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Have I Been Pwned

Breach lookups call the Have I Been Pwned API v3 `breachedaccount` endpoint.
Have I Been Pwned is operated by Troy Hunt. API use requires your own key and
is subject to the Have I Been Pwned API terms. Offboard does not ship an API key.
Sample breach cards describe publicly known incidents and are not a live lookup.
