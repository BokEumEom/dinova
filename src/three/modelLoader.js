import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { getModelAsset } from '../data/modelAssets.mjs'

const loader = new GLTFLoader()
const cache = new Map()
export async function loadCreatureModel(id){
  const url=getModelAsset(id); if(!url) throw new Error(`No GLB for ${id}`)
  if(!cache.has(id)) cache.set(id, loader.loadAsync(url).then(({scene})=>scene))
  const root=(await cache.get(id)).clone(true)
  root.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; if(o.material){ o.material=o.material.clone(); o.material.flatShading=true; o.material.roughness=.84; o.material.metalness=0 } } })
  return root
}
export function fitCreatureModel(root,targetHeight=3){
  const box=new THREE.Box3().setFromObject(root), size=box.getSize(new THREE.Vector3()); if(size.y>0) root.scale.multiplyScalar(targetHeight/size.y)
  const fitted=new THREE.Box3().setFromObject(root), center=fitted.getCenter(new THREE.Vector3()); root.position.x-=center.x; root.position.z-=center.z; root.position.y-=fitted.min.y; return root
}
