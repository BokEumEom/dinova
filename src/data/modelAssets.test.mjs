import test from 'node:test'
import assert from 'node:assert/strict'
import { MODEL_ASSETS, MASTER_PALETTE, getModelAsset } from './modelAssets.mjs'

const meadowCreatures = [
  'brachiosaurus', 'triceratops', 'stegosaurus',
  'tyrannosaurus-rex', 'velociraptor', 'ankylosaurus',
]

test('master palette is locked to the supplied mint Brachiosaurus art direction', () => {
  assert.deepEqual(MASTER_PALETTE, {
    mintLight: '#B6F2D8', mintBase: '#8EDFC8', mintShadow: '#6FC2AD',
    ivory: '#EFF2D7', charcoal: '#35424A',
  })
})

test('every Meadow creature has a GLB asset contract with procedural fallback', () => {
  for (const id of meadowCreatures) {
    const asset = getModelAsset(id)
    assert.equal(asset, MODEL_ASSETS[id])
    assert.match(asset, /^\/models\/.+\.glb$/)
  }
})
