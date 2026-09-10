import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MEP_URL = 'https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa';
const BNA_URL = 'https://dolarhistorico.com/dolar-banco-nacion';

function parseNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

async function fetchBna() {
  const res = await fetch(BNA_URL, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } });
  if (!res.ok) throw new Error(`BNA HTTP ${res.status}`);
  const html = await res.text();
  const rows = [...html.matchAll(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)/g)];
  return rows.slice(0, 260).map(m => ({ date: m[1], buy: parseNumber(m[2]), sell: parseNumber(m[3]) })).filter(x => x.buy != null && x.sell != null);
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
    ? mepResult.value.map((x: any) => ({ date: x.fecha, buy: x.compra, sell: x.venta })).filter((x: any) => x.date && typeof x.sell === 'number')
    : [];
  const bna = bnaResult.status === 'fulfilled' ? bnaResult.value : [];

  return NextResponse.json({
    ok: mep.length > 0 || bna.length > 0,
    checkedAt,
    period: 'historical available from providers',
    mep: mep.slice(-370),
    bna: bna.slice(0, 260),
    sources: { mep: MEP_URL, bna: BNA_URL },
    methodology: 'Histórico operativo. MEP proviene de ArgentinaDatos/DolarApi. BNA proviene de Dólar Histórico. No se mezclan fuentes para fabricar una serie única; cada serie conserva su procedencia.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
