import { NextResponse } from 'next/server';

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

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString();
  const origin = new URL(request.url).origin;
  const results = await Promise.allSettled(Object.entries(ENDPOINTS).map(async ([key, path]) => {
    const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${key} HTTP ${response.status}`);
    return [key, await response.json()] as const;
  }));
  const data: Record<string, any> = {};
  const failures: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') data[result.value[0]] = result.value[1];
    else failures.push(result.reason instanceof Error ? result.reason.message : 'source unavailable');
  }

  const fx = data.fx;
  const dashboard = data.dashboard;
  const score = data.score;
  const calendar = data.calendar;
  const mepVsOfficial = pct(fx?.spreads?.mepVsOfficial ?? dashboard?.market?.brechaMepOficial);
  const scoreValue = typeof score?.score === 'number' ? score.score : null;
  const events = Array.isArray(calendar?.events)
    ? calendar.events.filter((x: any) => typeof x.daysUntil === 'number' && x.daysUntil >= 0 && x.daysUntil <= 60)
    : Array.isArray(calendar?.upcoming)
      ? calendar.upcoming.filter((x: any) => typeof x.daysUntil === 'number' && x.daysUntil >= 0 && x.daysUntil <= 60)
      : [];
  const urgentEvents = events.filter((x: any) => x.daysUntil <= 7).sort((a: any, b: any) => a.daysUntil - b.daysUntil);

  const alerts: Array<{ level: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO'; title: string; detail: string; why: string }> = [];
  if (scoreValue != null && scoreValue < 60) alerts.push({ level: 'CRITICA', title: 'Health Score degradado', detail: `Score operativo ${scoreValue}/100.`, why: 'La combinación de liquidez, mercado, riesgo y calidad de datos está por debajo del umbral operativo.' });
  if (mepVsOfficial != null && mepVsOfficial > 5) alerts.push({ level: 'ALTA', title: 'Brecha MEP elevada', detail: `MEP ${mepVsOfficial.toFixed(2)}% por encima del oficial.`, why: 'La brecha supera el umbral operativo del 5%.' });
  for (const event of urgentEvents.slice(0, 3)) alerts.push({ level: event.daysUntil <= 3 ? 'CRITICA' : 'ALTA', title: event.title, detail: `${event.type} · ${event.daysUntil} días.`, why: 'La obligación/evento está dentro de la ventana de atención inmediata.' });
  if (!alerts.length) alerts.push({ level: 'INFO', title: 'Sin alertas críticas detectadas', detail: 'Continuar monitoreo automático.', why: 'No se activaron los umbrales configurados.' });

  const priority1 = urgentEvents.filter((x: any) => x.daysUntil <= 3).slice(0, 3).map((x: any) => ({ title: x.title, type: x.type, dueDate: x.date, daysUntil: x.daysUntil, source: x.source, why: `Vence en ${x.daysUntil} día${x.daysUntil === 1 ? '' : 's'}; requiere cobertura de caja y seguimiento inmediato.` }));
  const priority2 = [
    mepVsOfficial != null && mepVsOfficial > 5 ? { title: 'Revisar timing y exposición cambiaria', reason: `Brecha MEP ${mepVsOfficial.toFixed(2)}%`, why: 'La brecha MEP/oficial supera 5%; conviene revisar timing antes de ejecutar operaciones cambiarias.', source: fx?.sources?.mep ?? null } : null,
    data.bna?.sourceStatus?.billete !== 'OK' ? { title: 'Validar cotización BNA billete', reason: 'Fuente BNA no confirmada', why: 'La fuente directa no confirmó billete de forma inequívoca; el sistema no lo reemplaza por otra cotización.', source: data.bna?.source ?? null } : null,
    fx?.anomaly?.status === 'ANOMALIA' ? { title: 'Revisar anomalía MEP', reason: `z-score ${typeof fx.anomaly.zScore === 'number' ? fx.anomaly.zScore.toFixed(2) : 'N/D'}`, why: 'La observación MEP se encuentra a al menos 2 desviaciones estándar de su ventana reciente observada.', source: fx?.sources?.mep ?? null } : null,
  ].filter(Boolean);
  const priority3 = events.filter((x: any) => x.daysUntil > 3 && x.daysUntil <= 14).slice(0, 5).map((x: any) => ({ title: x.title, type: x.type, dueDate: x.date, daysUntil: x.daysUntil, source: x.source, why: `Agenda de corto plazo: quedan ${x.daysUntil} días para preparar caja y documentación.` }));

  let action = 'Mantener monitoreo y validar liquidez antes de ejecutar pagos o colocaciones.';
  if (priority1.length) action = 'Prioridad 1: asegurar caja de corto plazo y preparar las obligaciones inmediatas.';
  else if (priority2.length) action = 'Prioridad 2: resolver señales de mercado o calidad de datos antes de ejecutar.';
  else if (scoreValue != null && scoreValue < 70) action = 'Prioridad 2: revisar calidad de datos y fuentes antes de tomar decisiones.';
  else if (priority3.length) action = 'Prioridad 3: anticipar próximos vencimientos y ajustar el calendario de caja.';

  const risk = scoreValue == null ? 'SIN_DATO' : scoreValue >= 80 ? 'VERDE' : scoreValue >= 60 ? 'AMARILLO' : 'ROJO';
  const sourceHealth = {
    dashboard: data.dashboard ? 'OK' : 'ERROR', fima: data.fima?.ok ? 'OK' : 'ERROR', score: data.score?.ok ? 'OK' : 'ERROR', calendar: data.calendar?.ok ? 'OK' : 'ERROR', fx: data.fx?.ok ? 'OK' : 'ERROR',
    bnaBillete: data.bna?.sourceStatus?.billete === 'OK' ? 'OK' : 'ERROR', bnaDivisa: data.bna?.sourceStatus?.divisa === 'OK' ? 'OK' : 'ERROR',
  };

  return NextResponse.json({ ok: Object.keys(data).length > 0, checkedAt, action, risk, priorities: { one: priority1, two: priority2, three: priority3 }, alerts,
    market: { official: dashboard?.market?.oficial ?? fx?.official ?? null, mep: dashboard?.market?.mep ?? fx?.mep ?? null, mepVsOfficial, bna: data.bna ?? null },
    liquidity: { fima: data.fima?.reference ?? null, redemption: data.fima?.redemption ?? null },
    health: scoreValue == null ? null : { score: scoreValue, label: score?.label ?? null, dimensions: score?.dimensions ?? null },
    dataHealth: { status: failures.length ? 'ATENCION' : 'OK', sources: sourceHealth, failures }, analytics: { mepAnomaly: fx?.anomaly ?? null }, calendar: urgentEvents,
    sources: { dashboard: dashboard?.sources ?? null, fx: fx?.sources ?? null, bna: data.bna?.source ?? null, fima: data.fima?.source ?? null },
    methodology: 'Motor de prioridades operativo. Prioridad 1 = obligaciones <=3 días; prioridad 2 = señales de mercado/calidad; prioridad 3 = agenda <=14 días. Las explicaciones se generan solo a partir de señales y datos observados; no se reemplazan datos faltantes por estimaciones.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
