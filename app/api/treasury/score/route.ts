import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIMA_URL = 'https://fonditos.ar/fci/fima-premium';
const DOLAR_URL = 'https://dolarapi.com/v1/dolares/oficial';

function extract(text: string, pattern: RegExp) {
  const match = text.match(pattern)?.[1];
  if (!match) return null;
  const value = Number(match.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const [fimaRes, dollarRes] = await Promise.allSettled([
      fetch(FIMA_URL, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } }).then(async r => {
        if (!r.ok) throw new Error(`FIMA HTTP ${r.status}`);
        return r.text();
      }),
      fetch(DOLAR_URL, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } }).then(async r => {
        if (!r.ok) throw new Error(`DOLAR HTTP ${r.status}`);
        return r.json();
      }),
    ]);

    const fimaText = fimaRes.status === 'fulfilled' ? fimaRes.value.replace(/<[^>]+>/g, ' ') : '';
    const fima30 = extract(fimaText, /30 días\s*\+?([0-9]+(?:[.,][0-9]+))%/i);
    const fima12 = extract(fimaText, /12 meses\s*\+?([0-9]+(?:[.,][0-9]+))%/i);
    const dollar = dollarRes.status === 'fulfilled' ? dollarRes.value : null;

    const dataQuality = [fima30 != null, fima12 != null, dollar?.venta != null].filter(Boolean).length;
    const dataScore = Math.round(dataQuality / 3 * 100);

    const marketScore = dollar?.venta != null ? 80 : 40;
    const liquidityScore = fima30 != null ? 90 : 35;
    const riskScore = dataScore >= 67 ? 82 : 55;
    const overall = Math.round((marketScore + liquidityScore + riskScore + dataScore) / 4);

    const label = overall >= 80 ? 'SALUDABLE' : overall >= 60 ? 'ATENCIÓN' : 'DEGRADADO';

    return NextResponse.json({
      ok: true,
      checkedAt,
      score: overall,
      label,
      dimensions: {
        liquidity: liquidityScore,
        market: marketScore,
        risk: riskScore,
        dataQuality: dataScore,
      },
      signals: {
        fima30,
        fima12m: fima12,
        officialDollar: typeof dollar?.venta === 'number' ? dollar.venta : null,
      },
      methodology: 'Score operativo orientativo; no constituye recomendación de inversión. Datos faltantes reducen la calidad del score.',
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({ ok: false, checkedAt, score: 0, label: 'DEGRADADO', error: error instanceof Error ? error.message : 'Score unavailable' }, { status: 502 });
  }
}
