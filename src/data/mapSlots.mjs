export const MAP_SLOTS = [
  { id: 'meadow-a', creatureId: 'brachiosaurus', position: [-2.9, 0.2, -0.9], scale: 1.7 },
  { id: 'meadow-b', creatureId: 'triceratops', position: [2.8, 0.2, 0.9], scale: 1.35 },
  { id: 'meadow-c', creatureId: 'stegosaurus', position: [0.0, 0.2, 3.1], scale: 1.45 },
  { id: 'meadow-d', creatureId: 'tyrannosaurus-rex', position: [3.1, 0.2, -2.5], scale: 1.45 },
  { id: 'meadow-e', creatureId: 'ankylosaurus', position: [-3.2, 0.2, 2.45], scale: 1.28 },
  { id: 'meadow-f', creatureId: 'parasaurolophus', position: [-0.1, 0.2, -3.25], scale: 1.5 },
]

export function mapSlotForCreature(creatureId) {
  return MAP_SLOTS.find((slot) => slot.creatureId === creatureId) ?? null
}
