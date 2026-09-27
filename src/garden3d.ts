import * as T from 'three';
import {parkWater} from './park-water';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadDinosaur,animateDinosaur,dispose3D} from './dinosaur3d';
import {dinoName,decorations,type Language} from './catalog';
import type {Placement} from './state';
import type {Behaviour} from './rive-dinosaur';

const material=(color:number)=>new T.MeshStandardMaterial({color,flatShading:true,roughness:.85});
function mesh(g:T.BufferGeometry,color:number,x=0,y=0,z=0){const o=new T.Mesh(g,material(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
function rock(x:number,z:number,size=1){const o=mesh(new T.IcosahedronGeometry(size,0),0xaebbc2,x,size*.5,z);o.scale.set(1,.8,.85);return o;}
function tree(size=1){const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.10,.14,.7,6),0x93795a,0,.35));for(let n=0;n<3;n++)g.add(mesh(new T.ConeGeometry(.60-n*.12,1.05,6),[0x5a9a7d,0x66ac86,0x78b992][n],0,.9+n*.45));g.scale.setScalar(size);return g;}
function floatingIsland(){
  const coast=[[-4.6,-4.3],[-3.2,-4.9],[-1.4,-5.0],[.5,-4.8],[2.5,-4.6],[4.2,-3.8],[5.0,-2.0],[5.2,.1],[5.0,2.1],[4.1,3.8],[2.4,4.9],[.4,5.1],[-1.5,4.9],[-3.4,4.1],[-4.8,2.6],[-5.1,.5],[-4.9,-2.0]];
  const positions:number[]=[],colors:number[]=[];
  const emit=(a:number[],b:number[],c:number[],hex:number)=>{const color=new T.Color(hex);positions.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(color.r,color.g,color.b);};
  for(let i=0;i<coast.length;i++){
    const [ax,az]=coast[i],[bx,bz]=coast[(i+1)%coast.length];
    emit([0,.1,0],[ax,.1,az],[bx,.1,bz],[0xb9da8d,0xbada91,0xb6d589,0xb8d88e][i%4]);
    const mid=[(ax+bx)*.46,-1.22,(az+bz)*.46],bottomA=[ax*.72,-2.78,az*.72],bottomB=[bx*.72,-2.78,bz*.72];
    emit([ax,.06,az],[bx,.06,bz],mid,[0xc3b99c,0xb7ad94,0xd0c5a5][i%3]);
    emit([ax,.06,az],mid,bottomA,[0x9c9d8e,0xb0a98d,0x8f988d][i%3]);
    emit(mid,[bx,.06,bz],bottomB,[0xa49e8c,0x929b8f,0xb4ab93][i%3]);
    emit(bottomA,mid,bottomB,[0x8e9b94,0xa1a294,0x86928c][i%3]);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const island=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,side:T.DoubleSide,roughness:1}));island.receiveShadow=true;island.castShadow=true;return island;
}
function decoration(id:string){const g=new T.Group();if(id==='tree')return tree();if(id==='rocks'){g.add(rock(0,0,.45),rock(.3,.1,.23));}else if(id==='flowers'){for(let i=0;i<7;i++){const x=Math.sin(i*4)*.32,z=Math.cos(i*3)*.3;g.add(mesh(new T.CylinderGeometry(.015,.015,.3,4),0x72a564,x,.15,z));g.add(mesh(new T.SphereGeometry(.09,5,3),0xfffced,x,.32,z));g.add(mesh(new T.SphereGeometry(.035,5,3),0xf3d977,x,.39,z));}}else if(id==='pond'){const o=mesh(new T.CylinderGeometry(.65,.7,.05,12),0x74d4e3,0,.03);o.scale.z=.65;g.add(o);}else if(id==='log'){const o=mesh(new T.CylinderGeometry(.2,.2,1.0,8),0xa6835e,0,.22);o.rotation.z=Math.PI/2;g.add(o);}else if(id==='sign'){g.add(mesh(new T.BoxGeometry(.07,.65,.08),0x9d8058,0,.33),mesh(new T.BoxGeometry(.65,.24,.09),0xdac396,0,.63));}else{for(let i=0;i<3;i++)g.add(mesh(new T.IcosahedronGeometry(.32,1),0x87ba80,Math.sin(i*2)*.23,.27,Math.cos(i*2)*.19));}return g;}

// The park reference uses warm species accents. Geometry remains the same GLB
// used in Focus; only the park's lighting/material palette differs.
const parkColors:Record<number,{skin:number;detail?:number}>={
  1:{skin:0xd99575},2:{skin:0x7faac0,detail:0xe78b6a},
  3:{skin:0xc87855},4:{skin:0xdca958},6:{skin:0xc68cc0}
};
function colorForPark(root:T.Group,id:number){const palette=parkColors[id];if(!palette)return;
  root.traverse(o=>{if(!(o instanceof T.Mesh))return;
    for(const mat of Array.isArray(o.material)?o.material:[o.material]){
      if(!(mat instanceof T.MeshStandardMaterial))continue;
      if(/^Jade/.test(mat.name))mat.color.setHex(palette.skin);
      if(palette.detail&&/plate/i.test(mat.name))mat.color.setHex(palette.detail);
    }
  });
}

export class Garden {
  private scene=new T.Scene();
  private camera=new T.PerspectiveCamera(38,1,.1,90);
  private renderer:T.WebGLRenderer;
  private controls:OrbitControls;
  private observer:ResizeObserver;
  private abort=new AbortController();
  private ray=new T.Raycaster();
  private ground=new T.Plane(new T.Vector3(0,1,0),-.08);
  private actors=new Map<string,{root:T.Group;placement:Placement;state:Behaviour;until:number}>();
  private water:T.ShaderMaterial[]=[];
  private trees:T.Group[]=[];
  private lamps:T.Mesh[]=[];
  private sun!:T.DirectionalLight;
  private ambient!:T.HemisphereLight;
  private wind=.45;
  private daylight=1;
  private disposed=false;
  private motion:boolean;
  private frame=0;
  private elapsed=0;
  private last=performance.now();
  constructor(private host:HTMLElement,placements:Placement[],lang:Language,motion:boolean,private editing:boolean,onSelect:(uid:string)=>void,onMove:(uid:string,x:number,y:number)=>void){
    this.motion=motion;this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setClearColor(0xc5e7f2);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    const canvas=this.renderer.domElement;canvas.className='garden-3d-canvas';canvas.setAttribute('aria-label',lang==='ko'?'3D 공룡 공원. 드래그로 회전, 두 손가락으로 확대.':'3D dinosaur park. Drag to orbit, pinch to zoom.');host.append(canvas);host.dataset.renderer='threejs';
    this.camera.position.set(-9,12,17);this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,.1,0);this.controls.enableDamping=true;this.controls.minDistance=9;this.controls.maxDistance=24;this.controls.maxPolarAngle=1.22;this.controls.minPolarAngle=.35;this.controls.enablePan=false;this.controls.update();
    this.ambient=new T.HemisphereLight(0xf1ffff,0x87a58b,2);this.scene.add(this.ambient);const sun=new T.DirectionalLight(0xfff2d4,2.8);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});sun.shadow.bias=-.001;this.scene.add(sun);this.sun=sun;
    this.landscape();
    const panel=document.createElement('div');panel.className='park-environment';
    panel.innerHTML=`<div>${(lang==='ko'?['낮','노을','밤']:['Day','Sunset','Night']).map((name,i)=>`<button data-light="${i}" aria-pressed="${i===0}">${name}</button>`).join('')}<button data-camera aria-label="${lang==='ko'?'시점 초기화':'Reset camera'}">↺</button></div><label>${lang==='ko'?'바람':'Wind'}<input aria-label="${lang==='ko'?'바람 세기':'Wind strength'}" type="range" min="0" max="1" step="0.01" value=".45"></label>`;
    host.append(panel);
    panel.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(b=>b.onclick=()=>{const mode=Number(b.dataset.light);this.daylight=[1,.62,.06][mode];this.sun.color.setHex([0xfff2d4,0xffa36d,0x8eb6ff][mode]);this.sun.intensity=[2.8,1.8,.65][mode];this.ambient.intensity=[2,1.3,.65][mode];this.renderer.setClearColor([0xc5e7f2,0xead3cd,0x263e59][mode]);this.lamps.forEach(l=>{(l.material as T.MeshStandardMaterial).emissiveIntensity=mode===2?3:.15;});panel.querySelectorAll('[data-light]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
    panel.querySelector<HTMLInputElement>('input')!.oninput=e=>{this.wind=Number((e.target as HTMLInputElement).value);};
    panel.querySelector<HTMLButtonElement>('[data-camera]')!.onclick=()=>{this.camera.position.set(-9,12,17);this.controls.target.set(0,.1,0);this.controls.update();};
    const accessible=document.createElement('div');accessible.className='garden-accessible';host.append(accessible);
    for(const p of placements){
      const root=new T.Group();root.userData.uid=p.uid;root.position.copy(this.toWorld(p));root.scale.setScalar((p.kind==='dino'?(p.asset===0?1.02:.84):1)*p.scale);root.rotation.y=p.flip?Math.PI:0;this.scene.add(root);
      this.actors.set(p.uid,{root,placement:p,state:'idle',until:performance.now()+3000+this.actors.size*600});
      const label=p.kind==='dino'?dinoName(Number(p.asset),lang):decorations.find(d=>d.id===p.asset)?.[lang]||'';
      const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',`${label} · ${lang==='ko'?'선택':'Select'}`);accessible.append(button);button.onclick=()=>onSelect(p.uid);
      button.onkeydown=e=>{if(!this.editing||!e.key.startsWith('Arrow'))return;e.preventDefault();p.x=T.MathUtils.clamp(p.x+(e.key==='ArrowRight'?2:e.key==='ArrowLeft'?-2:0),12,88);p.y=T.MathUtils.clamp(p.y+(e.key==='ArrowDown'?2:e.key==='ArrowUp'?-2:0),24,86);root.position.copy(this.toWorld(p));onMove(p.uid,p.x,p.y);};
      if(p.kind==='decor')root.add(decoration(String(p.asset)));
      else loadDinosaur(Number(p.asset)).then(d=>{if(this.disposed){dispose3D(d);return;}colorForPark(d,Number(p.asset));root.add(d);host.dataset.loaded=String([...this.actors.values()].filter(a=>a.root.children.length).length);}).catch(()=>{if(!this.disposed){button.textContent+=' · '+(lang==='ko'?'불러오기 실패':'Load failed');host.dataset.error='model';}});
    }
    let down:{x:number;y:number;uid?:string;drag:boolean}|null=null;
    const aim=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);};
    const hit=()=>{for(const h of this.ray.intersectObjects([...this.actors.values()].map(a=>a.root),true)){let o:T.Object3D|null=h.object;while(o&&!o.userData.uid)o=o.parent;if(o)return String(o.userData.uid);}return undefined;};
    canvas.addEventListener('pointerdown',e=>{aim(e);const uid=hit();down={x:e.clientX,y:e.clientY,uid,drag:false};if(uid&&editing){this.controls.enabled=false;canvas.setPointerCapture(e.pointerId);onSelect(uid);}},{signal:this.abort.signal,capture:true});
    canvas.addEventListener('pointermove',e=>{if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>4)down.drag=true;if(!editing||!down.uid)return;aim(e);const point=this.ray.ray.intersectPlane(this.ground,new T.Vector3());if(!point)return;point.x=T.MathUtils.clamp(point.x,-4,4);point.z=T.MathUtils.clamp(point.z,-2.6,3.8);const a=this.actors.get(down.uid)!;a.placement.x=(point.x/8+0.5)*76+12;a.placement.y=(point.z+2.6)/6.4*62+24;a.root.position.copy(this.toWorld(a.placement));},{signal:this.abort.signal});
    const finish=()=>{if(down?.uid){const a=this.actors.get(down.uid)!;if(editing)onMove(down.uid,a.placement.x,a.placement.y);else if(!down.drag){onSelect(down.uid);this.interact(down.uid,'happy');}}down=null;this.controls.enabled=true;};
    canvas.addEventListener('pointerup',finish,{signal:this.abort.signal});canvas.addEventListener('pointercancel',finish,{signal:this.abort.signal});
    this.observer=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(r.width&&r.height){this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height);}});this.observer.observe(host);this.tick();
  }
  private toWorld(p:Placement){return new T.Vector3(((p.x-12)/76-.5)*8,.08,(p.y-24)/62*6.4-2.6);}
  private landscape(){
    this.scene.add(floatingIsland());
    for(let i=0;i<23;i++){const angle=i/23*Math.PI*2,r=4.0+(i%3)*.17;const x=Math.cos(angle)*r,z=Math.sin(angle)*r;this.scene.add(rock(x,z,.23+(i%4)*.10));if(i%2===0){const t=tree(.64+(i%3)*.17);t.position.set(x,.1,z);this.scene.add(t);this.trees.push(t);}}
    for(let i=0;i<5;i++){const o=mesh(new T.CylinderGeometry(.8,.98,1.4+i*.32,5),0xb3b5a3,-1.8+i*.65,.7+i*.16,-3.7);this.scene.add(o);this.scene.add(mesh(new T.CylinderGeometry(.82,.84,.13,5),0x99c681,-1.8+i*.65,1.47+i*.32,-3.7));}
    // The waterfall starts from a tiered forested ridge, as in the park art.
    for(const [x,z,h,r] of [[-2.8,-3.9,1.4,1],[-2.0,-3.7,2.15,1.15],[-.9,-4.25,2.85,1.0],[.55,-4.2,2.55,.92],[1.75,-3.85,1.6,.88]] as const){
      const cliff=mesh(new T.CylinderGeometry(r*.81,r,h,6),0xb8b29b,x,h/2+.1,z);this.scene.add(cliff);
      this.scene.add(mesh(new T.CylinderGeometry(r*.84,r*.86,.18,6),0x9fcb82,x,h+.1,z));
      if(x!==-.9){const pine=tree(.42);pine.position.set(x,h+.22,z);this.scene.add(pine);this.trees.push(pine);}
    }
    const waterMat=parkWater();this.water.push(waterMat);
    const path=[[-.1,-3.4],[-.1,-2.7],[1.1,-2.2],[2,-1.3],[2.7,-.2],[2.1,1],[1.7,2.2],[1.2,3.6],[1.2,5.3]];
    const curve=new T.CatmullRomCurve3(path.map(([x,z])=>new T.Vector3(x,.15,z)));
    const verts:number[]=[],uvs:number[]=[],indices:number[]=[];
    for(let i=0;i<=100;i++){const t=i/100,p=curve.getPoint(t),dir=curve.getTangent(t),w=.47+Math.sin(t*Math.PI)*.26;
      for(const side of [-1,1]){verts.push(p.x+dir.z*w*side,p.y,p.z-dir.x*w*side);uvs.push((side+1)/2,t);}
      if(i<100){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
      if(i%4===0)for(const side of [-1,1])this.scene.add(rock(p.x+dir.z*(w+.09)*side,p.z-dir.x*(w+.09)*side,.12+(i%3)*.035));
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();this.scene.add(new T.Mesh(geo,waterMat));
    for(const [x,z,y,h,w]of [[-.15,-3.25,1.43,2.5,.62],[1.2,5.3,-1.65,3.4,1.42]]){const mat=parkWater(true);this.water.push(mat);const falls=new T.Mesh(new T.PlaneGeometry(w,h,4,16),mat);falls.position.set(x,y,z);this.scene.add(falls);}
    for(let i=0;i<6;i++){const splash=mesh(new T.IcosahedronGeometry(.12+(i%3)*.04,0),i%2?0xe8f9f4:0xd4f4f5,.6+i*.22,.15,5.11+(i%2)*.10);splash.scale.set(1.1,.35,.65);this.scene.add(splash);}
    for(let i=0;i<8;i++){const x=1.65+i*.17;this.scene.add(mesh(new T.BoxGeometry(.15,.09,.8),0xba9468,x,.34,.2));}for(const z of [-.23,.63]){this.scene.add(mesh(new T.BoxGeometry(1.5,.08,.06),0x9b7c53,2.23,.72,z));for(const x of [1.6,2.85])this.scene.add(mesh(new T.BoxGeometry(.075,.65,.075),0x9b7c53,x,.42,z));}
    // A raised lookout and a tent make the park recognisable from every angle.
    for(const x of [3.1,3.8])for(const z of [-3.1,-2.4])this.scene.add(mesh(new T.BoxGeometry(.1,1.7,.1),0x9a7b52,x,.9,z));this.scene.add(mesh(new T.BoxGeometry(1.05,.12,1.0),0xb7986e,3.45,1.6,-2.75));const roof=mesh(new T.ConeGeometry(.82,.43,4),0xae8456,3.45,2.1,-2.75);roof.rotation.y=Math.PI/4;this.scene.add(roof);
    const tent=mesh(new T.ConeGeometry(.85,.85,4),0xffedca,-3.4,.95,-1.5);tent.rotation.y=Math.PI/4;this.scene.add(tent);for(const x of [-3.85,-2.95])for(const z of [-1.95,-1.05])this.scene.add(mesh(new T.CylinderGeometry(.035,.035,.8,5),0x997e55,x,.4,z));
    // Rock arch and dark recess on the right bank of the stream.
    const cave=new T.Group();cave.position.set(4.0,.1,1.55);
    const entrance=mesh(new T.CircleGeometry(.65,9),0x344746,0,.58,.12);cave.add(entrance);
    for(let i=0;i<9;i++){const a=Math.PI*i/8;const stone=mesh(new T.IcosahedronGeometry(.29+(i%3)*.045,0),i%2?0xa8afa5:0xc5c8ba,Math.cos(a)*.78,.58+Math.sin(a)*.74,.14);cave.add(stone);}
    cave.add(mesh(new T.IcosahedronGeometry(.65,0),0xb5b9aa,-.44,.40,-.38),mesh(new T.IcosahedronGeometry(.55,0),0xa9b3aa,.48,.39,-.32));this.scene.add(cave);
    for(const [x,z,s] of [[-4.0,-2.8,.68],[-3.3,.9,.74],[3.4,-1.7,.8],[4.0,2.9,.64],[-2.2,3.3,.58]] as const){
      const pine=tree(s);pine.position.set(x,.1,z);this.scene.add(pine);this.trees.push(pine);
    }
    for(const [x,z] of [[-2.95,-1.05],[1.6,.63],[2.85,-.23],[3.8,-2.4]]){const lamp=mesh(new T.BoxGeometry(.12,.2,.12),0xffe3a1,x,.9,z);(lamp.material as T.MeshStandardMaterial).emissive.setHex(0xffb85a);this.lamps.push(lamp);this.scene.add(lamp);}
    const flowers=new T.Group();
    for(let i=0;i<25;i++){const a=i*2.399,r=2.8+(i%4)*.5;const flower=decoration('flowers');flower.scale.setScalar(.45);flower.position.set(Math.cos(a)*r,.1,Math.sin(a)*r);flowers.add(flower);}
    // Merge static flowers by material color: hundreds of tiny meshes become three draws.
    flowers.updateMatrixWorld(true);const batches=new Map<number,T.BufferGeometry[]>();
    flowers.traverse(o=>{if(o instanceof T.Mesh){const key=(o.material as T.MeshStandardMaterial).color.getHex();const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=batches.get(key)||[];list.push(g);batches.set(key,list);}});
    for(const [color,geos] of batches){const merged=mergeGeometries(geos);if(merged)this.scene.add(mesh(merged,color));geos.forEach(g=>g.dispose());}dispose3D(flowers);
  }
  interact(uid:string,state:Behaviour){const a=this.actors.get(uid);if(a){a.state=state;a.until=performance.now()+(state==='sleep'?1e12:state==='happy'?1800:state==='eat'?8000:5000);this.host.dataset.activity=state;}}
  setMotion(enabled:boolean){this.motion=enabled;}
  private tick=()=>{this.frame=requestAnimationFrame(this.tick);const now=performance.now(),dt=Math.min(.05,(now-this.last)/1000);this.last=now;if(this.motion)this.elapsed+=dt;
    for(const a of this.actors.values())if(a.placement.kind==='dino'&&a.root.children.length){if(this.motion&&!this.editing&&now>a.until){a.state=a.state==='walk'?'idle':'walk';a.until=now+5500;}const d=a.root.children[0] as T.Group;if(this.motion&&!this.editing)animateDinosaur(d,this.elapsed,a.state);const base=this.toWorld(a.placement);a.root.position.copy(base);if(this.motion&&!this.editing&&a.state==='walk')a.root.position.x+=Math.sin(this.elapsed*.7)*.24;if(this.motion&&a.state==='happy')a.root.position.y+=Math.abs(Math.sin(this.elapsed*6))*.16;}
    this.water.forEach(w=>{w.uniforms.time.value=this.elapsed;w.uniforms.wind.value=this.wind;w.uniforms.day.value=this.daylight;});this.trees.forEach((t,i)=>{t.rotation.z=Math.sin(this.elapsed*1.4+i)*.025*this.wind;});this.controls.update();this.renderer.render(this.scene,this.camera);};
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.abort.abort();this.observer.disconnect();this.controls.dispose();dispose3D(this.scene);this.renderer.dispose();this.host.replaceChildren();}
}
