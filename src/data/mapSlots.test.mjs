import test from 'node:test'
import assert from 'node:assert/strict'
import { MAP_AREAS, MAP_SLOTS, mapAreaForCreature, mapSlotForCreature } from './mapSlots.mjs'
import { CREATURES } from './creatures.mjs'

test('all 15 creatures have a unique 3D habitat slot', () => {
  assert.equal(MAP_SLOTS.length, CREATURES.length)
  assert.equal(new Set(MAP_SLOTS.map(slot=>slot.creatureId)).size, CREATURES.length)
  for (const creature of CREATURES) assert.ok(mapSlotForCreature(creature.id))
})

test('MVP exposes four explorable habitat areas', () => {
  assert.deepEqual(MAP_AREAS.map(area=>area.id), ['meadow','snowy-ridge','ancient-forest','lost-coast'])
  for (const creature of CREATURES) assert.ok(MAP_AREAS.some(area=>area.id===mapAreaForCreature(creature.id)))
})
