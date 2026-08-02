// Money and weight maths. Pure - no DOM, no globals beyond this module.
// All money is integer cents. Never a float, at any point, for any reason.

// --- DIGI scale on his counter ------------------------------------------
// Max 15 kg / Min 100 g / e = d = 5 g, read off the label in the setup photo.
// Swap a scale, edit these three numbers, done - they are not scattered
// through the code on purpose.
export const SCALE_STEP_KG = 0.005;
export const SCALE_MIN_KG = 0.100;
export const SCALE_MAX_KG = 15.000;

// Weight is held as integer grams for the same reason money is held as cents.
const STEP_G = Math.round(SCALE_STEP_KG * 1000);
const MIN_G = Math.round(SCALE_MIN_KG * 1000);
const MAX_G = Math.round(SCALE_MAX_KG * 1000);

/** Round to nearest whole number, halves away from zero. */
function roundHalfUp(n) {
  return n < 0 ? -Math.round(-n) : Math.round(n);
}

/**
 * Snap a typed kg figure to what the scale can actually show.
 * The DIGI steps in 5 g, so 2.617 is a number it never displayed.
 * @returns {number} kg, snapped
 */
export function snapWeight(kg) {
  const grams = roundHalfUp(Number(kg) * 1000);
  return (roundHalfUp(grams / STEP_G) * STEP_G) / 1000;
}

/**
 * Check a typed quantity against the scale's real limits.
 * @returns {{ok: boolean, level: 'ok'|'warn'|'error', message: string}}
 */
export function checkWeight(kg) {
  const n = Number(kg);
  if (!isFinite(n) || n <= 0) {
    return { ok: false, level: 'error', message: 'Vul een gewicht in.' };
  }
  const grams = roundHalfUp(n * 1000);
  if (grams > MAX_G) {
    return {
      ok: false,
      level: 'error',
      message: `De weegschaal gaat tot ${SCALE_MAX_KG.toFixed(0)} kg. Weeg in twee keer.`
    };
  }
  if (grams < MIN_G) {
    // Below its minimum the scale is not certified, so the number on its
    // display is not trustworthy. Allow it, but say so.
    return {
      ok: true,
      level: 'warn',
      message: `Onder ${(SCALE_MIN_KG * 1000).toFixed(0)} g weegt de schaal niet nauwkeurig.`
    };
  }
  return { ok: true, level: 'ok', message: '' };
}

/** Count items sold per piece or per bunch, so no decimals there. */
export function isWeighed(product) {
  return product.unit === 'kg';
}

/**
 * Price of one basket line.
 * @param {{unit: string, price: number}} product - price in integer cents
 * @param {number} qty - kg for weighed items, whole count otherwise
 * @returns {number} integer cents
 */
export function lineTotal(product, qty) {
  if (isWeighed(product)) {
    // Multiply in integers (grams x cents), then divide once and round once.
    const grams = roundHalfUp(snapWeight(qty) * 1000);
    return roundHalfUp((grams * product.price) / 1000);
  }
  return roundHalfUp(qty) * product.price;
}

/** @returns {number} integer cents */
export function basketTotal(lines) {
  return lines.reduce((sum, l) => sum + l.cents, 0);
}

/** 994 -> "9,94". Dutch comma, always two decimals. */
export function formatEuro(cents) {
  const neg = cents < 0;
  const a = Math.abs(roundHalfUp(cents));
  const s = `${Math.floor(a / 100)},${String(a % 100).padStart(2, '0')}`;
  return neg ? `-${s}` : s;
}

/** 2.615 -> "2,615". Weighed items keep three decimals, counted items none. */
export function formatQty(product, qty) {
  if (!isWeighed(product)) return String(roundHalfUp(qty));
  return snapWeight(qty).toFixed(3).replace('.', ',');
}

/**
 * "2,615" and "2.615" both mean the same thing to someone typing fast.
 * An empty field is NaN, never 0 - otherwise a blank price box saves as free.
 */
export function parseNumber(text) {
  const s = String(text ?? '').replace(',', '.').trim();
  if (s === '') return NaN;
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

export const UNIT_LABEL = { kg: 'kg', stuk: 'stuk', bos: 'bos' };
