export const CREATURE_ATLAS_URL = '/assets/dinova-creatures-atlas.webp'
export const MASTER_CREATURE_ASSET = '/assets/brachiosaurus-master.webp'

export const CREATURE_ATLAS = Object.freeze({
  brachiosaurus: { col: 0, row: 0 },
  triceratops: { col: 1, row: 0 },
  stegosaurus: { col: 2, row: 0 },
  'tyrannosaurus-rex': { col: 3, row: 0 },
  ankylosaurus: { col: 4, row: 0 },
  parasaurolophus: { col: 0, row: 1 },
  pachycephalosaurus: { col: 1, row: 1 },
  amargasaurus: { col: 2, row: 1 },
  therizinosaurus: { col: 3, row: 1 },
  pteranodon: { col: 4, row: 1 },
})

export function getCreatureAsset(id) {
  const cell = CREATURE_ATLAS[id]
  return cell ? { ...cell, url: CREATURE_ATLAS_URL } : null
}

export function getCreatureAssetStyle(id) {
  const cell = CREATURE_ATLAS[id]
  if (!cell) return null
  const x = cell.col * 25
  const y = cell.row * 100
  return {
    backgroundImage: `url(${CREATURE_ATLAS_URL})`,
    backgroundSize: '500% 200%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
  }
}
