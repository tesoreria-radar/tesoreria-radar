import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';
const BNA = 'https://www.bna.com.ar/Empresas';

function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function spread(a: number | null, b: number | null) {
  return a != null && b != null && b !== 0 ? ((a / b) - 1) * 100 : null;
}

async function json(path: string) {
  const r = await fetch(`${API}/${path}`, { cache: 'no-store', headers: { 'User-Agent': 'Tesoreria-Radar/1.0' } });
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
  return r.json();
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [official, mep] = await Promise.allSettled([json('oficial'), json('bolsa')]);
  const o = official.status === 'fulfilled' ? official.value : null;
  const m = mep.status === 'fulfilled' ? mep.value : null;
  const oficialVenta = n(o?.venta);
  const mepVenta = n(m?.venta);
  return NextResponse.json({
    ok: oficialVenta != null || mepVenta != null,
    checkedAt,
    official: { buy: n(o?.compra), sell: oficialVenta, updatedAt: o?.fechaActualizacion ?? null },
    mep: { buy: n(m?.compra), sell: mepVenta, updatedAt: m?.fechaActualizacion ?? null },
    spreads: {
      mepVsOfficial: spread(mepVenta, oficialVenta),
    },
    signals: [
      mepVenta != null && oficialVenta != null && mepVenta > oficialVenta * 1.05 ? 'MEP_MUY_POR_ENCIMA_DEL_OFICIAL' : null,
      mepVenta != null && oficialVenta != null && mepVenta < oficialVenta ? 'MEP_DEBAJO_DEL_OFICIAL' : null,
    ].filter(Boolean),
    sources: { official: `${API}/oficial`, mep: `${API}/bolsa`, bna: BNA },
    methodology: 'Brechas calculadas exclusivamente entre datos observados. BNA queda fuera hasta disponer de una extracción inequívoca de billete/divisa.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
