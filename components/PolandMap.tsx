"use client";

import { useEffect, useMemo, useState } from "react";

type Region = { name: string; slug: string; points: string; x: number; y: number; w: number; h: number };

const REGIONS: Region[] = [
  {name:"Zachodniopomorskie",slug:"zachodniopomorskie",points:"25,65 92,48 132,82 116,142 45,151 18,110",x:18,y:48,w:114,h:103},
  {name:"Pomorskie",slug:"pomorskie",points:"92,48 177,24 232,55 220,112 132,82",x:92,y:24,w:140,h:88},
  {name:"Warminsko-Mazurskie",slug:"warminsko-mazurskie",points:"232,55 330,66 373,112 326,151 220,112",x:220,y:55,w:153,h:96},
  {name:"Lubuskie",slug:"lubuskie",points:"18,110 45,151 50,232 15,252 4,180",x:4,y:110,w:46,h:142},
  {name:"Wielkopolskie",slug:"wielkopolskie",points:"45,151 116,142 184,164 176,249 95,267 50,232",x:45,y:142,w:139,h:125},
  {name:"Kujawsko-Pomorskie",slug:"kujawsko-pomorskie",points:"132,82 220,112 238,174 184,164 116,142",x:116,y:82,w:122,h:92},
  {name:"Podlaskie",slug:"podlaskie",points:"326,151 373,112 394,190 373,258 326,245",x:326,y:112,w:68,h:146},
  {name:"Dolnoslaskie",slug:"dolnoslaskie",points:"15,252 50,232 95,267 118,318 70,350 20,323",x:15,y:232,w:103,h:118},
  {name:"Opolskie",slug:"opolskie",points:"95,267 150,278 160,332 118,345 118,318",x:95,y:267,w:65,h:78},
  {name:"Lodzkie",slug:"lodzkie",points:"184,164 238,174 258,248 217,290 176,249",x:176,y:164,w:82,h:126},
  {name:"Mazowieckie",slug:"mazowieckie",points:"238,174 326,151 326,245 302,299 258,248",x:238,y:151,w:88,h:148},
  {name:"Slaskie",slug:"slaskie",points:"150,278 217,290 205,361 160,372 160,332",x:150,y:278,w:67,h:94},
  {name:"Swietokrzyskie",slug:"swietokrzyskie",points:"217,290 258,248 302,299 268,342 205,361",x:205,y:248,w:97,h:113},
  {name:"Lubelskie",slug:"lubelskie",points:"326,245 373,258 387,340 330,374 268,342 302,299",x:268,y:245,w:119,h:129},
  {name:"Malopolskie",slug:"malopolskie",points:"160,372 205,361 268,342 278,392 218,414 164,402",x:160,y:342,w:118,h:72},
  {name:"Podkarpackie",slug:"podkarpackie",points:"268,342 330,374 346,417 278,392",x:268,y:342,w:78,h:75},
];

export default function PolandMap() {
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Region | null>(null);
  useEffect(() => { const load=()=>{try{setDiscovered(JSON.parse(localStorage.getItem("mq_voivodeships")||"[]"));setCounts(JSON.parse(localStorage.getItem("mq_voivodeship_tiles")||"{}"));}catch{}};load();window.addEventListener("mq-voivodeships-updated",load);window.addEventListener("storage",load);return()=>{window.removeEventListener("mq-voivodeships-updated",load);window.removeEventListener("storage",load);};},[]);
  const discoveredKeys=useMemo(()=>new Set(discovered.map(normalize)),[discovered]);
  const percentFor=(region:Region)=>Math.min(100,Math.max(discoveredKeys.has(normalize(region.name))?3:0,Math.round((counts[region.slug]||0)/4)));
  const countryPercent=Math.round(REGIONS.reduce((sum,region)=>sum+percentFor(region),0)/16);
  return <div className="mq-poland-map">
    <header><div><small>POSTEP KRAJU</small><h2>Odkryta Polska</h2><p>Herby wojewodztw ujawniaja sie wraz z postepem.</p></div><b>{countryPercent}%</b></header>
    <svg viewBox="0 0 400 430" role="img" aria-label="Mapa wojewodztw Polski">
      <defs>{REGIONS.map((r)=><clipPath id={`clip-${r.slug}`} key={r.slug}><polygon points={r.points}/></clipPath>)}</defs>
      {REGIONS.map((region)=>{const percent=percentFor(region);return <g key={region.slug} onClick={()=>setSelected(region)} className="mq-polish-region">
        <polygon points={region.points} fill="#121316" stroke="#4a4d54" strokeWidth="2"/>
        <image href={`/voivodeships/${region.slug}.svg`} x={region.x} y={region.y} width={region.w} height={region.h} preserveAspectRatio="xMidYMid meet" clipPath={`url(#clip-${region.slug})`} opacity={percent/100}/>
        <polygon points={region.points} fill="none" stroke={percent>0?"#ff7900":"#4a4d54"} strokeWidth={percent>0?3:2}/>
      </g>;})}
    </svg>
    {selected&&<div className="mq-region-detail"><div><img src={`/voivodeships/${selected.slug}.svg`} alt=""/><span><b>{selected.name}</b><small>Odkryto {percentFor(selected)}%</small></span></div><button onClick={()=>setSelected(null)}>Zamknij</button></div>}
  </div>;
}

function normalize(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
