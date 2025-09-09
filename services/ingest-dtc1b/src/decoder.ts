import iconv from 'iconv-lite';

const CANDIDATES = ['utf8', 'latin1', 'win1252', 'cp437', 'cp850', 'CP037'] as const;
type Enc = typeof CANDIDATES[number];

function printableRatio(s: string): number {
  if (!s) return 0;
  let printable = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127) || (c >= 160 && c <= 65533)) printable++;
  }
  return printable / s.length;
}

export function bestDecode(buf: Buffer): { text: string; encoding: Enc } {
  let best: { score: number; text: string; enc: Enc } = { score: -1, text: '', enc: 'utf8' };
  for (const enc of CANDIDATES) {
    try {
      const text = iconv.decode(buf, enc as any);
      const score = printableRatio(text);
      if (score > best.score) best = { score, text, enc };
      if (score > 0.985) break;
    } catch {}
  }
  return { text: best.text, encoding: best.enc };
}
