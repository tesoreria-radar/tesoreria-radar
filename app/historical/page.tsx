'use client';

import { useEffect, useState } from 'react';

type Point = { date: string; sell: number | null; buy: number | null };
type Data = { mep?: Point[]; bna?: Point[]; checkedAt?: string; sources?: { mep: string; bna: string }; methodology?: string };

function fmt(n: number | null) {
  return n == null ? '—' : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

function lastYear(points: Point[]) {
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
  return points.filter(p => new Date(p.date) >= cutoff).slice(-12);
}

function MiniChart({ points, label }: { points: Point[]; label: string }) {
  const values = points.map(p => p.sell).filter((v): v is number => typeof v === 'number');
  if (!values.length) return <div style={{ color: '#71869f' }}>Sin datos suficientes.</div>;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const width = 700, height = 180;
  const path = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * width},${height - ((v - min) / range) * (height - 20) - 10}`).join(' ');
  return <div><div style={{ color: '#8196b0', fontSize: 11, marginBottom: 8 }}>{label} · último año disponible</div><svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 180, background: 'rgba(5,12,22,.5)', borderRadius: 12, border: '1px solid rgba(124,162,204,.12)' }}><polyline fill="none" stroke="#77b7ff" strokeWidth="3" points={path} /><text x="12" y="20" fill="#8196b0" fontSize="11">máx {fmt(max)}</text><text x="12" y="170" fill="#8196b0" fontSize="11">mín {fmt(min)}</text></svg></div>;
}

export default function HistoricalPage() {
  const [data, setData] = useState<Data>({});
  const [error, setError] = useState('');
  async function refresh() { try { const r = await fetch('/api/treasury/historical', { cache: 'no-store' }); setData(await r.json()); setError(''); } catch { setError('No se pudo actualizar el histórico'); } }
  useEffect(() => { refresh(); const id = window.setInterval(refresh, 300000); return () => window.clearInterval(id); }, []);
  const mep = lastYear(data.mep || []), bna = lastYear(data.bna || []);
  return <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 75% -10%, #17345b 0, #0b1220 34%, #060b14 72%)', color: '#e8eef8', fontFamily: 'Inter,system-ui', padding: 36 }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ color: '#77b7ff', letterSpacing: 2, fontSize: 11 }}>NLK · TESORERÍA / HISTORICALS</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><h1 style={{ fontSize: 34, margin: '8px 0 4px' }}>Históricos de mercado</h1><p style={{ color: '#8196b0', marginTop: 0 }}>MEP y dólar Banco Nación, preservando fuente y procedencia.</p></div><a href="/" style={{ color: '#77b7ff', textDecoration: 'none', paddingTop: 12 }}>← Radar principal</a></div>
      {error && <div style={{ marginTop: 20, color: '#ff8a8a' }}>{error}</div>}
      <section style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <article style={{ background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 22 }}><div style={{ color: '#5ee7a0', fontSize: 11, letterSpacing: 1 }}>MEP / DÓLAR BOLSA</div><h2 style={{ margin: '7px 0 18px' }}>{fmt(mep.at(-1)?.sell ?? null)}</h2><MiniChart points={mep} label="Serie MEP"/><div style={{ marginTop: 12, fontSize: 11, color: '#71869f' }}>{mep.length} observaciones · fuente ArgentinaDatos / DolarApi</div></article>
        <article style={{ background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 22 }}><div style={{ color: '#ffd166', fontSize: 11, letterSpacing: 1 }}>BANCO NACIÓN / BILLETE</div><h2 style={{ margin: '7px 0 18px' }}>{fmt(bna.at(-1)?.sell ?? null)}</h2><MiniChart points={bna} label="Serie BNA"/><div style={{ marginTop: 12, fontSize: 11, color: '#71869f' }}>{bna.length} observaciones · fuente Dólar Histórico</div></article>
      </section>
      <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 22 }}><div style={{ fontSize: 11, color: '#8196b0', letterSpacing: 1 }}>ÚLTIMAS OBSERVACIONES</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 14 }}><div>{mep.slice(-6).reverse().map(p => <div key={p.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(124,162,204,.08)' }}><span>{new Date(p.date).toLocaleDateString('es-AR')}</span><b>{fmt(p.sell)}</b></div>)}</div><div>{bna.slice(-6).reverse().map(p => <div key={p.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(124,162,204,.08)' }}><span>{p.date}</span><b>{fmt(p.sell)}</b></div>)}</div></div></section>
      <div style={{ marginTop: 18, fontSize: 11, color: '#71869f' }}>{data.methodology || 'Actualizando…'} · actualización automática cada 5 minutos.</div>
    </div>
  </main>;
}
