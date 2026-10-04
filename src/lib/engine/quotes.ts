// Locate a model-supplied quote in the original document. Matching tolerates only
// whitespace runs and typographic quote/dash variants; the returned span is always
// the ORIGINAL text, so exported quotes are exact substrings of the corpus.

const CANON: Record<string, string> = {
  "‘": "'", "’": "'", "‚": "'", "′": "'",
  "“": '"', "”": '"', "„": '"', "″": '"',
  "–": "-", "—": "-", "‐": "-", "‑": "-", "−": "-",
};

function canon(s: string): { text: string; idx: number[] } {
  let text = "";
  const idx: number[] = [];
  let space = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/\s/.test(c)) {
      if (!space && text.length) { text += " "; idx.push(i); }
      space = true;
      continue;
    }
    space = false;
    text += CANON[c] ?? c;
    idx.push(i);
  }
  return { text: text.trimEnd(), idx };
}

export interface Span { start: number; end: number; text: string }

export function findQuote(doc: string, quote: string, docCanon = canon(doc)): Span | null {
  const q = canon(quote.trim()).text;
  if (q.length < 20 || /\.\.\.|…/.test(q)) return null; // no fragments, no stitched ellipses
  const at = docCanon.text.indexOf(q);
  if (at < 0) return null;
  const start = docCanon.idx[at];
  const end = docCanon.idx[at + q.length - 1] + 1;
  return { start, end, text: doc.slice(start, end) };
}

export const canonDoc = canon;
