const items = {
  // ==================================================
  // EXISTING WORLD REWARDS
  // ==================================================

  swordOfIsim: {
    id: "swordOfIsim",
    name: "Sword of Isim",
    type: "Weapon",
    rarity: "Common",
    effectType: "isimXp",
    effectValue: 0.10,
    description: "+10% XP dari soal Isim.",
    icon: "🗡️",
  },

  shieldOfMubtada: {
    id: "shieldOfMubtada",
    name: "Shield of Mubtada",
    type: "Armor",
    rarity: "Rare",
    effectType: "defense",
    effectValue: 20,
    description: "+20 Defense saat Battle.",
    icon: "🛡️",
  },

  ringOfRafa: {
    id: "ringOfRafa",
    name: "Ring of Rafa'",
    type: "Accessory",
    rarity: "Epic",
    effectType: "nahwuXp",
    effectValue: 0.15,
    description: "+15% XP dari semua soal Nahwu.",
    icon: "💍",
  },

  crownOfNahwu: {
    id: "crownOfNahwu",
    name: "Crown of Nahwu",
    type: "Accessory",
    rarity: "Legendary",
    effectType: "allXp",
    effectValue: 0.25,
    description: "+25% XP dari semua tantangan.",
    icon: "👑",
  },

  // ==================================================
  // SHOP TIER 1 — EARLY NAHWU VILLAGE
  // ==================================================

  woodenNahwuBlade: {
    id: "woodenNahwuBlade",
    name: "Wooden Nahwu Blade",
    type: "Weapon",
    rarity: "Common",
    effectType: "attack",
    effectValue: 5,
    description: "+5 Attack saat Battle.",
    icon: "🗡️",
  },

  studentRobe: {
    id: "studentRobe",
    name: "Student Robe",
    type: "Armor",
    rarity: "Common",
    effectType: "defense",
    effectValue: 8,
    description: "+8 Defense saat Battle.",
    icon: "🥋",
  },

  studyCharm: {
    id: "studyCharm",
    name: "Study Charm",
    type: "Accessory",
    rarity: "Common",
    effectType: "allXp",
    effectValue: 0.05,
    description: "+5% XP dari semua tantangan.",
    icon: "📿",
  },

  // ==================================================
  // SHOP TIER 2 — AFTER CHAPTER I
  // ==================================================

  forestBlade: {
    id: "forestBlade",
    name: "Forest Blade",
    type: "Weapon",
    rarity: "Rare",
    effectType: "attack",
    effectValue: 12,
    description: "+12 Attack saat Battle.",
    icon: "⚔️",
  },

  guardianArmor: {
    id: "guardianArmor",
    name: "Guardian Armor",
    type: "Armor",
    rarity: "Rare",
    effectType: "defense",
    effectValue: 18,
    description: "+18 Defense saat Battle.",
    icon: "🛡️",
  },

  isimPendant: {
    id: "isimPendant",
    name: "Isim Pendant",
    type: "Accessory",
    rarity: "Rare",
    effectType: "isimXp",
    effectValue: 0.12,
    description: "+12% XP dari soal Isim.",
    icon: "🔷",
  },

  // ==================================================
  // SHOP TIER 3 — AFTER CHAPTER II / FI'IL DESERT
  // ==================================================

  fiilBlade: {
    id: "fiilBlade",
    name: "Fi'il Blade",
    type: "Weapon",
    rarity: "Epic",
    effectType: "attack",
    effectValue: 20,
    description: "+20 Attack saat Battle.",
    icon: "🗡️",
  },

  desertScholarArmor: {
    id: "desertScholarArmor",
    name: "Desert Scholar Armor",
    type: "Armor",
    rarity: "Epic",
    effectType: "defense",
    effectValue: 28,
    description: "+28 Defense saat Battle.",
    icon: "🛡️",
  },

  fiilAmulet: {
    id: "fiilAmulet",
    name: "Fi'il Amulet",
    type: "Accessory",
    rarity: "Epic",
    effectType: "allXp",
    effectValue: 0.18,
    description: "+18% XP dari semua tantangan.",
    icon: "🔶",
  },

  // ==================================================
  // SHOP TIER 4 — CASTLE / BOSS PREPARATION
  // ==================================================

  royalNahwuSword: {
    id: "royalNahwuSword",
    name: "Royal Nahwu Sword",
    type: "Weapon",
    rarity: "Legendary",
    effectType: "attack",
    effectValue: 32,
    description: "+32 Attack saat Battle. Dibuat untuk menghadapi boss Castle.",
    icon: "⚔️",
  },

  royalScholarArmor: {
    id: "royalScholarArmor",
    name: "Royal Scholar Armor",
    type: "Armor",
    rarity: "Legendary",
    effectType: "defense",
    effectValue: 40,
    description: "+40 Defense saat Battle. Perlindungan tingkat Castle.",
    icon: "🛡️",
  },

  royalGrammarSeal: {
    id: "royalGrammarSeal",
    name: "Royal Grammar Seal",
    type: "Accessory",
    rarity: "Legendary",
    effectType: "allXp",
    effectValue: 0.25,
    description: "+25% XP dari semua tantangan.",
    icon: "💠",
  },
};

export default items;
