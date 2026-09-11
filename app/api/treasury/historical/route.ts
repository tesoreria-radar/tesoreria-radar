import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MEP_URL = 'https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa';
const BNA_URL = 'https://dolarhistorico.com/dolar-banco-nacion';

type Point = { date: string; buy: number | null; sell: number | null };

function parseNumber(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, '').trim();
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function validPoint(date: string, buy: number | null, sell: number | null) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && (buy != null || sell != null);
}

function dateFrom(value: string) {
  const m = value.trim().match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseBna(html: string): Point[] {
  const points: Point[] = [];

  // First try actual HTML table rows, preserving the source's own buy/sell values.
  for (const match of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...match[0].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim());
    if (cells.length < 3) continue;
    const date = dateFrom(cells.find(x => /\d{2}[\/-]\d{2}[\/-]\d{4}/.test(x)) ?? '');
    if (!date) continue;
    const dateIndex = cells.findIndex(x => /\d{2}[\/-]\d{2}[\/-]\d{4}/.test(x));
    const nums = cells.slice(dateIndex + 1).map(parseNumber).filter((n): n is number => n != null);
    const buy = nums[0] ?? null;
    const sell = nums[1] ?? null;
    if (validPoint(date, buy, sell)) points.push({ date, buy, sell });
  }

  // Fallback for text/markdown-like tables used by some provider versions.
  if (points.length === 0) {
    for (const m of html.matchAll(/(\d{2}[\/-]\d{2}[\/-]\d{4})\s*(?:\||;|,)\s*([0-9.,]+)\s*(?:\||;|,)\s*([0-9.,]+)/g)) {
      const date = dateFrom(m[1]);
      if (!date) continue;
      const buy = parseNumber(m[2]);
      const sell = parseNumber(m[3]);
      if (validPoint(date, buy, sell)) points.push({ date, buy, sell });
    }
  }

  const unique = new Map<string, Point>();
  for (const point of points) unique.set(point.date, point);
  return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchBna() {
  const res = await fetch(BNA_URL, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } });
  if (!res.ok) throw new Error(`BNA HTTP ${res.status}`);
  return parseBna(await res.text());
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [mepResult, bnaResult] = await Promise.allSettled([
    fetch(MEP_URL, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } }).then(async r => {
      if (!r.ok) throw new Error(`MEP HTTP ${r.status}`);
      return r.json();
    }),
    fetchBna(),
  ]);

  const mep = mepResult.status === 'fulfilled' && Array.isArray(mepResult.value)
    ? mepResult.value
        .map((x: any) => ({
          date: String(x.fecha || '').slice(0, 10),
          buy: typeof x.compra === 'number' ? x.compra : parseNumber(String(x.compra ?? '')),
          sell: typeof x.venta === 'number' ? x.venta : parseNumber(String(x.venta ?? '')),
        }))
        .filter((x: Point) => validPoint(x.date, x.buy, x.sell))
    : [];

  const bna = bnaResult.status === 'fulfilled' ? bnaResult.value : [];

  return NextResponse.json({
    ok: mep.length > 0 || bna.length > 0,
    checkedAt,
    period: 'historical available from providers',
    mep: mep.slice(-370),
    bna: bna.slice(-370),
    sources: { mep: MEP_URL, bna: BNA_URL },
    sourceStatus: {
      mep: mepResult.status === 'fulfilled' ? 'OK' : 'ERROR',
      bna: bnaResult.status === 'fulfilled' ? 'OK' : 'ERROR',
    },
    methodology: 'Histórico operativo. MEP proviene de ArgentinaDatos. BNA proviene de Dólar Histórico. Se priorizan filas HTML reales y se mantiene la procedencia de cada serie; no se mezclan fuentes para fabricar datos.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
