# Integration guide — Groenten module

Everything needed to get this running in the shop, and exactly what has to come
from the shop owner.

Two places it can run, and they are independent:

| | **A. Till PC** (the real one) | **B. Online** |
|---|---|---|
| Where | Next to Hanka on the APEXA G | https://wins-wereld-winkel.vercel.app |
| Internet | Never needed | Always needed |
| Prices stored in | `data\products.json` on that PC | Vercel Blob |
| Login | None — it stands behind the counter | `admin` + password |

> **They do not sync.** A price changed online does not reach the till, and vice
> versa. **Pick one as the master before anyone starts typing prices.** For a
> single shop with one till, that should be **A. Till PC** — it keeps working
> when the internet does not.

---

# Part 1 — What we need from the shop owner

Nothing here is a password to a bank, a card, or a payment system, and the module
never touches money. If any request looks like that, it is not from us.

## 1.1 Must have before it can be used at all

| # | What | Why | How to get it |
|---|---|---|---|
| 1 | **The real prices per kg / per piece / per bunch** for every vegetable he sells | The 44 prices shipped are placeholders. Selling at a placeholder price loses real money. | Write them on paper, then type them in under **Admin → Weekly prices** |
| 2 | **Confirmation that Hanka's `groenten` key accepts a typed euro amount** (open price) | The whole flow is "type this amount into Hanka". If that key only takes a quantity, nothing works. | Try it on the till: type `1.00`, press `groenten`, see if the receipt line reads € 1,00. If not → ask the Hanka dealer to set that key to **open price** |
| 3 | **Which vegetables he actually stocks** | Anything on screen that is not in the shop is a mis-tap waiting to happen. | Switch unused ones off with the **Active** toggle — they stay in the list |

## 1.2 Needed for the till PC (option A)

| # | What | Why |
|---|---|---|
| 4 | **Permission to copy a folder onto the till PC and run a `.bat` file** | That is the entire install. Nothing is installed into Windows. |
| 5 | **A USB stick** | The only backup. `data\products.json` is his whole price list. |
| 6 | **Label size in mm** of the sticker printer, if he wants stickers | Sets the `@page sticker` block. It will not be right the first time. |

**No admin rights, no licence key, no account, no card details.** The server uses
`System.Net.HttpListener`, which is part of Windows and binds `localhost:8777`
without administrator rights.

## 1.3 Needed for the online version (option B)

| # | What | Who has it now |
|---|---|---|
| 7 | **A Vercel account** | Already done — `prasadmogulothu-7623` |
| 8 | **`ADMIN_PASSWORD`** — the Beheer password | Set. Currently `RaguWinkel`. **Change it** (§3.2) |
| 9 | **`BLOB_READ_WRITE_TOKEN`** — storage for the price list | Set automatically when the Blob store `groenten-prijslijst` was linked |
| 10 | **`SESSION_SECRET`** — signs the login cookie | Set to a random 48-character string |

Items 8–10 are **already configured**. The shop owner does not need to supply
anything for the online version unless he wants his own Vercel account, in which
case he needs to redo §3.1.

## 1.4 Nice to have — makes it noticeably better

| # | What | What it unlocks |
|---|---|---|
| 11 | **A photo of the back of the DIGI scale** and its model label | If it has an RS-232 or USB socket, Chrome reads the weight live over Web Serial and nobody types a number again |
| 12 | **Phone photos of about ten vegetables** | Ten of the stock photos are recognisable but not obviously the product on his shelf. Listed by name in `tasks.md` |
| 13 | **His BTW rate for vegetables** (should be 9%) | Only to confirm. The module computes no VAT — Hanka does |

## 1.5 Explicitly NOT needed

- No Hanka licence, dealer password, or database access. We never touch it.
- No card, bank, or payment credentials. The module handles no money.
- No customer data. Nothing personal is stored anywhere.
- No changes to his POS contract or hardware.

---

# Part 2 — Installing on the till PC

1. Copy the whole `wereld-supermarkt` folder to the till PC, for example
   `C:\wereld-supermarkt`.
2. Double-click **`start.bat`**. A Chrome window opens with no address bar, plus
   a small minimised black window titled *Groenten server*.
3. Right-click `start.bat` → *Send to* → *Desktop (create shortcut)*.
4. **Leave the black window open.** Closing it stops the module. Everything can
   be closed at the end of the day.

### First run checklist

- [ ] Open **`app/test.html`** once. All 43 checks must be green before any
      money is calculated with it.
- [ ] Set the real prices in **Admin → Weekly prices**, then **Save**.
- [ ] Open `data\products.json` in Notepad and confirm a price you just changed
      is really in there.
- [ ] Weigh a real bag of tomatoes on the DIGI. Type the kg. **The module's euro
      figure must match the scale's own € display.** If it does not, the price
      per kg is different in the two places — fix it in Weekly prices.
- [ ] Type that amount into Hanka on the `groenten` key and check the receipt.
- [ ] Copy the folder to the USB stick.

### Daily use

```
weigh on the DIGI  →  type the kg  →  read the amount  →  type it into Hanka
```

Hanka stays the till: all turnover, VAT and the Z-report run exactly as now. The
module's own log in `data\sales.jsonl` is informational, not the till takings.

---

# Part 3 — The online version

## 3.1 Deploying from scratch (only if moving to another Vercel account)

```bash
npm install -g vercel
vercel login
vercel link --yes --project wins-wereld-winkel

# Storage for the price list. Public: the price list is printed for the aisle anyway.
vercel blob create-store groenten-prijslijst --access public --yes

# Credentials. --value is required; piping a value does NOT work.
vercel env add ADMIN_USER     production --value admin      --force --yes
vercel env add ADMIN_PASSWORD production --value SECRET     --force --yes
vercel env add SESSION_SECRET production --value RANDOM48   --force --yes

vercel deploy --prod --yes
```

## 3.2 Changing the admin password

The password is **not** in the repo. It lives as `ADMIN_PASSWORD` in the Vercel
project.

```bash
vercel env add ADMIN_PASSWORD production --value NEWPASSWORD --force --yes
vercel deploy --prod --yes
```

**Environment variables only take effect on a new deployment.** Change the value
and stop there and nothing happens.

To log every browser out, do the same with `SESSION_SECRET`.

> The current password has appeared in chat and in this repo's history discussion.
> Change it before the shop relies on it.

## 3.3 What is protected, and what is not

| Route | Access |
|---|---|
| `GET /` , `GET /api/products` | Open. Sell screen and price list need no login |
| `GET /api/session` | Open. Says whether this browser is logged in |
| `POST /api/login` | Open, rate-limited to 8 tries per minute per IP |
| `PUT /api/products` | **Login required** |
| `POST /api/photo` | **Login required** |

The login form is only a screen. The real gate is server-side on the write
routes — editing the JavaScript in devtools does not get anyone past it. The
session cookie is HttpOnly, Secure, SameSite=Strict, HMAC-signed, valid 12 hours.

**Understand the trade-off:** anyone on the internet can read the price list.
That is fine — it is the same list printed on A4 and hung in the aisle. Anyone
with the password can change prices, so the password is the whole security model.

---

# Part 4 — Language

The interface ships in **English by default**, with a **EN / NL** toggle in the
top-right. The choice is remembered per device, so the counter can sit in English
while the owner works in Dutch on his phone.

Each vegetable carries both a Dutch and an English name. The reading language
leads and the other sits underneath, on the tiles and on the printed price list.

**Money never changes format.** It reads `9,94` with a comma in both languages,
because that exact string gets typed into Hanka. A cashier who reads `9.94` and
types `9.94` is a bug waiting to happen.

---

# Part 5 — Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "The price list could not be loaded" | Server window closed | Close everything, run `start.bat` again |
| "Save failed…" | Same | Same. The change is not lost; retry after restarting |
| "Could not open port 8777" | A server is already running | Close the old black window |
| Coloured tile with a letter instead of a photo | No photo for that vegetable | Admin → edit → Choose photo |
| Amount does not match the DIGI display | The two have different prices per kg | Fix it in Weekly prices, and on the scale |
| Login says wrong password online | Env var changed but not redeployed | `vercel deploy --prod --yes` |
| Price changed online is not on the till | Working as designed — two separate lists | See the warning at the top |

---

# Part 6 — What is deliberately not built

- **Barcode on the sticker.** Nothing scans it when the cashier types the amount.
  Add it if the dealer enables price-embedded barcodes; Hanka already supports
  barcode PLUs — its own panel shows `PLU 869939820514 → 2,95`.
- **Customer display on the till's second screen.** Hanka already uses it (the
  setup photo shows it displaying `Subtotal 9,64`). Taking it over would break
  his customer display. The printable A4 sheet replaces it.
- **Live weight from the scale.** Needs item 11 above.
- **Any integration into Hanka's database or files.** Deliberate: it keeps the
  till supported and warranted, and keeps us out of his accounting.
- **Stock, waste, supplier orders, multi-user, tablet sync.** Not asked for.
