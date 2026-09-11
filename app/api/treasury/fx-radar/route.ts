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

async function json(path: string) {
  const r = await fetch(`${API}/${path}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
  });
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
  return r.json();
}

async function historicalMep() {
  const r = await fetch(`${API}/bolsa`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
  });
  if (!r.ok) throw new Error(`bolsa history HTTP ${r.status}`);
  const rows = await r.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => n(row?.venta))
    .filter((value): value is number => value != null)
    .slice(-30);
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
  const mepValues = historical.length ? historical : mepSell != null ? [mepSell] : [];
  const avg = mean(mepValues);
  const deviation = mepSell != null && avg != null ? spread(mepSell, avg) : null;
  const sigma = stdev(mepValues, avg);
  const zScore = mepSell != null && avg != null && sigma && sigma > 0 ? (mepSell - avg) / sigma : null;

  const sourceHealth = {
    official: official.status === 'fulfilled' && officialSell != null ? 'OK' : 'ERROR',
    mep: mep.status === 'fulfilled' && mepSell != null ? 'OK' : 'ERROR',
    mepHistory: history.status === 'fulfilled' && historical.length >= 5 ? 'OK' : 'LIMITED',
    bna: 'PENDIENTE_VERIFICACION',
  };

  const signals = [
    mepSell != null && officialSell != null && mepSell > officialSell * 1.05
      ? 'MEP_MUY_POR_ENCIMA_DEL_OFICIAL'
      : null,
    mepSell != null && officialSell != null && mepSell < officialSell
      ? 'MEP_DEBAJO_DEL_OFICIAL'
      : null,
    zScore != null && Math.abs(zScore) >= 2
      ? zScore > 0
        ? 'MEP_ANOMALIA_ALTA_VS_30_OBSERVACIONES'
        : 'MEP_ANOMALIA_BAJA_VS_30_OBSERVACIONES'
      : null,
  ].filter(Boolean);

  return NextResponse.json(
    {
      ok: officialSell != null || mepSell != null,
      checkedAt,
      official: {
        buy: n(o?.compra),
        sell: officialSell,
        updatedAt: o?.fechaActualizacion ?? null,
      },
      mep: {
        buy: n(m?.compra),
        sell: mepSell,
        updatedAt: m?.fechaActualizacion ?? null,
      },
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
      methodology:
        'Brechas y anomalías calculadas exclusivamente con observaciones disponibles. La anomalía usa hasta las últimas 30 observaciones MEP y umbral |z| >= 2. BNA no se proxifica ni se mezcla con oficial/MEP.',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
