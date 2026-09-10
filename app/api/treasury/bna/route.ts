import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BNA_URL = 'https://www.bna.com.ar/Empresas';

function number(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, '').trim();
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function extractPairs(html: string) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');

  const patterns = [
    /D[oó]lar\s+U\.?S\.?A\.?[\s\S]{0,500}?Compra[\s:$]*([0-9.,]+)[\s\S]{0,180}?Venta[\s:$]*([0-9.,]+)/i,
    /D[oó]lar\s+U\.?S\.?A\.?[\s\S]{0,500}?([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]+)?)[\s\S]{0,120}?([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const buy = number(match[1]);
      const sell = number(match[2]);
      if (buy != null && sell != null) return { buy, sell };
    }
  }

  const cells = [...text.matchAll(/(?:Compra|Compra\s*\$)\s*([0-9.,]+)[\s|]*?(?:Venta|Venta\s*\$)\s*([0-9.,]+)/gi)];
  for (const match of cells) {
    const buy = number(match[1]);
    const sell = number(match[2]);
    if (buy != null && sell != null) return { buy, sell };
  }

  return null;
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(BNA_URL, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 Tesoreria-Radar/1.0' },
    });
    if (!res.ok) throw new Error(`BNA HTTP ${res.status}`);
    const html = await res.text();

    const direct = extractPairs(html);

    return NextResponse.json({
      ok: Boolean(direct),
      checkedAt,
      source: BNA_URL,
      billete: direct,
      divisa: null,
      sourceStatus: { billete: direct ? 'OK' : 'ERROR', divisa: 'PENDIENTE_VERIFICACION' },
      methodology: 'Cotización BNA directa. El parser no fabrica divisa: solo informa una serie cuando la fuente directa permite identificarla de forma inequívoca.',
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      checkedAt,
      source: BNA_URL,
      billete: null,
      divisa: null,
      sourceStatus: { billete: 'ERROR', divisa: 'PENDIENTE_VERIFICACION' },
      error: error instanceof Error ? error.message : 'BNA unavailable',
    }, { status: 502 });
  }
}
