import * as THREE from 'three'

const h = value => Number.parseInt(value.slice(1),16)

const SPECIES = Object.freeze({
  brachiosaurus:{base:'#8EDFC8',light:'#B6F2D8',shadow:'#6FC2AD',accent:'#EFF2D7'},
  triceratops:{base:'#C9AD88',light:'#DFC9A8',shadow:'#A98D6F',accent:'#F0E6CF'},
  stegosaurus:{base:'#9BAE7C',light:'#B7C79A',shadow:'#7E9365',accent:'#D78158'},
  'tyrannosaurus-rex':{base:'#D98361',light:'#E8A17E',shadow:'#B9684B',accent:'#F2DFC5'},
  velociraptor:{base:'#93B4A3',light:'#B2CCBE',shadow:'#759184',accent:'#EFF0D8'},
  ankylosaurus:{base:'#D8B466',light:'#E8CA8C',shadow:'#B78E47',accent:'#EFE6CB'},
  parasaurolophus:{base:'#B98FD1',light:'#D0B1E0',shadow:'#9570AE',accent:'#EFE4D8'},
  pachycephalosaurus:{base:'#87BAB5',light:'#A7D1CB',shadow:'#679590',accent:'#EFE8D6'},
  iguanodon:{base:'#8FC4A4',light:'#ADD8BD',shadow:'#6F9F84',accent:'#EEE9D7'},
  therizinosaurus:{base:'#77B5A3',light:'#9BCDBE',shadow:'#568F7E',accent:'#F0E6CF'},
  amargasaurus:{base:'#87C9B5',light:'#A9DDCD',shadow:'#65A18E',accent:'#EAD8BE'},
  kentrosaurus:{base:'#88A978',light:'#A8C391',shadow:'#68875A',accent:'#C56D55'},
  styracosaurus:{base:'#B99678',light:'#D1B195',shadow:'#94765E',accent:'#F0E1C8'},
  pteranodon:{base:'#8FB4C6',light:'#B2CFDC',shadow:'#6D90A2',accent:'#EEE7D7'},
  mosasaurus:{base:'#70B8BD',light:'#92D0D2',shadow:'#4E9297',accent:'#E6E8D5'},
})

const material = color => new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0,flatShading:true})
const mats = id => {
  const p=SPECIES[id]||SPECIES.brachiosaurus
  return {base:material(h(p.base)),light:material(h(p.light)),shadow:material(h(p.shadow)),accent:material(h(p.accent)),eye:material(0x35424a)}
}
const add=(g,geometry,mat,p=[0,0,0],s=[1,1,1],r=[0,0,0])=>{const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...p);mesh.scale.set(...s);mesh.rotation.set(...r);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh}
const sphere=()=>new THREE.SphereGeometry(1,8,6)
const cylinder=(a=.3,b=.36,height=1)=>new THREE.CylinderGeometry(a,b,height,7)
const cone=(radius=.3,height=1)=>new THREE.ConeGeometry(radius,height,7)
const eye=(g,M,p)=>add(g,sphere(),M.eye,p,[.07,.08,.04])
const leg=(g,M,x,z,height=.9,width=.24)=>{add(g,cylinder(width*.85,width,height),M.shadow,[x,height/2,z]);add(g,sphere(),M.base,[x,.06,z+.03],[width*1.1,.14,width*1.3]);add(g,sphere(),M.accent,[x-.07,.04,z+.12],[.06,.05,.05]);add(g,sphere(),M.accent,[x+.07,.04,z+.12],[.06,.05,.05])}

function sauropod(id,spines=false){
  const M=mats(id),g=new THREE.Group()
  add(g,sphere(),M.base,[0,1.15,0],[1.15,.7,.65])
  add(g,cylinder(.2,.33,2.8),M.base,[-.8,2.3,0],[1,1,1],[0,0,-.2])
  add(g,cylinder(.11,.17,2.45),M.accent,[-.67,2.25,.25],[1,1,1],[0,0,-.2])
  add(g,sphere(),M.base,[-1.1,3.72,0],[.48,.34,.36])
  add(g,sphere(),M.accent,[-1.25,3.58,.2],[.3,.13,.09])
  eye(g,M,[-1.31,3.84,.28])
  ;[[-.65,.38],[.62,.38],[-.65,-.38],[.62,-.38]].forEach(([x,z])=>leg(g,M,x,z,1.02,.24))
  add(g,cone(.38,2.1),M.base,[1.75,1.22,0],[1,1,1],[0,0,-Math.PI/2])
  if(spines)for(let i=0;i<7;i++)add(g,cone(.1,.55),M.accent,[-.45+i*.27,1.95-Math.abs(3-i)*.08,0],[1,1,.7])
  return g
}
function triceratops(id,extra=false){
  const M=mats(id),g=new THREE.Group()
  add(g,sphere(),M.base,[0,1,0],[1.15,.65,.65])
  ;[[-.62,.4],[.62,.4],[-.62,-.4],[.62,-.4]].forEach(([x,z])=>leg(g,M,x,z,.72,.22))
  add(g,sphere(),M.light,[-1.05,1.25,0],[.6,.44,.46]);add(g,sphere(),M.light,[-.78,1.57,0],[.72,.55,.52])
  const horns=[[-1.35,1.58,.23],[-1.35,1.58,-.23],[-1.53,1.31,0]]
  if(extra)horns.push([-1.02,1.72,.35],[-1.02,1.72,-.35],[-.78,1.78,0])
  horns.forEach(p=>add(g,cone(.12,.7),M.accent,p,[1,1,1],[0,0,Math.PI/2]))
  eye(g,M,[-1.28,1.38,.31]);add(g,cone(.28,1.5),M.base,[1.4,1,0],[1,1,1],[0,0,-Math.PI/2]);return g
}
function stegosaurus(id,extra=false){
  const M=mats(id),g=new THREE.Group()
  add(g,sphere(),M.base,[0,1,0],[1.3,.68,.65])
  ;[[-.7,.4],[.7,.4],[-.7,-.4],[.7,-.4]].forEach(([x,z])=>leg(g,M,x,z,.72,.22))
  add(g,sphere(),M.base,[-1.15,1,0],[.5,.34,.36]);eye(g,M,[-1.39,1.09,.25])
  ;[-.7,-.35,0,.35,.7].forEach((x,i)=>add(g,cone(extra?.16:.26,extra?.85:.65+(2-Math.abs(2-i))*.09),extra?M.accent:M.shadow,[x,1.72,0],[1,1,.6]))
  add(g,cone(.28,1.7),M.base,[1.5,1,0],[1,1,1],[0,0,-Math.PI/2]);return g
}
function theropod(id){
  const M=mats(id),g=new THREE.Group()
  add(g,sphere(),M.base,[0,1.35,0],[.85,.7,.55]);add(g,sphere(),M.base,[-.75,2,0],[.68,.45,.45])
  if(id==='pachycephalosaurus')add(g,sphere(),M.light,[-.82,2.3,0],[.38,.22,.3])
  if(id==='parasaurolophus')add(g,cone(.22,.9),M.shadow,[-.48,2.35,0],[1,1,1],[0,0,-1.05])
  add(g,sphere(),M.accent,[-.97,1.83,.27],[.45,.14,.08]);eye(g,M,[-1.03,2.1,.3])
  leg(g,M,-.2,.32,1,.24);leg(g,M,.55,.32,1,.24)
  add(g,cone(.28,2),M.base,[1.55,1.3,0],[1,1,1],[0,0,-Math.PI/2])
  if(id==='therizinosaurus')for(let z of [-.18,.18])for(let j=0;j<3;j++)add(g,cone(.035,.9),M.accent,[-1.25-j*.08,1.35,z+j*.04],[1,1,1],[0,0,Math.PI/2])
  return g
}
function ankylosaurus(id){
  const M=mats(id),g=new THREE.Group()
  add(g,sphere(),M.base,[0,1,0],[1.25,.68,.72]);[[-.65,.4],[.65,.4],[-.65,-.4],[.65,-.4]].forEach(([x,z])=>leg(g,M,x,z,.68,.22))
  add(g,sphere(),M.base,[-1.15,1,0],[.5,.35,.38]);eye(g,M,[-1.38,1.08,.26])
  for(let i=0;i<7;i++)add(g,cone(.14,.42),M.accent,[-.65+i*.25,1.62,(i%2?-.2:.2)])
  add(g,cylinder(.12,.22,1.25),M.base,[1.25,1,0],[1,1,1],[0,0,-Math.PI/2]);add(g,sphere(),M.shadow,[1.9,1,0],[.3,.28,.3]);return g
}
function pteranodon(id){
  const M=mats(id),g=new THREE.Group();add(g,sphere(),M.base,[0,1.1,0],[.65,.3,.28]);add(g,sphere(),M.base,[-.65,1.2,0],[.35,.26,.23]);add(g,cone(.14,.9),M.accent,[-1.1,1.18,0],[1,1,1],[0,0,Math.PI/2]);eye(g,M,[-.77,1.3,.2]);add(g,cone(.17,.75),M.shadow,[-.35,1.43,0],[1,1,1],[0,0,-1.05]);add(g,cone(.85,2.5),M.light,[0,1.12,.95],[1,.22,1],[Math.PI/2,0,0]);add(g,cone(.85,2.5),M.light,[0,1.12,-.95],[1,.22,1],[-Math.PI/2,0,0]);add(g,cone(.16,1.2),M.base,[.95,1.08,0],[1,1,1],[0,0,-Math.PI/2]);return g
}
function mosasaurus(id){
  const M=mats(id),g=new THREE.Group();add(g,sphere(),M.base,[0,1,0],[1.45,.48,.55]);add(g,sphere(),M.base,[-1.2,1,0],[.58,.33,.38]);eye(g,M,[-1.43,1.12,.28]);add(g,cone(.35,2.1),M.base,[1.75,1,0],[1,1,1],[0,0,-Math.PI/2]);add(g,cone(.28,.85),M.light,[-.25,.82,.62],[1,.3,1],[Math.PI/2,0,0]);add(g,cone(.28,.85),M.light,[-.25,.82,-.62],[1,.3,1],[-Math.PI/2,0,0]);return g
}

export function createCreature(id='brachiosaurus'){
  let g
  if(id==='brachiosaurus')g=sauropod(id,false)
  else if(id==='amargasaurus')g=sauropod(id,true)
  else if(id==='triceratops')g=triceratops(id,false)
  else if(id==='styracosaurus')g=triceratops(id,true)
  else if(id==='stegosaurus')g=stegosaurus(id,false)
  else if(id==='kentrosaurus')g=stegosaurus(id,true)
  else if(id==='ankylosaurus')g=ankylosaurus(id)
  else if(id==='pteranodon')g=pteranodon(id)
  else if(id==='mosasaurus')g=mosasaurus(id)
  else g=theropod(id)
  g.userData.creatureId=id
  return g
}
