import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MEP_URL = 'https://dolarapi.com/v1/dolares/bolsa';
const BNA_URL = '/api/treasury/bna';
const OFFICIAL_URL = 'https://dolarapi.com/v1/dolares/oficial';

function spread(a: number | null, b: number | null) {
  if (a == null || b == null || b === 0) return null;
  return ((a / b) - 1) * 100;
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const [mepRes, officialRes, bnaRes] = await Promise.all([
      fetch(MEP_URL, { cache: 'no-store' }),
      fetch(OFFICIAL_URL, { cache: 'no-store' }),
      fetch(`${base}${BNA_URL}`, { cache: 'no-store' }),
    ]);
    const mep = mepRes.ok ? await mepRes.json() : null;
    const official = officialRes.ok ? await officialRes.json() : null;
    const bna = bnaRes.ok ? await bnaRes.json() : null;
    const mepSell = typeof mep?.venta === 'number' ? mep.venta : null;
    const officialSell = typeof official?.venta === 'number' ? official.venta : null;
    const bnaBuy = typeof bna?.billete?.buy === 'number' ? bna.billete.buy : null;
    const bnaSell = typeof bna?.billete?.sell === 'number' ? bna.billete.sell : null;

    return NextResponse.json({
      ok: mepSell != null || officialSell != null || bnaSell != null,
      checkedAt,
      market: {
        mep: mepSell,
        official: officialSell,
        bnaBilleteBuy: bnaBuy,
        bnaBilleteSell: bnaSell,
      },
      spreads: {
        mepVsOfficial: spread(mepSell, officialSell),
        mepVsBnaBillete: spread(mepSell, bnaSell),
        bnaBilleteVsOfficial: spread(bnaSell, officialSell),
      },
      signals: {
        mepPremium: mepSell != null && officialSell != null ? (mepSell > officialSell ? 'MEP_ABOVE_OFFICIAL' : 'MEP_BELOW_OFFICIAL') : 'SIN_DATO',
        bnaPremium: bnaSell != null && officialSell != null ? (bnaSell > officialSell ? 'BNA_ABOVE_OFFICIAL' : 'BNA_BELOW_OFFICIAL') : 'SIN_DATO',
      },
      sourceStatus: {
        mep: mepRes.ok ? 'OK' : 'ERROR',
        official: officialRes.ok ? 'OK' : 'ERROR',
        bna: bnaRes.ok && bna?.billete ? 'OK' : 'ERROR',
      },
      methodology: 'Brechas calculadas exclusivamente sobre cotizaciones verificadas. No se usa BNA divisa como proxy y no se inventan valores faltantes.',
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({ ok: false, checkedAt, error: error instanceof Error ? error.message : 'Spread unavailable' }, { status: 502 });
  }
}
