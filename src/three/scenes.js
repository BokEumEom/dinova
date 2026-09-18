import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { MAP_SLOTS } from '../data/mapSlots.mjs'
import { createCreature } from './creatures.js'
import { fitCreatureModel, loadCreatureModel } from './modelLoader.js'

const rendererFor = (canvas) => { const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); r.setPixelRatio(Math.min(devicePixelRatio||1,1.7)); r.shadowMap.enabled=true; r.shadowMap.type=THREE.PCFSoftShadowMap; r.outputColorSpace=THREE.SRGBColorSpace; return r }
const lights=(s)=>{ s.add(new THREE.HemisphereLight(0xf3ffff,0x8abf9c,2)); const d=new THREE.DirectionalLight(0xffffff,2.6); d.position.set(6,9,5); d.castShadow=true; s.add(d) }
const resize=(r,c,canvas)=>{ const w=canvas.clientWidth||1,h=canvas.clientHeight||1;if(canvas.width!==Math.round(w*r.getPixelRatio())||canvas.height!==Math.round(h*r.getPixelRatio())){r.setSize(w,h,false);c.aspect=w/h;c.updateProjectionMatrix()} }
const dispose=(scene)=>scene.traverse(o=>{o.geometry?.dispose?.(); if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()})
function loadOrFallback(id,height=3){ const holder=new THREE.Group(); const fallback=fitCreatureModel(createCreature(id),height); holder.add(fallback); loadCreatureModel(id).then(m=>{holder.clear();holder.add(fitCreatureModel(m,height))}).catch(()=>{}); holder.userData.creatureId=id; return holder }
function iceMaterial(){ return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uMelt:{value:0},uTime:{value:0}},vertexShader:`varying vec3 vPos;varying vec3 vNormal;void main(){vPos=position;vNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float uMelt;uniform float uTime;varying vec3 vPos;varying vec3 vNormal;float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}void main(){float n=hash(floor(vPos*5.));float threshold=mix(-2.2,2.5,uMelt);if(vPos.y+n*.55<threshold)discard;float edge=smoothstep(.0,.18,abs((vPos.y+n*.55)-threshold));float fres=pow(1.-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),2.);vec3 c=mix(vec3(.72,.94,.98),vec3(.92,1.,1.),fres);float a=mix(.56,.12,uMelt)*(1.-edge*.25);gl_FragColor=vec4(c,a);}`}) }
export function createMeltScene(canvas,progress=0,creatureId='brachiosaurus'){
  const s=new THREE.Scene(),c=new THREE.PerspectiveCamera(35,1,.1,60),r=rendererFor(canvas)
  r.setClearColor(0x000000,0);c.position.set(0,1.7,7.1);c.lookAt(0,1.55,0);lights(s)
  const creature=loadOrFallback(creatureId,3.25);creature.position.set(0,.12,0);creature.rotation.y=-.24;s.add(creature)
  const im=iceMaterial(),ice=new THREE.Mesh(new THREE.DodecahedronGeometry(2.15,1),im);ice.position.y=1.55;ice.scale.set(1.14,1.43,.88);s.add(ice)
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.72,1.95,.18,12),new THREE.MeshStandardMaterial({color:0xd8f1ed,flatShading:true,roughness:.95}));base.position.y=-.02;base.receiveShadow=true;s.add(base)
  const shardMat=new THREE.MeshPhysicalMaterial({color:0xcff4f8,transparent:true,opacity:.38,roughness:.18,transmission:.2,flatShading:true})
  const shards=[];for(let i=0;i<9;i++){const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.13+(i%3)*.05,0),shardMat.clone());const a=i/9*Math.PI*2;shard.position.set(Math.cos(a)*(1.45+(i%2)*.12),.12+(i%3)*.05,Math.sin(a)*.58);shard.rotation.set(i*.2,i*.41,i*.17);s.add(shard);shards.push(shard)}
  let target=progress,dead=false,raf;const clock=new THREE.Clock()
  function frame(){if(dead)return;resize(r,c,canvas);const t=clock.getElapsedTime();im.uniforms.uMelt.value+=(target-im.uniforms.uMelt.value)*.06;im.uniforms.uTime.value=t;ice.rotation.y=Math.sin(t*.2)*.03;creature.rotation.y=-.24+Math.sin(t*.28)*.035;creature.position.y=.12+Math.sin(t*.8)*.025;shards.forEach((shard,i)=>{shard.material.opacity=Math.max(.04,.38-target*.32);shard.position.y=.12+(i%3)*.05+Math.sin(t*.8+i)*.018});r.render(s,c);raf=requestAnimationFrame(frame)}
  frame()
  return{setProgress(v){target=Math.min(1,Math.max(0,v))},destroy(){dead=true;cancelAnimationFrame(raf);r.dispose();dispose(s)}}
}
function tree(s,x,z,k=1,crownColor=0x6fc293){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.1*k,.16*k,.9*k,6),new THREE.MeshStandardMaterial({color:0x9b8065,flatShading:true}));t.position.set(x,.45*k,z);s.add(t); const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.55*k,1),new THREE.MeshStandardMaterial({color:crownColor,flatShading:true,roughness:.9}));crown.position.set(x,1.25*k,z);crown.castShadow=true;s.add(crown) }
function rock(s,x,z,k=1){ const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.42*k,0),new THREE.MeshStandardMaterial({color:0x9aa79e,roughness:1,flatShading:true}));m.scale.set(1.35,.7,1);m.position.set(x,.18*k,z);m.castShadow=true;m.receiveShadow=true;s.add(m) }
function flower(s,x,z,color=0xfff3c4){ const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,.2,5),new THREE.MeshStandardMaterial({color:0x5aa774}));stem.position.set(x,.1,z);s.add(stem); const head=new THREE.Mesh(new THREE.OctahedronGeometry(.055,0),new THREE.MeshStandardMaterial({color,flatShading:true}));head.position.set(x,.22,z);s.add(head) }
function pathStone(s,x,z,scale=.32){ const m=new THREE.Mesh(new THREE.CylinderGeometry(scale,scale*.9,.06,7),new THREE.MeshStandardMaterial({color:0xd8d4c7,roughness:1,flatShading:true}));m.position.set(x,.04,z);m.rotation.y=x*.31;s.add(m) }
function mountain(s,x,y,z,k=1,color=0xbccbd2){const m=new THREE.Mesh(new THREE.ConeGeometry(1.65*k,3.5*k,5),new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1}));m.position.set(x,y+1.5*k,z);m.rotation.y=.35;s.add(m);const cap=new THREE.Mesh(new THREE.ConeGeometry(.72*k,1.15*k,5),new THREE.MeshStandardMaterial({color:0xf1f7f6,flatShading:true,roughness:1}));cap.position.set(x,y+3.15*k,z);cap.rotation.y=.35;s.add(cap)}
function stoneArch(s,x,z,k=1){const mat=new THREE.MeshStandardMaterial({color:0xaebfc2,flatShading:true,roughness:1});const left=new THREE.Mesh(new THREE.DodecahedronGeometry(.55*k,0),mat),right=left.clone(),top=new THREE.Mesh(new THREE.DodecahedronGeometry(.72*k,0),mat);left.scale.set(.8,1.7,.8);right.scale.set(.8,1.7,.8);top.scale.set(1.65,.62,.75);left.position.set(x-.7*k,.75*k,z);right.position.set(x+.7*k,.75*k,z);top.position.set(x,1.62*k,z);left.castShadow=right.castShadow=top.castShadow=true;s.add(left,right,top)}
function cloud(s,x,y,z,k=1){const mat=new THREE.MeshBasicMaterial({color:0xf7fbfb,transparent:true,opacity:.9});[[-.7,0,0,.65],[0,.1,0,.9],[.75,-.05,0,.55]].forEach(([dx,dy,dz,scale])=>{const c=new THREE.Mesh(new THREE.IcosahedronGeometry(scale*k,1),mat);c.position.set(x+dx*k,y+dy*k,z+dz);c.scale.y=.6;s.add(c)})}
function bush(s,x,z,k=1,color=0x70b884){const mat=new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1});[[-.25,0,.9],[.18,.02,.72],[0,.18,.8]].forEach(([dx,dy,scale])=>{const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.42*k*scale,1),mat);b.position.set(x+dx*k,.24*k+dy,z);s.add(b)})}
function waterfall(s,x,z,width=1.25,height=2.6,color=0x6ed9ec){const mat=new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.84,roughness:.12});const fall=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);fall.position.set(x,height/2-.05,z);fall.rotation.y=Math.PI;s.add(fall);for(let i=0;i<6;i++){const foam=new THREE.Mesh(new THREE.OctahedronGeometry(.12+(i%2)*.04,0),new THREE.MeshStandardMaterial({color:0xf3fbfb,flatShading:true}));foam.position.set(x-width*.42+i*(width*.16),.04,z-.08);s.add(foam)}}


function woodMaterial(){return new THREE.MeshStandardMaterial({color:0x9a6d49,flatShading:true,roughness:1})}
function tent(s,x,z,k=1){const pole=woodMaterial(),canvasMat=new THREE.MeshStandardMaterial({color:0xf4e7c7,flatShading:true,roughness:1,side:THREE.DoubleSide});const a=new THREE.Mesh(new THREE.ConeGeometry(.95*k,1.15*k,4),canvasMat);a.position.set(x,.62*k,z);a.rotation.y=Math.PI/4;s.add(a);[-.62,.62].forEach(dx=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.035*k,.045*k,1.15*k,5),pole);p.position.set(x+dx*k,.55*k,z);s.add(p)})}
function bridge(s,x,z,k=1,rot=0){const wood=woodMaterial(),rail=woodMaterial(),g=new THREE.Group();for(let i=-4;i<=4;i++){const plank=new THREE.Mesh(new THREE.BoxGeometry(.38*k,.08*k,1.25*k),wood);plank.position.set(i*.38*k,0,0);plank.castShadow=true;g.add(plank)}[-.62,.62].forEach(side=>{for(let i=-4;i<=4;i+=2){const post=new THREE.Mesh(new THREE.BoxGeometry(.08*k,.7*k,.08*k),rail);post.position.set(i*.38*k,.36*k,side*k);g.add(post)}const bar=new THREE.Mesh(new THREE.BoxGeometry(3.3*k,.08*k,.08*k),rail);bar.position.set(0,.62*k,side*k);g.add(bar)});g.position.set(x,.15,z);g.rotation.y=rot;s.add(g)}
function watchTower(s,x,z,k=1){const wood=woodMaterial(),g=new THREE.Group();[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]].forEach(([dx,dz])=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.12*k,2.6*k,.12*k),wood);leg.position.set(dx*k,1.3*k,dz*k);g.add(leg)});const deck=new THREE.Mesh(new THREE.BoxGeometry(1.45*k,.14*k,1.45*k),wood);deck.position.y=2.25*k;g.add(deck);const roof=new THREE.Mesh(new THREE.ConeGeometry(1.05*k,.75*k,4),new THREE.MeshStandardMaterial({color:0x7a5137,flatShading:true,roughness:1}));roof.position.y=3*k;roof.rotation.y=Math.PI/4;g.add(roof);g.position.set(x,0,z);g.castShadow=true;s.add(g)}
function cave(s,x,z,k=1){const rockMat=new THREE.MeshStandardMaterial({color:0x9da9a8,flatShading:true,roughness:1});const dark=new THREE.MeshBasicMaterial({color:0x33404a});const shell=new THREE.Mesh(new THREE.DodecahedronGeometry(1.15*k,0),rockMat);shell.scale.set(1.35,1,1.05);shell.position.set(x,.75*k,z);s.add(shell);const mouth=new THREE.Mesh(new THREE.CircleGeometry(.62*k,18,0,Math.PI),dark);mouth.rotation.y=Math.PI;mouth.position.set(x,.55*k,z-.97*k);mouth.scale.y=1.15;s.add(mouth)}
function fence(s,x,z,len=2,k=1,rot=0){const wood=woodMaterial(),g=new THREE.Group();for(let i=0;i<=len;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.09*k,.72*k,.09*k),wood);p.position.set((i-len/2)*.72*k,.36*k,0);g.add(p)}[-.18,.28].forEach(y=>{const bar=new THREE.Mesh(new THREE.BoxGeometry((len*.72+.2)*k,.08*k,.08*k),wood);bar.position.set(0,.42*k+y*k,0);g.add(bar)});g.position.set(x,0,z);g.rotation.y=rot;s.add(g)}
function signPost(s,x,z,k=1){const wood=woodMaterial();const p=new THREE.Mesh(new THREE.BoxGeometry(.1*k,.9*k,.1*k),wood);p.position.set(x,.45*k,z);s.add(p);const board=new THREE.Mesh(new THREE.BoxGeometry(.82*k,.45*k,.08*k),wood);board.position.set(x,.85*k,z);board.rotation.y=.15;s.add(board)}
function plateau(s,x,z,w,d,h,grassColor,rockColor){const rock=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:rockColor,flatShading:true,roughness:1}));rock.position.set(x,h/2-.25,z);rock.castShadow=true;rock.receiveShadow=true;s.add(rock);const grass=new THREE.Mesh(new THREE.BoxGeometry(w+.08,.16,d+.08),new THREE.MeshStandardMaterial({color:grassColor,flatShading:true,roughness:1}));grass.position.set(x,h-.17,z);grass.receiveShadow=true;s.add(grass)}
function waterPatch(s,x,z,w,d,color,rot=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.84,roughness:.12}));m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,.035,z);s.add(m);return m}
export function createMeadowScene(canvas,revivedIds=[],onCreatureClick=()=>{},areaId='meadow'){
  const themes={
    meadow:{sky:0xc6ebfb,ground:0xa9df78,cliff:0xb9b09a,water:0x62d6e7,tree:0x3f8f68,flower:true},
    'snowy-ridge':{sky:0xd9f1f7,ground:0xe8f4f1,cliff:0xc6d8dc,water:0x91deea,tree:0x6da69b,flower:false},
    'ancient-forest':{sky:0xd2e9df,ground:0x78b986,cliff:0x8d9d7d,water:0x6fc6bd,tree:0x3e8f70,flower:true},
    'lost-coast':{sky:0xccecf2,ground:0xb8dda2,cliff:0xc6ad86,water:0x68cfdf,tree:0x62ad88,flower:true},
  }
  const theme=themes[areaId]||themes.meadow
  const s=new THREE.Scene();s.background=new THREE.Color(theme.sky);s.fog=new THREE.Fog(theme.sky,18,38)
  const c=new THREE.PerspectiveCamera(38,1,.1,100),r=rendererFor(canvas);const homePos=new THREE.Vector3(10.2,9.2,13.6),homeTarget=new THREE.Vector3(0,.7,0);c.position.copy(homePos);c.lookAt(homeTarget);lights(s)
  const controls=new OrbitControls(c,canvas);controls.target.copy(homeTarget);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=19;controls.minPolarAngle=.72;controls.maxPolarAngle=1.18

  const island=new THREE.Mesh(new THREE.CylinderGeometry(8.1,8.65,1.05,30),new THREE.MeshStandardMaterial({color:theme.ground,flatShading:true,roughness:.98}));island.position.y=-.48;island.receiveShadow=true;s.add(island)
  const cliff=new THREE.Mesh(new THREE.CylinderGeometry(7.55,8.1,1.0,30),new THREE.MeshStandardMaterial({color:theme.cliff,flatShading:true,roughness:1}));cliff.position.y=-1.14;s.add(cliff)

  if(areaId==='meadow'){
    // Dino Park reference composition: raised waterfall mountain, winding stream,
    // camp, bridge, watch tower, cave, fence and scattered low-poly vegetation.
    mountain(s,-6.4,-.2,-7.4,1.1,0xb5c7c7);mountain(s,-3.3,-.2,-8.4,1.35,0xb0c4c6);mountain(s,3.2,-.2,-8.6,1.25,0xb7c9c8);mountain(s,6.2,-.2,-7.6,1.05,0xc0cfca)
    cloud(s,-5.2,6.9,-9.5,1.15);cloud(s,3.7,7.1,-9.8,.95)

    plateau(s,0,-5.25,4.9,3.55,2.35,0xa5dc75,0xaa9b82)
    plateau(s,-.3,-5.55,2.8,2.25,3.55,0x9ed46f,0x9c8d76)
    plateau(s,.25,-5.85,1.45,1.35,4.55,0x94cd69,0x90816d)
    waterfall(s,.25,-4.75,1.15,3.4,theme.water)
    waterPatch(s,.2,-3.25,3.2,2.25,theme.water,.04)
    waterPatch(s,1.9,-1.65,1.45,4.1,theme.water,-.47)
    waterPatch(s,3.35,.55,1.4,3.35,theme.water,.38)
    waterPatch(s,1.95,3.05,1.5,4.15,theme.water,-.5)
    waterPatch(s,.2,5.45,1.55,3.7,theme.water,.22)

    tent(s,-5.05,-1.35,.92)
    bridge(s,3.0,.25,.82,-.15)
    watchTower(s,5.65,-1.25,.78)
    cave(s,5.45,2.7,.92)
    signPost(s,5.0,3.65,.9)
    fence(s,-4.4,3.65,3,.8,.07)
    fence(s,-5.45,.2,2,.72,Math.PI/2)
  } else {
    const pond=new THREE.Mesh(new THREE.CircleGeometry(areaId==='lost-coast'?3.15:2.05,36),new THREE.MeshPhysicalMaterial({color:theme.water,transparent:true,opacity:.83,roughness:.15}));pond.rotation.x=-Math.PI/2;pond.position.set(areaId==='lost-coast'?1.1:1.7,.025,-1.05);s.add(pond)
    const stream=waterPatch(s,2.65,2.2,areaId==='lost-coast'?1.7:1.15,5.8,theme.water,-.22)
  }

  const treeSpots=areaId==='meadow'
    ? [[-6.4,-4.7],[-5.9,2.15],[-5.15,4.9],[-3.6,-4.3],[-2.4,5.2],[-1.3,-6.2],[1.7,-6.3],[3.9,-4.5],[5.2,-3.9],[6.1,.9],[6.2,4.1],[4.25,5.3],[-6.35,3.7],[1.1,5.8]]
    : [[-4,-3],[4,-3],[-4,3],[4,3],[-1,4.8],[-5,.5],[5,.7],[1.9,4.7],[-2.2,-4.8],[5,-1.7],[-5,2]]
  const treeCount=areaId==='ancient-forest'?11:areaId==='lost-coast'?5:areaId==='meadow'?14:7
  treeSpots.slice(0,treeCount).forEach(([x,z],i)=>tree(s,x,z,.58+(i%3)*.12,theme.tree))
  const rockSpots=areaId==='meadow'?[[-5.6,-3.1],[-3.6,1.9],[-2.5,4.4],[4.9,.3],[5.9,4.55],[1.4,4.55],[-.8,-3.7],[3.2,-3.4]]:[[-2.7,-3.5],[-4.3,-1.3],[3.8,2.8],[.4,4.4],[4.6,-.8]]
  rockSpots.forEach(([x,z],i)=>rock(s,x,z,.66+(i%3)*.18))
  const bushSpots=areaId==='meadow'?[[-5.2,-2.6],[-4.6,1.5],[-3.15,4.1],[-1.8,3.9],[1.0,4.35],[4.55,4.4],[5.1,1.75],[3.75,-2.8],[-2.4,-3.9],[.8,-4.05]]:[[-3,2],[3,-2]]
  bushSpots.forEach(([x,z],i)=>bush(s,x,z,.65+(i%3)*.11,areaId==='meadow'?0x70af68:theme.tree))
  if(theme.flower)for(let i=0;i<(areaId==='meadow'?44:24);i++){const a=i*.79,rad=2.0+(i%7)*.72;flower(s,Math.cos(a)*rad,Math.sin(a)*rad,i%3===0?0xffefa2:0xffffff)}
  if(areaId==='snowy-ridge')for(let i=0;i<14;i++){const a=i*.53,rad=2.8+(i%4)*.7;const snow=new THREE.Mesh(new THREE.OctahedronGeometry(.18+(i%3)*.05,0),new THREE.MeshStandardMaterial({color:0xf3fbfb,flatShading:true}));snow.position.set(Math.cos(a)*rad,.12,Math.sin(a)*rad);s.add(snow)}

  const groups=[]
  MAP_SLOTS.forEach((slot,index)=>{
    if(slot.areaId!==areaId||!revivedIds.includes(slot.creatureId))return
    const g=loadOrFallback(slot.creatureId,slot.creatureId==='brachiosaurus'||slot.creatureId==='amargasaurus'?3.1:2.25)
    const positions=areaId==='meadow'?{
      brachiosaurus:[-3.35,0,.35],
      triceratops:[-1.85,0,3.05],
      stegosaurus:[2.35,0,.8],
      'tyrannosaurus-rex':[3.65,0,-3.05],
      velociraptor:[.35,0,-1.65],
      ankylosaurus:[4.5,0,3.9],
    }:null
    const target=positions?.[slot.creatureId]||slot.position
    g.position.set(...target);g.rotation.y=slot.rotationY;g.scale.setScalar(slot.scale);g.userData.creatureId=slot.creatureId
    g.userData.motion={homeX:target[0],homeY:target[1],homeZ:target[2],phase:index*1.73,radius:slot.aquatic?.42:.11+(index%3)*.04,speed:slot.flight?.18:.045+(index%2)*.016,flight:!!slot.flight,aquatic:!!slot.aquatic}
    s.add(g);groups.push(g)
  })

  const ray=new THREE.Raycaster(),p=new THREE.Vector2()
  const click=e=>{const rect=canvas.getBoundingClientRect();p.x=((e.clientX-rect.left)/rect.width)*2-1;p.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(p,c);const hit=ray.intersectObjects(groups,true)[0];if(!hit)return;let o=hit.object;while(o&&!o.userData.creatureId)o=o.parent;if(o?.userData.creatureId)onCreatureClick(o.userData.creatureId)}
  canvas.addEventListener('click',click)

  let dead=false,raf;const clock=new THREE.Clock()
  function frame(){if(dead)return;resize(r,c,canvas);controls.update();const t=clock.getElapsedTime();groups.forEach((g,i)=>{const m=g.userData.motion,a=t*m.speed+m.phase;const nextX=m.homeX+Math.cos(a)*m.radius,nextZ=m.homeZ+Math.sin(a*.9)*m.radius;const dx=nextX-g.position.x,dz=nextZ-g.position.z;g.position.x=nextX;g.position.z=nextZ;g.position.y=m.homeY+(m.flight?Math.sin(t*.85+i)*.18:m.aquatic?Math.sin(t*.65+i)*.05:Math.sin(t*.72+i)*.025);if(Math.abs(dx)+Math.abs(dz)>.0001)g.rotation.y=Math.atan2(dx,dz)});r.render(s,c);raf=requestAnimationFrame(frame)}
  frame()
  return{
    resetCamera(){c.position.copy(homePos);controls.target.copy(homeTarget);controls.update()},
    destroy(){dead=true;cancelAnimationFrame(raf);canvas.removeEventListener('click',click);controls.dispose();r.dispose();dispose(s)}
  }
}
