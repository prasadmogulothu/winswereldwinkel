# Groenten module — tasks

> **Everything still outstanding is collected in [`integration.md`](integration.md),
> Part 0** — with who has to do it and why it blocks. This file is the build history,
> phase by phase.

Offline vegetable admin + sell screen for Wereld Supermarkt, running on the till PC next to Hanka.

**Money path:** the module never takes money. Staff weigh on the DIGI, type the kg here, and the
module shows one euro amount to type into Hanka's `groenten` key. Hanka stays the source of truth
for turnover, BTW and the Z-report.

Legend: `[ ]` todo · `[x]` done · `[~]` in progress · `[!]` blocked / needs the shop

---

## Phase 0 — Foundation

- [x] Folder skeleton (`app/`, `data/`, `tools/`)
- [x] `serve.ps1` — `System.Net.HttpListener` static server on `http://localhost:8777`
  - [x] `GET /*` static from `app/`, correct MIME types
  - [x] `GET /data/products.json`
  - [x] `PUT /api/products` — atomic write (`.tmp` then move)
  - [x] `POST /api/sale` — append one line to `data/sales.jsonl`
  - [x] `PUT /api/photo/<id>` — write JPEG to `app/photos/`
- [x] `start.bat` — start server hidden, open Chrome with `--app=http://localhost:8777`
- [x] `data/products.json` seeded with his Hanka veg + common world-shop produce
- [x] `README.md` — launch, back up, add a vegetable, troubleshoot
- [x] **Verify:** `start.bat` opens a Chrome app window and the page loads

## Phase 1 — Design system

- [x] Download **Archivo** + **IBM Plex Sans** WOFF2 into `app/fonts/` with OFL licences
- [x] `css/tokens.css` — slate / chalk / stone / okra / turmeric / chilli, type scale, spacing
- [x] `css/app.css` — header, tab bar, three-column shell, buttons, press states
- [x] Inline Lucide SVG sprite (no emoji, no icon font, no CDN)
- [x] **Verify:** renders at 1024×768 and 1440×900, no horizontal scroll, contrast ≥ 4.5:1

## Phase 2 — Money core

- [x] `js/money.js` — integer cents only, named DIGI scale constants
- [x] `app/test.html` — assert-based, no framework
- [x] **Verify:** all green. `2.615 × 3.80 = 994` · per-piece · `snapWeight(2.617) = 2.615` ·
      `0.05 kg` warns · `15.001 kg` rejects · `formatEuro(994) = "9,94"`

## Phase 3 — Sell screen

- [x] Category rail (Alles / Bladgroen / Knollen / Pepers / Kruiden / Per stuk)
- [x] Photo tile grid, 4-up at 1024px, 6-up at 1440px
- [x] Weigh panel: big photo, name, €/kg, numeric keypad, live amount
- [x] Basket column — multiple vegetables, one total
- [x] **The amount readout** — the signature element
- [x] `Klaar` → `POST /api/sale`, basket clears
- [x] Sticker print from a basket line
- [x] **Verified in the browser:** Tomaat at `2,615 kg × € 3,80` gives **€ 9,94** — the exact
      line off his Hanka receipt. Two lines sum to € 13,99 in the readout.
- [ ] **Verify at the shop:** weigh a real bag of tomatoes on the DIGI, type the kg, confirm the
      module's euro figure matches the scale's own € display

## Phase 4 — Admin

- [x] Product list with search and category filter
- [x] Add / edit: NL name, EN name, unit (`kg` / `stuk` / `bos`), price, cost, category, active, sort
- [x] Photo upload → `PUT /api/photo/<id>`
- [x] **Weekprijzen** — one column of price inputs, Enter/Tab down, changed cells outlined turmeric,
      one `Save` with a count
- [x] Delete with confirm + undo toast
- [x] **Verified:** changed Tomato to EUR 4,25, saved, confirmed `425` in `data/products.json`
      on disk, reloaded, price survived. Malformed JSON is rejected server-side without
      touching the file.

## Phase 5 — Price list & printing

- [x] Printable A4 aisle sheet — two columns, NL + EN, unit, price, date
- [x] Full-screen kiosk view (for the spare tablet later)
- [x] Price sticker layout — name, €/kg, weight, total, date
- [ ] **Verify at the shop:** print both on his actual printer and label stock, tune `@page`

## Phase 6 — Photos

- [x] `tools/fetch-photos.ps1` — Wikimedia Commons API, centre-crop, 400×400 JPEG via `System.Drawing`
- [x] Candidate scoring: rejects botanical plates, cooked dishes, market-stall scenes,
      insects and (really) the band Red Hot Chili Peppers
- [x] Fallback tile: vegetable's own colour + initial in Archivo, never an empty box
- [x] All 44 have a photo, 2 MB total

**Auto-sourced photos need one human pass.** Keyword search on Commons is unreliable —
it produced a butterfly for white cabbage and a rock band for red chilli before the reject
list caught them. Open **Beheer → Alle groenten**, scroll the thumbnails, and replace
anything unrecognisable via **bewerken → Foto kiezen**. A phone photo of the actual crate
beats any stock image here.

- [ ] **Owner to review and reshoot.** These are the weakest — recognisable but not obviously
      the product on the shelf:
  - Afrikaanse aubergine — shows the plant in flower, not the fruit
  - Aardappel — sprouted tubers on a table
  - Witte kool — a young plant in soil, not a cabbage head
  - Courgette / Flessenkalebas / Slangkalebas / Bittermeloen — in the field or in a crate
  - Yam / Taro / Cassave — rough, in-soil shots
  - Fenegriekblad — seedlings rather than a bunch of methi

## Phase 7 — Polish & on-site

- [x] Visible keyboard focus rings
- [x] `prefers-reduced-motion` respected
- [x] Press feedback under 100ms, no layout shift
- [x] Empty states (`No vegetables yet — add one`)
- [x] Error states with a recovery path
- [x] Touch targets ≥ 56×56px, ≥ 12px apart
- [ ] **Verify at the till, with his friend watching:** weigh → tap → type into Hanka's `groenten`
      key → confirm the Hanka receipt line and subtotal are right. This is the only test that proves
      the module is useful.

---

## Phase 8 — Hosted version on Vercel

Live at **https://wins-wereld-winkel.vercel.app**, connected to
`github.com/prasadmogulothu/winswereldwinkel`.

- [x] `api/session.js`, `api/login.js`, `api/products.js`, `api/photo.js`
- [x] Password on **every** write route, server-side. `admin` / password from
      `ADMIN_PASSWORD` in Vercel — not in the repo
- [x] HttpOnly + Secure + SameSite=Strict session cookie, HMAC-signed, valid 12 hours
- [x] Vercel Blob store `groenten-prijslijst` for the price list
- [x] Login screen in Admin; Sell and Price list stay open
- [x] `serve.ps1` gained the same `/api/session` and `/api/products` routes, so the
      till and the hosted version run an identical front-end
- [x] **Verified on production:** wrong password -> 401 · PUT with no login -> 401 ·
      login -> 200 · three price changes in a row, each visible immediately ·
      44 products, 5 categories

Two bugs found and fixed along the way:
- UTF-8 BOM in `products.json` (PowerShell `-Encoding utf8`) made `JSON.parse` throw
- A fixed blob name behind a CDN with a 60 s floor left a just-saved price invisible
  for up to a minute; every save now writes a new name

- [ ] **Decide which list is the real one.** The till PC and the hosted version each
      keep their own price list and do not talk to each other. While both are in use
      they will drift apart.
- [ ] Rotate the password now that it has been in chat:
      `vercel env add ADMIN_PASSWORD production --value ... --force --yes` + redeploy

## Phase 9 — Language

- [x] `app/js/i18n.js` — EN/NL dictionary, `t()`, plurals, names and categories
- [x] **English as the default**, EN/NL toggle top-right, choice remembered per device
- [x] Static text via `data-i18n` in `index.html`, not rebuilt in JS just to translate it
- [x] `money.js` returns message keys instead of sentences — stays free of language and DOM
- [x] Amounts stay `9,94` with a comma in both languages (that is what gets typed into Hanka)
- [x] **Verified on production:** tabs, tiles, categories, weekly prices, login screen
      and price list all switch; 43 money checks green

- [ ] Have a fluent Dutch speaker read the NL strings — the Dutch came from the
      original build, the English is newer, and nobody has read the pair side by side

## Phase 10 — iPhone

The phone screen is its own layout, not the till layout squeezed down.

- [x] Categories as chips you swipe sideways
- [x] Vegetables two-up, square photos
- [x] **Amount pinned to the bottom of the screen**, above the home indicator; basket
      lines grow above it to ~30 vh and then scroll
- [x] Weigh keypad under the photo instead of beside it
- [x] Header over two rows: brand + language toggle, then the three tabs
- [x] Product table hides category, unit and status — name, price and the two buttons stay
- [x] A4 price list becomes one column and fits the screen width
- [x] `viewport-fit=cover` + `env(safe-area-inset-*)` for the notch and home indicator
- [x] `100dvh` instead of `100%` — otherwise the bottom sits under the Safari toolbar
- [x] Every tap target >= 44x44 pt (language toggle was 34, `.btn-sm` 40, icon buttons 38)
- [x] No input under 16 px, otherwise iOS zooms in on tap
- [x] `-webkit-text-size-adjust` against inflated text in landscape
- [x] Separate rule for phone landscape (very little height)
- [x] **Measured at 390 x 844:** no sideways scrolling anywhere, nothing wider than the
      screen, no tap target under 44 pt on sell, admin, product list, price list or
      screen view; the whole sell flow works (2,615 kg x EUR 3,80 = EUR 9,94)
- [x] Deployed files checked on the live site

- [ ] **Look at it on his actual iPhone.** Tested in a 390 x 844 viewport in Chrome,
      not on iOS Safari itself. Safari differs on scroll momentum, the dynamic toolbar
      and font rendering.
- [ ] Show him **Share -> Add to Home Screen** for a full-screen view with no Safari bars

## Phase 11 — Language of the project itself

The shop is Dutch, so the interface was written in Dutch first. That leaked outward
into things that are not the shop's: commit messages, README, the newer sections of
this file, console output and API error strings. Nobody asked for that.

- [x] Dutch now lives in exactly one place: the `nl` block of `app/js/i18n.js`
- [x] `README.md` rewritten in English
- [x] These phase notes rewritten in English
- [x] API error strings in English — they surface in the UI, which defaults to English
- [x] `serve.ps1` and `tools/fetch-photos.ps1` console output in English
- [x] `app/test.html` labels in English, `lang="en"`
- [x] `package.json` description in English
- [ ] Earlier commit messages stay Dutch — rewriting pushed history is not worth it.
      Everything from here is English.
## Open questions for the shop

- [ ] Does the DIGI scale have an RS-232 or USB socket on the back? A photo of the model label would
      settle it. If it does, Chrome can read the weight live over Web Serial — no install, no typing.
- [ ] What label stock does the sticker printer use? Size in mm decides the `@page` block.
- [ ] Confirm the `groenten` key in Hanka accepts a typed euro amount (open price), not just a
      quantity. If it doesn't, the dealer needs to set it to open-price.

## Deliberately not built

- Barcode on the sticker — nothing scans it under the typed-amount path. Add if the dealer enables
  price-embedded barcodes; Hanka already supports barcode PLUs (`PLU 869939820514 → 2,95`).
- Customer display on the till's second screen — Hanka already owns it (`Subtotal 9,64` in the photo).
- Stock, waste, supplier orders, multi-user, login, tablet sync.
