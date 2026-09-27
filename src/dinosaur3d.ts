import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {dinosaurs} from './catalog';
const loader=new GLTFLoader();
const data=new Map<number,Promise<ArrayBuffer>>();
export async function loadDinosaur(id:number){
  if(!data.has(id))data.set(id,fetch(`/models/${dinosaurs[id].id}.glb`).then(r=>{if(!r.ok)throw Error('Dinosaur model unavailable');return r.arrayBuffer();}).catch(e=>{data.delete(id);throw e;}));
  const gltf=await loader.parseAsync((await data.get(id)!).slice(0),'');
  const model=gltf.scene,box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const scale=Math.min(2.85/size.y,3.20/Math.max(size.x,size.z));
  model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;o.userData.restQuaternion=o.quaternion.clone();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m instanceof T.MeshStandardMaterial){m.roughness=.82;m.flatShading=true;m.side=T.DoubleSide;}});}});
  const root=new T.Group();root.add(model);root.userData.species=dinosaurs[id].id;return root;
}
export function dispose3D(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if('map'in m)(m.map as T.Texture|null)?.dispose();m.dispose();});}});}
export function animateDinosaur(root:T.Group,time:number,state:string){
  root.rotation.z=state==='happy'?Math.sin(time*9)*.055:state==='walk'?Math.sin(time*6)*.018:0;
  root.scale.y=state==='sleep'?.82:1+Math.sin(time*2)*.008;
  root.children[0].rotation.z=state==='eat'?Math.sin(time*4)*.045:state==='look'?Math.sin(time*1.7)*.035:0;
  root.traverse(o=>{
    const rest=o.userData.restQuaternion as T.Quaternion|undefined;if(!rest)return;
    o.quaternion.copy(rest);
    if(o.name.startsWith('Tail')||o.name.startsWith('Tapered_tail'))o.rotateZ(Math.sin(time*2)*.025);
    if(o.name.startsWith('Rounded_leg')||o.name.startsWith('Thigh'))o.rotateY(state==='walk'?Math.sin(time*7+o.position.z*8)*.06:0);
  });
}
