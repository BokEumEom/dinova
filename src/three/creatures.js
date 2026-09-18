import * as THREE from 'three'
import { MASTER_PALETTE } from '../data/modelAssets.mjs'

const color = hex => Number.parseInt(hex.slice(1),16)
export const PALETTE={mint:color(MASTER_PALETTE.mintBase),mintLight:color(MASTER_PALETTE.mintLight),mintShadow:color(MASTER_PALETTE.mintShadow),ivory:color(MASTER_PALETTE.ivory),charcoal:color(MASTER_PALETTE.charcoal)}
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.86,metalness:0,flatShading:true})
const M={mint:mat(PALETTE.mint),light:mat(PALETTE.mintLight),shadow:mat(PALETTE.mintShadow),ivory:mat(PALETTE.ivory),eye:mat(PALETTE.charcoal)}
const add=(g,geometry,material,p=[0,0,0],s=[1,1,1],r=[0,0,0])=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...p);mesh.scale.set(...s);mesh.rotation.set(...r);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh}
const sphere=()=>new THREE.SphereGeometry(1,8,6)
const cylinder=(a=.3,b=.36,h=1)=>new THREE.CylinderGeometry(a,b,h,7)
const cone=(r=.3,h=1)=>new THREE.ConeGeometry(r,h,7)
const eye=(g,p)=>add(g,sphere(),M.eye,p,[.07,.08,.04])
const leg=(g,x,z,h=.9,w=.24)=>{add(g,cylinder(w*.85,w,h),M.shadow,[x,h/2,z]);add(g,sphere(),M.mint,[x,.06,z+.03],[w*1.1,.14,w*1.3])}

function sauropod(spines=false){
  const g=new THREE.Group();add(g,sphere(),M.mint,[0,1.15,0],[1.15,.7,.65]);add(g,cylinder(.2,.33,2.8),M.mint,[-.8,2.3,0],[1,1,1],[0,0,-.2]);add(g,cylinder(.11,.17,2.45),M.ivory,[-.67,2.25,.25],[1,1,1],[0,0,-.2]);add(g,sphere(),M.mint,[-1.1,3.72,0],[.48,.34,.36]);add(g,sphere(),M.ivory,[-1.25,3.58,.2],[.3,.13,.09]);eye(g,[-1.31,3.84,.28]);[[-.65,.38],[.62,.38],[-.65,-.38],[.62,-.38]].forEach(([x,z])=>leg(g,x,z,1.02,.24));add(g,cone(.38,2.1),M.mint,[1.75,1.22,0],[1,1,1],[0,0,-Math.PI/2]);if(spines){for(let i=0;i<7;i++)add(g,cone(.1,.55),M.ivory,[-.45+i*.27,1.95-Math.abs(3-i)*.08,0],[1,1,.7])}return g
}
function triceratops(extra=false){const g=new THREE.Group();add(g,sphere(),M.mint,[0,1,0],[1.15,.65,.65]);[[-.62,.4],[.62,.4],[-.62,-.4],[.62,-.4]].forEach(([x,z])=>leg(g,x,z,.72,.22));add(g,sphere(),M.light,[-1.05,1.25,0],[.6,.44,.46]);add(g,sphere(),M.light,[-.78,1.57,0],[.72,.55,.52]);const horns=[[-1.35,1.58,.23],[-1.35,1.58,-.23],[-1.53,1.31,0]];if(extra)horns.push([-1.02,1.72,.35],[-1.02,1.72,-.35],[-.78,1.78,0]);horns.forEach(p=>add(g,cone(.12,.7),M.ivory,p,[1,1,1],[0,0,Math.PI/2]));eye(g,[-1.28,1.38,.31]);add(g,cone(.28,1.5),M.mint,[1.4,1,0],[1,1,1],[0,0,-Math.PI/2]);return g}
function stegosaurus(extra=false){const g=new THREE.Group();add(g,sphere(),M.mint,[0,1,0],[1.3,.68,.65]);[[-.7,.4],[.7,.4],[-.7,-.4],[.7,-.4]].forEach(([x,z])=>leg(g,x,z,.72,.22));add(g,sphere(),M.mint,[-1.15,1,0],[.5,.34,.36]);eye(g,[-1.39,1.09,.25]);[-.7,-.35,0,.35,.7].forEach((x,i)=>add(g,cone(extra?.16:.26,extra?.85:.65+(2-Math.abs(2-i))*.09),extra?M.ivory:M.shadow,[x,1.72,0],[1,1,.6]));add(g,cone(.28,1.7),M.mint,[1.5,1,0],[1,1,1],[0,0,-Math.PI/2]);return g}
function theropod(kind){const g=new THREE.Group();add(g,sphere(),M.mint,[0,1.35,0],[.85,.7,.55]);add(g,sphere(),M.mint,[-.75,2,0],[.68,.45,.45]);if(kind==='pachycephalosaurus')add(g,sphere(),M.light,[-.82,2.3,0],[.38,.22,.3]);if(kind==='parasaurolophus')add(g,cone(.22,.9),M.shadow,[-.48,2.35,0],[1,1,1],[0,0,-1.05]);add(g,sphere(),M.ivory,[-.97,1.83,.27],[.45,.14,.08]);eye(g,[-1.03,2.1,.3]);leg(g,-.2,.32,1,.24);leg(g,.55,.32,1,.24);add(g,cone(.28,2),M.mint,[1.55,1.3,0],[1,1,1],[0,0,-Math.PI/2]);if(kind==='therizinosaurus'){for(let z of [-.18,.18])for(let j=0;j<3;j++)add(g,cone(.035,.9),M.ivory,[-1.25-j*.08,1.35,z+j*.04],[1,1,1],[0,0,Math.PI/2])}g.userData.kind=kind;return g}
function ankylosaurus(){const g=new THREE.Group();add(g,sphere(),M.mint,[0,1,0],[1.25,.68,.72]);[[-.65,.4],[.65,.4],[-.65,-.4],[.65,-.4]].forEach(([x,z])=>leg(g,x,z,.68,.22));add(g,sphere(),M.mint,[-1.15,1,0],[.5,.35,.38]);eye(g,[-1.38,1.08,.26]);for(let i=0;i<7;i++){const x=-.65+i*.25;add(g,cone(.14,.42),M.ivory,[x,1.62,(i%2?-.2:.2)])}add(g,cylinder(.12,.22,1.25),M.mint,[1.25,1,0],[1,1,1],[0,0,-Math.PI/2]);add(g,sphere(),M.shadow,[1.9,1,0],[.3,.28,.3]);return g}
function pteranodon(){const g=new THREE.Group();add(g,sphere(),M.mint,[0,1.1,0],[.65,.3,.28]);add(g,sphere(),M.mint,[-.65,1.2,0],[.35,.26,.23]);add(g,cone(.14,.9),M.ivory,[-1.1,1.18,0],[1,1,1],[0,0,Math.PI/2]);eye(g,[-.77,1.3,.2]);add(g,cone(.17,.75),M.shadow,[-.35,1.43,0],[1,1,1],[0,0,-1.05]);add(g,cone(.85,2.5),M.light,[0,1.12,.95],[1,.22,1],[Math.PI/2,0,0]);add(g,cone(.85,2.5),M.light,[0,1.12,-.95],[1,.22,1],[-Math.PI/2,0,0]);add(g,cone(.16,1.2),M.mint,[.95,1.08,0],[1,1,1],[0,0,-Math.PI/2]);return g}
function mosasaurus(){const g=new THREE.Group();add(g,sphere(),M.mint,[0,1,0],[1.45,.48,.55]);add(g,sphere(),M.mint,[-1.2,1,0],[.58,.33,.38]);eye(g,[-1.43,1.12,.28]);add(g,cone(.35,2.1),M.mint,[1.75,1,0],[1,1,1],[0,0,-Math.PI/2]);add(g,cone(.28,.85),M.light,[-.25,.82,.62],[1,.3,1],[Math.PI/2,0,0]);add(g,cone(.28,.85),M.light,[-.25,.82,-.62],[1,.3,1],[-Math.PI/2,0,0]);return g}

export function createCreature(id='brachiosaurus'){
  let g
  if(id==='brachiosaurus')g=sauropod(false)
  else if(id==='amargasaurus')g=sauropod(true)
  else if(id==='triceratops')g=triceratops(false)
  else if(id==='styracosaurus')g=triceratops(true)
  else if(id==='stegosaurus')g=stegosaurus(false)
  else if(id==='kentrosaurus')g=stegosaurus(true)
  else if(id==='ankylosaurus')g=ankylosaurus()
  else if(id==='pteranodon')g=pteranodon()
  else if(id==='mosasaurus')g=mosasaurus()
  else g=theropod(id)
  g.userData.creatureId=id
  return g
}
