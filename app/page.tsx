'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

type Status = { ok?: boolean; checkedAt?: string; refreshEverySeconds?: number; staleAfterSeconds?: number; status?: string };
type DashboardData = {
  checkedAt?: string;
  sources?: { oficial?: string | null; mep?: string | null; inflation?: string | null };
  market?: {
    oficial?: { compra: number | null; venta: number | null; updatedAt?: string | null };
    mep?: { compra: number | null; venta: number | null; updatedAt?: string | null };
    brechaMepOficial?: number | null;
  };
  inflation?: { month: string; value: number } | null;
};

const nav = ['Resumen', 'Alertas', 'Mercado', 'ARCA', 'Cash Calendar', 'BCRA', 'Real Estate', 'Vaca Muerta'];
const money = (v: number | null | undefined) => v == null ? '—' : `$${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
const pct = (v: number | null | undefined) => v == null ? '—' : `${v.toFixed(2)}%`;

const modules = [
  ['BCRA', 'Comunicaciones, normativa y próximos informes'],
  ['Mercado', 'Oficial · Mayorista · MEP · CCL · brechas'],
  ['ARCA', 'Vencimientos, prórrogas y cambios'],
  ['Caja', 'Cash Calendar 3 · 7 · 15 · 30 días'],
  ['Real Estate', 'Mercado, construcción y señales'],
  ['Vaca Muerta', 'Energía · RIGI · infraestructura'],
];

function Card({ title, value, detail }: { title: string; value: string; detail?: string }) {
  return <div style={{background:'rgba(13,23,38,.82)', border:'1px solid rgba(124,162,204,.17)', borderRadius:14, padding:18}}><div style={{fontSize:12, color:'#8196b0'}}>{title}</div><div style={{fontSize:27, fontWeight:800, margin:'8px 0'}}>{value}</div>{detail && <div style={{fontSize:12, color:'#71869f'}}>{detail}</div>}</div>;
}

function SectionContent({ section, data, status }: { section: string; data: DashboardData; status: Status }) {
  const oficial = data.market?.oficial;
  const mep = data.market?.mep;
  const source = (key: keyof NonNullable<DashboardData['sources']>) => data.sources?.[key] || 'Fuente pendiente';

  if (section === 'Mercado') return <>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}><Card title="Dólar oficial" value={money(oficial?.venta)} detail={`Compra ${money(oficial?.compra)} · ${source('oficial')}`} /><Card title="Dólar MEP" value={money(mep?.venta)} detail={`Compra ${money(mep?.compra)} · ${source('mep')}`} /><Card title="Brecha MEP / Oficial" value={pct(data.market?.brechaMepOficial)} detail="Calculada en tiempo real" /><Card title="Inflación último dato" value={data.inflation ? pct(data.inflation.value) : '—'} detail={data.inflation?.month || 'Esperando dato'} /></div>
    <Panel title="Monitor de mercado"><Row label="Oficial — venta" value={money(oficial?.venta)} /><Row label="MEP — venta" value={money(mep?.venta)} /><Row label="Brecha MEP / oficial" value={pct(data.market?.brechaMepOficial)} /><Row label="Última comprobación" value={data.checkedAt ? new Date(data.checkedAt).toLocaleTimeString('es-AR') : '—'} /></Panel>
  </>;

  if (section === 'ARCA') return <><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}><Card title="Próximo vencimiento relevante" value="22/09/2026" detail="Ganancias PH/PF 2025" /><Card title="1° anticipo Ganancias 2026" value="24/09/2026" detail="Calendario operativo" /><Card title="Estado del módulo" value="Monitoreando" detail="Fuente oficial ARCA" /></div><Panel title="Agenda ARCA"><Row label="22/09" value="Ganancias PH/PF 2025" /><Row label="24/09" value="1° anticipo Ganancias 2026" /><Row label="Fuente" value="ARCA · vencimientos" /></Panel></>;

  if (section === 'BCRA') return <><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}><Card title="Estado BCRA" value="Monitoreando" detail="Normativa y comunicaciones" /><Card title="Última actualización Radar" value={data.checkedAt ? new Date(data.checkedAt).toLocaleTimeString('es-AR') : '—'} detail="Refresh automático" /><Card title="Health" value={status.ok === false ? 'Degradado' : 'Operativo'} detail="Conectividad del motor" /></div><Panel title="Agenda y vigilancia BCRA"><Row label="REM" value="04/09/2026 · revisar publicación" /><Row label="Informe Monetario" value="09/09/2026 · revisar publicación" /><Row label="Exterior y Cambios" value="Monitoreo de novedades" /><Row label="Principal fuente" value="BCRA oficial" /></Panel></>;

  if (section === 'Cash Calendar') return <><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}><Card title="3 días" value="Planificar" detail="Caja inmediata" /><Card title="7 días" value="Planificar" detail="Obligaciones próximas" /><Card title="15 días" value="Planificar" detail="Compromisos" /><Card title="30 días" value="Planificar" detail="Visibilidad extendida" /></div><Panel title="Cash Calendar"><Row label="3 días" value="Sin obligaciones cargadas" /><Row label="7 días" value="Sin obligaciones cargadas" /><Row label="15 días" value="Sin obligaciones cargadas" /><Row label="30 días" value="Sin obligaciones cargadas" /></Panel></>;

  if (section === 'Real Estate') return <><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}><Card title="Mercado" value="Monitoreando" detail="Actividad inmobiliaria" /><Card title="Construcción" value={data.inflation ? pct(data.inflation.value) : '—'} detail="Último dato de inflación como contexto macro" /><Card title="Señal" value="En observación" detail="Sin dato sectorial inventado" /></div><Panel title="Radar Real Estate"><Row label="Macro" value="Inflación y tipo de cambio" /><Row label="Construcción" value="Monitoreo de costos" /><Row label="Señales" value="Pendiente de feed sectorial dedicado" /></Panel></>;

  if (section === 'Vaca Muerta') return <><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}><Card title="Energía" value="Monitoreando" detail="Actividad y señales" /><Card title="RIGI" value="En observación" detail="Proyectos e infraestructura" /><Card title="Impacto Tesorería" value="Analizando" detail="FX · inversión · infraestructura" /></div><Panel title="Radar Vaca Muerta"><Row label="Energía" value="Monitoreo de novedades" /><Row label="RIGI" value="Monitoreo regulatorio y proyectos" /><Row label="Datos sectoriales" value="Pendiente de feed dedicado" /></Panel></>;

  if (section === 'Alertas') return <><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}><Card title="Sistema" value={status.ok === false ? 'Degradado' : 'Operativo'} detail="Health check" /><Card title="Mercado" value={data.market?.brechaMepOficial != null && data.market.brechaMepOficial > 5 ? 'Revisar' : 'Normal'} detail="Brecha MEP / oficial" /><Card title="Datos" value="Actualización automática" detail="Cada 5 minutos en navegador" /></div><Panel title="Centro de alertas"><Row label="Conectividad" value={status.ok === false ? 'Revisar API' : 'OK'} /><Row label="Mercado" value={data.market ? 'Datos disponibles' : 'Sin datos'} /><Row label="Inflación" value={data.inflation ? 'Dato disponible' : 'Pendiente'} /></Panel></>;

  return <><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}><Card title="Dólar oficial" value={money(oficial?.venta)} detail={`Venta · ${source('oficial')}`} /><Card title="Dólar MEP" value={money(mep?.venta)} detail={`Venta · ${source('mep')}`} /><Card title="Brecha MEP / Oficial" value={pct(data.market?.brechaMepOficial)} detail="Tiempo real" /><Card title="Inflación" value={data.inflation ? pct(data.inflation.value) : '—'} detail={data.inflation?.month || 'Esperando dato'} /></div><div style={{marginTop:20,display:'grid',gridTemplateColumns:'2fr 1fr',gap:18}}><Panel title="Radar operativo"><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>{modules.map(([name,desc])=><div key={name} style={{border:'1px solid rgba(124,162,204,.15)',borderRadius:11,padding:15,background:'rgba(255,255,255,.018)'}}><div style={{display:'flex',justifyContent:'space-between'}}><b>{name}</b><span style={{color:'#5ee7a0'}}>●</span></div><div style={{fontSize:12,color:'#8196b0',marginTop:7}}>{desc}</div></div>)}</div></Panel><Panel title="Próximos hitos"><Row label="22/09" value="Ganancias PH/PF 2025" /><Row label="24/09" value="1° anticipo Ganancias 2026" /></Panel></div></>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) { return <div style={{marginTop:18,background:'rgba(13,23,38,.82)',border:'1px solid rgba(124,162,204,.17)',borderRadius:14,padding:22}}><h2 style={{marginTop:0}}>{title}</h2>{children}</div>; }
function Row({ label, value }: { label: string; value: string }) { return <div style={{display:'flex',justifyContent:'space-between',gap:20,padding:'12px 0',borderBottom:'1px solid rgba(124,162,204,.10)',fontSize:13}}><span style={{color:'#8196b0'}}>{label}</span><b style={{textAlign:'right'}}>{value}</b></div>; }

export default function Dashboard() {
  const [status, setStatus] = useState<Status>({});
  const [data, setData] = useState<DashboardData>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [section, setSection] = useState('Resumen');
  async function refresh() { try { const [health, dashboard] = await Promise.all([fetch('/api/health', { cache:'no-store' }), fetch('/api/dashboard', { cache:'no-store' })]); setStatus(await health.json()); if (dashboard.ok) setData(await dashboard.json()); setLastRefresh(new Date()); } catch { setStatus({ok:false,status:'degraded'}); } }
  useEffect(() => { refresh(); const id = window.setInterval(refresh, 300000); return () => window.clearInterval(id); }, []);
  const systemState = useMemo(() => status.ok === false ? 'Degradado' : 'Operativo', [status.ok]);
  return <div style={{minHeight:'100vh',background:'radial-gradient(circle at 80% -10%, #17345b 0, #0b1220 34%, #060b14 70%)',color:'#e8eef8',fontFamily:'Inter, ui-sans-serif, system-ui'}}><aside style={{position:'fixed',inset:'0 auto 0 0',width:250,background:'rgba(5,10,19,.94)',borderRight:'1px solid rgba(102,177,255,.16)',padding:24,boxSizing:'border-box',backdropFilter:'blur(18px)'}}><div style={{fontSize:11,letterSpacing:2,color:'#77b7ff'}}>NLK · TESORERÍA</div><div style={{fontSize:22,fontWeight:850,margin:'8px 0 28px'}}>Radar Intelligence</div>{nav.map(n=><button key={n} onClick={()=>setSection(n)} style={{width:'100%',textAlign:'left',border:'1px solid transparent',borderRadius:10,padding:'11px 12px',marginBottom:5,background:section===n?'linear-gradient(90deg, rgba(70,140,220,.28), rgba(70,140,220,.08))':'transparent',borderColor:section===n?'rgba(119,183,255,.24)':'transparent',color:'white',cursor:'pointer'}}>{n}</button>)}<div style={{position:'absolute',bottom:24,left:24,right:24,fontSize:12,color:'#91a4bd'}}>Motor autónomo<br/><b style={{color:'#dce9f8'}}>Refresh cada 5 minutos</b><br/><span style={{color:'#69e6a5'}}>● HEALTH CHECK ACTIVO</span></div></aside><main style={{marginLeft:250}}><header style={{background:'rgba(7,13,24,.82)',borderBottom:'1px solid rgba(102,177,255,.13)',padding:'20px 34px',display:'flex',justifyContent:'space-between',alignItems:'center',backdropFilter:'blur(16px)'}}><div><div style={{fontSize:12,color:'#7890ad',letterSpacing:1.1}}>CENTRO DE CONTROL / {section.toUpperCase()}</div><h1 style={{margin:'5px 0 0',fontSize:30}}>{section}</h1></div><div style={{textAlign:'right',fontSize:13}}><div><span style={{color:'#5ee7a0'}}>●</span> <b>{systemState}</b></div><div style={{color:'#7890ad',marginTop:5}}>Última comprobación: {lastRefresh?lastRefresh.toLocaleTimeString('es-AR'):'—'}</div></div></header><section style={{padding:34,maxWidth:1450}}><div style={{background:'linear-gradient(135deg, rgba(29,70,120,.65), rgba(11,21,36,.9))',border:'1px solid rgba(100,180,255,.22)',borderRadius:18,padding:24,marginBottom:18,boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}><div style={{fontSize:11,letterSpacing:1.5,color:'#79baff'}}>TESO AI · EXECUTIVE BRIEF</div><h2 style={{fontSize:25,margin:'12px 0 0'}}>Radar operativo conectado a datos de mercado.</h2><p style={{color:'#b6c7db',marginBottom:0}}>Cada menú ahora renderiza su propio tablero y reutiliza los datos vivos disponibles.</p></div><SectionContent section={section} data={data} status={status}/></section></main></div>;
}
