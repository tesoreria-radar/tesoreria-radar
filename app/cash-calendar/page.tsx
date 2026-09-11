'use client';

import { useEffect, useState } from 'react';

type EventItem = { date: string; type: string; title: string; priority: string; source: string; daysUntil: number };
type Calendar = { ok?: boolean; checkedAt?: string; upcoming?: EventItem[]; methodology?: string };
const priorityColor=(p:string)=>p==='CRÍTICA'?'#ff6b6b':p==='ALTA'?'#ffd166':'#77b7ff';
const fmtDate=(d:string)=>new Date(`${d}T12:00:00-03:00`).toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});

export default function CashCalendarPage(){
 const [data,setData]=useState<Calendar>({});
 async function refresh(){try{const r=await fetch('/api/treasury/calendar',{cache:'no-store'});setData(await r.json())}catch{setData(x=>x)}}
 useEffect(()=>{refresh();const id=window.setInterval(refresh,300000);return()=>window.clearInterval(id)},[]);
 const items=data.upcoming||[]; const critical=items.filter(x=>x.priority==='CRÍTICA').length; const next=items[0];
 return <main style={{minHeight:'100vh',background:'radial-gradient(circle at 80% -10%,#17345b 0,#0b1220 34%,#060b14 72%)',color:'#e8eef8',fontFamily:'Inter,system-ui',padding:28}}>
  <div style={{maxWidth:1200,margin:'0 auto'}}>
   <header style={{display:'flex',justifyContent:'space-between',alignItems:'end',borderBottom:'1px solid rgba(120,170,220,.18)',paddingBottom:20}}><div><div style={{fontSize:11,letterSpacing:3,color:'#77b7ff'}}>NLK · TESORERÍA / CASH COMMAND</div><h1 style={{fontSize:34,margin:'8px 0 4px'}}>Cash Calendar</h1><div style={{color:'#8196b0'}}>Agenda operativa de caja · ARCA + BCRA · horizonte 60 días</div></div><a href="/command-center" style={{color:'#77b7ff',textDecoration:'none'}}>← Command Center</a></header>
   <section style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginTop:22}}>{[['PRÓXIMO EVENTO',next?`${next.daysUntil} días`:'—'],['CRÍTICOS',String(critical)],['EVENTOS',String(items.length)]].map(([a,b])=><div key={a} style={{background:'rgba(13,23,38,.84)',border:'1px solid rgba(124,162,204,.17)',borderRadius:14,padding:18}}><div style={{fontSize:11,color:'#8196b0',letterSpacing:1.4}}>{a}</div><div style={{fontSize:25,fontWeight:850,marginTop:8}}>{b}</div></div>)}</section>
   <section style={{marginTop:18,background:'rgba(13,23,38,.86)',border:'1px solid rgba(124,162,204,.18)',borderRadius:16,overflow:'hidden'}}><div style={{display:'grid',gridTemplateColumns:'115px 75px 1fr 90px',gap:12,padding:'13px 18px',fontSize:10,color:'#617a95',letterSpacing:1.3,borderBottom:'1px solid rgba(124,162,204,.12)'}}><span>FECHA</span><span>TIPO</span><span>EVENTO</span><span style={{textAlign:'right'}}>PRIORIDAD</span></div>{items.map((e,i)=><div key={`${e.date}-${e.title}`} style={{display:'grid',gridTemplateColumns:'115px 75px 1fr 90px',gap:12,alignItems:'center',padding:'16px 18px',borderBottom:i===items.length-1?'none':'1px solid rgba(124,162,204,.08)'}}><div><b>{fmtDate(e.date)}</b><div style={{fontSize:11,color:'#71869f',marginTop:3}}>{e.daysUntil===0?'HOY':`T-${e.daysUntil}`}</div></div><span style={{color:e.type==='ARCA'?'#5ee7a0':'#77b7ff',fontSize:11,fontWeight:800}}>{e.type}</span><div><div style={{fontWeight:750}}>{e.title}</div><div style={{fontSize:11,color:'#71869f',marginTop:4}}><a href={e.source} target="_blank" rel="noreferrer" style={{color:'#71869f'}}>fuente primaria ↗</a></div></div><span style={{color:priorityColor(e.priority),fontWeight:850,fontSize:10,textAlign:'right'}}>{e.priority}</span></div>)}</section>
   <div style={{marginTop:16,fontSize:11,color:'#647b96'}}>{data.methodology||'Cargando agenda…'}</div>
  </div>
 </main>
}
