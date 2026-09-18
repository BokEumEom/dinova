export const CREATURES = [
  { id: 'brachiosaurus', name: 'Brachiosaurus', koName: '브라키오사우루스', requiredMinutes: 120, rarity: 'common', biomeId: 'meadow', category: 'land', mapSlot: 'meadow-a', silhouette: 'longneck' },
  { id: 'triceratops', name: 'Triceratops', koName: '트리케라톱스', requiredMinutes: 150, rarity: 'common', biomeId: 'meadow', category: 'land', mapSlot: 'meadow-b', silhouette: 'horned' },
  { id: 'stegosaurus', name: 'Stegosaurus', koName: '스테고사우루스', requiredMinutes: 180, rarity: 'common', biomeId: 'meadow', category: 'land', mapSlot: 'meadow-c', silhouette: 'plates' },
  { id: 'tyrannosaurus-rex', name: 'Tyrannosaurus rex', koName: '티라노사우루스', requiredMinutes: 240, rarity: 'rare', biomeId: 'meadow', category: 'land', mapSlot: 'meadow-d', silhouette: 'theropod' },
  { id: 'ankylosaurus', name: 'Ankylosaurus', koName: '안킬로사우루스', requiredMinutes: 210, rarity: 'rare', biomeId: 'meadow', category: 'land', mapSlot: 'meadow-e', silhouette: 'armored' },
  { id: 'parasaurolophus', name: 'Parasaurolophus', koName: '파라사우롤로푸스', requiredMinutes: 220, rarity: 'rare', biomeId: 'meadow', category: 'land', mapSlot: 'meadow-f', silhouette: 'crested' },
  { id: 'pachycephalosaurus', name: 'Pachycephalosaurus', koName: '파키케팔로사우루스', requiredMinutes: 280, rarity: 'rare', biomeId: 'snowy-ridge', category: 'land', mapSlot: 'ridge-a', silhouette: 'dome' },
  { id: 'amargasaurus', name: 'Amargasaurus', koName: '아마르가사우루스', requiredMinutes: 330, rarity: 'epic', biomeId: 'snowy-ridge', category: 'land', mapSlot: 'ridge-b', silhouette: 'spines' },
  { id: 'therizinosaurus', name: 'Therizinosaurus', koName: '테리지노사우루스', requiredMinutes: 360, rarity: 'epic', biomeId: 'ancient-forest', category: 'land', mapSlot: 'forest-a', silhouette: 'claws' },
  { id: 'pteranodon', name: 'Pteranodon', koName: '프테라노돈', requiredMinutes: 300, rarity: 'epic', biomeId: 'sky', category: 'sky', mapSlot: 'sky-a', silhouette: 'winged' },
  { id: 'velociraptor', name: 'Velociraptor', koName: '벨로시랩터', requiredMinutes: 260, rarity: 'rare', biomeId: 'ancient-forest', category: 'land', mapSlot: 'forest-b', silhouette: 'raptor' },
  { id: 'mosasaurus', name: 'Mosasaurus', koName: '모사사우루스', requiredMinutes: 420, rarity: 'epic', biomeId: 'lost-coast', category: 'water', mapSlot: 'coast-a', silhouette: 'marine' },
]

export const CREATURE_BY_ID = Object.fromEntries(CREATURES.map((creature) => [creature.id, creature]))
