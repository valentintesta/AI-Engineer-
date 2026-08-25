// Extracts a stock ticker + optional yyyy-mm-dd date out of a free-text chat
// message like "AAPL", "analyze NVDA 2026-08-20", or "what about brk.b?".

export interface ParsedQuery {
  ticker: string | null;
  date: string | null;
}

// 1-5 letters, optionally followed by a "." and 1-2 letters (e.g. BRK.B).
const TICKER_RE = /\b[A-Z]{1,5}(?:\.[A-Z]{1,2})?\b/g;

const DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;

// Common short English words that would otherwise look like valid tickers
// when the whole message gets uppercased (e.g. "buy AAPL now").
const STOPWORDS = new Set([
  "A",
  "I",
  "ON",
  "IN",
  "OF",
  "TO",
  "IS",
  "IT",
  "DO",
  "GO",
  "ME",
  "MY",
  "AT",
  "OR",
  "BE",
  "SO",
  "UP",
  "US",
  "AN",
  "AS",
  "IF",
  "BUY",
  "SELL",
  "HOLD",
  "FOR",
  "THE",
  "AND",
  "ARE",
  "GET",
  "CAN",
  "YOU",
  "PLS",
  "PLZ",
  "PLEASE",
  "STOCK",
  "SHARE",
  "SHARES",
  "CHECK",
  "WHAT",
  "WHATS",
  "HOW",
  "TODAY",
  "DATE",
  "PLEASE",
  "ANALYZE",
  "ANALYSE",
  "ANALYSIS",
  "RUN",
  "SHOW",
  "TELL",
  "ABOUT",
  "GIVE",
  "NEED",
  "WANT",
]);

/**
 * Parses free text and returns the best-guess ticker (uppercased) and an
 * optional yyyy-mm-dd date substring. Returns `ticker: null` when nothing
 * plausible was found so callers can show an inline validation message
 * instead of calling the backend.
 */
export function parseAnalysisQuery(input: string): ParsedQuery {
  const trimmed = input.trim();
  const dateMatch = trimmed.match(DATE_RE);
  const date = dateMatch ? dateMatch[1] : null;

  // Strip the date substring before scanning for a ticker so "2026-08-20"
  // never gets misread as a ticker-shaped token.
  const withoutDate = date ? trimmed.replace(date, " ") : trimmed;

  // Prefer a token that was ALREADY uppercase in the original text (how
  // people naturally write a ticker mid-sentence, in any language: "cuanto
  // deberia invertir en AAPL"). This sidesteps the stopword list entirely
  // for non-English filler words ("EN", "SI", "TENGO", ...) that only look
  // ticker-shaped once the whole string gets uppercased. Falls back to the
  // blanket-uppercase + stopword-filtered scan for all-caps or all-lowercase
  // input, where casing carries no signal.
  const originalCaseCandidates = withoutDate.match(TICKER_RE) ?? [];
  const fromOriginalCase = originalCaseCandidates.find((c) => !STOPWORDS.has(c));
  if (fromOriginalCase) return { ticker: fromOriginalCase, date };

  const upper = withoutDate.toUpperCase();
  const candidates = upper.match(TICKER_RE) ?? [];
  const ticker = candidates.find((c) => !STOPWORDS.has(c)) ?? null;

  return { ticker, date };
}
