import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BNA_URL = 'https://www.bna.com.ar/Empresas';

type Quote = { buy: number; sell: number };

function number(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, '').trim();
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function cleanHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractQuote(text: string, label: RegExp) {
  const section = text.match(label)?.[1] ?? '';
  const match = section.match(/Compra\s*[:$-]?\s*([0-9.,]+)[\s\S]{0,120}?Venta\s*[:$-]?\s*([0-9.,]+)/i);
  if (!match) return null;
  const buy = number(match[1]);
  const sell = number(match[2]);
  return buy != null && sell != null ? { buy, sell } : null;
}

function extract(html: string) {
  const text = cleanHtml(html);

  // Keep the quote classes separate. Never use the official quote as a proxy for BNA divisa.
  const billete = extractQuote(
    text,
    /D[oó]lar\s+U\.?S\.?A\.?\s+Billete([\s\S]{0,1200}?)(?=D[oó]lar\s+U\.?S\.?A\.?\s+Divisa|$)/i,
  );
  const divisa = extractQuote(
    text,
    /D[oó]lar\s+U\.?S\.?A\.?\s+Divisa([\s\S]{0,1200}?)(?=D[oó]lar\s+U\.?S\.?A\.?\s+Billete|$)/i,
  );

  return { billete, divisa };
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
    const { billete, divisa } = extract(html);

    return NextResponse.json(
      {
        ok: billete != null || divisa != null,
        checkedAt,
        source: BNA_URL,
        billete,
        divisa,
        sourceStatus: {
          billete: billete ? 'OK' : 'ERROR',
          divisa: divisa ? 'OK' : 'ERROR',
        },
        methodology:
          'Cotización BNA directa. Billete y divisa se extraen por separado; no se sustituye una serie faltante por otra fuente o por otra cotización.',
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        checkedAt,
        source: BNA_URL,
        billete: null,
        divisa: null,
        sourceStatus: { billete: 'ERROR', divisa: 'ERROR' },
        error: error instanceof Error ? error.message : 'BNA unavailable',
      },
      { status: 502 },
    );
  }
}
