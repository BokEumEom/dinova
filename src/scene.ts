import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {type Language} from './catalog';
import {loadDinosaur,dispose3D,animateDinosaur} from './dinosaur3d';
import {translate} from './i18n';

/** Focus and park share the same Blender GLB; collection uses its rendered thumbnail. */
export class IceScene {
  private renderer:THREE.WebGLRenderer;
  private scene=new THREE.Scene();
  private camera=new THREE.PerspectiveCamera(32,1,.1,40);
  private controls:OrbitControls;
  private ice=new THREE.Group();
  private dinosaur:THREE.Group|null=null;
  private cap:THREE.Mesh;
  private clip=new THREE.Plane(new THREE.Vector3(0,-1,0),4);
  private observer:ResizeObserver;
  private frame=0;
  private disposed=false;
  private progress=0;
  private reduced=false;
  private clock=new THREE.Clock();
  constructor(private host:HTMLElement,id:number,lang:Language,motion:boolean){
    this.reduced=!motion;
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
    this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.localClippingEnabled=true;
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label',translate('sceneLabel',lang));
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.enableZoom=false;
    this.controls.minAzimuthAngle=-Infinity;this.controls.maxAzimuthAngle=Infinity;
    this.controls.minPolarAngle=1.18;this.controls.maxPolarAngle=1.66;
    this.reset();
    this.scene.add(new THREE.HemisphereLight(0xeafaff,0x809eaf,2.2));
    const sun=new THREE.DirectionalLight(0xfffaf1,3.0);sun.position.set(-4,7,5);this.scene.add(sun);
    this.cap=new THREE.Mesh(new THREE.CircleGeometry(1,8),new THREE.MeshBasicMaterial({color:0xdaf7ff,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));
    this.cap.rotation.x=-Math.PI/2;this.cap.scale.set(1.1,.67,1);this.cap.position.y=3.40;this.cap.renderOrder=6;this.scene.add(this.cap);
    this.scene.add(this.ice);
    const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=64;
    const ctx=glowCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(64,32,3,64,32,62);
    gradient.addColorStop(0,'rgba(73,149,166,.23)');gradient.addColorStop(1,'rgba(73,149,166,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,64);
    const shadow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));shadow.scale.set(4.8,.7,1);shadow.position.set(0,.02,-.05);shadow.renderOrder=0;this.scene.add(shadow);
    for(const [x,y,z,s] of [[-2.05,.03,.3,.33],[1.97,.02,.1,.35],[-2.6,.04,-.7,.25],[2.5,.02,-1,.4],[-1.8,0,1,.20]]){
      const chunk=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),new THREE.MeshBasicMaterial({color:0xe5f8ff,transparent:true,opacity:.75}));chunk.position.set(x,y,z);chunk.scale.y=.7;this.scene.add(chunk);
    }
    const tasks=[loadDinosaur(id).then(model=>{if(this.disposed){dispose3D(model);return;}this.dinosaur=model;model.rotation.y=.52;model.position.y=.12;this.scene.add(model);host.dataset.model=model.userData.species;}),new GLTFLoader().loadAsync('/models/reference-ice.glb').then(gltf=>{
      if(this.disposed){this.release(gltf.scene);return;}
      gltf.scene.traverse(obj=>{if(obj instanceof THREE.Mesh){const old=obj.material as THREE.MeshStandardMaterial;const fissure=old.name.includes('fractured');const replacement=new THREE.MeshBasicMaterial({color:fissure?0xf7ffff:[0xa3dbe9,0xdaf7ff,0xf1fcff,0x8fc9df,0xb5e4f0][Number(old.name.match(/\d+/)?.[0]??0)%5],transparent:true,opacity:fissure?.82:Math.max(.34,old.opacity*1.35),side:THREE.FrontSide,depthWrite:false,clippingPlanes:[this.clip]});old.dispose();obj.material=replacement;obj.renderOrder=fissure?7:5;}});
      this.ice.add(gltf.scene);this.setMelt(this.progress);
    })];
    Promise.all(tasks).then(()=>{if(!this.disposed)host.dataset.loaded='true';}).catch(()=>{if(!this.disposed){host.dataset.loaded='error';host.insertAdjacentHTML('beforeend',`<p class="scene-error">${translate('sceneError',lang)}</p>`);}});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();this.animate();
  }
  setMotion(motion:boolean){this.reduced=!motion;}
  setMelt(percent:number){this.progress=percent;const p=THREE.MathUtils.clamp(percent/100,0,1),height=3.46*(1-p);this.clip.constant=height;this.ice.visible=p<.998;this.cap.visible=p>.005&&p<.998;this.cap.position.y=height;this.cap.scale.set(1.12+p*.48,.65+p*.22,1);}
  setAngle(value:number){this.camera.position.set(Math.sin(value*.009)*8.4,this.camera.position.y,Math.cos(value*.009)*8.4);this.controls.update();}
  setElevation(value:number){this.camera.position.y=1.5+(value/100)*2.0;this.controls.update();}
  reset(){this.camera.position.set(.3,2.00,8.4);this.controls.target.set(0,1.72,0);this.controls.update();}
  private resize(){const{width,height}=this.host.getBoundingClientRect();if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);}
  private animate=()=>{this.frame=requestAnimationFrame(this.animate);const t=this.clock.getElapsedTime();if(this.dinosaur&&!this.reduced)animateDinosaur(this.dinosaur,t,this.progress>=99?'idle':'sleep');this.controls.update();this.renderer.render(this.scene,this.camera);};
  private release(root:THREE.Object3D){root.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.Sprite){if(obj instanceof THREE.Mesh)obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>{if('map'in m)(m.map as THREE.Texture|null)?.dispose();m.dispose();});}});}
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.controls.dispose();this.release(this.scene);this.renderer.dispose();this.renderer.domElement.remove();}
}
