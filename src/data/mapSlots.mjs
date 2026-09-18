export const MAP_SLOTS = [
  { id: 'meadow-a', creatureId: 'brachiosaurus', position: [-2.8, 0, -0.8], rotationY: 0.25, scale: 0.76 },
  { id: 'meadow-b', creatureId: 'triceratops', position: [2.8, 0, 0.9], rotationY: 0.55, scale: 0.85 },
  { id: 'meadow-c', creatureId: 'stegosaurus', position: [0.2, 0, 3.0], rotationY: -0.85, scale: 0.8 },
  { id: 'meadow-d', creatureId: 'tyrannosaurus-rex', position: [3.0, 0, -2.4], rotationY: -1.5, scale: 0.72 },
  { id: 'meadow-e', creatureId: 'velociraptor', position: [-0.2, 0, -3.2], rotationY: 1.1, scale: 0.5 },
  { id: 'meadow-f', creatureId: 'ankylosaurus', position: [-3.2, 0, 2.45], rotationY: 2.2, scale: 0.76 },
]

export function mapSlotForCreature(creatureId) {
  return MAP_SLOTS.find((slot) => slot.creatureId === creatureId) ?? null
}
