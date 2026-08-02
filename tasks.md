# Groenten module — tasks

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

## Phase 3 — Verkoop (sell screen)

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

## Phase 4 — Beheer (admin)

- [x] Product list with search and category filter
- [x] Add / edit: NL name, EN name, unit (`kg` / `stuk` / `bos`), price, cost, category, active, sort
- [x] Photo upload → `PUT /api/photo/<id>`
- [x] **Weekprijzen** — one column of price inputs, Enter/Tab down, changed cells outlined turmeric,
      one `Opslaan` with a count
- [x] Delete with confirm + undo toast
- [x] **Verified:** changed Tomaat to € 4,25, `Opslaan`, confirmed `425` in `data/products.json`
      on disk, reloaded, price survived. Malformed JSON is rejected server-side without
      touching the file.

## Phase 5 — Prijslijst & printing

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
- [x] Empty states (`Nog geen groenten — voeg er een toe`)
- [x] Error states with a recovery path
- [x] Touch targets ≥ 56×56px, ≥ 12px apart
- [ ] **Verify at the till, with his friend watching:** weigh → tap → type into Hanka's `groenten`
      key → confirm the Hanka receipt line and subtotal are right. This is the only test that proves
      the module is useful.

---

## Phase 8 — Online versie op Vercel

Live op **https://wins-wereld-winkel.vercel.app**, gekoppeld aan
`github.com/prasadmogulothu/winswereldwinkel`.

- [x] `api/session.js`, `api/login.js`, `api/products.js`, `api/photo.js`
- [x] Wachtwoord op **alle** schrijfroutes, server-side. `admin` / wachtwoord uit
      `ADMIN_PASSWORD` in Vercel — staat niet in de repo
- [x] HttpOnly + Secure + SameSite=Strict sessiecookie, HMAC-ondertekend, 12 uur geldig
- [x] Vercel Blob store `groenten-prijslijst` voor de prijslijst
- [x] Login-scherm in Beheer; Verkoop en Prijslijst blijven open
- [x] `serve.ps1` kreeg dezelfde `/api/session` en `/api/products` routes, zodat
      kassa en online exact dezelfde front-end draaien
- [x] **Geverifieerd op productie:** fout wachtwoord → 401 · PUT zonder login → 401 ·
      inloggen → 200 · drie prijswijzigingen achter elkaar, elk meteen zichtbaar ·
      44 producten, 5 categorieën

Twee bugs onderweg gevonden en opgelost:
- UTF-8 BOM in `products.json` (PowerShell `-Encoding utf8`) liet `JSON.parse` klappen
- Vaste blob-naam + CDN met minimaal 60 s cache maakte een net opgeslagen prijs tot een
  minuut onzichtbaar; nu schrijft elke opslag een nieuwe naam

- [ ] **Beslissen welke lijst de echte is.** De kassa-pc en de online versie hebben elk
      hun eigen prijslijst en praten niet met elkaar. Zolang beide in gebruik zijn lopen
      ze uit elkaar.
- [ ] Overweeg het wachtwoord te wijzigen nu het in de chat heeft gestaan:
      `vercel env add ADMIN_PASSWORD production --value ... --force --yes` + opnieuw deployen

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
