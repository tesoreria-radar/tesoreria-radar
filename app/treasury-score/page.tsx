'use client';

import { useEffect, useState } from 'react';

type Score = {
  ok?: boolean;
  score?: number;
  label?: string;
  checkedAt?: string;
  dimensions?: { liquidity: number; market: number; risk: number; dataQuality: number };
  signals?: { fima30: number | null; fima12m: number | null; officialDollar: number | null };
  methodology?: string;
};

export default function TreasuryScorePage() {
  const [data, setData] = useState<Score>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await fetch('/api/treasury/score', { cache: 'no-store' });
      setData(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 300000);
    return () => window.clearInterval(id);
  }, []);

  const score = data.score ?? 0;
  const tone = score >= 80 ? '#5ee7a0' : score >= 60 ? '#ffd166' : '#ff6b6b';

  return (
    <main style={{ minHeight: '100vh', background: '#060b14', color: '#e8eef8', fontFamily: 'Inter,system-ui', padding: 36 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ color: '#77b7ff', letterSpacing: 2, fontSize: 11 }}>NLK · TESORERÍA / INTELLIGENCE</div>
        <h1 style={{ fontSize: 34, margin: '8px 0 4px' }}>Treasury Health Score</h1>
        <p style={{ color: '#8196b0', marginTop: 0 }}>Estado operativo consolidado de liquidez, mercado, riesgo y calidad de datos.</p>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginTop: 28 }}>
          <div style={{ background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8196b0' }}>SCORE OPERATIVO</div>
            <div style={{ fontSize: 76, fontWeight: 850, color: tone, lineHeight: 1.05, margin: '16px 0 4px' }}>{loading ? '—' : score}</div>
            <div style={{ color: tone, fontWeight: 800 }}>{data.label || 'CALCULANDO'}</div>
            <div style={{ fontSize: 11, color: '#71869f', marginTop: 16 }}>{data.checkedAt ? `Actualizado ${new Date(data.checkedAt).toLocaleTimeString('es-AR')}` : 'Esperando datos'}</div>
          </div>

          <div style={{ background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Dimensiones</h2>
            {Object.entries(data.dimensions || {}).map(([name, value]) => (
              <div key={name} style={{ margin: '17px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}><span style={{ color: '#8196b0' }}>{name === 'dataQuality' ? 'Calidad de datos' : name === 'liquidity' ? 'Liquidez' : name === 'market' ? 'Mercado' : 'Riesgo operativo'}</span><b>{value}</b></div>
                <div style={{ height: 7, background: '#111c2b', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: tone, borderRadius: 10 }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Señales verificadas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><span style={{ color: '#8196b0' }}>FIMA 30 días</span><strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{data.signals?.fima30 == null ? '—' : `${data.signals.fima30.toFixed(2)}%`}</strong></div>
            <div><span style={{ color: '#8196b0' }}>FIMA 12 meses</span><strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{data.signals?.fima12m == null ? '—' : `${data.signals.fima12m.toFixed(2)}%`}</strong></div>
            <div><span style={{ color: '#8196b0' }}>Dólar oficial</span><strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{data.signals?.officialDollar == null ? '—' : `$${data.signals.officialDollar.toLocaleString('es-AR')}`}</strong></div>
          </div>
        </section>

        <div style={{ marginTop: 18, fontSize: 11, color: '#71869f' }}>{data.methodology || 'Score orientativo. Datos faltantes reducen la calidad del indicador.'}</div>
      </div>
    </main>
  );
}
