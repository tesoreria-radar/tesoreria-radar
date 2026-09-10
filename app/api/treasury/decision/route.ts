import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIMA_URL = 'https://fonditos.ar/fci/fima-premium';
const DOLAR_URL = 'https://dolarapi.com/v1/dolares/oficial';

function pct(value: number | null) {
  return value == null ? null : Number(value.toFixed(2));
}

async function readJson(url: string) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} · ${url}`);
  return response.json();
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const [fimaResponse, dollar] = await Promise.allSettled([
      fetch(FIMA_URL, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`FIMA HTTP ${r.status}`);
        return r.text();
      }),
      readJson(DOLAR_URL),
    ]);

    let fima30: number | null = null;
    let fima12m: number | null = null;
    let fimaUpdated: string | null = null;

    if (fimaResponse.status === 'fulfilled') {
      const text = fimaResponse.value.replace(/<[^>]+>/g, ' ');
      const m30 = text.match(/30 días\s*\+?([0-9]+(?:[.,][0-9]+))%/i)?.[1];
      const m12 = text.match(/12 meses\s*\+?([0-9]+(?:[.,][0-9]+))%/i)?.[1];
      const updated = text.match(/Último cierre incorporado:\s*([0-9-]+)/i)?.[1];
      fima30 = m30 ? Number(m30.replace(',', '.')) : null;
      fima12m = m12 ? Number(m12.replace(',', '.')) : null;
      fimaUpdated = updated ?? null;
    }

    const dollarData = dollar.status === 'fulfilled' ? dollar.value : null;
    const options = [
      {
        instrument: 'FIMA Premium Clase B',
        horizon: '30 días',
        returnPct: pct(fima30),
        liquidity: 'T+0',
        status: fima30 != null ? 'DISPONIBLE' : 'SIN DATO',
        source: FIMA_URL,
      },
      {
        instrument: 'Caución pesos',
        horizon: '7–30 días',
        returnPct: null,
        liquidity: 'T+1 / según operación',
        status: 'SIN DATO',
        source: 'BYMA / mercado de cauciones pendiente de feed',
      },
      {
        instrument: 'Plazo fijo pesos',
        horizon: '30 días',
        returnPct: null,
        liquidity: 'Vencimiento',
        status: 'SIN DATO',
        source: 'Tasa bancaria pendiente de feed',
      },
      {
        instrument: 'Cuenta remunerada',
        horizon: 'Inmediato',
        returnPct: null,
        liquidity: 'Inmediata',
        status: 'SIN DATO',
        source: 'Tasa bancaria pendiente de feed',
      },
    ];

    const recommendation = fima30 != null
      ? 'FIMA como benchmark líquido: mantener como referencia hasta disponer de tasas comparables verificadas.'
      : 'No emitir recomendación: faltan datos verificables de instrumentos comparables.';

    return NextResponse.json({
      ok: true,
      checkedAt,
      engine: 'Treasury Liquidity Decision v1',
      recommendation,
      benchmark: {
        instrument: 'FIMA Premium Clase B',
        thirtyDay: fima30,
        twelveMonth: fima12m,
        lastClose: fimaUpdated,
      },
      marketContext: {
        officialDollarSell: typeof dollarData?.venta === 'number' ? dollarData.venta : null,
        officialDollarBuy: typeof dollarData?.compra === 'number' ? dollarData.compra : null,
      },
      options,
      methodology: [
        'No se rankea un instrumento sin tasa verificable.',
        'La liquidez es parte de la decisión, no un dato accesorio.',
        'El benchmark FIMA no implica recomendación de inversión.',
      ],
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      checkedAt,
      engine: 'Treasury Liquidity Decision v1',
      recommendation: 'Motor degradado: no emitir recomendación.',
      error: error instanceof Error ? error.message : 'Decision engine unavailable',
    }, { status: 502, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
}
