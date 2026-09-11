'use client';

import { useEffect, useState } from 'react';

type Command = {
  action?: string;
  alerts?: { level: string; title: string; detail: string }[];
  market?: { official?: { sell?: number | null }; mep?: { sell?: number | null }; mepVsOfficial?: number | null; bna?: { billete?: { buy?: number|null; sell?: number|null }; divisa?: { buy?: number|null; sell?: number|null } } | null };
  liquidity?: { fima?: { thirtyDay?: number|null; twelveMonth?: number|null; tnaEstimated?: number|null }; redemption?: string|null };
  health?: { score?: number; label?: string; dimensions?: Record<string,number> } | null;
  checkedAt?: string;
};
const money=(v:number|null|undefined)=>v==null?'—':`$${v.toLocaleString('es-AR',{maximumFractionDigits:2})}`;
const pct=(v:number|null|undefined)=>v==null?'—':`${v.toFixed(2)}%`;

export default function CommandCenter(){
 const [d,setD]=useState<Command>({}); const [loading,setLoading]=useState(true);
 async function refresh(){try{setLoading(true);const r=await fetch('/api/treasury/command',{cache:'no-store'});setD(await r.json());}finally{setLoading(false)}}
 useEffect(()=>{refresh();const id=window.setInterval(refresh,300000);return()=>window.clearInterval(id)},[]);
 const score=d.health?.score;
 return <main style={{minHeight:'100vh',background:'radial-gradient(circle at 80% 0%,#163761 0,#08111f 42%,#040810 100%)',color:'#e8eef8',fontFamily:'Inter,system-ui',padding:28}}>
  <div style={{maxWidth:1400,margin:'0 auto'}}>
   <header style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:20,borderBottom:'1px solid rgba(120,170,220,.18)',paddingBottom:20}}><div><div style={{fontSize:11,letterSpacing:3,color:'#76b8ff'}}>NLK · TESORERÍA RADAR</div><h1 style={{fontSize:34,margin:'8px 0 4px'}}>Treasury Command Center</h1><div style={{color:'#8096b0'}}>Centro ejecutivo de decisión · actualización automática cada 5 minutos</div></div><div style={{textAlign:'right',fontSize:12,color:'#7890aa'}}>{loading?'Actualizando…':`Última lectura ${d.checkedAt?new Date(d.checkedAt).toLocaleTimeString('es-AR'):'—'}`}<div style={{marginTop:6,color:'#5ee7a0'}}>● Sistema operativo</div></div></header>
   <section style={{marginTop:24,display:'grid',gridTemplateColumns:'2fr 1fr',gap:18}}>
    <div style={{background:'rgba(13,23,38,.86)',border:'1px solid rgba(102,177,255,.24)',borderRadius:16,padding:26,boxShadow:'0 0 35px rgba(45,130,220,.08)'}}><div style={{fontSize:12,color:'#79a8d8',letterSpacing:1.5}}>DECISIÓN PRIORITARIA</div><div style={{fontSize:25,fontWeight:800,lineHeight:1.2,marginTop:12}}>{d.action||'Analizando condiciones de tesorería…'}</div></div>
    <div style={{background:'rgba(13,23,38,.86)',border:'1px solid rgba(124,162,204,.17)',borderRadius:16,padding:26}}><div style={{fontSize:12,color:'#8196b0'}}>HEALTH SCORE</div><div style={{fontSize:52,fontWeight:900,marginTop:4}}>{score??'—'}<span style={{fontSize:16,color:'#8196b0'}}>/100</span></div><div style={{color:score!=null&&score>=80?'#5ee7a0':'#f3c969',fontWeight:700}}>{d.health?.label||'SIN DATO'}</div></div>
   </section>
   <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginTop:18}}>{[['Oficial',money(d.market?.official?.sell)],['MEP',money(d.market?.mep?.sell)],['Brecha',pct(d.market?.mepVsOfficial)],['FIMA 30d',pct(d.liquidity?.fima?.thirtyDay)]].map(([a,b])=><div key={a} style={{background:'rgba(13,23,38,.8)',border:'1px solid rgba(124,162,204,.15)',borderRadius:14,padding:18}}><div style={{fontSize:12,color:'#8196b0'}}>{a}</div><div style={{fontSize:25,fontWeight:850,marginTop:7}}>{b}</div></div>)}</section>
   <section style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:18,marginTop:18}}>
    <div style={{background:'rgba(13,23,38,.82)',border:'1px solid rgba(124,162,204,.17)',borderRadius:14,padding:22}}><h2 style={{marginTop:0}}>Alertas activas</h2>{(d.alerts||[]).map((a,i)=><div key={i} style={{padding:'14px 0',borderBottom:'1px solid rgba(124,162,204,.1)'}}><b style={{color:a.level==='CRITICA'?'#ff7777':a.level==='ALTA'?'#f3c969':'#7fb8ef'}}>{a.level}</b><div style={{marginTop:4,fontWeight:700}}>{a.title}</div><div style={{fontSize:12,color:'#8196b0',marginTop:3}}>{a.detail}</div></div>)}</div>
    <div style={{background:'rgba(13,23,38,.82)',border:'1px solid rgba(124,162,204,.17)',borderRadius:14,padding:22}}><h2 style={{marginTop:0}}>Liquidez</h2><div style={{color:'#8196b0',fontSize:12}}>FIMA Premium</div><div style={{marginTop:10}}>30 días <b style={{float:'right'}}>{pct(d.liquidity?.fima?.thirtyDay)}</b></div><div style={{marginTop:12}}>12 meses <b style={{float:'right'}}>{pct(d.liquidity?.fima?.twelveMonth)}</b></div><div style={{marginTop:12}}>TNA estimada <b style={{float:'right'}}>{pct(d.liquidity?.fima?.tnaEstimated)}</b></div><div style={{marginTop:12}}>Rescate <b style={{float:'right',color:'#5ee7a0'}}>{d.liquidity?.redemption||'—'}</b></div></div>
   </section>
   <section style={{marginTop:18,background:'rgba(13,23,38,.82)',border:'1px solid rgba(124,162,204,.17)',borderRadius:14,padding:22}}><h2 style={{marginTop:0}}>BNA · control de cotización</h2><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>{[['Billete',d.market?.bna?.billete],['Divisa',d.market?.bna?.divisa]].map(([k,v])=><div key={k} style={{border:'1px solid rgba(124,162,204,.12)',borderRadius:10,padding:15}}><b>{k}</b><div style={{marginTop:9,color:'#8196b0'}}>Compra <strong style={{color:'#e8eef8',float:'right'}}>{money((v as any)?.buy)}</strong></div><div style={{marginTop:7,color:'#8196b0'}}>Venta <strong style={{color:'#e8eef8',float:'right'}}>{money((v as any)?.sell)}</strong></div></div>)}</div></section>
   <footer style={{marginTop:20,fontSize:11,color:'#647b96'}}>Motor agregado: mercado · FX · BNA · FIMA · Health Score · Cash Calendar. Los datos faltantes permanecen explícitos; validar fuentes antes de ejecutar operaciones.</footer>
  </div></main>
}
