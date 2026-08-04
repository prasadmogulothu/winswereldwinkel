# Groenten — Wereld Supermarkt

Een groentemodule die naast Hanka op de kassa-pc draait. Geen internet, geen server
buiten de winkel, niets te installeren.

Er draait ook een online versie op **https://wins-wereld-winkel.vercel.app** —
zie [Online versie](#online-versie) onderaan.

De interface staat standaard in het **Engels**, met een **EN / NL**-knop rechtsboven.
De keuze wordt per apparaat onthouden. Bedragen blijven in beide talen `9,94` met een
komma, want dat is precies wat er in Hanka getypt wordt.

**Inrichten bij je vriend in de winkel? Lees [`integration.md`](integration.md)** —
daar staat wat er van hem nodig is en wat juist niet. **Part 0** is de lijst met
wat er nog openstaat, met wie het moet doen en waarom het blokkeert.

> **Let op: twee gescheiden prijslijsten.**
> De kassa-pc bewaart prijzen in `data\products.json` op die pc. De online versie
> bewaart ze in Vercel Blob. Ze praten **niet** met elkaar. Een prijs die je online
> wijzigt komt niet op de kassa, en andersom ook niet. Kies er één als de echte,
> anders gaan ze uit elkaar lopen.

## Starten

Dubbelklik **`start.bat`**. Er opent een venster zonder adresbalk. Alt+Tab om tussen
Groenten en Hanka te wisselen.

Er start ook een klein zwart venster met de titel *Groenten server*. Dat moet openblijven —
sluit je dat, dan werkt de module niet meer. Aan het eind van de dag mag alles dicht.

Maak eventueel een snelkoppeling naar `start.bat` op het bureaublad.

## Hoe het aan de kassa werkt

```
  weeg op de DIGI  →  typ de kg in Groenten  →  lees het bedrag  →  typ dat in Hanka
```

1. Tik op de foto van de groente.
2. Typ het gewicht dat op de DIGI staat. Komma of punt, allebei goed.
3. Onderin links staat het bedrag, groot en oranje.
4. Meerdere groenten? Tik **Toevoegen** en kies de volgende. Onderin staat het totaal.
5. Typ dat ene bedrag in Hanka op de toets **groenten** en reken af.

**De module raakt het geld niet aan.** Hanka blijft de kassa: alle omzet, btw en de
Z-afsluiting lopen precies zoals nu. Wat de module bijhoudt in `data\sales.jsonl` is
alleen ter informatie, niet je kassa-omzet.

## Prijzen aanpassen

**Beheer → Weekprijzen.** Alle groenten in één scherm, één kolom met prijzen.
Tab of Enter springt naar de volgende. Gewijzigde velden krijgen een oranje rand.
Onderin staat hoeveel er gewijzigd zijn; klik **Opslaan**. Veertig prijzen in een minuut.

Prijzen zijn **consumentenprijzen inclusief btw** — precies het getal dat je in Hanka typt.
De module rekent zelf geen btw uit; dat doet Hanka al op de afdeling groenten.

## Groente toevoegen of wijzigen

**Beheer → Alle groenten → Nieuwe groente.**

- **Eenheid** bepaalt alles: `per kg` laat je wegen, `per stuk` en `per bos` laten je tellen.
- **Foto**: een telefoonfoto is prima. Wordt automatisch vierkant bijgesneden naar 400×400.
- **Actief** uit = de groente verdwijnt van het verkoopscherm en van de prijslijst,
  maar blijft bewaard. Handig voor seizoensgroenten.
- **Volgorde**: lager staat vooraan.

## Prijslijst voor het schap

**Prijslijst → Print A4.** Twee kolommen, Nederlands en Engels, met de datum erop.
**Schermweergave** is dezelfde lijst groot op een scherm, voor als er later een tablet
bij het schap komt te hangen.

## Back-up

De hele prijslijst staat in één bestand: **`data\products.json`**.

- Back-up = kopieer de map `wereld-supermarkt` naar een USB-stick.
- Terugzetten = kopieer hem terug.

Doe dat na elke grote prijswijziging. Het bestand is gewone tekst; je kunt het in
Kladblok openen om te zien dat je wijziging er echt in staat.

## Als er iets niet werkt

| Wat je ziet | Wat je doet |
|---|---|
| "De prijslijst kon niet geladen worden" | Het servervenster is dicht. Sluit alles en start `start.bat` opnieuw. |
| "Opslaan mislukt … Draait de server nog?" | Zelfde. Je wijziging is nog niet weg — probeer opnieuw na het herstarten. |
| "Kon poort 8777 niet openen" | Er draait al een Groenten-server. Sluit het oude zwarte venster. |
| Een foto ontbreekt (gekleurd vlak met een letter) | Normaal. Maak zelf een foto via Beheer → bewerken → Foto kiezen. |
| De prijs klopt niet met de weegschaal | Controleer de prijs per kg in Weekprijzen. De DIGI heeft zijn eigen prijs ingesteld staan; die twee moeten gelijk zijn. |

## Voor wie eraan sleutelt

- **`app/test.html`** — reken- en gewichtscontroles. Open dit na elke wijziging aan
  `app/js/money.js`. Alles moet groen zijn voordat het aan de kassa gebruikt wordt.
- **`app/js/money.js`** — alle bedragen zijn hele centen, nooit kommagetallen. De drie
  constanten bovenaan (`SCALE_STEP_KG`, `SCALE_MIN_KG`, `SCALE_MAX_KG`) komen van het
  typeplaatje van de DIGI: 5 g stappen, min 100 g, max 15 kg. Andere weegschaal?
  Alleen die drie getallen aanpassen.
- **`serve.ps1`** — statische server op `System.Net.HttpListener`, zit in Windows zelf.
  Schrijft `products.json` via een tijdelijk bestand, zodat een crash halverwege nooit
  een halve prijslijst achterlaat. Ongeldige JSON wordt geweigerd zonder het bestand aan
  te raken.
- **`tools/fetch-photos.ps1`** — haalt productfoto's van Wikimedia Commons. Heeft internet
  nodig, maar alleen op de pc waar je het draait — de kassa nooit. Bronvermelding komt in
  `app/photos/CREDITS.md`.

## Online versie

**https://wins-wereld-winkel.vercel.app**

- **Verkoop** en **Prijslijst** zijn open — geen inloggen nodig, iedereen mag kijken.
- **Beheer** vraagt om inloggen: gebruikersnaam `admin`.

Het wachtwoord staat **niet** in deze repo. Het staat als `ADMIN_PASSWORD` in de
Vercel-projectinstellingen. Wijzigen:

```
vercel env rm  ADMIN_PASSWORD production --yes
vercel env add ADMIN_PASSWORD production --value NIEUWWACHTWOORD --yes
vercel deploy --prod --yes
```

Een nieuwe waarde geldt pas na een nieuwe deploy. Wil je iedereen uitloggen, doe dan
hetzelfde met `SESSION_SECRET`.

### Wat waar staat

| Onderdeel | Kassa-pc | Online |
|---|---|---|
| Server | `serve.ps1` (Windows HttpListener) | Serverless functies in `api/` |
| Prijslijst | `data\products.json` | Vercel Blob, map `prijslijst/` |
| Inloggen | niet nodig, staat achter de toonbank | wachtwoord op alle schrijfroutes |
| Foto's | `app\photos\` | dezelfde 44 statisch; nieuwe uploads naar Blob |
| Back-up | map kopiëren naar USB | laatste 5 versies blijven in Blob staan |

Elke opslag schrijft een **nieuw** bestand in Blob in plaats van er één te overschrijven.
Publieke blob-URLs staan namelijk achter een CDN dat minstens een minuut cachet — met
één vaste naam gaf een net gewijzigde prijs nog even de oude waarde terug.

### Opnieuw uitrollen

```
git push            # Vercel bouwt automatisch vanaf GitHub
vercel deploy --prod --yes   # of handmatig
```

## Nog open

- Heeft de DIGI een seriële of USB-aansluiting achterop? Dan kan Chrome het gewicht
  rechtstreeks uitlezen en hoeft niemand meer te typen.
- Welk etiketformaat gebruikt de stickerprinter? Dat bepaalt het `@page`-blok onderin
  `app/css/app.css`.
- Accepteert de toets **groenten** in Hanka een vrij bedrag? Zo niet, dan moet de dealer
  die toets op open prijs zetten.
