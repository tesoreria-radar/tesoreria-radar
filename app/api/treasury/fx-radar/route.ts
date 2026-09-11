import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';
const BNA = 'https://www.bna.com.ar/Empresas';

function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function spread(a: number | null, b: number | null) {
  return a != null && b != null && b !== 0 ? ((a / b) - 1) * 100 : null;
}

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function stdev(values: number[], avg: number | null) {
  if (!values.length || avg == null) return null;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '/');
}

async function json(path: string) {
  const r = await fetch(`${API}/${path}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
  });
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
  return r.json();
}

async function historicalMep() {
  // ArgentinaDatos exposes the historical quote by house/date. Build a small
  // recent window from actual dated observations rather than assuming /bolsa
  // is itself a historical array.
  const days: string[] = [];
  const cursor = new Date();
  for (let i = 0; i < 30; i += 1) {
    days.push(dateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const rows = await Promise.all(days.map(async (day) => {
    try {
      const row = await json(`bolsa/${day}`);
      const value = n(row?.venta);
      return value != null ? value : null;
    } catch {
      return null;
    }
  }));

  return rows.filter((value): value is number => value != null);
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [official, mep, history] = await Promise.allSettled([
    json('oficial'),
    json('bolsa'),
    historicalMep(),
  ]);

  const o = official.status === 'fulfilled' ? official.value : null;
  const m = mep.status === 'fulfilled' ? mep.value : null;
  const historical = history.status === 'fulfilled' ? history.value : [];
  const officialSell = n(o?.venta);
  const mepSell = n(m?.venta);
  const mepValues = historical.length >= 5 ? historical : mepSell != null ? [mepSell] : [];
  const avg = mean(mepValues);
  const deviation = mepSell != null && avg != null ? spread(mepSell, avg) : null;
  const sigma = stdev(mepValues, avg);
  const zScore = mepSell != null && avg != null && sigma != null && sigma > 0 ? (mepSell - avg) / sigma : null;

  const sourceHealth = {
    official: official.status === 'fulfilled' && officialSell != null ? 'OK' : 'ERROR',
    mep: mep.status === 'fulfilled' && mepSell != null ? 'OK' : 'ERROR',
    mepHistory: history.status === 'fulfilled' && historical.length >= 5 ? 'OK' : 'LIMITED',
    bna: 'PENDIENTE_VERIFICACION',
  };

  const signals = [
    mepSell != null && officialSell != null && mepSell > officialSell * 1.05 ? 'MEP_MUY_POR_ENCIMA_DEL_OFICIAL' : null,
    mepSell != null && officialSell != null && mepSell < officialSell ? 'MEP_DEBAJO_DEL_OFICIAL' : null,
    zScore != null && Math.abs(zScore) >= 2
      ? zScore > 0 ? 'MEP_ANOMALIA_ALTA_VS_30_OBSERVACIONES' : 'MEP_ANOMALIA_BAJA_VS_30_OBSERVACIONES'
      : null,
  ].filter(Boolean);

  return NextResponse.json(
    {
      ok: officialSell != null || mepSell != null,
      checkedAt,
      official: { buy: n(o?.compra), sell: officialSell, updatedAt: o?.fechaActualizacion ?? null },
      mep: { buy: n(m?.compra), sell: mepSell, updatedAt: m?.fechaActualizacion ?? null },
      spreads: { mepVsOfficial: spread(mepSell, officialSell) },
      anomaly: {
        window: historical.length,
        mean: avg,
        stdev: sigma,
        deviationVsMeanPct: deviation,
        zScore,
        status: zScore != null && Math.abs(zScore) >= 2 ? 'ANOMALIA' : 'NORMAL',
      },
      sourceHealth,
      signals,
      sources: { official: `${API}/oficial`, mep: `${API}/bolsa`, bna: BNA },
      methodology: 'Brechas y anomalías calculadas exclusivamente con observaciones disponibles. La anomalía usa hasta 30 observaciones MEP obtenidas por fecha desde ArgentinaDatos y umbral |z| >= 2. BNA no se proxifica ni se mezcla con oficial/MEP.',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
