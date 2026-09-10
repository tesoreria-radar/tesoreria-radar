'use client';

import { useEffect, useMemo, useState } from 'react';

type Point = { date: string; sell: number | null; buy: number | null };
type Data = { mep?: Point[]; bna?: Point[]; checkedAt?: string; sources?: { mep: string; bna: string }; sourceStatus?: { mep: string; bna: string }; methodology?: string };

function fmt(n: number | null) { return n == null ? '—' : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`; }
function lastYear(points: Point[]) {
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
  return points.filter(p => new Date(p.date) >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
}
function change(points: Point[]) {
  const v = points.map(p => p.sell).filter((x): x is number => typeof x === 'number');
  if (v.length < 2) return null;
  return ((v[v.length - 1] / v[0]) - 1) * 100;
}
function MiniChart({ points, label }: { points: Point[]; label: string }) {
  const values = points.map(p => p.sell).filter((v): v is number => typeof v === 'number');
  if (!values.length) return <div style={{ color: '#71869f', padding: 20 }}>Sin datos suficientes.</div>;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const width = 760, height = 220;
  const path = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * width},${height - ((v - min) / range) * (height - 30) - 15}`).join(' ');
  return <div><div style={{ color: '#8196b0', fontSize: 11, marginBottom: 8 }}>{label} · último año disponible</div><svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 220, background: 'rgba(5,12,22,.55)', borderRadius: 12, border: '1px solid rgba(124,162,204,.12)' }}><line x1="0" y1="55" x2={width} y2="55" stroke="rgba(124,162,204,.10)"/><line x1="0" y1="110" x2={width} y2="110" stroke="rgba(124,162,204,.10)"/><line x1="0" y1="165" x2={width} y2="165" stroke="rgba(124,162,204,.10)"/><polyline fill="none" stroke="#77b7ff" strokeWidth="3" points={path}/><text x="12" y="20" fill="#8196b0" fontSize="11">máx {fmt(max)}</text><text x="12" y="210" fill="#8196b0" fontSize="11">mín {fmt(min)}</text></svg></div>;
}
function Card({ title, points, source, accent }: { title: string; points: Point[]; source: string; accent: string }) {
  const latest = points.at(-1)?.sell ?? null, delta = change(points);
  return <article style={{ background: 'linear-gradient(180deg,rgba(16,29,48,.92),rgba(9,17,29,.92))', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 22, boxShadow: '0 14px 40px rgba(0,0,0,.20)' }}><div style={{ color: accent, fontSize: 11, letterSpacing: 1 }}>{title}</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><h2 style={{ fontSize: 32, margin: '8px 0 2px' }}>{fmt(latest)}</h2>{delta != null && <span style={{ color: delta >= 0 ? '#ff9b9b' : '#5ee7a0', fontSize: 12, fontWeight: 800 }}>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}% 12m</span>}</div><MiniChart points={points} label={title}/><div style={{ marginTop: 12, fontSize: 11, color: '#71869f' }}>{points.length} observaciones · {source}</div></article>;
}

export default function HistoricalPage() {
  const [data, setData] = useState<Data>({});
  const [error, setError] = useState('');
  const [range, setRange] = useState<'1Y' | '3M' | '1M'>('1Y');
  async function refresh() { try { const r = await fetch('/api/treasury/historical', { cache: 'no-store' }); if (!r.ok) throw new Error(); setData(await r.json()); setError(''); } catch { setError('No se pudo actualizar el histórico'); } }
  useEffect(() => { refresh(); const id = window.setInterval(refresh, 300000); return () => window.clearInterval(id); }, []);
  const rawMep = lastYear(data.mep || []), rawBna = lastYear(data.bna || []);
  const filterRange = (points: Point[]) => { if (range === '1Y') return points; const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - (range === '3M' ? 3 : 1)); return points.filter(p => new Date(p.date) >= cutoff); };
  const mep = useMemo(() => filterRange(rawMep), [rawMep, range]);
  const bna = useMemo(() => filterRange(rawBna), [rawBna, range]);
  const health = data.sourceStatus?.mep === 'OK' && data.sourceStatus?.bna === 'OK' ? 'DATA HEALTH · OK' : 'DATA HEALTH · PARCIAL';
  return <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 75% -10%, #17345b 0, #0b1220 34%, #060b14 72%)', color: '#e8eef8', fontFamily: 'Inter,system-ui', padding: 30 }}>
    <div style={{ maxWidth: 1220, margin: '0 auto' }}>
      <div style={{ color: '#77b7ff', letterSpacing: 2, fontSize: 10 }}>NLK · TESORERÍA / MARKET INTELLIGENCE</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}><div><h1 style={{ fontSize: 36, margin: '7px 0 3px' }}>Market Historicals</h1><p style={{ color: '#8196b0', margin: 0 }}>Series de referencia para decisiones de tesorería · fuente preservada.</p></div><div style={{ textAlign: 'right' }}><div style={{ color: '#5ee7a0', fontSize: 11, fontWeight: 800 }}>{health}</div><div style={{ color: '#71869f', fontSize: 10, marginTop: 5 }}>auto-refresh · 5 min</div></div></div>
      <div style={{ marginTop: 22, display: 'flex', gap: 8 }}><span style={{ color: '#71869f', fontSize: 11, paddingTop: 7 }}>VENTANA</span>{(['1Y','3M','1M'] as const).map(x => <button key={x} onClick={() => setRange(x)} style={{ background: range === x ? '#17345b' : 'rgba(13,23,38,.75)', color: range === x ? '#e8eef8' : '#8196b0', border: '1px solid rgba(124,162,204,.18)', borderRadius: 8, padding: '6px 11px', cursor: 'pointer' }}>{x}</button>)}<a href="/" style={{ marginLeft: 'auto', color: '#77b7ff', textDecoration: 'none', paddingTop: 7 }}>← Radar principal</a></div>
      {error && <div style={{ marginTop: 18, color: '#ff8a8a' }}>{error}</div>}
      <section style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}><Card title="MEP / DÓLAR BOLSA" points={mep} source="ArgentinaDatos" accent="#5ee7a0"/><Card title="BANCO NACIÓN / BILLETE" points={bna} source="Dólar Histórico" accent="#ffd166"/></section>
      <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 22 }}><div style={{ fontSize: 11, color: '#8196b0', letterSpacing: 1 }}>ÚLTIMAS OBSERVACIONES</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 14 }}><div>{mep.slice(-8).reverse().map(p => <div key={p.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(124,162,204,.08)' }}><span>{new Date(p.date).toLocaleDateString('es-AR')}</span><b>{fmt(p.sell)}</b></div>)}</div><div>{bna.slice(-8).reverse().map(p => <div key={p.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(124,162,204,.08)' }}><span>{new Date(p.date).toLocaleDateString('es-AR')}</span><b>{fmt(p.sell)}</b></div>)}</div></div></section>
      <div style={{ marginTop: 18, fontSize: 10, color: '#71869f' }}>{data.methodology || 'Actualizando…'} · Los datos históricos son informativos y conservan la procedencia de cada proveedor.</div>
    </div>
  </main>;
}
