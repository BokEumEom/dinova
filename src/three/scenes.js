import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { MAP_SLOTS } from '../data/mapSlots.mjs'
import { createCreature } from './creatures.js'
import { fitCreatureModel, loadCreatureModel } from './modelLoader.js'

const rendererFor = (canvas) => { const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); r.setPixelRatio(Math.min(devicePixelRatio||1,1.7)); r.shadowMap.enabled=true; r.shadowMap.type=THREE.PCFSoftShadowMap; r.outputColorSpace=THREE.SRGBColorSpace; return r }
const lights=(s)=>{ s.add(new THREE.HemisphereLight(0xf3ffff,0x8abf9c,2)); const d=new THREE.DirectionalLight(0xffffff,2.6); d.position.set(6,9,5); d.castShadow=true; s.add(d) }
const resize=(r,c,canvas)=>{ const w=canvas.clientWidth||1,h=canvas.clientHeight||1;if(canvas.width!==Math.round(w*r.getPixelRatio())||canvas.height!==Math.round(h*r.getPixelRatio())){r.setSize(w,h,false);c.aspect=w/h;c.updateProjectionMatrix()} }
const dispose=(scene)=>scene.traverse(o=>{o.geometry?.dispose?.(); if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()})
function loadOrFallback(id,height=3){ const holder=new THREE.Group(); const fallback=createCreature(id); holder.add(fallback); loadCreatureModel(id).then(m=>{holder.clear();holder.add(fitCreatureModel(m,height))}).catch(()=>{}); holder.userData.creatureId=id; return holder }
function iceMaterial(){ return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uMelt:{value:0},uTime:{value:0}},vertexShader:`varying vec3 vPos;varying vec3 vNormal;void main(){vPos=position;vNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float uMelt;uniform float uTime;varying vec3 vPos;varying vec3 vNormal;float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}void main(){float n=hash(floor(vPos*5.));float threshold=mix(-2.2,2.5,uMelt);if(vPos.y+n*.55<threshold)discard;float edge=smoothstep(.0,.18,abs((vPos.y+n*.55)-threshold));float fres=pow(1.-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),2.);vec3 c=mix(vec3(.72,.94,.98),vec3(.92,1.,1.),fres);float a=mix(.56,.12,uMelt)*(1.-edge*.25);gl_FragColor=vec4(c,a);}`}) }
export function createMeltScene(canvas,progress=0,creatureId='brachiosaurus'){ const s=new THREE.Scene(),c=new THREE.PerspectiveCamera(38,1,.1,60),r=rendererFor(canvas);r.setClearColor(0x000000,0);c.position.set(0,1.6,7);c.lookAt(0,1.5,0);lights(s);const im=iceMaterial(),ice=new THREE.Mesh(new THREE.DodecahedronGeometry(2.15,1),im);ice.position.y=1.55;ice.scale.set(1.12,1.42,.84);s.add(ice);const shardMat=new THREE.MeshPhysicalMaterial({color:0xcff4f8,transparent:true,opacity:.38,roughness:.18,transmission:.2,flatShading:true});const shards=[];for(let i=0;i<8;i++){const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.13+(i%3)*.05,0),shardMat.clone());const a=i/8*Math.PI*2;shard.position.set(Math.cos(a)*(1.45+(i%2)*.12),.12+(i%3)*.05,Math.sin(a)*.5);shard.rotation.set(i*.2,i*.41,i*.17);s.add(shard);shards.push(shard)}let target=progress,dead=false,raf;const clock=new THREE.Clock();function frame(){if(dead)return;resize(r,c,canvas);const t=clock.getElapsedTime();im.uniforms.uMelt.value+=(target-im.uniforms.uMelt.value)*.06;im.uniforms.uTime.value=t;ice.rotation.y=Math.sin(t*.2)*.035;shards.forEach((shard,i)=>{shard.material.opacity=Math.max(.04,.38-target*.32);shard.position.y=.12+(i%3)*.05+Math.sin(t*.8+i)*.018});r.render(s,c);raf=requestAnimationFrame(frame)}frame();return{setProgress(v){target=Math.min(1,Math.max(0,v))},destroy(){dead=true;cancelAnimationFrame(raf);r.dispose();dispose(s)}} }
function tree(s,x,z,k=1,crownColor=0x6fc293){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.1*k,.16*k,.9*k,6),new THREE.MeshStandardMaterial({color:0x9b8065,flatShading:true}));t.position.set(x,.45*k,z);s.add(t); const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.55*k,1),new THREE.MeshStandardMaterial({color:crownColor,flatShading:true,roughness:.9}));crown.position.set(x,1.25*k,z);crown.castShadow=true;s.add(crown) }
function rock(s,x,z,k=1){ const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.42*k,0),new THREE.MeshStandardMaterial({color:0x9aa79e,roughness:1,flatShading:true}));m.scale.set(1.35,.7,1);m.position.set(x,.18*k,z);m.castShadow=true;m.receiveShadow=true;s.add(m) }
function flower(s,x,z,color=0xfff3c4){ const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,.2,5),new THREE.MeshStandardMaterial({color:0x5aa774}));stem.position.set(x,.1,z);s.add(stem); const head=new THREE.Mesh(new THREE.OctahedronGeometry(.055,0),new THREE.MeshStandardMaterial({color,flatShading:true}));head.position.set(x,.22,z);s.add(head) }
function pathStone(s,x,z,scale=.32){ const m=new THREE.Mesh(new THREE.CylinderGeometry(scale,scale*.9,.06,7),new THREE.MeshStandardMaterial({color:0xd8d4c7,roughness:1,flatShading:true}));m.position.set(x,.04,z);m.rotation.y=x*.31;s.add(m) }
export function createMeadowScene(canvas,revivedIds=[],onCreatureClick=()=>{},areaId='meadow'){
  const themes={
    meadow:{sky:0xc8e9f4,ground:0x9edb91,cliff:0xb8aa8f,water:0x7fd4dc,tree:0x6fc293,flower:true},
    'snowy-ridge':{sky:0xd9f1f7,ground:0xe8f4f1,cliff:0xc6d8dc,water:0x91deea,tree:0x6da69b,flower:false},
    'ancient-forest':{sky:0xd2e9df,ground:0x78b986,cliff:0x8d9d7d,water:0x6fc6bd,tree:0x3e8f70,flower:true},
    'lost-coast':{sky:0xccecf2,ground:0xb8dda2,cliff:0xc6ad86,water:0x68cfdf,tree:0x62ad88,flower:true},
  }
  const theme=themes[areaId]||themes.meadow
  const s=new THREE.Scene();s.background=new THREE.Color(theme.sky);s.fog=new THREE.Fog(theme.sky,13,31)
  const c=new THREE.PerspectiveCamera(42,1,.1,90),r=rendererFor(canvas);c.position.set(9.5,7.8,11.8);lights(s)
  const controls=new OrbitControls(c,canvas);controls.target.set(0,.75,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=6;controls.maxDistance=18;controls.maxPolarAngle=1.25
  const island=new THREE.Mesh(new THREE.CylinderGeometry(7.2,7.9,.92,24),new THREE.MeshStandardMaterial({color:theme.ground,flatShading:true,roughness:.97}));island.position.y=-.42;island.receiveShadow=true;s.add(island)
  const cliff=new THREE.Mesh(new THREE.CylinderGeometry(6.65,7.25,.7,24),new THREE.MeshStandardMaterial({color:theme.cliff,flatShading:true,roughness:1}));cliff.position.y=-.98;s.add(cliff)
  const pond=new THREE.Mesh(new THREE.CircleGeometry(areaId==='lost-coast'?3.15:2.05,32),new THREE.MeshPhysicalMaterial({color:theme.water,transparent:true,opacity:.82,roughness:.18,metalness:0}));pond.rotation.x=-Math.PI/2;pond.position.set(areaId==='lost-coast'?1.1:1.7,.025,-1.05);s.add(pond)
  const stream=new THREE.Mesh(new THREE.PlaneGeometry(areaId==='lost-coast'?1.7:1.15,5.8,1,6),new THREE.MeshPhysicalMaterial({color:theme.water,transparent:true,opacity:.72,roughness:.16}));stream.rotation.x=-Math.PI/2;stream.rotation.z=-.22;stream.position.set(2.65,.03,2.2);s.add(stream)
  const treeCount=areaId==='ancient-forest'?11:areaId==='lost-coast'?5:7
  const treeSpots=[[-4,-3],[4,-3],[-4,3],[4,3],[-1,4.8],[-5,.5],[5,.7],[1.9,4.7],[-2.2,-4.8],[5,-1.7],[-5,2]]
  treeSpots.slice(0,treeCount).forEach(([x,z],i)=>tree(s,x,z,.64+(i%3)*.12,theme.tree))
  [[-2.7,-3.5],[-4.3,-1.3],[3.8,2.8],[.4,4.4],[4.6,-.8]].forEach(([x,z],i)=>rock(s,x,z,.7+(i%2)*.25))
  if(theme.flower)for(let i=0;i<24;i++){const a=i*.82,rad=3.2+(i%4)*.55;flower(s,Math.cos(a)*rad,Math.sin(a)*rad,i%2?0xfff1b7:0xf7fbff)}
  if(areaId==='snowy-ridge'){for(let i=0;i<14;i++){const a=i*.53,rad=2.8+(i%4)*.7;const snow=new THREE.Mesh(new THREE.OctahedronGeometry(.18+(i%3)*.05,0),new THREE.MeshStandardMaterial({color:0xf3fbfb,flatShading:true}));snow.position.set(Math.cos(a)*rad,.12,Math.sin(a)*rad);s.add(snow)}}
  for(let i=0;i<8;i++)pathStone(s,-2.1+i*.55,1.55-Math.sin(i*.7)*.22,.22+(i%2)*.04)
  const groups=[]
  MAP_SLOTS.forEach((slot,index)=>{
    if(slot.areaId!==areaId||!revivedIds.includes(slot.creatureId))return
    const g=loadOrFallback(slot.creatureId,slot.creatureId==='brachiosaurus'||slot.creatureId==='amargasaurus'?3.1:2.2)
    g.position.set(...slot.position);g.rotation.y=slot.rotationY;g.scale.setScalar(slot.scale);g.userData.creatureId=slot.creatureId
    g.userData.motion={homeX:slot.position[0],homeY:slot.position[1],homeZ:slot.position[2],phase:index*1.73,radius:slot.aquatic?.42:.18+(index%3)*.06,speed:slot.flight?.18:.075+(index%2)*.025,flight:!!slot.flight,aquatic:!!slot.aquatic}
    s.add(g);groups.push(g)
  })
  const ray=new THREE.Raycaster(),p=new THREE.Vector2()
  const click=e=>{const rect=canvas.getBoundingClientRect();p.x=((e.clientX-rect.left)/rect.width)*2-1;p.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(p,c);const hit=ray.intersectObjects(groups,true)[0];if(!hit)return;let o=hit.object;while(o&&!o.userData.creatureId)o=o.parent;if(o?.userData.creatureId)onCreatureClick(o.userData.creatureId)}
  canvas.addEventListener('click',click)
  let dead=false,raf;const clock=new THREE.Clock()
  function frame(){if(dead)return;resize(r,c,canvas);controls.update();const t=clock.getElapsedTime();groups.forEach((g,i)=>{const m=g.userData.motion,a=t*m.speed+m.phase;const nextX=m.homeX+Math.cos(a)*m.radius,nextZ=m.homeZ+Math.sin(a*.9)*m.radius;const dx=nextX-g.position.x,dz=nextZ-g.position.z;g.position.x=nextX;g.position.z=nextZ;g.position.y=m.homeY+(m.flight?Math.sin(t*.85+i)*.18:m.aquatic?Math.sin(t*.65+i)*.05:Math.sin(t*.72+i)*.025);if(Math.abs(dx)+Math.abs(dz)>.0001)g.rotation.y=Math.atan2(dx,dz)});r.render(s,c);raf=requestAnimationFrame(frame)}
  frame()
  return{destroy(){dead=true;cancelAnimationFrame(raf);canvas.removeEventListener('click',click);controls.dispose();r.dispose();dispose(s)}}
}
