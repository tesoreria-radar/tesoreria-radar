import { NextResponse } from 'next/server';

type FxQuote = {
  nombre?: string;
  compra?: number;
  venta?: number;
  fechaActualizacion?: string;
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const [oficial, mep, inflacion] = await Promise.all([
    getJson<FxQuote>('https://dolarapi.com/v1/dolares/oficial'),
    getJson<FxQuote>('https://dolarapi.com/v1/dolares/bolsa'),
    getJson<Array<{ fecha: string; valor: number }>>('https://api.argentinadatos.com/v1/finanzas/indices/inflacion'),
  ]);

  const oficialVenta = typeof oficial?.venta === 'number' ? oficial.venta : null;
  const mepVenta = typeof mep?.venta === 'number' ? mep.venta : null;
  const brecha = oficialVenta && mepVenta ? ((mepVenta / oficialVenta) - 1) * 100 : null;
  const latestInflation = inflacion?.length ? inflacion[inflacion.length - 1] : null;

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    sources: {
      oficial: oficial ? 'DolarAPI' : null,
      mep: mep ? 'DolarAPI' : null,
      inflation: latestInflation ? 'ArgentinaDatos' : null,
    },
    market: {
      oficial: { compra: oficial?.compra ?? null, venta: oficialVenta, updatedAt: oficial?.fechaActualizacion ?? null },
      mep: { compra: mep?.compra ?? null, venta: mepVenta, updatedAt: mep?.fechaActualizacion ?? null },
      brechaMepOficial: brecha,
    },
    inflation: latestInflation ? { month: latestInflation.fecha, value: latestInflation.valor } : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
