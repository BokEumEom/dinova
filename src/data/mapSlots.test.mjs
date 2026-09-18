import test from 'node:test'
import assert from 'node:assert/strict'
import { MAP_SLOTS, mapSlotForCreature } from './mapSlots.mjs'

test('meadow slots provide deterministic coordinates for starter creatures', () => {
  assert.deepEqual(mapSlotForCreature('brachiosaurus').position, [-2.8, 0, -0.8])
  assert.equal(mapSlotForCreature('triceratops').rotationY, 0.55)
})

test('all meadow starter slots have unique ids and coordinates', () => {
  const ids = MAP_SLOTS.map((slot) => slot.id)
  const positions = MAP_SLOTS.map((slot) => slot.position.join(','))
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(new Set(positions).size, positions.length)
})
