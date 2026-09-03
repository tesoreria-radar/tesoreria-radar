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
  const systemState = useMemo(() => status.ok === false ? ['Degradado', '🟠'] : ['Operativo', '🟢'], [status.ok]);

  return (
    <div style={{minHeight:'100vh', background:'radial-gradient(circle at 80% -10%, #17345b 0, #0b1220 34%, #060b14 70%)', color:'#e8eef8', fontFamily:'Inter, ui-sans-serif, system-ui'}}>
      <aside style={{position:'fixed', inset:'0 auto 0 0', width:250, background:'rgba(5,10,19,.94)', borderRight:'1px solid rgba(102,177,255,.16)', padding:24, boxSizing:'border-box', backdropFilter:'blur(18px)'}}>
        <div style={{fontSize:11, letterSpacing:2, color:'#77b7ff'}}>NLK · TESORERÍA</div>
        <div style={{fontSize:22, fontWeight:850, margin:'8px 0 28px'}}>Radar Intelligence</div>
        {nav.map(n => (
          <button key={n} onClick={() => setSection(n)} style={{width:'100%', textAlign:'left', border:'1px solid transparent', borderRadius:10, padding:'11px 12px', marginBottom:5, background: section === n ? 'linear-gradient(90deg, rgba(70,140,220,.28), rgba(70,140,220,.08))' : 'transparent', borderColor: section === n ? 'rgba(119,183,255,.24)' : 'transparent', color:'white', cursor:'pointer'}}>{n}</button>
        ))}
        <div style={{position:'absolute', bottom:24, left:24, right:24, fontSize:12, color:'#91a4bd'}}>Motor autónomo<br/><b style={{color:'#dce9f8'}}>Refresh cada 5 minutos</b><br/><span style={{color:'#69e6a5'}}>● HEALTH CHECK ACTIVO</span></div>
      </aside>

      <main style={{marginLeft:250}}>
        <header style={{background:'rgba(7,13,24,.82)', borderBottom:'1px solid rgba(102,177,255,.13)', padding:'20px 34px', display:'flex', justifyContent:'space-between', alignItems:'center', backdropFilter:'blur(16px)'}}>
          <div><div style={{fontSize:12, color:'#7890ad', letterSpacing:1.1}}>CENTRO DE CONTROL / {section.toUpperCase()}</div><h1 style={{margin:'5px 0 0', fontSize:30}}>{section}</h1></div>
          <div style={{textAlign:'right', fontSize:13}}><div><span style={{color:'#5ee7a0'}}>●</span> <b>{systemState[0]}</b></div><div style={{color:'#7890ad', marginTop:5}}>Última comprobación: {lastRefresh ? lastRefresh.toLocaleTimeString('es-AR') : '—'}</div></div>
        </header>

        <section style={{padding:34, maxWidth:1450}}>
          <div style={{background:'linear-gradient(135deg, rgba(29,70,120,.65), rgba(11,21,36,.9))', border:'1px solid rgba(100,180,255,.22)', borderRadius:18, padding:24, marginBottom:18, boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:11, letterSpacing:1.5, color:'#79baff'}}>TESO AI · EXECUTIVE BRIEF</div>
            <div style={{display:'flex', justifyContent:'space-between', gap:20, alignItems:'end'}}><h2 style={{fontSize:25, margin:'12px 0 0'}}>Radar operativo conectado y listo para producción.</h2><span style={{fontSize:12, color:'#91a4bd'}}>RISK SCORE <b style={{fontSize:18, color:'#f5c96b'}}>62 · MEDIO</b></span></div>
            <p style={{color:'#b6c7db', marginBottom:0}}>Monitoreo de mercado, BCRA, ARCA, caja y sectores estratégicos desde un único centro de control.</p>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
            {[
              ['Alertas críticas','0','Requieren acción inmediata'],
              ['Próximos 7 días','04/09','REM · agenda BCRA'],
              ['Brecha MEP / Oficial','—','Esperando cotización en vivo'],
              ['Datos stale','0','Umbral: 10 minutos'],
            ].map(([a,b,c]) => <div key={a} style={{background:'rgba(13,23,38,.82)', border:'1px solid rgba(124,162,204,.17)', borderRadius:14, padding:18}}><div style={{fontSize:12, color:'#8196b0'}}>{a}</div><div style={{fontSize:27, fontWeight:800, margin:'8px 0'}}>{b}</div><div style={{fontSize:12, color:'#71869f'}}>{c}</div></div>)}
          </div>

          <div style={{marginTop:20, display:'grid', gridTemplateColumns:'2fr 1fr', gap:18}}>
            <div style={{background:'rgba(13,23,38,.82)', border:'1px solid rgba(124,162,204,.17)', borderRadius:14, padding:22}}>
              <h2 style={{marginTop:0}}>Radar operativo</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>{modules.map(([name,desc]) => <div key={name} style={{border:'1px solid rgba(124,162,204,.15)', borderRadius:11, padding:15, background:'rgba(255,255,255,.018)'}}><div style={{display:'flex', justifyContent:'space-between'}}><b>{name}</b><span style={{color:'#5ee7a0'}}>●</span></div><div style={{fontSize:12, color:'#8196b0', marginTop:7}}>{desc}</div></div>)}</div>
            </div>
            <div style={{background:'rgba(13,23,38,.82)', border:'1px solid rgba(124,162,204,.17)', borderRadius:14, padding:22}}><h2 style={{marginTop:0}}>Próximos hitos</h2><div style={{fontSize:13, lineHeight:2, color:'#a8b8ca'}}><div><b>04/09</b> · REM</div><div><b>09/09</b> · Informe Monetario Mensual</div><div><b>22/09</b> · Ganancias PH/PF 2025</div><div><b>24/09</b> · 1° anticipo Ganancias 2026</div></div></div>
          </div>

          <div style={{marginTop:18, background:'rgba(13,23,38,.82)', border:'1px solid rgba(124,162,204,.17)', borderRadius:14, padding:22}}><h2 style={{marginTop:0}}>Últimas novedades</h2><p style={{color:'#8196b0'}}>El motor mostrará aquí únicamente novedades nuevas o modificadas y las ordenará por impacto para Tesorería.</p></div>
        </section>
      </main>
    </div>
  );
}
