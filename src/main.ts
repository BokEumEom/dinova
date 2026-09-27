import './style.css';
import {createIcons,Timer,BookOpen,MapPin,UserRound,Settings2,X,Play,Pause,RotateCcw,ChevronRight,ArrowLeft,Check,Plus,Minus,Move,FlipHorizontal2,Trash2,Leaf,Snowflake,Volume2,VolumeX,Sparkles,Clock3,Flame,Mountain,Flower2,Heart,LockKeyhole,ArrowRight,CheckCheck,Globe,Footprints,Image,Hand,TreePine,Trophy} from 'lucide';
import {dinosaurs,decorations,decorationArt,imageFor,dinoName,type Language} from './catalog';
import {translate,type Key} from './i18n';
import {readState,defaults,freshSession,STORE,type Placement} from './state';
import {remainingSeconds,progressPercent,formatTime,startSession,pauseSession,finishSession} from './session.mjs';
import {IceScene} from './scene';
import {Garden} from './garden3d';
import type {Behaviour} from './rive-dinosaur';
const icons={Timer,BookOpen,MapPin,UserRound,Settings2,X,Play,Pause,RotateCcw,ChevronRight,ArrowLeft,Check,Plus,Minus,Move,FlipHorizontal2,Trash2,Leaf,Snowflake,Volume2,VolumeX,Sparkles,Clock3,Flame,Mountain,Flower2,Heart,LockKeyhole,ArrowRight,CheckCheck,Globe,Footprints,Image,Hand,TreePine,Trophy};
type Page='focus'|'collection'|'map'|'profile';
let state=readState(),page:Page='focus',filter:number|'all'|'found'='all',preview:number|null=null,scene:IceScene|null=null,garden:Garden|null=null;
let editing=false,tray:'dino'|'decor'='dino',demo=false,selected:string|null=null,demoPlacements:Placement[]=[];
let audioContext:AudioContext|null=null,toastTimer:ReturnType<typeof setTimeout>,storageWarned=false;
const app=document.querySelector<HTMLDivElement>('#app')!;
const t=(key:Key)=>translate(key,state.language);
const name=(id:number)=>dinoName(id,state.language);
const icon=(key:string)=>`<i data-lucide="${key}" aria-hidden="true"></i>`;
const title=()=>page==='focus'?'MeltTime':t(page==='map'?'gardenTitle':page==='profile'?'profileTitle':'collection');
const groupNames:Key[]=['group1','group2','group3'];
const placements=()=>demo?demoPlacements:state.garden;
const guid=()=>crypto.randomUUID();
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch{if(!storageWarned){storageWarned=true;toast(t('saveError'));}}}
function refreshIcons(){createIcons({icons,attrs:{'stroke-width':1.8},nameAttr:'data-lucide'});}
function rangeFill(input:HTMLInputElement){input.style.setProperty('--fill',`${(+input.value-+input.min)/(+input.max-+input.min)*100}%`);}
function stats(){const total=state.history.reduce((a,b)=>a+b.seconds,0),longest=Math.max(0,...state.history.map(r=>r.seconds));const dates=new Set(state.history.map(r=>new Date(r.date).toLocaleDateString('en-CA')));const day=new Date();let streak=0;if(!dates.has(day.toLocaleDateString('en-CA')))day.setDate(day.getDate()-1);while(dates.has(day.toLocaleDateString('en-CA'))){streak++;day.setDate(day.getDate()-1);}return {total,longest,streak};}
function duration(seconds:number){const m=Math.floor(seconds/60),h=Math.floor(m/60);return state.language==='ko'?(h?`${h}시간 ${m%60}분`:`${m}분`):(h?`${h}h ${m%60}m`:`${m}m`);}
function render(){
  scene?.dispose();scene=null;garden?.dispose();garden=null;
  document.documentElement.lang=state.language;document.body.dataset.page=page;document.title=`${title()} · MeltTime`;
  app.innerHTML=`<aside class="desktop-note"><span class="desktop-logo">${icon('snowflake')} MeltTime</span><h2>${state.language==='ko'?'당신의 작은 집중이,<br>새로운 세상을 깨워요.':'A little focus.<br>A world of wonder.'}</h2><p>${t('focusHint')}</p><img src="${imageFor(0)}" alt=""/><span class="desktop-note-bottom">${icon('leaf')} ${t('together')}</span></aside>
  <div class="mobile-app ${page}"><div class="sky-backdrop"></div><header class="app-header"><div><span class="overline">${page==='focus'?'FOCUS · MELT · REVIVE':page==='map'?'YOUR LITTLE WORLD':page==='collection'?'LITTLE FRIENDS, BIG WONDERS':'ONE MOMENT AT A TIME'}</span><h1>${title()}</h1></div><div class="header-actions">${page==='collection'?`<span class="collection-total"><strong>${state.collected.length}</strong><span>/ ${dinosaurs.length}</span></span>`:''}<button class="round-button settings-button" data-action="settings" aria-label="${t('settings')}">${icon('settings-2')}</button></div></header>
  <main>${page==='focus'?focusView():page==='collection'?collectionView():page==='map'?gardenView():profileView()}</main>
  <nav class="bottom-nav" aria-label="${state.language==='ko'?'주 메뉴':'Main navigation'}">${([['focus','timer','focus'],['collection','book-open','collection'],['map','map-pin','garden'],['profile','user-round','profile']] as const).map(([id,ico,key])=>`<a href="#${id}" ${page===id?'aria-current="page"':''} class="${page===id?'active':''}">${icon(ico)}<span>${t(key)}</span></a>`).join('')}</nav></div><div class="toast" role="status"></div><dialog id="modal"></dialog>`;
  bind();refreshIcons();document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(rangeFill);
  if(page==='focus'){
    const host=document.querySelector<HTMLElement>('#ice-scene')!;
    try{scene=new IceScene(host,state.session.target,state.language,state.motion);scene.setMelt(preview??progressPercent(state.session));}
    catch{host.innerHTML=`<img class="scene-fallback" src="${imageFor(state.session.target)}" alt="${name(state.session.target)}"/><span class="scene-error">${t('sceneError')}</span>`;host.dataset.loaded='error';}
    updateTimer();
  }
  if(page==='map'){
    garden=new Garden(document.querySelector('#garden-actors')!,placements(),state.language,state.motion,editing,uid=>{selected=uid;updateSelection();},(uid,x,y)=>{const p=placements().find(p=>p.uid===uid);if(p){p.x=x;p.y=y;if(!demo)save();}});
    updateSelection();
  }
}
function focusView(){return `<section class="focus-world" aria-label="${t('sceneLabel')}"><div id="ice-scene" data-loading="${t('loading')}"></div><button class="scene-reset" data-action="reset-view" aria-label="${t('viewReset')}">${icon('rotate-ccw')}</button><div class="world-caption"><button data-detail="${state.session.target}">${name(state.session.target)} ${icon('chevron-right')}</button><span id="melt-percent">${Math.floor(progressPercent(state.session))}% ${t('melted')}</span></div></section>
  <div class="focus-panels"><section class="glass-card view-controls"><label><span>${t('left')}</span><input id="rotate" type="range" min="-50" max="50" value="2" aria-label="${t('rotateLabel')}"/><span>${t('right')}</span></label><div class="divider"></div><label><span>${t('down')}</span><input id="tilt" type="range" min="0" max="100" value="25" aria-label="${t('tiltLabel')}"/><span>${t('up')}</span></label></section>
  <section class="glass-card melt-preview"><div class="card-heading"><h2>${t('preview')}</h2><button class="text-button" data-action="live">${t('live')} ${icon('rotate-ccw')}</button></div><p>${t('previewHint')}</p><input id="preview" type="range" min="0" max="100" value="${preview??Math.floor(progressPercent(state.session))}" aria-label="${t('previewLabel')}"/><div class="range-labels"><span>0%</span><output id="preview-output">${preview??Math.floor(progressPercent(state.session))}%</output><span>100%</span></div><span class="preview-disclaimer ${preview===null?'quiet':''}" id="preview-disclaimer">${t('previewOnly')}</span></section>
  <section class="glass-card focus-timer"><div class="duration-options" aria-label="${t('focus')}">${[5,15,25,45].map(m=>`<button data-duration="${m}" class="${state.session.duration===m*60?'active':''}" ${state.session.running?'disabled':''}>${m}<span>${t('min')}</span></button>`).join('')}</div><div class="session-track"><div id="session-progress" style="width:${progressPercent(state.session)}%"></div></div><div class="timer-value" id="timer-digits">${formatTime(remainingSeconds(state.session))}</div><div class="timer-actions"><button class="timer-secondary" data-action="sound" aria-label="${t('sound')}">${icon(state.sound?'volume-2':'volume-x')}</button><button class="timer-toggle" data-action="timer" aria-label="${t(state.session.running?'pause':'start')}" id="timer-toggle">${icon(state.session.running?'pause':'play')}</button><button class="timer-secondary" data-action="reset" aria-label="${t('reset')}">${icon('rotate-ccw')}</button></div><p id="timer-label">${t(state.session.running?'pause':state.session.remaining<state.session.duration?'resume':'start')}</p><span class="timer-footnote">${t('together')}</span></section>
  <button class="choose-friend" data-action="choose">${icon('snowflake')}<span>${t('choose')}</span>${icon('chevron-right')}</button></div>`;}
function collectionView(){const list=dinosaurs.map((d,id)=>({...d,index:id})).filter(d=>filter==='all'||filter==='found'&&state.collected.includes(d.index)||d.group===filter);return `<div class="collection-intro"><p>${t('collectionHint')}</p><span class="intro-sparkle">✧</span></div><section class="collection-content"><div class="glass-card collection-tabs" role="group" aria-label="${t('collection')}">${(['all',0,1,2] as const).map((value,i)=>`<button data-filter="${value}" class="${filter===value?'active':''}">${i===0?t('all'):state.language==='ko'?`친구 ${i}`:`Set ${i}`}</button>`).join('')}</div><div class="collection-summary"><span>${state.collected.length} / ${dinosaurs.length} ${t('collectedCount')}</span><button class="filter-found ${filter==='found'?'active':''}" data-filter="found">${icon('check')} ${t('found')}</button></div><div class="collection-grid">${list.map(d=>{const found=state.collected.includes(d.index);return `<button class="collection-card ${found?'revived':'frozen'}" data-detail="${d.index}" data-asset="${d.id}"><div class="collection-art"><span class="catalog-number">${String(d.index+1).padStart(2,'0')}</span><img src="${imageFor(d.index)}" alt="${found?name(d.index):t('unknown')}" loading="lazy"/>${!found?'<span class="mini-ice"></span>':`<span class="revived-check">${icon('check')}</span>`}</div><strong>${found?name(d.index):'???'}</strong><small>${found?t('found'):t('frozen')}</small></button>`;}).join('')||`<div class="empty-collection">${icon('snowflake')}<p>${t('emptyHint')}</p><a href="#focus" class="primary-button">${t('start')}</a></div>`}</div><p class="collection-source">${icon('heart')} ${t('focusHint')}</p></section>`;}
function gardenView(){const current=placements();return `<div class="garden-subtitle"><p>${t('gardenHint')}</p></div><section class="garden-board ${editing?'editing':''}" id="garden-board"><div class="garden-topline"><span>${icon(demo?'image':'leaf')} ${demo?t('demo'):t('meadow')}</span><button data-action="edit" class="board-button ${editing?'active':''}">${icon(editing?'check':'move')} ${t(editing?'done':'edit')}</button></div><div id="garden-actors" class="garden-actors"></div>${current.length===0?`<div class="garden-empty"><span>${icon('footprints')}</span><h2>${t('emptyGarden')}</h2><p>${t('emptyHint')}</p><button class="primary-button" data-action="demo">${icon('play')} ${t('tryGarden')}</button></div>`:''}<div class="garden-board-bottom"><span>${icon(editing?'hand':demo?'image':'check-check')} ${t(editing?'moveHint':'orbitHint')}</span>${demo?`<button data-action="exit-demo">${t('exitDemo')} ${icon('x')}</button>`:''}</div></section>
  <div class="garden-selection" id="garden-selection"></div><section class="glass-card garden-inventory"><div class="inventory-header"><div class="inventory-tabs"><button data-tray="dino" class="${tray==='dino'?'active':''}">${icon('footprints')} ${t('dinosaurs')} <span>${demo?4:state.collected.length}</span></button><button data-tray="decor" class="${tray==='decor'?'active':''}">${icon('tree-pine')} ${t('decorations')}</button></div><span class="inventory-count">${current.length}/24</span></div><p>${t('selectHint')}</p><div class="inventory-scroll">${tray==='dino'?dinosaurs.map((d,id)=>{const can=demo?id<4:state.collected.includes(id),placed=current.some(p=>p.kind==='dino'&&p.asset===id);return `<button class="inventory-item ${can?'':'locked'} ${placed?'placed':''}" data-place-dino="${id}" aria-label="${name(id)} · ${t(placed?'placed':can?'place':'frozen')}"><img src="${imageFor(id)}" alt="${name(id)}" loading="lazy"/><span>${name(id)}</span><b>${icon(placed?'check':can?'plus':'lock-keyhole')}</b></button>`;}).join(''):decorations.map(d=>`<button class="inventory-item decor" data-place-decor="${d.id}"><span class="decor-thumb">${decorationArt(d.id)}</span><span>${d[state.language]}</span><b>${icon('plus')}</b></button>`).join('')}</div></section><div class="garden-help">${icon('sparkles')} ${t('together')}</div>`;}
function profileView(){const s=stats();const values=[['clock-3',duration(s.total),'totalTime'],['play',`${state.history.length}`,'sessions'],['footprints',`${state.collected.length} / 18`,'revived'],['flame',`${s.streak} ${t('days')}`,'streak'],['mountain',duration(s.longest),'longest'],['flower-2',`${state.garden.filter(p=>p.kind==='dino').length}`,'placedCount']] as const;const achievements=[['leaf','firstStep','firstStepHint',state.history.length>0],['mountain','deepFocus','deepFocusHint',s.longest>=1500],['footprints','newFriend','newFriendHint',state.collected.length>0],['flower-2','gardener','gardenerHint',state.garden.some(p=>p.kind==='dino')]] as const;const weeks=Array.from({length:7},(_,i)=>{const day=new Date();day.setDate(day.getDate()-6+i);return {day,seconds:state.history.filter(r=>new Date(r.date).toDateString()===day.toDateString()).reduce((a,r)=>a+r.seconds,0)};});const max=Math.max(1500,...weeks.map(w=>w.seconds));return `<section class="profile-identity"><div class="profile-avatar"><img src="${imageFor(state.collected[0]??0)}" alt="${name(state.collected[0]??0)}"/></div><h2>${t('explorer')}</h2><p>${t('profileHint')}</p></section><div class="profile-content"><div class="stats-grid">${values.map(([ico,value,label])=>`<div class="glass-card stat-card"><span>${icon(ico)}</span><div><p>${t(label)}</p><strong>${value}</strong></div></div>`).join('')}</div><section class="glass-card achievements"><h2>${t('achievements')}</h2><div>${achievements.map(([ico,label,desc,earned])=>`<div class="achievement ${earned?'earned':''}"><span class="achievement-ice">${icon(ico)}${earned?'<b>✓</b>':''}</span><strong>${t(label)}</strong><small>${t(desc)}</small></div>`).join('')}</div></section><section class="glass-card weekly-card"><h2>${t('week')}</h2><div class="week-chart">${weeks.map(({day,seconds},i)=>`<div><span>${Math.floor(seconds/60)}${t('min')}</span><div class="week-bar"><b style="height:${Math.max(3,seconds/max*100)}%"></b></div><small>${i===6?t('today'):day.toLocaleDateString(state.language==='ko'?'ko-KR':'en-US',{weekday:'short'})}</small></div>`).join('')}</div></section><section class="glass-card history"><h2>${t('recent')}</h2>${state.history.length?state.history.slice(-6).reverse().map(r=>`<div class="history-row"><img src="${imageFor(r.target)}" alt=""/><span>${name(r.target)}<small>${new Date(r.date).toLocaleDateString(state.language==='ko'?'ko-KR':'en-US',{month:'short',day:'numeric'})}</small></span><strong>${duration(r.seconds)}</strong></div>`).join(''):`<p class="no-history">${t('noHistory')}</p>`}</section></div>`;}
function bind(){
  document.querySelectorAll<HTMLElement>('[data-action]').forEach(el=>el.onclick=()=>action(el.dataset.action!));
  document.querySelectorAll<HTMLElement>('[data-detail]').forEach(el=>el.onclick=()=>detail(+el.dataset.detail!));
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach(el=>el.onclick=()=>{const f=el.dataset.filter!;filter=f==='all'||f==='found'?f:+f;render();});
  document.querySelectorAll<HTMLElement>('[data-duration]').forEach(el=>el.onclick=()=>{
    if(state.session.running)return;const seconds=+el.dataset.duration!*60;if(seconds===state.session.duration)return;
    const change=()=>{state.session=freshSession(seconds,state.session.target);preview=null;save();render();};
    if(state.session.remaining<state.session.duration)confirm(t('resetTitle'),t('resetHint'),change);else change();
  });
  document.querySelectorAll<HTMLElement>('[data-tray]').forEach(el=>el.onclick=()=>{tray=el.dataset.tray as typeof tray;render();});
  document.querySelectorAll<HTMLElement>('[data-place-dino]').forEach(el=>el.onclick=()=>addDino(+el.dataset.placeDino!));
  document.querySelectorAll<HTMLElement>('[data-place-decor]').forEach(el=>el.onclick=()=>addPlacement('decor',el.dataset.placeDecor!));
  document.querySelector<HTMLInputElement>('#rotate')?.addEventListener('input',e=>{const el=e.target as HTMLInputElement;scene?.setAngle(+el.value);rangeFill(el);});
  document.querySelector<HTMLInputElement>('#tilt')?.addEventListener('input',e=>{const el=e.target as HTMLInputElement;scene?.setElevation(+el.value);rangeFill(el);});
  document.querySelector<HTMLInputElement>('#preview')?.addEventListener('input',e=>{const el=e.target as HTMLInputElement;preview=+el.value;scene?.setMelt(preview);rangeFill(el);document.querySelector('#preview-output')!.textContent=`${preview}%`;document.querySelector('#preview-disclaimer')!.classList.remove('quiet');});
}
function action(key:string){
  if(key==='settings')settings();
  if(key==='timer'){state.session=state.session.running?pauseSession(state.session):startSession(state.session);preview=null;save();updateTimer();document.querySelectorAll<HTMLButtonElement>('[data-duration]').forEach(el=>el.disabled=state.session.running);}
  if(key==='reset'){if(!state.session.running&&state.session.remaining===state.session.duration)return;confirm(t('resetTitle'),t('resetHint'),()=>{state.session=freshSession(state.session.duration,state.session.target);preview=null;save();render();});}
  if(key==='live'){preview=null;updateTimer();}
  if(key==='reset-view'){scene?.reset();for(const [id,value]of[['rotate','2'],['tilt','25']]){const el=document.querySelector<HTMLInputElement>('#'+id);if(el){el.value=value;rangeFill(el);}}}
  if(key==='sound')void sound();
  if(key==='choose')location.hash='collection';
  if(key==='edit'){editing=!editing;render();}
  if(key==='demo'){demo=true;demoPlacements=[{uid:guid(),kind:'dino',asset:0,x:36,y:49,scale:1.05,flip:false},{uid:guid(),kind:'dino',asset:1,x:29,y:60,scale:1,flip:true},{uid:guid(),kind:'dino',asset:2,x:58,y:56,scale:1,flip:false},{uid:guid(),kind:'dino',asset:3,x:50,y:69,scale:1,flip:false}];selected=null;editing=false;render();}
  if(key==='exit-demo'){demo=false;demoPlacements=[];selected=null;editing=false;render();}
}
let lastTimerLabel='';
function updateTimer(){
  if(state.session.running&&remainingSeconds(state.session)<=0){complete();return;}
  if(page!=='focus')return;
  const digits=document.querySelector('#timer-digits');if(!digits)return;
  const remaining=remainingSeconds(state.session),progress=progressPercent(state.session);
  digits.textContent=formatTime(remaining);document.title=`${state.session.running?formatTime(remaining)+' · ':''}MeltTime`;
  (document.querySelector('#session-progress')as HTMLElement).style.width=`${progress}%`;
  document.querySelector('#melt-percent')!.textContent=`${Math.floor(progress)}% ${t('melted')}`;
  const label=t(state.session.running?'pause':remaining<state.session.duration?'resume':'start');
  const button=document.querySelector<HTMLButtonElement>('#timer-toggle')!;
  if(lastTimerLabel!==label||button.getAttribute('aria-label')!==label){button.innerHTML=icon(state.session.running?'pause':'play');button.setAttribute('aria-label',label);document.querySelector('#timer-label')!.textContent=label;lastTimerLabel=label;refreshIcons();}
  if(preview===null){scene?.setMelt(progress);const input=document.querySelector<HTMLInputElement>('#preview')!;input.value=String(Math.floor(progress));rangeFill(input);document.querySelector('#preview-output')!.textContent=`${Math.floor(progress)}%`;document.querySelector('#preview-disclaimer')!.classList.add('quiet');}
}
function complete(){const target=state.session.target,isNew=!state.collected.includes(target);state=finishSession(state);preview=null;save();render();modal(`<div class="celebration"><span class="modal-kicker">${t('complete')}</span><div class="celebration-art"><img src="${imageFor(target)}" alt="${name(target)}"/><span>✧</span><span>✦</span></div><h2>${isNew?t('hello'):t('complete')}</h2><h3>${name(target)}</h3><p>${t(isNew?'completeHint':'completeAgain')}</p><button class="primary-button" id="place-completed">${icon('flower-2')} ${t('place')}</button><button class="text-button" id="continue-completed">${t('continue')}</button></div>`);document.querySelector('#place-completed')!.addEventListener('click',()=>{demo=false;closeModal();addDino(target);});document.querySelector('#continue-completed')!.addEventListener('click',closeModal);}
function detail(id:number){const d=dinosaurs[id],found=state.collected.includes(id);modal(`<div class="dino-detail"><span class="modal-kicker">NO. ${String(id+1).padStart(2,'0')} · ${t(groupNames[d.group])}</span><div class="detail-art ${found?'':'frozen'}"><img src="${imageFor(id)}" alt="${found?name(id):t('unknown')}"/>${found?'':'<span class="mini-ice"></span>'}</div><span class="detail-state">${icon(found?'check':'snowflake')} ${t(found?'found':'sleeping')}</span><h2>${found?name(id):'???'}</h2><p class="scientific-name">${found?d.en:t('unknown')}</p><div class="detail-facts"><span>${icon('leaf')} ${t(d.diet)}</span><span>${icon('mountain')} ${t(d.era)}</span></div><p>${t('dinoHint')}</p><button class="primary-button" id="revive-dino">${icon('play')} ${t(found?'focusTogether':'revive')}</button>${found?`<button class="secondary-button" id="place-dino">${icon('flower-2')} ${t('place')}</button>`:''}</div>`);
  document.querySelector('#revive-dino')!.addEventListener('click',()=>{
    const change=()=>{state.session=freshSession(state.session.duration,id);preview=null;save();closeModal();if(page==='focus')render();else location.hash='focus';};
    if(id===state.session.target){closeModal();location.hash='focus';return;}
    if(state.session.running||state.session.remaining<state.session.duration)confirm(t('resetTitle'),t('resetHint'),change);else change();
  });
  document.querySelector('#place-dino')?.addEventListener('click',()=>{demo=false;closeModal();addDino(id);});
}
function addDino(id:number){
  if(!(demo?id<4:state.collected.includes(id))){detail(id);return;}
  const existing=placements().find(p=>p.kind==='dino'&&p.asset===id);
  if(existing){selected=existing.uid;editing=true;if(page!=='map')location.hash='map';else render();return;}
  addPlacement('dino',id);
}
function addPlacement(kind:'dino'|'decor',asset:number|string){
  if(placements().length>=24){toast(t('gardenLimit'));return;}
  const spots=[[45,50],[65,65],[30,70],[51,80],[25,51],[76,77]],spot=spots[placements().length%spots.length];
  const item:Placement={uid:guid(),kind,asset,x:spot[0],y:spot[1],scale:1,flip:false};placements().push(item);selected=item.uid;editing=true;if(!demo)save();
  if(page!=='map')location.hash='map';else render();
}
function updateSelection(){
  const host=document.querySelector('#garden-selection');if(!host)return;
  document.querySelectorAll<HTMLElement>('.garden-actor').forEach(el=>el.classList.toggle('selected',el.dataset.uid===selected));
  const p=placements().find(p=>p.uid===selected);
  if(!p){host.innerHTML='';host.classList.remove('visible');return;}
  const label=p.kind==='dino'?name(Number(p.asset)):decorations.find(d=>d.id===p.asset)![state.language];
  if(p.kind==='dino'&&!editing){
    host.classList.add('visible','pet-controls');
    host.innerHTML=`<span>${label}</span><div>${(['idle','walk','look','eat','happy','sleep'] as Behaviour[]).map((b,i)=>`<button data-behaviour="${b}" aria-label="${t(b)}">${icon(['leaf','footprints','sparkles','flower-2','heart','clock-3'][i])}<span>${t(b)}</span></button>`).join('')}</div>`;
    host.querySelectorAll<HTMLElement>('[data-behaviour]').forEach(el=>el.onclick=()=>{garden?.interact(p.uid,el.dataset.behaviour as Behaviour);host.querySelectorAll('[data-behaviour]').forEach(b=>b.classList.toggle('active',b===el));});refreshIcons();return;
  }
  host.classList.remove('pet-controls');
  host.classList.add('visible');host.innerHTML=`<span>${label}</span><div><button data-transform="smaller" aria-label="${t('smaller')}">${icon('minus')}</button><button data-transform="bigger" aria-label="${t('bigger')}">${icon('plus')}</button><button data-transform="flip" aria-label="${t('flip')}">${icon('flip-horizontal-2')}</button><button data-transform="remove" aria-label="${t('remove')}">${icon('trash-2')}</button></div>`;
  host.querySelectorAll<HTMLElement>('[data-transform]').forEach(el=>el.onclick=()=>{
    const op=el.dataset.transform;
    if(op==='remove'){if(demo)demoPlacements=demoPlacements.filter(x=>x.uid!==p.uid);else state.garden=state.garden.filter(x=>x.uid!==p.uid);selected=null;}
    if(op==='flip')p.flip=!p.flip;if(op==='bigger')p.scale=Math.min(1.6,p.scale+.12);if(op==='smaller')p.scale=Math.max(.65,p.scale-.12);
    if(!demo)save();render();
  });refreshIcons();
}
function modal(content:string){const el=document.querySelector<HTMLDialogElement>('#modal')!;el.innerHTML=`<button class="modal-close round-button" aria-label="${t('close')}">${icon('x')}</button>${content}`;if(!el.open)el.showModal();el.querySelector('.modal-close')!.addEventListener('click',closeModal);el.onclick=e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}};refreshIcons();}
function closeModal(){document.querySelector<HTMLDialogElement>('#modal')?.close();}
function confirm(heading:string,message:string,yes:()=>void){modal(`<div class="confirm-content">${icon('snowflake')}<h2>${heading}</h2><p>${message}</p><div><button class="secondary-button" id="cancel-confirm">${t('cancel')}</button><button class="primary-button" id="yes-confirm">${t('confirm')}</button></div></div>`);document.querySelector('#cancel-confirm')!.addEventListener('click',closeModal);document.querySelector('#yes-confirm')!.addEventListener('click',()=>{closeModal();yes();});}
function settings(){modal(`<div class="settings-content"><span class="modal-kicker">MELTTIME</span><h2>${t('settings')}</h2><div class="setting-row language-row"><span>${icon('globe')} ${t('language')}</span><div class="language-options"><button data-language="ko" class="${state.language==='ko'?'active':''}">한국어</button><button data-language="en" class="${state.language==='en'?'active':''}">English</button></div></div><label class="setting-row"><span>${icon('volume-2')} ${t('sound')}</span><input id="sound-setting" type="checkbox" ${state.sound?'checked':''}/></label><label class="setting-row"><span>${icon('sparkles')} ${t('motion')}</span><input id="motion-setting" type="checkbox" ${state.motion?'checked':''}/></label><p class="storage-note">${t('storage')}</p><button class="danger-button" id="reset-data">${t('resetData')}</button></div>`);
  document.querySelectorAll<HTMLElement>('[data-language]').forEach(el=>el.onclick=()=>{state.language=el.dataset.language as Language;save();render();settings();});
  document.querySelector('#sound-setting')!.addEventListener('change',()=>void sound());
  document.querySelector<HTMLInputElement>('#motion-setting')!.addEventListener('change',e=>{state.motion=(e.target as HTMLInputElement).checked;scene?.setMotion(state.motion);garden?.setMotion(state.motion&&!editing);save();});
  document.querySelector('#reset-data')!.addEventListener('click',()=>confirm(t('deleteTitle'),t('deleteHint'),()=>{const language=state.language;audioContext?.close();audioContext=null;state={...defaults(),language};demo=false;demoPlacements=[];selected=null;preview=null;save();render();}));
}
async function sound(){
  try{
    if(audioContext){await audioContext.close();audioContext=null;state.sound=false;}
    else{audioContext=new AudioContext();const length=audioContext.sampleRate*4,buffer=audioContext.createBuffer(1,length,audioContext.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}const source=audioContext.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;const gain=audioContext.createGain();gain.gain.value=.16;source.connect(filter).connect(gain).connect(audioContext.destination);source.start();await audioContext.resume();state.sound=true;}
    save();document.querySelectorAll('[data-action="sound"]').forEach(el=>el.innerHTML=icon(state.sound?'volume-2':'volume-x'));const check=document.querySelector<HTMLInputElement>('#sound-setting');if(check)check.checked=state.sound;refreshIcons();toast(t(state.sound?'soundOn':'soundOff'));
  }catch{audioContext=null;state.sound=false;save();toast(t('soundError'));}
}
function toast(message:string){const el=document.querySelector('.toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function route(){const value=location.hash.slice(1);page=(['focus','collection','map','profile'].includes(value)?value:'focus')as Page;render();window.scrollTo(0,0);}
window.addEventListener('hashchange',route);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateTimer();garden?.setMotion(!document.hidden&&state.motion&&!editing);});
state.sound=false;save();route();setInterval(updateTimer,250);
