import {RiveDinosaur,type Behaviour} from './rive-dinosaur';
import {dinosaurs,decorations,decorationArt,imageFor,dinoName,type Language} from './catalog';
import type {Placement} from './state';
import {translate} from './i18n';

export class Garden {
  private actors:RiveDinosaur[]=[];
  private pets=new Map<string,{rive:RiveDinosaur;el:HTMLElement;placement:Placement;state:Behaviour;until:number;index:number}>();
  private frame=0;
  private moving=false;
  private controller=new AbortController();
  constructor(host:HTMLElement,placements:Placement[],lang:Language,motion:boolean,editing:boolean,onSelect:(uid:string)=>void,onMove:(uid:string,x:number,y:number)=>void){
    this.moving=motion&&!editing;
    for(const placement of placements){
      const actor=document.createElement('div');actor.className=`garden-actor ${placement.kind}`;actor.tabIndex=0;actor.setAttribute('role','button');actor.dataset.uid=placement.uid;
      const id=Number(placement.asset),decor=decorations.find(d=>d.id===placement.asset);
      const label=placement.kind==='dino'?dinoName(id,lang):decor?.[lang]||'';
      actor.setAttribute('aria-label',`${label} · ${translate('move',lang)}`);
      const width=placement.kind==='dino'?(dinosaurs[id].id==='pteranodon'?27:29):decor?.width||18;
      actor.style.left=`${placement.x}%`;actor.style.top=`${placement.y}%`;actor.style.width=`${width*placement.scale}%`;actor.style.zIndex=String(Math.round(placement.y));
      actor.innerHTML=`<div class="actor-art" style="transform:scaleX(${placement.flip?-1:1})">${placement.kind==='dino'?`<img src="${imageFor(id)}" alt="" class="actor-fallback" draggable="false"/><canvas aria-label="${label}"></canvas>`:decorationArt(String(placement.asset))}</div><span class="actor-name">${label}</span>`;
      host.append(actor);
      if(placement.kind==='dino'){
        const canvas=actor.querySelector('canvas')!;
        const rive=new RiveDinosaur(canvas,id,motion&&!editing,()=>{actor.classList.add('animation-error');actor.title=translate('riveError',lang);});
        this.actors.push(rive);
        this.pets.set(placement.uid,{rive,el:actor,placement,state:'idle',until:performance.now()+2200+this.pets.size*1300,index:this.pets.size});
      }
      let drag:{pointer:number;startX:number;startY:number;x:number;y:number;rect:DOMRect}|null=null;
      const options={signal:this.controller.signal};
      actor.addEventListener('click',()=>{if(!editing&&placement.kind==='dino')this.interact(placement.uid,'happy');onSelect(placement.uid);},options);
      actor.addEventListener('pointerdown',e=>{
        if(!editing)return;
        onSelect(placement.uid);
        e.preventDefault();actor.setPointerCapture(e.pointerId);actor.classList.add('dragging');
        drag={pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:placement.x,y:placement.y,rect:host.getBoundingClientRect()};
      },options);
      actor.addEventListener('pointermove',e=>{
        if(!drag||drag.pointer!==e.pointerId)return;
        const x=Math.max(12,Math.min(88,drag.x+(e.clientX-drag.startX)/drag.rect.width*100));
        const y=Math.max(26,Math.min(87,drag.y+(e.clientY-drag.startY)/drag.rect.height*100));
        actor.style.left=`${x}%`;actor.style.top=`${y}%`;actor.style.zIndex=String(Math.round(y));
        placement.x=x;placement.y=y;
      },options);
      const finish=()=>{if(!drag)return;actor.classList.remove('dragging');drag=null;onMove(placement.uid,placement.x,placement.y);};
      actor.addEventListener('pointerup',finish,options);actor.addEventListener('pointercancel',finish,options);actor.addEventListener('lostpointercapture',finish,options);
      actor.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!editing&&placement.kind==='dino')this.interact(placement.uid,'happy');onSelect(placement.uid);return;}
        if(!editing||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
        e.preventDefault();onSelect(placement.uid);
        placement.x=Math.max(12,Math.min(88,placement.x+(e.key==='ArrowRight'?2:e.key==='ArrowLeft'?-2:0)));
        placement.y=Math.max(26,Math.min(87,placement.y+(e.key==='ArrowDown'?2:e.key==='ArrowUp'?-2:0)));
        actor.style.left=`${placement.x}%`;actor.style.top=`${placement.y}%`;onMove(placement.uid,placement.x,placement.y);
      },options);
    }
    this.frame=requestAnimationFrame(this.animate);
  }
  interact(uid:string,state:Behaviour){const pet=this.pets.get(uid);if(!pet)return;pet.state=state;pet.until=performance.now()+(state==='happy'?1600:state==='look'?3200:state==='eat'?6000:8000);pet.rive.setBehaviour(state);pet.el.dataset.activity=state;pet.el.querySelector('.pet-reaction')?.remove();const reactions:Partial<Record<Behaviour,string>>={happy:'♡',eat:'🌿',sleep:'z z z',look:'?'};if(reactions[state]){const badge=document.createElement('span');badge.className='pet-reaction';badge.textContent=reactions[state]!;badge.setAttribute('aria-hidden','true');pet.el.append(badge);}}
  private animate=(now:number)=>{
    if(this.moving)for(const pet of this.pets.values()){
      if(now>pet.until&&pet.state!=='sleep'){const next=pet.state==='walk'?'idle':'walk';pet.state=next;pet.rive.setBehaviour(next);pet.el.querySelector('.pet-reaction')?.remove();pet.until=now+(next==='walk'?5200:3500)+pet.index*220;}
      if(pet.state==='walk'){const phase=(now/2800+pet.index)*Math.PI;pet.el.style.left=`${Math.max(12,Math.min(88,pet.placement.x+Math.sin(phase)*2.5))}%`;}
    }
    this.frame=requestAnimationFrame(this.animate);
  };
  setMotion(enabled:boolean){this.moving=enabled;this.actors.forEach(actor=>actor.setMotion(enabled));}
  dispose(){cancelAnimationFrame(this.frame);this.controller.abort();this.actors.forEach(actor=>actor.dispose());this.actors=[];this.pets.clear();}
}
