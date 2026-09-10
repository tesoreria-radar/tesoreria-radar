import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BNA_URL = 'https://www.bna.com.ar/Empresas';

function number(value: string) {
  const n = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(BNA_URL, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Tesoreria-Radar/1.0' },
    });
    if (!res.ok) throw new Error(`BNA HTTP ${res.status}`);
    const html = await res.text();

    const billeteMatch = html.match(/Dolar U\.S\.A[\s\S]{0,900}?([0-9]+(?:[.,][0-9]+))\s*\|\s*([0-9]+(?:[.,][0-9]+))/i);
    const divisaMatches = [...html.matchAll(/Dolar U\.S\.A[\s\S]{0,900}?([0-9]+(?:[.,][0-9]+))\s*\|\s*([0-9]+(?:[.,][0-9]+))/gi)];

    const billete = billeteMatch
      ? { buy: number(billeteMatch[1]), sell: number(billeteMatch[2]) }
      : null;

    const candidates = divisaMatches.map(m => ({ buy: number(m[1]), sell: number(m[2]) }));
    const divisa = candidates.length > 1 ? candidates[candidates.length - 1] : null;

    return NextResponse.json({
      ok: Boolean(billete || divisa),
      checkedAt,
      source: BNA_URL,
      billete,
      divisa,
      methodology: 'Cotización BNA directa. Billete y divisa se mantienen separados; no se utiliza el dólar oficial como proxy de divisa.',
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      checkedAt,
      source: BNA_URL,
      error: error instanceof Error ? error.message : 'BNA unavailable',
    }, { status: 502 });
  }
}
