import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SOURCES = {
  fx: '/api/treasury/fx-radar',
  calendar: '/api/treasury/calendar',
  bna: '/api/treasury/bna',
  score: '/api/treasury/score',
};

type Alert = {
  id: string;
  level: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO';
  title: string;
  why: string;
  action: string;
  source: string;
  daysUntil?: number;
};

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString();
  const origin = new URL(request.url).origin;
  const urls = Object.values(SOURCES).map(path => `${origin}${path}`);

  const results = await Promise.allSettled(urls.map(url => fetch(url, { cache: 'no-store' }).then(async r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })));

  const [fx, calendar, bna, score] = results.map(r => r.status === 'fulfilled' ? r.value : null);
  const alerts: Alert[] = [];

  const brecha = typeof fx?.spreads?.mepVsOfficial === 'number' ? fx.spreads.mepVsOfficial : null;
  const anomaly = fx?.anomaly?.status === 'ANOMALIA';
  const mep = typeof fx?.market?.mep?.venta === 'number' ? fx.market.mep.venta : null;
  const official = typeof fx?.market?.official?.venta === 'number' ? fx.market.official.venta : null;

  if (brecha != null && brecha > 5) {
    alerts.push({
      id: 'FX-BRECHA-5', level: 'ALTA',
      title: 'MEP supera 5% al oficial',
      why: `Brecha MEP/oficial de ${brecha.toFixed(2)}%.`,
      action: 'Revisar cobertura cambiaria, pagos en USD y necesidad de pesificación antes de ejecutar operaciones.',
      source: 'ArgentinaDatos · FX Radar',
    });
  }

  if (anomaly) {
    const z = typeof fx?.anomaly?.zScore === 'number' ? fx.anomaly.zScore.toFixed(2) : 'N/D';
    alerts.push({
      id: 'FX-ANOMALY', level: 'ALTA',
      title: 'Anomalía estadística en MEP',
      why: `El MEP presenta una desviación estadística relevante (z-score ${z}).`,
      action: 'Validar la cotización contra la fuente primaria antes de tomar una decisión de tesorería.',
      source: 'ArgentinaDatos · FX Radar',
    });
  }

  if (mep != null && official != null && mep < official) {
    alerts.push({
      id: 'FX-MEP-BELOW', level: 'MEDIA',
      title: 'MEP por debajo del oficial',
      why: `MEP ${mep.toFixed(2)} vs oficial ${official.toFixed(2)}.`,
      action: 'Revisar el costo efectivo de acceder a USD y el canal más eficiente para cada pago.',
      source: 'ArgentinaDatos · FX Radar',
    });
  }

  const events = Array.isArray(calendar?.upcoming) ? calendar.upcoming : Array.isArray(calendar?.events) ? calendar.events : [];
  for (const event of events) {
    if (typeof event.daysUntil !== 'number') continue;
    if (event.daysUntil <= 3) {
      alerts.push({
        id: `CAL-${event.date}-${event.title}`,
        level: event.type === 'ARCA' ? 'CRITICA' : 'ALTA',
        title: `Vencimiento / evento en ${event.daysUntil} día${event.daysUntil === 1 ? '' : 's'}`,
        why: `${event.type} · ${event.title}.`,
        action: 'Confirmar fondos, responsables y fecha valor. Revalidar el calendario oficial antes del pago.',
        source: event.source ?? event.type,
        daysUntil: event.daysUntil,
      });
    } else if (event.daysUntil <= 7) {
      alerts.push({
        id: `CAL7-${event.date}-${event.title}`,
        level: 'MEDIA',
        title: `Evento de caja dentro de ${event.daysUntil} días`,
        why: `${event.type} · ${event.title}.`,
        action: 'Incluir en el cash forecast de la semana y reservar liquidez si corresponde.',
        source: event.source ?? event.type,
        daysUntil: event.daysUntil,
      });
    }
  }

  const bnaBilleteOk = bna?.sourceStatus?.billete === 'OK';
  const bnaDivisaOk = bna?.sourceStatus?.divisa === 'OK';
  if (!bnaBilleteOk || !bnaDivisaOk) {
    alerts.push({
      id: 'DATA-BNA', level: 'MEDIA',
      title: 'Calidad de datos BNA degradada',
      why: `Billete: ${bna?.sourceStatus?.billete ?? 'SIN DATO'} · Divisa: ${bna?.sourceStatus?.divisa ?? 'SIN DATO'}.`,
      action: 'No sustituir una serie por otra. Validar BNA directamente antes de usar la cotización.',
      source: 'Banco Nación',
    });
  }

  if (score?.label === 'DEGRADADO') {
    alerts.push({
      id: 'DATA-SCORE', level: 'ALTA',
      title: 'Health Score operativo degradado',
      why: `Score actual: ${typeof score?.score === 'number' ? score.score : 'N/D'}.`,
      action: 'Priorizar validación de fuentes faltantes antes de automatizar decisiones de tesorería.',
      source: 'Treasury Health Score',
    });
  }

  const order: Record<Alert['level'], number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, INFO: 3 };
  alerts.sort((a, b) => order[a.level] - order[b.level] || (a.daysUntil ?? 999) - (b.daysUntil ?? 999));

  return NextResponse.json({
    ok: true,
    checkedAt,
    summary: {
      total: alerts.length,
      critical: alerts.filter(a => a.level === 'CRITICA').length,
      high: alerts.filter(a => a.level === 'ALTA').length,
      medium: alerts.filter(a => a.level === 'MEDIA').length,
    },
    alerts,
    methodology: 'Alertas operativas basadas únicamente en datos disponibles y fuentes identificadas. No se inventan valores ni se sustituyen fuentes. Los eventos ARCA/BCRA deben revalidarse antes de pagos o vencimientos.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
