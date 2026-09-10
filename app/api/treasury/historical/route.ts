import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MEP_URL = 'https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa';
const BNA_URL = 'https://dolarhistorico.com/dolar-banco-nacion';

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

async function fetchBna() {
  const res = await fetch(BNA_URL, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } });
  if (!res.ok) throw new Error(`BNA HTTP ${res.status}`);
  const html = await res.text();
  const rows = [...html.matchAll(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*([0-9.,]+)\s*\|\s*([0-9.,]+)/g)];
  return rows.map(m => {
    const [day, month, year] = m[1].split('/');
    const date = `${year}-${month}-${day}`;
    const buy = parseNumber(m[2]);
    const sell = parseNumber(m[3]);
    return { date, buy, sell };
  }).filter(x => validPoint(x.date, x.buy, x.sell));
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
    ? mepResult.value.map((x: any) => ({ date: String(x.fecha || '').slice(0, 10), buy: typeof x.compra === 'number' ? x.compra : parseNumber(String(x.compra ?? '')), sell: typeof x.venta === 'number' ? x.venta : parseNumber(String(x.venta ?? '')) }))
        .filter((x: any) => validPoint(x.date, x.buy, x.sell))
    : [];

  const bna = bnaResult.status === 'fulfilled' ? bnaResult.value : [];

  return NextResponse.json({
    ok: mep.length > 0 || bna.length > 0,
    checkedAt,
    period: 'historical available from providers',
    mep: mep.slice(-370),
    bna: bna.slice(0, 370),
    sources: { mep: MEP_URL, bna: BNA_URL },
    sourceStatus: {
      mep: mepResult.status === 'fulfilled' ? 'OK' : 'ERROR',
      bna: bnaResult.status === 'fulfilled' ? 'OK' : 'ERROR',
    },
    methodology: 'Histórico operativo. MEP proviene de ArgentinaDatos. BNA proviene de Dólar Histórico. Las series mantienen su procedencia y no se combinan para fabricar una serie única.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
