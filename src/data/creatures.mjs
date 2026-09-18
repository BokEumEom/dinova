export const CREATURES = [
  { id: 'brachiosaurus', name: 'Brachiosaurus', koName: '브라키오사우루스', requiredMinutes: 120, rarity: 'common', biomeId: 'meadow', biomeName: '초원', category: 'land', mapSlot: 'meadow-a', spriteIndex: 0 },
  { id: 'triceratops', name: 'Triceratops', koName: '트리케라톱스', requiredMinutes: 150, rarity: 'common', biomeId: 'meadow', biomeName: '초원', category: 'land', mapSlot: 'meadow-b', spriteIndex: 1 },
  { id: 'stegosaurus', name: 'Stegosaurus', koName: '스테고사우루스', requiredMinutes: 180, rarity: 'common', biomeId: 'meadow', biomeName: '초원', category: 'land', mapSlot: 'meadow-c', spriteIndex: 2 },
  { id: 'tyrannosaurus-rex', name: 'Tyrannosaurus rex', koName: '티라노사우루스', requiredMinutes: 240, rarity: 'rare', biomeId: 'meadow', biomeName: '초원', category: 'land', mapSlot: 'meadow-d', spriteIndex: 3 },
  { id: 'ankylosaurus', name: 'Ankylosaurus', koName: '안킬로사우루스', requiredMinutes: 210, rarity: 'rare', biomeId: 'meadow', biomeName: '초원', category: 'land', mapSlot: 'meadow-f', spriteIndex: 4 },
  { id: 'velociraptor', name: 'Velociraptor', koName: '벨로시랩터', requiredMinutes: 210, rarity: 'rare', biomeId: 'meadow', biomeName: '초원', category: 'land', mapSlot: 'meadow-e', spriteIndex: 5 },
  { id: 'parasaurolophus', name: 'Parasaurolophus', koName: '파라사우롤로푸스', requiredMinutes: 260, rarity: 'rare', biomeId: 'snowy-ridge', biomeName: '설원', category: 'land', mapSlot: 'ridge-a', spriteIndex: 6 },
  { id: 'pachycephalosaurus', name: 'Pachycephalosaurus', koName: '파키케팔로사우루스', requiredMinutes: 280, rarity: 'rare', biomeId: 'snowy-ridge', biomeName: '설원', category: 'land', mapSlot: 'ridge-b', spriteIndex: 7 },
  { id: 'iguanodon', name: 'Iguanodon', koName: '이구아노돈', requiredMinutes: 270, rarity: 'rare', biomeId: 'snowy-ridge', biomeName: '설원', category: 'land', mapSlot: 'ridge-c', spriteIndex: 8 },
  { id: 'therizinosaurus', name: 'Therizinosaurus', koName: '테리지노사우루스', requiredMinutes: 360, rarity: 'epic', biomeId: 'ancient-forest', biomeName: '고대 숲', category: 'land', mapSlot: 'forest-a', spriteIndex: 9 },
  { id: 'amargasaurus', name: 'Amargasaurus', koName: '아마르가사우루스', requiredMinutes: 330, rarity: 'epic', biomeId: 'ancient-forest', biomeName: '고대 숲', category: 'land', mapSlot: 'forest-b', spriteIndex: 10 },
  { id: 'kentrosaurus', name: 'Kentrosaurus', koName: '켄트로사우루스', requiredMinutes: 340, rarity: 'epic', biomeId: 'ancient-forest', biomeName: '고대 숲', category: 'land', mapSlot: 'forest-c', spriteIndex: 11 },
  { id: 'styracosaurus', name: 'Styracosaurus', koName: '스티라코사우루스', requiredMinutes: 320, rarity: 'epic', biomeId: 'ancient-forest', biomeName: '고대 숲', category: 'land', mapSlot: 'forest-d', spriteIndex: 12 },
  { id: 'pteranodon', name: 'Pteranodon', koName: '프테라노돈', requiredMinutes: 300, rarity: 'epic', biomeId: 'sky', biomeName: '하늘', category: 'sky', mapSlot: 'sky-a', spriteIndex: 13 },
  { id: 'mosasaurus', name: 'Mosasaurus', koName: '모사사우루스', requiredMinutes: 420, rarity: 'epic', biomeId: 'lost-coast', biomeName: '바다', category: 'water', mapSlot: 'coast-a', spriteIndex: 14 },
]

export const CREATURE_BY_ID = Object.fromEntries(CREATURES.map((creature) => [creature.id, creature]))
