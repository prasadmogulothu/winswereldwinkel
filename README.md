# Groenten — Wereld Supermarkt

A vegetable module that runs next to Hanka on the till PC. No internet, no server
outside the shop, nothing to install.

There is also a hosted version at **https://wins-wereld-winkel.vercel.app** — see
[Hosted version](#hosted-version) at the bottom.

The interface is in **English by default**, with an **EN / NL** toggle top-right.
The choice is remembered per device. Amounts stay `9,94` with a comma in both
languages, because that is exactly what gets typed into Hanka.

**Setting this up in the shop? Read [`integration.md`](integration.md)** — it lists
what is needed from the owner and what is not. **Part 0** is the list of everything
still outstanding, who has to do it, and why it blocks.

> **Careful: two separate price lists.**
> The till PC keeps prices in `data\products.json` on that machine. The hosted
> version keeps them in Vercel Blob. They do **not** talk to each other. A price
> changed online does not reach the till, and vice versa. Pick one as the real
> one, or they will drift apart.

## Starting it

Double-click **`start.bat`**. A window opens with no address bar. Alt+Tab between
it and Hanka.

A small black window titled *Groenten server* also starts. **Leave it open** — close
it and the module stops working. Everything can be closed at the end of the day.

Make a desktop shortcut to `start.bat` if that helps.

## How it works at the counter

```
  weigh on the DIGI  →  type the kg  →  read the amount  →  type it into Hanka
```

1. Tap the photo of the vegetable.
2. Type the weight shown on the DIGI. Comma or full stop, both work.
3. The amount appears bottom-left, large and orange.
4. More than one vegetable? Tap **Add** and pick the next. The total is at the bottom.
5. Type that one amount into Hanka on the **groenten** key and take payment.

**The module never touches the money.** Hanka stays the till: all turnover, VAT and
the Z-report run exactly as they do now. What the module records in
`data\sales.jsonl` is informational, not the till takings.

## Changing prices

**Admin → Weekly prices.** Every vegetable on one screen, one column of prices.
Tab or Enter jumps to the next. Changed fields get an orange outline. The bottom bar
shows how many changed; click **Save**. Forty prices in a minute.

Prices are **consumer prices including VAT** — exactly the number typed into Hanka.
The module calculates no VAT; Hanka already does that on the groenten department.

## Adding or editing a vegetable

**Admin → All vegetables → New vegetable.**

- **Unit** decides everything: `per kg` weighs, `per piece` and `per bunch` count.
- **Photo**: a phone photo is fine. Cropped square to 400×400 automatically.
- **Active** off = the vegetable disappears from the sell screen and the price list
  but is kept. Useful for seasonal produce.
- **Order**: lower comes first.

## Price list for the shelf

**Price list → Print A4.** Two columns, Dutch and English, dated.
**Screen view** is the same list large on a screen, for if a tablet ever goes up
next to the shelf.

## Backup

The entire price list is one file: **`data\products.json`**.

- Backup = copy the `wereld-supermarkt` folder to a USB stick.
- Restore = copy it back.

Do it after every significant price change. The file is plain text; open it in
Notepad to confirm a change really landed.

## When something breaks

| What you see | What to do |
|---|---|
| "The price list could not be loaded" | The server window is closed. Close everything and run `start.bat` again. |
| "Save failed…" | Same. Your change is not lost — retry after restarting. |
| "Could not open port 8777" | A Groenten server is already running. Close the old black window. |
| A photo is missing (coloured tile with a letter) | Normal. Take your own via Admin → edit → Choose photo. |
| The price does not match the scale | Check the price per kg under Weekly prices. The DIGI has its own price set; the two must agree. |

## For whoever works on it

- **`app/test.html`** — money and weight checks. Open it after every change to
  `app/js/money.js`. Everything must be green before it is used at the counter.
- **`app/js/money.js`** — all amounts are whole cents, never floats. The three
  constants at the top (`SCALE_STEP_KG`, `SCALE_MIN_KG`, `SCALE_MAX_KG`) come off
  the DIGI's type plate: 5 g steps, min 100 g, max 15 kg. Different scale? Edit
  those three numbers and nothing else.
- **`app/js/i18n.js`** — the only place Dutch belongs. Everything outside this file
  — docs, comments, commit messages, console output — is English.
- **`serve.ps1`** — static server on `System.Net.HttpListener`, part of Windows
  itself. Writes `products.json` via a temp file so a crash halfway can never leave
  half a price list. Invalid JSON is rejected without touching the file.
- **`tools/fetch-photos.ps1`** — pulls product photos from Wikimedia Commons. Needs
  internet, but only on the machine running it — never the till. Attribution goes
  into `app/photos/CREDITS.md`.

## Hosted version

**https://wins-wereld-winkel.vercel.app**

- **Sell** and **Price list** are open — no login, anyone may look.
- **Admin** requires a login: username `admin`.

The password is **not** in this repo. It lives as `ADMIN_PASSWORD` in the Vercel
project settings. To change it:

```
vercel env add ADMIN_PASSWORD production --value NEWPASSWORD --force --yes
vercel deploy --prod --yes
```

A new value only takes effect after a new deployment. To log everyone out, do the
same with `SESSION_SECRET`.

### What lives where

| Part | Till PC | Hosted |
|---|---|---|
| Server | `serve.ps1` (Windows HttpListener) | Serverless functions in `api/` |
| Price list | `data\products.json` | Vercel Blob, prefix `prijslijst/` |
| Login | Not needed, it stands behind the counter | Password on every write route |
| Photos | `app\photos\` | Same 44 served statically; new uploads go to Blob |
| Backup | Copy the folder to USB | Last 5 versions kept in Blob |

Every save writes a **new** file in Blob instead of overwriting one. Public blob
URLs sit behind a CDN with a 60-second floor, so with one fixed name a
just-changed price kept reading back as the old one.

### Redeploying

```
git push                     # Vercel builds automatically from GitHub
vercel deploy --prod --yes   # or manually
```

## Still open

See **Part 0** of [`integration.md`](integration.md) for the full list with owners.
The three that matter most:

- Does Hanka's **groenten** key accept a freely typed amount? If not, the dealer has
  to set that key to open price. **The whole design rests on this and it is untested.**
- Does the DIGI have a serial or USB socket on the back? Then Chrome can read the
  weight directly and nobody types a number again.
- What label size does the sticker printer use? That sets the `@page sticker` block
  in `app/css/app.css`.
