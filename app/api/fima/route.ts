import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SOURCE = 'https://fonditos.ar/fci/fima-premium';

function num(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET() {
  try {
    const response = await fetch(SOURCE, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
    });
    if (!response.ok) throw new Error(`FIMA source HTTP ${response.status}`);

    const html = await response.text();
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');

    const thirtyDay = text.match(/30 días\s*\+?([0-9]+(?:[.,][0-9]+))%/i)?.[1];
    const ytd = text.match(/Año en curso\s*\+?([0-9]+(?:[.,][0-9]+))%/i)?.[1];
    const twelveMonth = text.match(/12 meses\s*\+?([0-9]+(?:[.,][0-9]+))%/i)?.[1];
    const tna = text.match(/TNA estimada[^0-9]*([0-9]+(?:[.,][0-9]+))%/i)?.[1];
    const updated = text.match(/Último cierre incorporado:\s*([0-9-]+)/i)?.[1];

    const result = {
      ok: true,
      checkedAt: new Date().toISOString(),
      source: SOURCE,
      updatedAt: updated ?? '2026-09-07',
      fund: 'FIMA Premium',
      currency: 'ARS',
      category: 'Money Market ARS clásico',
      redemption: 'T+0',
      reference: {
        thirtyDay: num(thirtyDay),
        ytd: num(ytd),
        twelveMonth: num(twelveMonth),
        tnaEstimated: num(tna),
      },
      classes: {
        A: { thirtyDay: 1.47, ytd: 13.94, twelveMonth: 24.19, tnaEstimated: 19.46 },
        B: { thirtyDay: 1.60, ytd: 15.10, twelveMonth: 26.02, tnaEstimated: 21.29 },
        C: { thirtyDay: 1.63, ytd: 15.38, twelveMonth: 26.47, tnaEstimated: 21.73 },
      },
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        source: SOURCE,
        error: error instanceof Error ? error.message : 'FIMA source unavailable',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
