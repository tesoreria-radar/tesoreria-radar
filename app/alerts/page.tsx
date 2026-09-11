'use client';

import { useEffect, useState } from 'react';

const levels = ['CRITICA', 'ALTA', 'MEDIA', 'INFO'] as const;
type Alert = { id: string; level: typeof levels[number]; title: string; why: string; action: string; source: string; daysUntil?: number };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState({ total: 0, critical: 0, high: 0, medium: 0 });
  const [status, setStatus] = useState('CARGANDO');
  const [checkedAt, setCheckedAt] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/treasury/alerts', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error('alerts unavailable');
      setAlerts(json.alerts ?? []);
      setSummary(json.summary ?? { total: 0, critical: 0, high: 0, medium: 0 });
      setCheckedAt(json.checkedAt ?? '');
      setStatus('ONLINE');
    } catch {
      setStatus('DEGRADADO');
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 300000);
    return () => clearInterval(timer);
  }, []);

  const badge = (level: Alert['level']) => {
    const label = level === 'CRITICA' ? 'P1' : level === 'ALTA' ? 'P2' : level === 'MEDIA' ? 'P3' : 'INFO';
    return <span style={{ border: '1px solid #334155', borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{label} · {level}</span>;
  };

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%, #10264a 0%, #050914 42%, #02040a 100%)', color: '#e5edf8', fontFamily: 'Inter, Arial, sans-serif', padding: 28 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', marginBottom: 24 }}>
          <div><div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>NLK · TESORERÍA / ALERT ENGINE</div><h1 style={{ fontSize: 36, margin: '7px 0', letterSpacing: -1 }}>Actionable Alerts</h1><div style={{ color: '#94a3b8' }}>Señales operativas para anticipar riesgo, liquidez y vencimientos.</div></div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 12 }}>● {status}<br />Actualizado: {checkedAt ? new Date(checkedAt).toLocaleTimeString('es-AR') : '—'}</div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[['TOTAL', summary.total], ['CRÍTICAS', summary.critical], ['ALTAS', summary.high], ['MEDIAS', summary.medium]].map(([label, value]) => <div key={String(label)} style={{ background: 'rgba(15,23,42,.72)', border: '1px solid #1e3a5f', borderRadius: 14, padding: 18 }}><div style={{ color: '#64748b', fontSize: 11, letterSpacing: 2 }}>{label}</div><div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{value}</div></div>)}
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          {alerts.length === 0 ? <div style={{ padding: 40, border: '1px solid #1e3a5f', borderRadius: 14, background: 'rgba(15,23,42,.72)', color: '#94a3b8' }}>Sin alertas activas con los datos disponibles.</div> : alerts.map(alert => (
            <article key={alert.id} style={{ border: `1px solid ${alert.level === 'CRITICA' ? '#7f1d1d' : '#1e3a5f'}`, background: 'rgba(8,15,29,.88)', borderRadius: 14, padding: 20, boxShadow: '0 10px 35px rgba(0,0,0,.18)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}><div style={{ fontSize: 17, fontWeight: 850 }}>{alert.title}</div>{badge(alert.level)}</div>
              <div style={{ color: '#cbd5e1', marginTop: 12 }}>{alert.why}</div>
              <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'rgba(30,58,95,.28)', color: '#dbeafe' }}><strong>Acción sugerida:</strong> {alert.action}</div>
              <div style={{ marginTop: 12, color: '#64748b', fontSize: 11, letterSpacing: .5 }}>FUENTE · {alert.source}{alert.daysUntil !== undefined ? ` · T-${alert.daysUntil}` : ''}</div>
            </article>
          ))}
        </section>

        <footer style={{ marginTop: 24, color: '#64748b', fontSize: 11 }}>Motor operativo · refresh cada 5 minutos · sin datos inventados · las alertas no constituyen recomendación de inversión.</footer>
      </div>
    </main>
  );
}
