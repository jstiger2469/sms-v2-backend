// Single source of truth for phone formats.
// Storage/lookup format: 10-digit US number, digits only (e.g. "5551234567").
// Send format: E.164 (e.g. "+15551234567").

/**
 * Normalize any user/Twilio-supplied phone to 10 US digits.
 * Accepts "(555) 123-4567", "1-555-123-4567", "+15551234567", etc.
 * Returns null when the input can't be a valid US number.
 */
function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

/** Convert any phone to E.164 for Twilio. Returns null if invalid. */
function toE164(input) {
  const digits = normalizePhone(input);
  return digits ? `+1${digits}` : null;
}

// Carrier-standard keywords (CTIA). Matched after stripping punctuation.
const OPT_IN_KEYWORDS = new Set(['START', 'YES', 'UNSTOP', 'SUBSCRIBE']);
const OPT_OUT_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

/** Returns 'in', 'out', or null for a normal message. */
function parseOptKeyword(body) {
  const word = String(body || '').trim().replace(/[^a-z]/gi, '').toUpperCase();
  if (OPT_IN_KEYWORDS.has(word)) return 'in';
  if (OPT_OUT_KEYWORDS.has(word)) return 'out';
  return null;
}

module.exports = { normalizePhone, toE164, parseOptKeyword };
