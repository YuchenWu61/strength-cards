(function(root){
  'use strict';
  const KEY='strength-cards:personal:v1';
  const point=[5,3,1,0];
  const id=(n,max)=>Number.isInteger(n)&&n>=0&&n<max;
  const unique=(xs,max)=>Array.isArray(xs)&&xs.every(n=>id(n,max))&&new Set(xs).size===xs.length;
  function validPlaces(xs){return Array.isArray(xs)&&xs.length===27&&xs.every(n=>n===null||id(n,4))&&[0,1,2,3].every(r=>xs.filter(n=>n===r).length<=12)}
  function scores(places){return Array.from({length:9},(_,g)=>places.slice(g*3,g*3+3).reduce((s,r)=>s+(r===null?0:point[r]),0))}
  function validResult(s){if(!s||!validPlaces(s.places)||s.places.includes(null)||![0,1,2,3].every(r=>[6,7].includes(s.places.filter(n=>n===r).length))||!unique(s.top,9)||s.top.length!==4||!unique(s.tie,9))return false;const values=scores(s.places),cut=[...values].sort((a,b)=>b-a)[3];return s.top.every(g=>values[g]>=cut)&&values.every((v,g)=>v<=cut||s.top.includes(g))&&s.tie.every(g=>s.top.includes(g)&&values[g]===cut)}
  function validCurrent(s){return s&&['sort','balance','results'].includes(s.phase)&&validPlaces(s.places)&&unique(s.order,27)&&s.order.length===27&&unique(s.top,9)&&unique(s.tie,9)&&Array.isArray(s.history)&&s.history.length<=2000&&s.history.every(h=>h&&id(h.id,27)&&(h.from===null||id(h.from,4)))&&(s.phase!=='results'||validResult(s))}
  let data={version:1,current:null,results:[],savedAt:null},message='',available=true;
  try{const raw=root.localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.version!==1||!validCurrent(parsed.current)||!Array.isArray(parsed.results)||parsed.results.length>30||!parsed.results.every(r=>validResult(r)&&typeof r.id==='string'&&Number.isFinite(Date.parse(r.completedAt))))throw Error('Invalid save');data=parsed;message=parsed.current.phase==='results'?'已恢复上次评分结果':'已恢复上次分类进度'}}catch(error){message='无法读取上次记录，本轮将从头开始。'}
  function persist(){try{root.localStorage.setItem(KEY,JSON.stringify(data));available=true;return true}catch(error){available=false;return false}}
  root.StrengthStorage={
    load:()=>data.current?JSON.parse(JSON.stringify(data.current)):null,
    message:()=>message,
    save(s){const current={phase:s.phase,order:[...s.order],places:[...s.places],history:s.history.slice(-2000).map(h=>({...h})),top:[...s.top],tie:[...s.tie]};if(!validCurrent(current))return false;data.current=current;data.savedAt=new Date().toISOString();return persist()},
    remember(s){if(!validResult(s))return false;const signature=JSON.stringify([s.places,s.top,s.tie]);if(!data.results.some(r=>JSON.stringify([r.places,r.top,r.tie])===signature)){const time=new Date().toISOString();data.results.unshift({id:time+'-'+Math.random().toString(36).slice(2,8),completedAt:time,places:[...s.places],top:[...s.top],tie:[...s.tie]});data.results=data.results.slice(0,30)}return persist()},
    results:()=>JSON.parse(JSON.stringify(data.results)),
    status:()=>({available,savedAt:data.savedAt,count:data.results.length}),scores,validCurrent,validResult
  };
})(globalThis);
