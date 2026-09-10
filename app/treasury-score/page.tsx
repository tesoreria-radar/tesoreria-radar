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

type Decision = {
  ok?: boolean;
  checkedAt?: string;
  recommendation?: string;
  benchmark?: { instrument?: string; thirtyDay?: number | null; twelveMonth?: number | null; lastClose?: string | null };
  marketContext?: { officialDollarSell?: number | null; officialDollarBuy?: number | null };
  options?: Array<{ instrument: string; horizon: string; returnPct: number | null; liquidity: string; status: string }>;
  methodology?: string[];
};

const money = (v: number | null | undefined) => v == null ? '—' : `$${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
const pct = (v: number | null | undefined) => v == null ? '—' : `${v.toFixed(2)}%`;

export default function TreasuryScorePage() {
  const [data, setData] = useState<Score>({});
  const [decision, setDecision] = useState<Decision>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [scoreResponse, decisionResponse] = await Promise.all([
        fetch('/api/treasury/score', { cache: 'no-store' }),
        fetch('/api/treasury/decision', { cache: 'no-store' }),
      ]);
      setData(await scoreResponse.json());
      setDecision(await decisionResponse.json());
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
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 80% -10%, #17345b 0, #0b1220 34%, #060b14 70%)', color: '#e8eef8', fontFamily: 'Inter,system-ui', padding: 36 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ color: '#77b7ff', letterSpacing: 2, fontSize: 11 }}>NLK · TESORERÍA / INTELLIGENCE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 34, margin: '8px 0 4px' }}>Treasury Command Center</h1>
            <p style={{ color: '#8196b0', marginTop: 0 }}>Health Score + motor de decisión de liquidez para priorizar la acción operativa.</p>
          </div>
          <a href="/" style={{ color: '#77b7ff', textDecoration: 'none', fontSize: 13, paddingTop: 12 }}>← Radar principal</a>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginTop: 28 }}>
          <div style={{ background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8196b0' }}>SCORE OPERATIVO</div>
            <div style={{ fontSize: 76, fontWeight: 850, color: tone, lineHeight: 1.05, margin: '16px 0 4px' }}>{loading ? '—' : score}</div>
            <div style={{ color: tone, fontWeight: 800 }}>{data.label || 'CALCULANDO'}</div>
            <div style={{ fontSize: 11, color: '#71869f', marginTop: 16 }}>{data.checkedAt ? `Actualizado ${new Date(data.checkedAt).toLocaleTimeString('es-AR')}` : 'Esperando datos'}</div>
          </div>

          <div style={{ background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Dimensiones de control</h2>
            {Object.entries(data.dimensions || {}).map(([name, value]) => (
              <div key={name} style={{ margin: '17px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}><span style={{ color: '#8196b0' }}>{name === 'dataQuality' ? 'Calidad de datos' : name === 'liquidity' ? 'Liquidez' : name === 'market' ? 'Mercado' : 'Riesgo operativo'}</span><b>{value}</b></div>
                <div style={{ height: 7, background: '#111c2b', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: tone, borderRadius: 10 }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>¿Qué debería hacer Tesorería hoy?</h2>
          <div style={{ borderLeft: `3px solid ${tone}`, padding: '14px 18px', background: 'rgba(255,255,255,.018)', borderRadius: 8, lineHeight: 1.55 }}>
            {decision.recommendation || 'Calculando recomendación con datos verificables…'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16 }}>
            <div><span style={{ color: '#8196b0', fontSize: 12 }}>Benchmark</span><strong style={{ display: 'block', marginTop: 6 }}>{decision.benchmark?.instrument || '—'}</strong></div>
            <div><span style={{ color: '#8196b0', fontSize: 12 }}>FIMA 30 días</span><strong style={{ display: 'block', marginTop: 6 }}>{pct(decision.benchmark?.thirtyDay)}</strong></div>
            <div><span style={{ color: '#8196b0', fontSize: 12 }}>Dólar oficial venta</span><strong style={{ display: 'block', marginTop: 6 }}>{money(decision.marketContext?.officialDollarSell)}</strong></div>
          </div>
        </section>

        <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Alternativas de liquidez</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: '#8196b0', textAlign: 'left' }}><th style={{ padding: '10px 8px' }}>Instrumento</th><th>Horizonte</th><th>Rendimiento</th><th>Liquidez</th><th>Estado</th></tr></thead>
              <tbody>{(decision.options || []).map((option) => <tr key={option.instrument} style={{ borderTop: '1px solid rgba(124,162,204,.10)' }}><td style={{ padding: '12px 8px', fontWeight: 700 }}>{option.instrument}</td><td>{option.horizon}</td><td>{pct(option.returnPct)}</td><td>{option.liquidity}</td><td style={{ color: option.status === 'DISPONIBLE' ? '#5ee7a0' : '#ffd166' }}>{option.status}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section style={{ marginTop: 18, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Señales verificadas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><span style={{ color: '#8196b0' }}>FIMA 30 días</span><strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{pct(data.signals?.fima30)}</strong></div>
            <div><span style={{ color: '#8196b0' }}>FIMA 12 meses</span><strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{pct(data.signals?.fima12m)}</strong></div>
            <div><span style={{ color: '#8196b0' }}>Dólar oficial</span><strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{money(data.signals?.officialDollar)}</strong></div>
          </div>
        </section>

        <div style={{ marginTop: 18, fontSize: 11, color: '#71869f' }}>{data.methodology || 'Score operativo indicativo. Datos faltantes reducen la calidad del indicador. No constituye asesoramiento de inversión.'}</div>
      </div>
    </main>
  );
}
