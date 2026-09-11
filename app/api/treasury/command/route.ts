import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ENDPOINTS = {
  dashboard: '/api/dashboard',
  fima: '/api/fima',
  score: '/api/treasury/score',
  calendar: '/api/treasury/calendar',
  fx: '/api/treasury/fx-radar',
  bna: '/api/treasury/bna',
};

function pct(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString();
  const origin = new URL(request.url).origin;

  const results = await Promise.allSettled(
    Object.entries(ENDPOINTS).map(async ([key, path]) => {
      const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${key} HTTP ${response.status}`);
      return [key, await response.json()] as const;
    }),
  );

  const data: Record<string, any> = {};
  for (const result of results) {
    if (result.status === 'fulfilled') data[result.value[0]] = result.value[1];
  }

  const fx = data.fx;
  const dashboard = data.dashboard;
  const score = data.score;
  const calendar = data.calendar;

  const mepVsOfficial = pct(fx?.spreads?.mepVsOfficial ?? dashboard?.market?.brechaMepOficial);
  const scoreValue = typeof score?.score === 'number' ? score.score : null;
  const urgentEvents = Array.isArray(calendar?.events)
    ? calendar.events.filter((x: any) => typeof x.daysUntil === 'number' && x.daysUntil <= 7)
    : [];

  const alerts: Array<{ level: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO'; title: string; detail: string }> = [];
  if (scoreValue != null && scoreValue < 60) alerts.push({ level: 'CRITICA', title: 'Health Score degradado', detail: `Score operativo ${scoreValue}/100.` });
  if (mepVsOfficial != null && mepVsOfficial > 5) alerts.push({ level: 'ALTA', title: 'Brecha MEP elevada', detail: `MEP ${mepVsOfficial.toFixed(2)}% por encima del oficial.` });
  for (const event of urgentEvents.slice(0, 3)) alerts.push({ level: event.daysUntil <= 3 ? 'CRITICA' : 'ALTA', title: event.title, detail: `${event.type} · ${event.daysUntil} días.` });
  if (!alerts.length) alerts.push({ level: 'INFO', title: 'Sin alertas críticas detectadas', detail: 'Continuar monitoreo automático.' });

  let action = 'Mantener monitoreo y validar liquidez antes de ejecutar pagos o colocaciones.';
  if (urgentEvents.some((x: any) => x.daysUntil <= 3)) action = 'Priorizar caja de corto plazo: revisar vencimientos y asegurar liquidez para las obligaciones inmediatas.';
  else if (mepVsOfficial != null && mepVsOfficial > 5) action = 'Revisar exposición cambiaria y timing de compras/ventas; la brecha MEP requiere seguimiento.';
  else if (scoreValue != null && scoreValue < 70) action = 'Revisar calidad de datos y fuentes antes de tomar decisiones de tesorería.';

  return NextResponse.json({
    ok: Object.keys(data).length > 0,
    checkedAt,
    action,
    alerts,
    market: {
      official: dashboard?.market?.oficial ?? fx?.official ?? null,
      mep: dashboard?.market?.mep ?? fx?.mep ?? null,
      mepVsOfficial,
      bna: data.bna ?? null,
    },
    liquidity: {
      fima: data.fima?.reference ?? null,
      redemption: data.fima?.redemption ?? null,
    },
    health: scoreValue == null ? null : { score: scoreValue, label: score?.label ?? null, dimensions: score?.dimensions ?? null },
    calendar: urgentEvents,
    sources: {
      dashboard: dashboard?.sources ?? null,
      fx: fx?.sources ?? null,
      bna: data.bna?.source ?? null,
      fima: data.fima?.source ?? null,
    },
    methodology: 'Command Center agregado desde endpoints internos; conserva procedencia y no reemplaza datos faltantes por estimaciones.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
