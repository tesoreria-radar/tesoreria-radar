'use client';

import { useEffect, useState } from 'react';

type Quote = { buy: number | null; sell: number | null } | null;
type Data = { ok?: boolean; checkedAt?: string; source?: string; billete?: Quote; divisa?: Quote; error?: string; methodology?: string };

const money = (n: number | null | undefined) => n == null ? '—' : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

export default function BnaPage() {
  const [data, setData] = useState<Data>({});
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const r = await fetch('/api/treasury/bna', { cache: 'no-store' });
      if (!r.ok) throw new Error();
      setData(await r.json());
      setError('');
    } catch {
      setError('No se pudo actualizar BNA');
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 300000);
    return () => window.clearInterval(id);
  }, []);

  const card = (title: string, q: Quote, accent: string, note: string) => (
    <article style={{ background: 'linear-gradient(180deg,rgba(16,29,48,.95),rgba(8,15,26,.95))', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ color: accent, fontSize: 11, letterSpacing: 1.5 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
        <div><div style={{ color: '#71869f', fontSize: 10 }}>COMPRA</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{money(q?.buy)}</div></div>
        <div><div style={{ color: '#71869f', fontSize: 10 }}>VENTA</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{money(q?.sell)}</div></div>
      </div>
      <div style={{ color: '#71869f', fontSize: 11, marginTop: 18 }}>{note}</div>
    </article>
  );

  return <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 75% -10%, #17345b 0, #0b1220 34%, #060b14 72%)', color: '#e8eef8', fontFamily: 'Inter,system-ui', padding: 30 }}>
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      <div style={{ color: '#77b7ff', letterSpacing: 2, fontSize: 10 }}>NLK · TESORERÍA / BANCO NACIÓN</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div><h1 style={{ fontSize: 36, margin: '7px 0 3px' }}>BNA Command View</h1><p style={{ color: '#8196b0', margin: 0 }}>Billete y divisa separados, con fuente directa del Banco Nación.</p></div>
        <a href="/" style={{ color: '#77b7ff', textDecoration: 'none', paddingTop: 10 }}>← Radar principal</a>
      </div>
      <div style={{ marginTop: 18, color: data.ok ? '#5ee7a0' : '#ff8a8a', fontSize: 11, fontWeight: 800 }}>DATA HEALTH · {data.ok ? 'OK' : 'PARCIAL'}</div>
      {error && <div style={{ marginTop: 18, color: '#ff8a8a' }}>{error}</div>}
      <section style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {card('DÓLAR BNA · BILLETE', data.billete ?? null, '#ffd166', 'Referencia para operaciones en efectivo / billete.')}
        {card('DÓLAR BNA · DIVISA', data.divisa ?? null, '#5ee7a0', 'Referencia mayorista/divisa BNA. No se proxifica con dólar oficial.')}
      </section>
      <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 22 }}>
        <div style={{ color: '#8196b0', fontSize: 10, letterSpacing: 1 }}>CONTROL DE FUENTE</div>
        <div style={{ marginTop: 12, fontSize: 12 }}>Última consulta: {data.checkedAt ? new Date(data.checkedAt).toLocaleString('es-AR') : '—'}</div>
        <div style={{ marginTop: 8, color: '#71869f', fontSize: 11 }}>{data.methodology || 'Actualizando…'}</div>
        <div style={{ marginTop: 8, color: '#71869f', fontSize: 10 }}>Fuente: Banco de la Nación Argentina · actualización automática cada 5 minutos.</div>
      </section>
    </div>
  </main>;
}
