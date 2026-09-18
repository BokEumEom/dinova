import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CREATURE_ATLAS, CREATURE_ATLAS_URL, MASTER_CREATURE_ASSET, getCreatureAsset, getCreatureAssetStyle } from './assetUrls.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('master Brachiosaurus asset remains the canonical visual reference', () => {
  assert.equal(MASTER_CREATURE_ASSET, '/assets/brachiosaurus-master.webp')
})

test('matching creature assets share one optimized transparent atlas', () => {
  const atlasPath = path.join(root, 'public', CREATURE_ATLAS_URL.slice(1))
  assert.equal(fs.existsSync(atlasPath), true)
  assert.ok(fs.statSync(atlasPath).size > 10_000)
  assert.equal(Object.keys(CREATURE_ATLAS).length, 10)
  assert.deepEqual(getCreatureAsset('triceratops'), { col: 1, row: 0, url: CREATURE_ATLAS_URL })
  assert.equal(getCreatureAsset('velociraptor'), null)
})

test('CSS atlas style maps a creature to its deterministic cell', () => {
  assert.deepEqual(getCreatureAssetStyle('pteranodon'), {
    backgroundImage: `url(${CREATURE_ATLAS_URL})`,
    backgroundSize: '500% 200%',
    backgroundPosition: '100% 100%',
    backgroundRepeat: 'no-repeat',
  })
})
