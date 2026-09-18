export const MASTER_PALETTE = Object.freeze({
  mintLight: '#B6F2D8',
  mintBase: '#8EDFC8',
  mintShadow: '#6FC2AD',
  ivory: '#EFF2D7',
  charcoal: '#35424A',
})

export const MODEL_ASSETS = Object.freeze({
  brachiosaurus: '/models/brachiosaurus.glb',
  triceratops: '/models/triceratops.glb',
  stegosaurus: '/models/stegosaurus.glb',
  'tyrannosaurus-rex': '/models/tyrannosaurus-rex.glb',
  velociraptor: '/models/velociraptor.glb',
  ankylosaurus: '/models/ankylosaurus.glb',
})

export function getModelAsset(id) {
  return MODEL_ASSETS[id] ?? null
}
