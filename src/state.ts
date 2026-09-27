import {dinosaurs,type Language} from './catalog';
export type Session={duration:number;remaining:number;running:boolean;endsAt:number|null;target:number};
export type FocusRecord={date:string;seconds:number;target:number};
export type Placement={uid:string;kind:'dino'|'decor';asset:number|string;x:number;y:number;scale:number;flip:boolean};
export type Saved={version:2;session:Session;collected:number[];history:FocusRecord[];sound:boolean;motion:boolean;language:Language;garden:Placement[]};
export const STORE='melttime-v2';
export const freshSession=(duration=1500,target=0):Session=>({duration,remaining:duration,running:false,endsAt:null,target});
export const defaults=():Saved=>({version:2,session:freshSession(),collected:[],history:[],sound:false,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,language:'ko',garden:[]});
const validId=(id:unknown):id is number=>typeof id==='number'&&Number.isInteger(id)&&id>=0&&id<dinosaurs.length;
const validSession=(s:Session)=>s&&Number.isFinite(s.duration)&&s.duration>0&&s.duration<=3600&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=s.duration&&validId(s.target)&&typeof s.running==='boolean'&&(!s.running||Number.isFinite(s.endsAt));
export function readState():Saved{
  const base=defaults();
  try{
    const current=localStorage.getItem(STORE);let raw=JSON.parse(current||localStorage.getItem('melttime-v1')||'null');
    if(!raw)return base;
    if(!current){const mapping=[0,1,2,17,11,15,16,1,2];raw={...raw,session:{...raw.session,target:mapping[raw.session?.target]??0},collected:(raw.collected||[]).map((id:number)=>mapping[id]),history:(raw.history||[]).map((h:FocusRecord)=>({...h,target:mapping[h.target]??0})),language:'ko',garden:[]};}
    const collected=[...new Set<number>((raw.collected||[]).filter(validId))];
    const garden=(Array.isArray(raw.garden)?raw.garden:[]).filter((p:Placement)=>p&&typeof p.uid==='string'&&['dino','decor'].includes(p.kind)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.scale)&&(p.kind==='decor'?['tree','flowers','rocks','pond','log','bush','sign'].includes(String(p.asset)):validId(p.asset)&&collected.includes(p.asset))).slice(0,24).map((p:Placement)=>({...p,x:Math.max(12,Math.min(88,p.x)),y:Math.max(24,Math.min(86,p.y)),scale:Math.max(.65,Math.min(1.6,p.scale)),flip:!!p.flip}));
    return {...base,session:validSession(raw.session)?raw.session:base.session,collected,history:(Array.isArray(raw.history)?raw.history:[]).filter((h:FocusRecord)=>h&&validId(h.target)&&Number.isFinite(h.seconds)&&h.seconds>0&&h.seconds<=3600&&Number.isFinite(Date.parse(h.date))),motion:raw.motion!==false,language:raw.language==='en'?'en':'ko',garden};
  }catch{return base;}
}
