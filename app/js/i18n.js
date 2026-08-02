// English / Nederlands. English is the default: the counter staff are a mixed
// bunch and English is the common language between them, while the owner and
// the paperwork are Dutch.
//
// Money is NOT localised. It always reads "9,94" with a comma, in both
// languages, because that exact string gets typed into Hanka. A cashier who
// sees "9.94" and types 9.94 is a bug waiting to happen.

const DICT = {
  en: {
    'app.title': 'Vegetables — Wereld Supermarkt',
    'brand.sub': 'Vegetables',

    'nav.main': 'Main menu',
    'nav.category': 'Category',
    'tab.sell': 'Sell',
    'tab.admin': 'Admin',
    'tab.list': 'Price list',
    'lang.switch': 'Language',

    'basket.head': 'This customer',
    'basket.empty': 'Pick a vegetable.<br>Weigh it on the DIGI, type the weight, and the amount appears here.',
    'basket.remove': 'Remove {name}',
    'basket.printSticker': 'Print sticker for {name}',
    'basket.stickerTitle': 'Print sticker',
    'basket.clear': 'Clear basket',
    'basket.removed': '{name} removed',
    'basket.cleared': 'Basket cleared',
    'basket.undo': 'Undo',

    'readout.hint': 'Type this into Hanka → groenten',
    'btn.done': 'Done',
    'btn.back': 'Back',
    'btn.add': 'Add',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Delete',
    'btn.restore': 'Restore',
    'key.del': 'Delete',

    'sell.typeInHanka': 'Type {amount} into Hanka on the groenten key',
    'sell.perUnit': 'per {unit}',
    'sell.amount': 'Amount',
    'sell.enterCount': 'Enter a quantity.',
    'sell.emptyCat': 'Nothing in this category',
    'sell.emptyCatHint': 'Add vegetables under Admin, or pick another category.',
    'cat.all': 'All',

    'scale.enterWeight': 'Enter a weight.',
    'scale.tooHeavy': 'The scale goes up to {max} kg. Weigh it in two goes.',
    'scale.tooLight': 'Below {min} g the scale is not accurate.',

    'sticker.total': 'Total',

    'admin.week': 'Weekly prices',
    'admin.weekHint': 'Tab or Enter jumps to the next one. Prices include VAT.',
    'admin.products': 'All vegetables',
    'admin.inList': '{n} in the list',
    'admin.new': 'New vegetable',
    'admin.search': 'Search…',
    'admin.priceFor': 'Price for {name}',
    'admin.noChanges': 'No changes',
    'admin.changed': '{n} price changed',
    'admin.changedPlural': '{n} prices changed',
    'admin.saved': '{n} price saved',
    'admin.savedPlural': '{n} prices saved',
    'admin.unsaved': 'You have unsaved prices. Save them first.',
    'admin.priceNote': 'Prices are consumer prices including VAT, exactly as you type them into Hanka.',
    'admin.emptyTitle': 'No vegetables yet',
    'admin.emptyHint': 'Go to All vegetables and add the first one.',
    'admin.emptyHint2': 'Click New vegetable to start.',
    'admin.noResults': 'Nothing found for "{q}"',
    'admin.noResultsHint': 'Try another word.',
    'admin.saveFailed': 'Save failed: {msg}',
    'admin.sessionLost': 'Session expired. Please log in again.',

    'col.name': 'Name',
    'col.category': 'Category',
    'col.unit': 'Unit',
    'col.price': 'Price',
    'col.status': 'Status',
    'status.active': 'active',
    'status.off': 'off',
    'act.edit': 'Edit {name}',
    'act.delete': 'Delete {name}',

    'del.title': 'Delete {name}?',
    'del.text': 'It disappears from the sell screen and the price list. You can undo this straight afterwards.',
    'del.done': '{name} deleted',

    'form.newTitle': 'New vegetable',
    'form.newHint': 'Fill in what is on the shelf.',
    'form.editHint': 'Changes take effect at the counter immediately.',
    'form.nameNl': 'Name (Dutch)',
    'form.nameEn': 'Name (English)',
    'form.nameEnHint': 'Shown under the Dutch name on the tile and on the price list.',
    'form.category': 'Category',
    'form.unit': 'Unit',
    'form.unitKg': 'per kg — weighed',
    'form.unitStuk': 'per piece — counted',
    'form.unitBos': 'per bunch — counted',
    'form.price': 'Selling price (€, incl. VAT)',
    'form.cost': 'Cost price (€, optional)',
    'form.costHint': 'For your information only — nothing is calculated with it.',
    'form.margin': 'Margin {pct}% — for your information only, nothing is calculated with it.',
    'form.photo': 'Photo',
    'form.pickPhoto': 'Choose photo',
    'form.photoHint': 'A phone photo is fine. It gets cropped square.',
    'form.active': 'Active — visible at the counter',
    'form.sort': 'Order',
    'form.sortHint': 'Lower comes first on the sell screen.',
    'form.needName': 'Fill in a Dutch name.',
    'form.needPrice': 'Fill in a price, for example 3,80.',
    'form.badCost': 'Cost price is not a valid amount.',
    'form.savedOk': '{name} saved',
    'form.photoFailed': 'Photo failed: {msg}',

    'login.title': 'Log in',
    'login.sub': 'Log in to change prices.',
    'login.text': 'For the shop owner only. The sell screen and the price list keep working without logging in.',
    'login.user': 'Username',
    'login.pass': 'Password',
    'login.go': 'Log in',
    'login.ok': 'Logged in',
    'login.readOnlyTitle': 'Saving is switched off.',
    'login.readOnlyText': 'This environment has no storage attached, so changes will not be kept. Attach a Blob store in Vercel (BLOB_READ_WRITE_TOKEN) and deploy again.',

    'list.title': 'Price list',
    'list.sub': 'For the shelf. Active vegetables only.',
    'list.kiosk': 'Screen view',
    'list.print': 'Print A4',
    'list.sheetTitle': 'Vegetables & herbs',
    'list.validFrom': 'Prices valid from {date}',
    'list.footer': 'Wereld Supermarkt · prices include VAT · subject to change',
    'list.emptyTitle': 'No price list yet',
    'list.emptyHint': 'Add vegetables under Admin and the list appears here.',

    'err.loadTitle': 'The price list could not be loaded',
    'err.loadHint': 'Running this on the till PC? Then the server is not running: close this window and start <b>start.bat</b> again.',
    'err.generic': 'Error: {msg}',

    'unit.kg': 'kg',
    'unit.stuk': 'piece',
    'unit.bos': 'bunch',
    'locale': 'en-GB'
  },

  nl: {
    'app.title': 'Groenten — Wereld Supermarkt',
    'brand.sub': 'Groenten',

    'nav.main': 'Hoofdmenu',
    'nav.category': 'Categorie',
    'tab.sell': 'Verkoop',
    'tab.admin': 'Beheer',
    'tab.list': 'Prijslijst',
    'lang.switch': 'Taal',

    'basket.head': 'Deze klant',
    'basket.empty': 'Kies een groente.<br>Weeg op de DIGI, typ het gewicht, en het bedrag verschijnt hier.',
    'basket.remove': '{name} verwijderen',
    'basket.printSticker': 'Sticker printen voor {name}',
    'basket.stickerTitle': 'Sticker printen',
    'basket.clear': 'Mandje wissen',
    'basket.removed': '{name} verwijderd',
    'basket.cleared': 'Mandje gewist',
    'basket.undo': 'Ongedaan maken',

    'readout.hint': 'Typ dit in Hanka → groenten',
    'btn.done': 'Klaar',
    'btn.back': 'Terug',
    'btn.add': 'Toevoegen',
    'btn.save': 'Opslaan',
    'btn.cancel': 'Annuleren',
    'btn.delete': 'Verwijderen',
    'btn.restore': 'Herstellen',
    'key.del': 'Wissen',

    'sell.typeInHanka': 'Typ {amount} in Hanka op de toets groenten',
    'sell.perUnit': 'per {unit}',
    'sell.amount': 'Bedrag',
    'sell.enterCount': 'Vul een aantal in.',
    'sell.emptyCat': 'Niets in deze categorie',
    'sell.emptyCatHint': 'Voeg groenten toe bij Beheer, of kies een andere categorie.',
    'cat.all': 'Alles',

    'scale.enterWeight': 'Vul een gewicht in.',
    'scale.tooHeavy': 'De weegschaal gaat tot {max} kg. Weeg in twee keer.',
    'scale.tooLight': 'Onder {min} g weegt de schaal niet nauwkeurig.',

    'sticker.total': 'Totaal',

    'admin.week': 'Weekprijzen',
    'admin.weekHint': 'Tab of Enter om naar de volgende te springen. Prijzen zijn inclusief btw.',
    'admin.products': 'Alle groenten',
    'admin.inList': '{n} in de lijst',
    'admin.new': 'Nieuwe groente',
    'admin.search': 'Zoeken…',
    'admin.priceFor': 'Prijs voor {name}',
    'admin.noChanges': 'Geen wijzigingen',
    'admin.changed': '{n} prijs gewijzigd',
    'admin.changedPlural': '{n} prijzen gewijzigd',
    'admin.saved': '{n} prijs opgeslagen',
    'admin.savedPlural': '{n} prijzen opgeslagen',
    'admin.unsaved': 'Je hebt niet-opgeslagen prijzen. Sla eerst op.',
    'admin.priceNote': 'Prijzen zijn consumentenprijzen inclusief btw, precies zoals je ze in Hanka typt.',
    'admin.emptyTitle': 'Nog geen groenten',
    'admin.emptyHint': 'Ga naar Alle groenten en voeg de eerste toe.',
    'admin.emptyHint2': 'Klik op Nieuwe groente om te beginnen.',
    'admin.noResults': 'Niets gevonden voor "{q}"',
    'admin.noResultsHint': 'Probeer een ander woord.',
    'admin.saveFailed': 'Opslaan mislukt: {msg}',
    'admin.sessionLost': 'Sessie verlopen. Log opnieuw in.',

    'col.name': 'Naam',
    'col.category': 'Categorie',
    'col.unit': 'Eenheid',
    'col.price': 'Prijs',
    'col.status': 'Status',
    'status.active': 'actief',
    'status.off': 'uit',
    'act.edit': '{name} bewerken',
    'act.delete': '{name} verwijderen',

    'del.title': '{name} verwijderen?',
    'del.text': 'De groente verdwijnt uit het verkoopscherm en van de prijslijst. Je kunt dit direct daarna nog ongedaan maken.',
    'del.done': '{name} verwijderd',

    'form.newTitle': 'Nieuwe groente',
    'form.newHint': 'Vul in wat op het schap staat.',
    'form.editHint': 'Wijzigingen gelden direct aan de kassa.',
    'form.nameNl': 'Naam (Nederlands)',
    'form.nameEn': 'Naam (Engels)',
    'form.nameEnHint': 'Staat onder de Nederlandse naam op de tegel en op de prijslijst.',
    'form.category': 'Categorie',
    'form.unit': 'Eenheid',
    'form.unitKg': 'per kg — wegen',
    'form.unitStuk': 'per stuk — tellen',
    'form.unitBos': 'per bos — tellen',
    'form.price': 'Verkoopprijs (€, incl. btw)',
    'form.cost': 'Inkoopprijs (€, optioneel)',
    'form.costHint': 'Alleen ter informatie — wordt nergens mee gerekend.',
    'form.margin': 'Marge {pct}% — alleen ter informatie, wordt nergens mee gerekend.',
    'form.photo': 'Foto',
    'form.pickPhoto': 'Foto kiezen',
    'form.photoHint': 'Een telefoonfoto is prima. Wordt vierkant bijgesneden.',
    'form.active': 'Actief — zichtbaar aan de kassa',
    'form.sort': 'Volgorde',
    'form.sortHint': 'Lager staat vooraan in het verkoopscherm.',
    'form.needName': 'Vul een Nederlandse naam in.',
    'form.needPrice': 'Vul een prijs in, bijvoorbeeld 3,80.',
    'form.badCost': 'Inkoopprijs is geen geldig bedrag.',
    'form.savedOk': '{name} opgeslagen',
    'form.photoFailed': 'Foto lukte niet: {msg}',

    'login.title': 'Inloggen',
    'login.sub': 'Log in om prijzen te wijzigen.',
    'login.text': 'Alleen voor de winkeleigenaar. Het verkoopscherm en de prijslijst blijven gewoon zonder inloggen werken.',
    'login.user': 'Gebruikersnaam',
    'login.pass': 'Wachtwoord',
    'login.go': 'Inloggen',
    'login.ok': 'Ingelogd',
    'login.readOnlyTitle': 'Opslaan staat uit.',
    'login.readOnlyText': 'Deze omgeving heeft geen opslag gekoppeld, dus wijzigingen worden niet bewaard. Koppel in Vercel een Blob store (BLOB_READ_WRITE_TOKEN) en deploy opnieuw.',

    'list.title': 'Prijslijst',
    'list.sub': 'Voor het schap. Alleen actieve groenten.',
    'list.kiosk': 'Schermweergave',
    'list.print': 'Print A4',
    'list.sheetTitle': 'Groenten & kruiden',
    'list.validFrom': 'Prijzen geldig vanaf {date}',
    'list.footer': 'Wereld Supermarkt · prijzen inclusief btw · wijzigingen voorbehouden',
    'list.emptyTitle': 'Nog geen prijslijst',
    'list.emptyHint': 'Voeg groenten toe bij Beheer, dan verschijnt de lijst hier.',

    'err.loadTitle': 'De prijslijst kon niet geladen worden',
    'err.loadHint': 'Draai je dit op de kassa-pc? Dan draait de server niet: sluit dit venster en start <b>start.bat</b> opnieuw.',
    'err.generic': 'Fout: {msg}',

    'unit.kg': 'kg',
    'unit.stuk': 'stuk',
    'unit.bos': 'bos',
    'locale': 'nl-NL'
  }
};

const STORE_KEY = 'groenten_lang';
let lang = 'en';

try {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved === 'nl' || saved === 'en') lang = saved;
} catch { /* private mode; English it is */ }

export function getLang() { return lang; }

export function setLang(next) {
  if (next !== 'nl' && next !== 'en') return;
  lang = next;
  try { localStorage.setItem(STORE_KEY, next); } catch { /* nothing to do */ }
  document.documentElement.lang = next;
}

/** t('admin.changed', { n: 3 }) */
export function t(key, vars) {
  let s = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/** Dutch has no "1 prijzen", English has no "1 prices". */
export function plural(n, key) {
  return t(n === 1 ? key : `${key}Plural`, { n });
}

/** Unit label in the reading language. */
export function unit(u) { return t(`unit.${u}`) || u; }

// --- names -------------------------------------------------------------
// Every product carries both names. The reading language leads, the other
// one sits underneath - the customers are as mixed as the staff.

export function pName(p) { return (lang === 'en' ? p.en : p.nl) || p.nl || p.en || ''; }
export function pSub(p) { return (lang === 'en' ? p.nl : p.en) || ''; }
export function cName(c) { return (lang === 'en' ? c.en : c.nl) || c.nl || c.id; }
export function cSub(c) { return (lang === 'en' ? c.nl : c.en) || ''; }

export function today() {
  return new Date().toLocaleDateString(t('locale'), {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

/**
 * Fills every element carrying data-i18n / data-i18n-aria / data-i18n-title.
 * Static markup stays in index.html where it is readable, instead of being
 * rebuilt in JavaScript just to translate it.
 */
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  });
  document.title = t('app.title');
  document.documentElement.lang = lang;
}
