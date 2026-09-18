import test from 'node:test'
import assert from 'node:assert/strict'
import { MAP_SLOTS, mapSlotForCreature } from './mapSlots.mjs'

test('Meadow slots use the six creatures that have final matching assets', () => {
  assert.deepEqual(MAP_SLOTS.map(slot => slot.creatureId), [
    'brachiosaurus', 'triceratops', 'stegosaurus',
    'tyrannosaurus-rex', 'ankylosaurus', 'parasaurolophus',
  ])
  assert.deepEqual(mapSlotForCreature('brachiosaurus').position, [-2.9, 0.2, -0.9])
})

test('all Meadow slots have unique ids and coordinates', () => {
  const ids = MAP_SLOTS.map((slot) => slot.id)
  const positions = MAP_SLOTS.map((slot) => slot.position.join(','))
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(new Set(positions).size, positions.length)
})
