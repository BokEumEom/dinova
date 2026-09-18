export const MAP_AREAS = [
  { id:'meadow', name:'Sunny Plains', koName:'햇살 초원' },
  { id:'snowy-ridge', name:'Snowy Ridge', koName:'눈 덮인 능선' },
  { id:'ancient-forest', name:'Ancient Forest', koName:'고대 숲' },
  { id:'lost-coast', name:'Lost Coast', koName:'잃어버린 해안' },
]

export const MAP_SLOTS = [
  { id:'meadow-a', areaId:'meadow', creatureId:'brachiosaurus', position:[-2.8,0,-.8], rotationY:.25, scale:.76 },
  { id:'meadow-b', areaId:'meadow', creatureId:'triceratops', position:[2.8,0,.9], rotationY:.55, scale:.85 },
  { id:'meadow-c', areaId:'meadow', creatureId:'stegosaurus', position:[.2,0,3], rotationY:-.85, scale:.8 },
  { id:'meadow-d', areaId:'meadow', creatureId:'tyrannosaurus-rex', position:[3,0,-2.4], rotationY:-1.5, scale:.72 },
  { id:'meadow-e', areaId:'meadow', creatureId:'velociraptor', position:[-.2,0,-3.2], rotationY:1.1, scale:.5 },
  { id:'meadow-f', areaId:'meadow', creatureId:'ankylosaurus', position:[-3.2,0,2.45], rotationY:2.2, scale:.76 },

  { id:'ridge-a', areaId:'snowy-ridge', creatureId:'parasaurolophus', position:[-2.5,0,-1.3], rotationY:.4, scale:.72 },
  { id:'ridge-b', areaId:'snowy-ridge', creatureId:'pachycephalosaurus', position:[2.5,0,.4], rotationY:-.6, scale:.64 },
  { id:'ridge-c', areaId:'snowy-ridge', creatureId:'iguanodon', position:[0,0,2.8], rotationY:1.2, scale:.74 },

  { id:'forest-a', areaId:'ancient-forest', creatureId:'therizinosaurus', position:[-2.6,0,-1.5], rotationY:.45, scale:.68 },
  { id:'forest-b', areaId:'ancient-forest', creatureId:'amargasaurus', position:[2.4,0,-.7], rotationY:-.7, scale:.7 },
  { id:'forest-c', areaId:'ancient-forest', creatureId:'kentrosaurus', position:[1.1,0,2.7], rotationY:2, scale:.7 },
  { id:'forest-d', areaId:'ancient-forest', creatureId:'styracosaurus', position:[-2.5,0,2], rotationY:1.4, scale:.72 },

  { id:'coast-a', areaId:'lost-coast', creatureId:'pteranodon', position:[-1.8,2.4,-.9], rotationY:.2, scale:.62, flight:true },
  { id:'coast-b', areaId:'lost-coast', creatureId:'mosasaurus', position:[1.8,.1,.3], rotationY:-.5, scale:.68, aquatic:true },
]

export function mapSlotForCreature(creatureId) {
  return MAP_SLOTS.find(slot => slot.creatureId === creatureId) ?? null
}

export function mapAreaForCreature(creatureId) {
  return mapSlotForCreature(creatureId)?.areaId ?? 'meadow'
}
