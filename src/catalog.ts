export type Language='ko'|'en';
export const dinosaurs=[
  {id:'brachiosaurus',ko:'브라키오사우루스',en:'Brachiosaurus',image:1,group:0,diet:'plant',era:'jurassic'},
  {id:'triceratops',ko:'트리케라톱스',en:'Triceratops',image:2,group:0,diet:'plant',era:'cretaceous'},
  {id:'stegosaurus',ko:'스테고사우루스',en:'Stegosaurus',image:3,group:0,diet:'plant',era:'jurassic'},
  {id:'tyrannosaurus',ko:'티라노사우루스',en:'Tyrannosaurus',image:4,group:0,diet:'meat',era:'cretaceous'},
  {id:'ankylosaurus',ko:'안킬로사우루스',en:'Ankylosaurus',image:5,group:0,diet:'plant',era:'cretaceous'},
  {id:'pteranodon',ko:'프테라노돈',en:'Pteranodon',image:6,group:0,diet:'fish',era:'cretaceous'},
  {id:'parasaurolophus',ko:'파라사우롤로푸스',en:'Parasaurolophus',image:9,group:1,diet:'plant',era:'cretaceous'},
  {id:'velociraptor',ko:'벨로키랍토르',en:'Velociraptor',image:10,group:1,diet:'meat',era:'cretaceous'},
  {id:'spinosaurus',ko:'스피노사우루스',en:'Spinosaurus',image:11,group:1,diet:'fish',era:'cretaceous'},
  {id:'pachycephalosaurus',ko:'파키케팔로사우루스',en:'Pachycephalosaurus',image:12,group:1,diet:'plant',era:'cretaceous'},
  {id:'dilophosaurus',ko:'딜로포사우루스',en:'Dilophosaurus',image:13,group:1,diet:'meat',era:'jurassic'},
  {id:'styracosaurus',ko:'스티라코사우루스',en:'Styracosaurus',image:14,group:1,diet:'plant',era:'cretaceous'},
  {id:'carnotaurus',ko:'카르노타우루스',en:'Carnotaurus',image:15,group:2,diet:'meat',era:'cretaceous'},
  {id:'therizinosaurus',ko:'테리지노사우루스',en:'Therizinosaurus',image:16,group:2,diet:'plant',era:'cretaceous'},
  {id:'corythosaurus',ko:'코리토사우루스',en:'Corythosaurus',image:17,group:2,diet:'plant',era:'cretaceous'},
  {id:'kentrosaurus',ko:'켄트로사우루스',en:'Kentrosaurus',image:18,group:2,diet:'plant',era:'jurassic'},
  {id:'amargasaurus',ko:'아마르가사우루스',en:'Amargasaurus',image:19,group:2,diet:'plant',era:'cretaceous'},
  {id:'iguanodon',ko:'이구아노돈',en:'Iguanodon',image:20,group:2,diet:'plant',era:'cretaceous'},
] as const;
export const imageFor=(id:number)=>`/models/thumbs/${dinosaurs[id].id}.png`;
export const dinoName=(id:number,lang:Language)=>dinosaurs[id][lang];
export const decorations=[
  {id:'tree',ko:'작은 나무',en:'Little tree',viewBox:'191 291 113 145',width:19},
  {id:'flowers',ko:'데이지',en:'Daisies',viewBox:'12 176 128 112',width:14},
  {id:'rocks',ko:'바위',en:'Rocks',viewBox:'379 169 150 120',width:18},
  {id:'pond',ko:'연못',en:'Little pond',viewBox:'147 170 232 117',width:29},
  {id:'log',ko:'통나무',en:'Fallen log',viewBox:'338 330 191 94',width:24},
  {id:'bush',ko:'풀숲',en:'Bush',viewBox:'372 39 158 105',width:18},
  {id:'sign',ko:'이정표',en:'Signpost',viewBox:'360 431 101 112',width:13},
] as const;
export function decorationArt(id:string){const d=decorations.find(x=>x.id===id)!;return `<svg viewBox="${d.viewBox}" aria-hidden="true"><image href="/images/reference-07.webp" width="550" height="550"/></svg>`;}
