import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BCRA_SOURCE = 'https://www.bcra.gob.ar/calendario-informes/';
const ARCA_SOURCE = 'https://www.arca.gob.ar/gananciasYBienes/ganancias/personas-humanas-sucesiones-indivisas/declaracion-jurada/determinativa/vencimientos.asp';

const events = [
  { date: '2026-09-14', type: 'BCRA', title: 'Boletín Estadístico', priority: 'MEDIA', source: BCRA_SOURCE },
  { date: '2026-09-18', type: 'BCRA', title: 'Informe sobre Bancos', priority: 'ALTA', source: BCRA_SOURCE },
  { date: '2026-09-22', type: 'ARCA', title: 'Ganancias — presentación DDJJ personas humanas / sucesiones indivisas', priority: 'CRÍTICA', source: ARCA_SOURCE },
  { date: '2026-09-24', type: 'ARCA', title: 'Primer anticipo Ganancias período fiscal 2026', priority: 'CRÍTICA', source: 'https://servicioscf.arca.gob.ar/publico/sitio/contenido/novedad/ver.aspx?id=5877' },
  { date: '2026-09-25', type: 'BCRA', title: 'Evolución del Mercado de Cambios y Balance Cambiario', priority: 'ALTA', source: BCRA_SOURCE },
  { date: '2026-09-25', type: 'BCRA', title: 'Informe de Pagos Minoristas', priority: 'MEDIA', source: BCRA_SOURCE },
  { date: '2026-10-06', type: 'BCRA', title: 'Relevamiento de Expectativas de Mercado (REM)', priority: 'ALTA', source: BCRA_SOURCE },
  { date: '2026-10-07', type: 'BCRA', title: 'Informe Monetario Mensual', priority: 'ALTA', source: BCRA_SOURCE },
  { date: '2026-10-14', type: 'BCRA', title: 'Boletín Estadístico', priority: 'MEDIA', source: BCRA_SOURCE },
  { date: '2026-10-16', type: 'BCRA', title: 'Informe sobre Bancos', priority: 'ALTA', source: BCRA_SOURCE },
];

function daysUntil(date: string, now: Date) {
  const target = new Date(`${date}T12:00:00-03:00`);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export async function GET() {
  const checkedAt = new Date();
  const upcoming = events
    .map(event => ({ ...event, daysUntil: daysUntil(event.date, checkedAt) }))
    .filter(event => event.daysUntil >= 0 && event.daysUntil <= 60)
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    ok: true,
    checkedAt: checkedAt.toISOString(),
    horizonDays: 60,
    upcoming,
    methodology: 'Agenda operativa construida con fechas oficiales publicadas por BCRA y ARCA. Las fechas pueden ser reprogramadas; el radar debe revalidarlas antes de ejecutar pagos.',
    sources: { BCRA: BCRA_SOURCE, ARCA: ARCA_SOURCE },
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
