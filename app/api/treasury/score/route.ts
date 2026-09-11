import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SOURCES = {
  fima: 'https://fonditos.ar/fci/fima-premium',
  dollar: 'https://dolarapi.com/v1/dolares/oficial',
};

function extract(text: string, pattern: RegExp) {
  const match = text.match(pattern)?.[1];
  if (!match) return null;
  const value = Number(match.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString();
  const origin = new URL(request.url).origin;
  try {
    const results = await Promise.allSettled([
      fetch(SOURCES.fima, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } }).then(async r => { if (!r.ok) throw new Error(`FIMA HTTP ${r.status}`); return r.text(); }),
      fetch(SOURCES.dollar, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } }).then(async r => { if (!r.ok) throw new Error(`DOLAR HTTP ${r.status}`); return r.json(); }),
      fetch(`${origin}/api/treasury/fx-radar`, { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error(`FX HTTP ${r.status}`); return r.json(); }),
      fetch(`${origin}/api/treasury/calendar`, { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error(`CALENDAR HTTP ${r.status}`); return r.json(); }),
    ]);
    const [fimaRes, dollarRes, fxRes, calendarRes] = results;
    const fimaText = fimaRes.status === 'fulfilled' ? fimaRes.value.replace(/<[^>]+>/g, ' ') : '';
    const fima30 = extract(fimaText, /30 días\s*\+?([0-9]+(?:[.,][0-9]+))%/i);
    const fima12 = extract(fimaText, /12 meses\s*\+?([0-9]+(?:[.,][0-9]+))%/i);
    const dollar = dollarRes.status === 'fulfilled' ? dollarRes.value : null;
    const fx = fxRes.status === 'fulfilled' ? fxRes.value : null;
    const calendar = calendarRes.status === 'fulfilled' ? calendarRes.value : null;

    const events = Array.isArray(calendar?.upcoming) ? calendar.upcoming : Array.isArray(calendar?.events) ? calendar.events : [];
    const urgent = events.filter((x: any) => typeof x.daysUntil === 'number' && x.daysUntil >= 0 && x.daysUntil <= 7);
    const critical = events.filter((x: any) => typeof x.daysUntil === 'number' && x.daysUntil >= 0 && x.daysUntil <= 3);
    const brecha = typeof fx?.spreads?.mepVsOfficial === 'number' ? fx.spreads.mepVsOfficial : null;
    const anomaly = fx?.anomaly?.status === 'ANOMALIA';

    const checks = [fima30 != null, fima12 != null, typeof dollar?.venta === 'number', typeof brecha === 'number', Array.isArray(events)].filter(Boolean).length;
    const dataScore = Math.round(checks / 5 * 100);
    const marketScore = typeof dollar?.venta === 'number' ? Math.max(45, Math.min(95, 90 - (brecha != null && brecha > 5 ? 15 : 0) - (anomaly ? 15 : 0))) : 35;
    const liquidityScore = fima30 != null ? 90 : 35;
    const riskScore = Math.max(35, Math.min(95, 88 - (critical.length ? 20 : urgent.length ? 10 : 0) - (anomaly ? 15 : 0) - (brecha != null && brecha > 5 ? 10 : 0)));
    const overall = Math.round((marketScore + liquidityScore + riskScore + dataScore) / 4);
    const label = overall >= 80 ? 'SALUDABLE' : overall >= 60 ? 'ATENCIÓN' : 'DEGRADADO';

    return NextResponse.json({
      ok: true, checkedAt, score: overall, label,
      dimensions: { liquidity: liquidityScore, market: marketScore, risk: riskScore, dataQuality: dataScore },
      signals: {
        fima30, fima12m: fima12, officialDollar: typeof dollar?.venta === 'number' ? dollar.venta : null,
        mepVsOfficial: brecha, mepAnomaly: anomaly, urgentEvents: urgent.length, criticalEvents: critical.length,
      },
      methodology: 'Score operativo orientativo. Integra liquidez FIMA, mercado cambiario, anomalías MEP, agenda de caja BCRA/ARCA y calidad de datos. No constituye recomendación de inversión; datos faltantes reducen el score.',
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({ ok: false, checkedAt, score: 0, label: 'DEGRADADO', error: error instanceof Error ? error.message : 'Score unavailable' }, { status: 502 });
  }
}
