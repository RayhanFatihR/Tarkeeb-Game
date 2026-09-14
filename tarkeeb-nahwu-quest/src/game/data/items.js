const items = {
  // ==================================================
  // WEAPON
  // ==================================================

  swordOfIsim: {
    id: "swordOfIsim",

    name: "Sword of Isim",

    type: "Weapon",

    rarity: "Common",

    effectType: "isimXp",

    effectValue: 0.10,

    description:
      "+10% XP dari soal Isim.",

    icon: "🗡️",
  },

  // ==================================================
  // ARMOR
  // ==================================================

  shieldOfMubtada: {
    id: "shieldOfMubtada",

    name: "Shield of Mubtada",

    type: "Armor",

    rarity: "Rare",

    effectType: "defense",

    effectValue: 20,

    description:
      "+20 Defense saat Battle.",

    icon: "🛡️",
  },

  // ==================================================
  // ACCESSORY
  // ==================================================

  ringOfRafa: {
    id: "ringOfRafa",

    name: "Ring of Rafa'",

    type: "Accessory",

    rarity: "Epic",

    effectType: "nahwuXp",

    effectValue: 0.15,

    description:
      "+15% XP dari semua soal Nahwu.",

    icon: "💍",
  },

  // ==================================================
  // CONTOH LEGENDARY
  // ==================================================

  crownOfNahwu: {
    id: "crownOfNahwu",

    name: "Crown of Nahwu",

    type: "Accessory",

    rarity: "Legendary",

    effectType: "allXp",

    effectValue: 0.25,

    description:
      "+25% XP dari semua tantangan.",

    icon: "👑",
  },
};

export default items;