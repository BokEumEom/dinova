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
function mountain(s,x,y,z,k=1,color=0xbccbd2){const m=new THREE.Mesh(new THREE.ConeGeometry(1.65*k,3.5*k,5),new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1}));m.position.set(x,y+1.5*k,z);m.rotation.y=.35;s.add(m);const cap=new THREE.Mesh(new THREE.ConeGeometry(.72*k,1.15*k,5),new THREE.MeshStandardMaterial({color:0xf1f7f6,flatShading:true,roughness:1}));cap.position.set(x,y+3.15*k,z);cap.rotation.y=.35;s.add(cap)}
function stoneArch(s,x,z,k=1){const mat=new THREE.MeshStandardMaterial({color:0xaebfc2,flatShading:true,roughness:1});const left=new THREE.Mesh(new THREE.DodecahedronGeometry(.55*k,0),mat),right=left.clone(),top=new THREE.Mesh(new THREE.DodecahedronGeometry(.72*k,0),mat);left.scale.set(.8,1.7,.8);right.scale.set(.8,1.7,.8);top.scale.set(1.65,.62,.75);left.position.set(x-.7*k,.75*k,z);right.position.set(x+.7*k,.75*k,z);top.position.set(x,1.62*k,z);left.castShadow=right.castShadow=top.castShadow=true;s.add(left,right,top)}
function cloud(s,x,y,z,k=1){const mat=new THREE.MeshBasicMaterial({color:0xf7fbfb,transparent:true,opacity:.9});[[-.7,0,0,.65],[0,.1,0,.9],[.75,-.05,0,.55]].forEach(([dx,dy,dz,scale])=>{const c=new THREE.Mesh(new THREE.IcosahedronGeometry(scale*k,1),mat);c.position.set(x+dx*k,y+dy*k,z+dz);c.scale.y=.6;s.add(c)})}
function bush(s,x,z,k=1,color=0x70b884){const mat=new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1});[[-.25,0,.9],[.18,.02,.72],[0,.18,.8]].forEach(([dx,dy,scale])=>{const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.42*k*scale,1),mat);b.position.set(x+dx*k,.24*k+dy,z);s.add(b)})}
function waterfall(s,x,z,width=1.25,height=2.6,color=0x6ed9ec){const mat=new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.84,roughness:.12});const fall=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);fall.position.set(x,height/2-.05,z);fall.rotation.y=Math.PI;s.add(fall);for(let i=0;i<6;i++){const foam=new THREE.Mesh(new THREE.OctahedronGeometry(.12+(i%2)*.04,0),new THREE.MeshStandardMaterial({color:0xf3fbfb,flatShading:true}));foam.position.set(x-width*.42+i*(width*.16),.04,z-.08);s.add(foam)}}

export function createMeadowScene(canvas,revivedIds=[],onCreatureClick=()=>{},areaId='meadow'){
  const themes={
    meadow:{sky:0xc8ecfb,ground:0xa8e58b,cliff:0xb5c7c9,water:0x61d7e9,tree:0x4fa883,flower:true},
    'snowy-ridge':{sky:0xd9f1f7,ground:0xe8f4f1,cliff:0xc6d8dc,water:0x91deea,tree:0x6da69b,flower:false},
    'ancient-forest':{sky:0xd2e9df,ground:0x78b986,cliff:0x8d9d7d,water:0x6fc6bd,tree:0x3e8f70,flower:true},
    'lost-coast':{sky:0xccecf2,ground:0xb8dda2,cliff:0xc6ad86,water:0x68cfdf,tree:0x62ad88,flower:true},
  }
  const theme=themes[areaId]||themes.meadow
  const s=new THREE.Scene();s.background=new THREE.Color(theme.sky);s.fog=new THREE.Fog(theme.sky,15,35)
  const c=new THREE.PerspectiveCamera(39,1,.1,100),r=rendererFor(canvas);c.position.set(9.6,8.4,12.6);c.lookAt(0,.9,0);lights(s)
  const controls=new OrbitControls(c,canvas);controls.target.set(0,.8,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=18;controls.minPolarAngle=.7;controls.maxPolarAngle=1.22

  const island=new THREE.Mesh(new THREE.CylinderGeometry(7.6,8.15,.95,28),new THREE.MeshStandardMaterial({color:theme.ground,flatShading:true,roughness:.98}));island.position.y=-.44;island.receiveShadow=true;s.add(island)
  const cliff=new THREE.Mesh(new THREE.CylinderGeometry(7.05,7.65,.8,28),new THREE.MeshStandardMaterial({color:theme.cliff,flatShading:true,roughness:1}));cliff.position.y=-1.03;s.add(cliff)

  // The Sunny Plains composition intentionally mirrors the supplied reference image:
  // mountain wall behind, stone arch on the left, waterfall/lake on the right and creek in front.
  if(areaId==='meadow'){
    mountain(s,-5.8,-.05,-7.3,1.25,0xb7cbd4);mountain(s,-2.9,-.1,-8.3,1.6,0xaec3cf);mountain(s,.1,-.05,-8.8,1.25,0xb6c9d2);mountain(s,3.2,-.1,-8,1.45,0xb3c7cf);mountain(s,6,-.1,-7.1,1.1,0xbdced3)
    cloud(s,-4.8,6.6,-9,1.2);cloud(s,2.6,6.7,-9.5,1)
    stoneArch(s,-4.9,-.4,1.15)
    const plateau=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.3,3.1),new THREE.MeshStandardMaterial({color:0xb7c9ca,flatShading:true,roughness:1}));plateau.position.set(4.75,.55,-4.2);plateau.castShadow=true;plateau.receiveShadow=true;s.add(plateau)
    const grassTop=new THREE.Mesh(new THREE.BoxGeometry(3.3,.18,3.2),new THREE.MeshStandardMaterial({color:0xa9e28f,flatShading:true,roughness:1}));grassTop.position.set(4.75,1.78,-4.2);s.add(grassTop)
    waterfall(s,4.75,-2.62,1.15,2.35,theme.water)
  }

  const pond=new THREE.Mesh(new THREE.CircleGeometry(areaId==='meadow'?2.55:areaId==='lost-coast'?3.15:2.05,36),new THREE.MeshPhysicalMaterial({color:theme.water,transparent:true,opacity:.83,roughness:.15}));pond.rotation.x=-Math.PI/2;pond.position.set(areaId==='meadow'?4.05:areaId==='lost-coast'?1.1:1.7,.025,areaId==='meadow'?-1.85:-1.05);s.add(pond)
  const stream=new THREE.Mesh(new THREE.PlaneGeometry(areaId==='meadow'?1.65:areaId==='lost-coast'?1.7:1.15,areaId==='meadow'?8.6:5.8,1,8),new THREE.MeshPhysicalMaterial({color:theme.water,transparent:true,opacity:.78,roughness:.14}));stream.rotation.x=-Math.PI/2;stream.rotation.z=areaId==='meadow'?.31:-.22;stream.position.set(areaId==='meadow'?-2.9:2.65,.035,areaId==='meadow'?4.4:2.2);s.add(stream)

  const treeSpots=areaId==='meadow'
    ? [[-6,-4],[-5.6,3.1],[-4.4,4.6],[-2.7,-4.9],[1.8,-5.3],[5.7,1.9],[6.1,3.9],[4.1,5.3],[-5.8,-2.7],[.4,5.4]]
    : [[-4,-3],[4,-3],[-4,3],[4,3],[-1,4.8],[-5,.5],[5,.7],[1.9,4.7],[-2.2,-4.8],[5,-1.7],[-5,2]]
  const treeCount=areaId==='ancient-forest'?11:areaId==='lost-coast'?5:areaId==='meadow'?10:7
  treeSpots.slice(0,treeCount).forEach(([x,z],i)=>tree(s,x,z,.62+(i%3)*.12,theme.tree))
  const rocks=areaId==='meadow'?[[-4.4,-3.4],[5.5,.5],[1.2,4.9],[-.4,-5.1],[3.2,3.9],[-6,1.1]]:[[-2.7,-3.5],[-4.3,-1.3],[3.8,2.8],[.4,4.4],[4.6,-.8]]
  rocks.forEach(([x,z],i)=>rock(s,x,z,.7+(i%2)*.25))
  const bushes=areaId==='meadow'?[[-4.1,-2.3],[-5,2.2],[-2.7,4.5],[2.8,4.7],[5.6,2.7],[1.9,-4.7],[-.4,4.9],[4.7,-.2]]:[[-3,2],[3,-2]]
  bushes.forEach(([x,z],i)=>bush(s,x,z,.7+(i%3)*.12,areaId==='meadow'?0x78bd71:theme.tree))
  if(theme.flower)for(let i=0;i<(areaId==='meadow'?36:24);i++){const a=i*.82,rad=2.2+(i%6)*.72;flower(s,Math.cos(a)*rad,Math.sin(a)*rad,i%3===0?0xfff4a8:0xffffff)}
  if(areaId==='snowy-ridge')for(let i=0;i<14;i++){const a=i*.53,rad=2.8+(i%4)*.7;const snow=new THREE.Mesh(new THREE.OctahedronGeometry(.18+(i%3)*.05,0),new THREE.MeshStandardMaterial({color:0xf3fbfb,flatShading:true}));snow.position.set(Math.cos(a)*rad,.12,Math.sin(a)*rad);s.add(snow)}
  for(let i=0;i<8;i++)pathStone(s,-2.1+i*.55,1.55-Math.sin(i*.7)*.22,.22+(i%2)*.04)

  const groups=[]
  MAP_SLOTS.forEach((slot,index)=>{
    if(slot.areaId!==areaId||!revivedIds.includes(slot.creatureId))return
    const g=loadOrFallback(slot.creatureId,slot.creatureId==='brachiosaurus'||slot.creatureId==='amargasaurus'?3.15:2.3)
    const positions=areaId==='meadow'?{
      brachiosaurus:[-1.1,0,-.3],
      triceratops:[-3.9,0,2.6],
      stegosaurus:[2.6,0,1.3],
      'tyrannosaurus-rex':[.9,0,4.05],
      velociraptor:[4.5,0,3.4],
      ankylosaurus:[4.8,0,.3],
    }:null
    const target=positions?.[slot.creatureId]||slot.position
    g.position.set(...target);g.rotation.y=slot.rotationY;g.scale.setScalar(slot.scale);g.userData.creatureId=slot.creatureId
    g.userData.motion={homeX:target[0],homeY:target[1],homeZ:target[2],phase:index*1.73,radius:slot.aquatic?.42:.14+(index%3)*.05,speed:slot.flight?.18:.055+(index%2)*.02,flight:!!slot.flight,aquatic:!!slot.aquatic}
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
