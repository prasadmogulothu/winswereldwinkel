# Installing on the till PC — step by step

For someone who has never used a POS machine before. Follow it in order.
Every step says what you should see, so you know whether it worked.

The till is an **APEXA G POS** running **Hanka** on Windows. It is a normal
Windows PC in a POS-shaped box, with a touchscreen instead of a mouse.

---

## Before you go to the shop

| ✓ | Bring | Why |
|---|---|---|
| ☐ | **A USB keyboard** | The biggest single risk in this whole job. The till is touch-only. Without a keyboard you cannot type a URL, cannot press Alt+Tab, and probably cannot get out of Hanka at all. A cheap wired one is fine. |
| ☐ | **A USB mouse** (optional but helpful) | Touch works, but right-click on a touchscreen means press-and-hold, which is fiddly on Windows dialogs. |
| ☐ | **Your laptop** | For the TeamViewer route if you cannot use the till directly. |
| ☐ | **This URL, written on paper** | `github.com/prasadmogulothu/winswereldwinkel/archive/refs/heads/main.zip` |

> **Check there is a free USB port.** In the photos of the back of the APEXA G, the
> port bay is full — a Datalogic barcode scanner, a D-sub cable for the second
> monitor, a network cable. No free USB socket is visible. If there isn't one, you
> will have to unplug the scanner for ten minutes (tell the owner first), or bring
> a small USB hub.

Do this at a quiet time. Not Saturday afternoon.

---

## Step 1 — Get out of Hanka and onto the Windows desktop

Hanka runs full-screen and hides Windows. You need Windows underneath it.

Try these **in this order**, least drastic first. Stop as soon as you see the
desktop or the taskbar.

1. **Press `Alt` + `Tab`** (hold Alt, tap Tab). If other windows exist you will see
   thumbnails of them. This is the safest thing to try.
2. **Press the `Windows` key** (the key with the Windows logo, bottom-left of the
   keyboard). If a Start menu or taskbar appears, you are done.
3. **Press `Windows` + `D`** — shows the desktop directly.
4. **Press `Ctrl` + `Shift` + `Esc`** — opens Task Manager. From there:
   *File → Run new task*, and you have a box you can type into. This works even
   when everything else is locked down.
5. **Look for a "minimise" or "X" button in Hanka's own screen.** In the setup
   screens there is a red **X** in the top-right corner. That closes the setup
   panel, not Hanka.

> ### Do NOT press "Shutdown System"
> Hanka's Control Panel has a tile named **Shutdown System**. On most POS software
> that powers the machine off — it does not drop you to the desktop. If the till
> won't come back up, you have turned a 20-minute job into an emergency in a
> working shop. Leave it alone.

**If none of steps 1–5 work:** the till is locked into kiosk mode. Skip to
[Plan B — TeamViewer](#plan-b--teamviewer-from-your-laptop). Do not go hunting
through Hanka's settings for a way out.

**When you're finished with everything, Hanka must be back on screen and working.**
Alt+Tab back to it before you leave.

---

## Step 2 — Open a browser

Once you can see the Windows desktop or taskbar:

- **Look on the taskbar** (the strip along the bottom) for a blue-and-green swirl
  (**Microsoft Edge**) or a red/yellow/green circle (**Chrome**).
- **Or press `Windows` key, type `edge`, press `Enter`.** Edge is on every Windows
  10 and 11 machine. It cannot have been uninstalled, only hidden.
- **Or from Task Manager** (`Ctrl`+`Shift`+`Esc`) → *File → Run new task* → type
  `msedge` → OK.

If the browser opens but every website is blocked, go to
[Plan B](#plan-b--teamviewer-from-your-laptop).

---

## Step 3 — The quick way: one line, no zip

This does the whole job — download, unpack, unblock, start — in one command. It
skips Steps 4, 5 and 6 entirely, which are the fiddly ones on a touchscreen.

1. Press `Windows` + `R` (or Task Manager → *File → Run new task*).
2. Type this **exactly**, then press Enter:

   ```
   powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/prasadmogulothu/winswereldwinkel/main/install.ps1 | iex"
   ```

3. A blue window appears and reports each stage. About 15 seconds. When it says
   **Installed to C:\wereld-supermarkt**, the module opens by itself.

Then skip to [Step 7](#step-7--check-it-actually-works-before-anyone-sells-anything).

**Re-run the same line any time to update the code. It keeps the shop's price
list** — `data\products.json` is copied aside and put back, and a timestamped
backup is left in the Temp folder.

If it fails, it tells you why and changes nothing. Fall through to the manual
route below.

> That command runs whatever script sits at that URL. It is your own public repo,
> so you can read it first at
> `github.com/prasadmogulothu/winswereldwinkel/blob/main/install.ps1`. Don't run a
> line like this from a source you don't control.

---

## Step 3b — The manual way (if the one-liner won't run)

1. Click the address bar at the top of the browser and type exactly:

   ```
   github.com/prasadmogulothu/winswereldwinkel/archive/refs/heads/main.zip
   ```

2. Press `Enter`. A file called **`winswereldwinkel-main.zip`** downloads
   (about 2.4 MB, a few seconds). It lands in `C:\Users\<name>\Downloads`.
3. If Edge says *"...isn't commonly downloaded. Make sure you trust..."*, click the
   **⋯** next to the warning → **Keep**. That warning is about it being an unusual
   file, not about it being unsafe.

---

## Step 4 — Unblock the zip (do not skip this)

Windows marks anything downloaded from the internet as untrusted, and that mark
survives extraction. If you skip this, `start.bat` will look like it works and the
server will silently fail to start.

1. Open the **Downloads** folder (in Edge, click the ⤓ icon → *Open folder*).
2. **Right-click** `winswereldwinkel-main.zip` → **Properties**.
   (On a touchscreen: press and hold your finger on the file for ~2 seconds, then
   let go — the right-click menu appears.)
3. At the bottom of the *General* tab, if there is a checkbox marked **Unblock**,
   tick it.
4. Click **OK**.

If there is no Unblock checkbox, that is fine — it means Windows didn't flag it.

---

## Step 5 — Extract to the right place

**The folder must be somewhere the app can write to.** It saves prices into
`data\products.json`. `C:\Program Files` will not work — Windows blocks writes there.

1. Right-click the zip → **Extract All…**
2. In the box, delete what's there and type: `C:\`
3. Untick *"Show extracted files when complete"* if you like. Click **Extract**.
4. You now have `C:\winswereldwinkel-main`. Rename it:
   right-click → **Rename** → type `wereld-supermarkt` → Enter.

You should end up with **`C:\wereld-supermarkt`**, and inside it you should see
`start.bat`, `serve.ps1`, `README.md`, and folders named `app` and `data`.

If instead you see a single folder inside a folder
(`C:\wereld-supermarkt\winswereldwinkel-main\start.bat`), move the inner contents
up one level, or just use the inner folder — as long as `start.bat` and `app` sit
side by side.

---

## Step 6 — Run it

1. Double-click **`start.bat`**.
2. Two things should happen within about 3 seconds:
   - A small **black window** appears (minimised, titled *Groenten server*). It
     should say `Groenten running on http://localhost:8777` in green.
   - A **browser window with no address bar** opens showing the vegetable tiles.
3. **Leave the black window open.** Closing it stops the module. It can be closed
   at the end of the day.

If Windows shows *"Windows protected your PC"*, click **More info** → **Run anyway**.

Make a shortcut for the shop: right-click `start.bat` → *Show more options* →
*Send to* → *Desktop (create shortcut)*.

---

## Step 7 — Check it actually works before anyone sells anything

In the module's browser window, go to `localhost:8777/test.html`
(or open `C:\wereld-supermarkt\app\test.html` by double-clicking it).

- [ ] **All 43 checks are green.** If any are red, stop and send me a photo.
- [ ] Enter the real prices in **Admin → Weekly prices**, then **Save**.
- [ ] Open `C:\wereld-supermarkt\data\products.json` in Notepad and confirm a price
      you just typed is really in the file. This proves the server can write.
- [ ] Weigh a real bag of tomatoes on the DIGI scale. Type the kg into the module.
      **The module's euro figure must match the DIGI's own € display.** If they
      differ, the price per kg is set differently in the two places.
- [ ] Test the Hanka side — see [The `groenten` key](#the-groenten-key) below.
- [ ] Alt+Tab back to Hanka and confirm the till still works normally.

---

## The `groenten` key

From the photo of the live till screen, `groenten` is **not** an open-price key
today. Hanka multiplies **quantity × the PLU's price**, and `groenten` is priced at
`0,00`, so the receipt showed:

```
2.615   groenten   0,00   0,00
```

Anything you type times zero is zero. Typing `9,94` then `groenten` will ring up
**€0,00** and give the customer a free bag of vegetables.

**The fix, before any real sale:** in Hanka, go to
**D. PLU management → PLU**, find `groenten`, and set its price to **€1,00**.

Then typing `9.94` then `groenten` gives €9,94, because 9.94 × 1,00 = 9,94. The
money and the VAT are correct. The receipt's quantity column will read "9.94"
units, which is meaningless but harmless.

**Test it with a real receipt before trusting it:** type `1.00`, press `groenten`,
and check the receipt line reads € 1,00. Then try `9.94` and check for € 9,94.

---

## Plan B — TeamViewer from your laptop

Use this if you cannot get out of Hanka, or the browser is blocked, or you are not
going to the shop in person.

TeamViewer is **already installed on the till** — it is a button in Hanka's setup
under *A. General*, and a tile on Hanka's Control Panel.

### On your laptop, first

1. Go to `teamviewer.com/download` and install **TeamViewer** (the full version,
   not QuickSupport — you need the file-transfer feature).
2. Open it. You'll see *Your ID* and *Password* on the left, and a box marked
   **Partner ID** on the right. You will type the till's ID into that box.

### On the till, someone has to press the button

You need a person standing at the till. Ask the owner, on the phone:

1. In Hanka, open the setup screen and go to the **A. General** tab.
2. Press the **TeamViewer** button in the left-hand list.
   (Or from Hanka's Control Panel, press the **TeamViewer** tile.)
3. A TeamViewer window opens showing **Your ID** (9–10 digits) and a
   **Password** (4–6 characters).
4. **Ask them to read both out to you.** Write them down. The password changes
   every time TeamViewer restarts, so use it straight away.

### Then, on your laptop

1. Type the till's ID into **Partner ID** → click **Connect**.
2. Type the password when asked.
3. You are now looking at the till's screen and can control it. Everything in
   Steps 1–7 above now applies, but you're doing it from your own keyboard —
   which solves the whole keyboard problem.

### Sending the files across

If the till has no internet access, send the zip directly instead of downloading it:

1. While connected, find the **File transfer** option — in the toolbar at the top
   of the TeamViewer session window, under **Files & Extras → Open file transfer**.
2. A two-panel window opens: your laptop on the left, the till on the right.
3. On the left, navigate to `C:\Users\prasa\OneDrive\Desktop\wereld-supermarkt-till.zip`.
4. On the right, navigate to `C:\`.
5. Select the file on the left and click **Send**.
6. Then carry on from [Step 4](#step-4--unblock-the-zip-do-not-skip-this).
   A file sent by TeamViewer usually isn't marked as internet-downloaded, but check
   anyway — it costs ten seconds.

### Things that will trip you up

- **"Commercial use suspected."** TeamViewer's free tier is for personal use. A
  shop till may get flagged, which cuts sessions off after about 5 minutes.
  Annoying but workable — reconnect. If it blocks you entirely, use Plan C.
- **The password is one-time.** If you lose the connection, the owner has to read
  you a new one.
- **The till's TeamViewer may be the Hanka dealer's locked-down version**, which
  can have file transfer disabled. If the *Files & Extras* menu is missing, you
  can still control the screen — just download the zip on the till instead
  (Step 3), or use Plan C.
- **Someone must stay at the till** for the first minute to read you the password.
  After that they can walk away.

---

## Plan C — buy a USB stick

If Plan A and Plan B both fail, this is €5 at any supermarket and always works.

The zip is already sitting on your Desktop at
`C:\Users\prasa\OneDrive\Desktop\wereld-supermarkt-till.zip`. Copy it to the stick,
plug the stick into the till, and continue from
[Step 4](#step-4--unblock-the-zip-do-not-skip-this).

You will still need a keyboard and a way out of Hanka (Step 1), so this only solves
the *transferring files* problem, not the *getting into Windows* problem.

---

## Day-to-day: switching between the module and Hanka

```
weigh on the DIGI  →  type the kg  →  read the amount  →  type it into Hanka
```

Switching between the two windows is **`Alt` + `Tab`**.

> **Decide this on the day:** if the till has no keyboard permanently attached, the
> cashier has no way to switch between the module and Hanka. Either leave a cheap
> keyboard at the counter, or check whether the Windows taskbar can be left visible
> at the bottom of the screen so both can be tapped. Work this out while you are
> standing there, not afterwards.

---

## If something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| Black window flashes and vanishes | PowerShell blocked, or the zip was never unblocked | Redo Step 4. If it still fails, open PowerShell and run `Get-ExecutionPolicy` — send me what it says |
| "Could not open port 8777" | A server is already running | Close the old black window and run `start.bat` again |
| "The price list could not be loaded" | The black window got closed | Close everything, run `start.bat` again |
| "Save failed…" | Same | Same. Nothing is lost — retry after restarting |
| Browser opens but the page is blank | Server didn't start in time | Close the browser window, run `start.bat` again |
| Coloured tile with a letter, no photo | No photo for that vegetable | Admin → edit → Choose photo |
| Module's euro figure ≠ the DIGI's € display | Different price per kg in the two places | Fix it in Weekly prices, and on the scale |

**Before you leave the shop:**

- [ ] Hanka is back on screen and takes a normal sale
- [ ] Anything you unplugged is plugged back in (especially the barcode scanner)
- [ ] The owner has seen the `groenten` key ring up a correct amount on a receipt
- [ ] `C:\wereld-supermarkt` is backed up somewhere — `data\products.json` is the
      entire price list and the only copy
