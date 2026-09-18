import test from 'node:test'
import assert from 'node:assert/strict'
import { CREATURES } from './creatures.mjs'
import { createInitialGameState } from '../store/gameStore.mjs'

test('MVP has 15 canonical creatures', () => {
  assert.equal(CREATURES.length, 15)
  assert.equal(new Set(CREATURES.map(c => c.id)).size, 15)
})

test('sprite indexes cover the full 3x5 sheet', () => {
  assert.deepEqual(CREATURES.map(c => c.spriteIndex).sort((a,b)=>a-b), Array.from({length:15},(_,i)=>i))
})

test('game state contains progress for every creature', () => {
  const state=createInitialGameState()
  assert.deepEqual(Object.keys(state.progress).sort(), CREATURES.map(c=>c.id).sort())
})
