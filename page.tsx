'use client';

import { useEffect, useMemo, useState } from 'react';

type Status = { ok?: boolean; checkedAt?: string; refreshEverySeconds?: number; staleAfterSeconds?: number; status?: string };

const modules = [
  ['BCRA', 'Comunicaciones, normativa y próximos informes'],
  ['Mercado', 'Oficial · Mayorista · MEP · CCL · brechas'],
  ['ARCA', 'Vencimientos, prórrogas y cambios'],
  ['Caja', 'Cash Calendar 3 · 7 · 15 · 30 días'],
  ['Real Estate', 'Mercado, construcción y señales'],
  ['Vaca Muerta', 'Energía · RIGI · infraestructura'],
];

export default function Dashboard() {
  const [status, setStatus] = useState<Status>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [section, setSection] = useState('Resumen');

  async function refresh() {
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      setStatus(await r.json());
      setLastRefresh(new Date());
    } catch {
      setStatus({ ok: false, status: 'degraded' });
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 300000);
    return () => window.clearInterval(id);
  }, []);

  const nav = ['Resumen', 'Alertas', 'Mercado', 'ARCA', 'Cash Calendar', 'BCRA', 'Real Estate', 'Vaca Muerta'];

  const systemState = useMemo(() => {
    if (status.ok === false) return ['Degradado', '🟠'];
    return ['Operativo', '🟢'];
  }, [status.ok]);

  return (
    <div style={{minHeight:'100vh', background:'#f3f4f6', color:'#111827', fontFamily:'Inter, ui-sans-serif, system-ui'}}>
      <aside style={{position:'fixed', inset:'0 auto 0 0', width:240, background:'#111827', color:'white', padding:24, boxSizing:'border-box'}}>
        <div style={{fontSize:11, letterSpacing:1.5, opacity:.55}}>NLK · TESORERÍA</div>
        <div style={{fontSize:21, fontWeight:800, margin:'8px 0 28px'}}>Radar Intelligence</div>
        {nav.map(n => (
          <button key={n} onClick={() => setSection(n)} style={{
            width:'100%', textAlign:'left', border:0, borderRadius:9, padding:'11px 12px', marginBottom:5,
            background: section === n ? '#374151' : 'transparent', color:'white', cursor:'pointer'
          }}>{n}</button>
        ))}
        <div style={{position:'absolute', bottom:24, left:24, right:24, fontSize:12, opacity:.65}}>
          Actualización automática<br/><b style={{opacity:1}}>cada 5 minutos</b>
        </div>
      </aside>

      <main style={{marginLeft:240}}>
        <header style={{background:'white', borderBottom:'1px solid #e5e7eb', padding:'18px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:12, color:'#6b7280'}}>CENTRO DE CONTROL / {section.toUpperCase()}</div>
            <h1 style={{margin:'4px 0 0', fontSize:26}}>{section}</h1>
          </div>
          <div style={{textAlign:'right', fontSize:12}}>
            <div>{systemState[1]} <b>{systemState[0]}</b></div>
            <div style={{color:'#6b7280', marginTop:4}}>Última comprobación: {lastRefresh ? lastRefresh.toLocaleTimeString('es-AR') : '—'}</div>
          </div>
        </header>

        <section style={{padding:32, maxWidth:1400}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
            {[
              ['Alertas críticas','0','Requieren acción inmediata'],
              ['Próximos 7 días','—','Obligaciones ARCA / caja'],
              ['Brecha MEP / Oficial','—','Dato de mercado'],
              ['Datos stale','0','Umbral: 10 minutos'],
            ].map(([a,b,c]) => (
              <div key={a} style={{background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:18}}>
                <div style={{fontSize:12, color:'#6b7280'}}>{a}</div>
                <div style={{fontSize:25, fontWeight:800, margin:'8px 0'}}>{b}</div>
                <div style={{fontSize:12, color:'#6b7280'}}>{c}</div>
              </div>
            ))}
          </div>

          <div style={{marginTop:22, display:'grid', gridTemplateColumns:'2fr 1fr', gap:18}}>
            <div style={{background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:22}}>
              <h2 style={{marginTop:0}}>Radar operativo</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
                {modules.map(([name,desc]) => (
                  <div key={name} style={{border:'1px solid #e5e7eb', borderRadius:10, padding:15}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <b>{name}</b><span>🟢</span>
                    </div>
                    <div style={{fontSize:12, color:'#6b7280', marginTop:7}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:22}}>
              <h2 style={{marginTop:0}}>Próximos hitos</h2>
              <div style={{fontSize:13, lineHeight:1.9, color:'#4b5563'}}>
                <div><b>21/08</b> · Informe sobre Bancos</div>
                <div><b>28/08</b> · Mercado de Cambios</div>
                <div><b>28/08</b> · Pagos Minoristas</div>
                <div><b>04/09</b> · REM</div>
              </div>
            </div>
          </div>

          <div style={{marginTop:18, background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:22}}>
            <h2 style={{marginTop:0}}>Últimas novedades</h2>
            <p style={{color:'#6b7280'}}>El motor mostrará aquí únicamente novedades nuevas o modificadas y las ordenará por impacto para Tesorería.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
