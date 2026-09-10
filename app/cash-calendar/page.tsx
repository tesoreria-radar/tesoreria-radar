'use client';

import { useEffect, useState } from 'react';

type EventItem = { date: string; type: string; title: string; priority: string; source: string; daysUntil: number };
type Calendar = { ok?: boolean; checkedAt?: string; upcoming?: EventItem[]; methodology?: string };

const priorityColor = (priority: string) => priority === 'CRÍTICA' ? '#ff6b6b' : priority === 'ALTA' ? '#ffd166' : '#77b7ff';

export default function CashCalendarPage() {
  const [data, setData] = useState<Calendar>({});

  async function refresh() {
    const response = await fetch('/api/treasury/calendar', { cache: 'no-store' });
    setData(await response.json());
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 300000);
    return () => window.clearInterval(id);
  }, []);

  return <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 80% -10%, #17345b 0, #0b1220 34%, #060b14 70%)', color: '#e8eef8', fontFamily: 'Inter,system-ui', padding: 36 }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ color: '#77b7ff', letterSpacing: 2, fontSize: 11 }}>NLK · TESORERÍA / CASH CALENDAR</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 style={{ fontSize: 34, margin: '8px 0 4px' }}>Cash Calendar</h1><p style={{ color: '#8196b0', marginTop: 0 }}>Obligaciones fiscales e hitos BCRA que pueden impactar la caja.</p></div>
        <a href="/" style={{ color: '#77b7ff', textDecoration: 'none', paddingTop: 12 }}>← Radar principal</a>
      </div>
      <section style={{ marginTop: 28, background: 'rgba(13,23,38,.86)', border: '1px solid rgba(124,162,204,.18)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {(data.upcoming || []).map(event => <div key={`${event.date}-${event.title}`} style={{ display: 'grid', gridTemplateColumns: '110px 90px 1fr 100px', gap: 14, alignItems: 'center', padding: '15px 12px', borderBottom: '1px solid rgba(124,162,204,.10)' }}>
            <b>{new Date(`${event.date}T12:00:00-03:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</b>
            <span style={{ color: event.type === 'ARCA' ? '#5ee7a0' : '#77b7ff', fontSize: 12 }}>{event.type}</span>
            <div><div style={{ fontWeight: 700 }}>{event.title}</div><div style={{ color: '#8196b0', fontSize: 12, marginTop: 4 }}>{event.daysUntil === 0 ? 'HOY' : `en ${event.daysUntil} días`} · <a href={event.source} target="_blank" rel="noreferrer" style={{ color: '#71869f' }}>fuente</a></div></div>
            <span style={{ color: priorityColor(event.priority), fontWeight: 800, fontSize: 11, textAlign: 'right' }}>{event.priority}</span>
          </div>)}
        </div>
      </section>
      <div style={{ marginTop: 18, fontSize: 11, color: '#71869f' }}>{data.methodology || 'Cargando agenda…'}</div>
    </div>
  </main>;
}
