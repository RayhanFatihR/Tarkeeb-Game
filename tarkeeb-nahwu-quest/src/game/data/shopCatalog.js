import items from "./items";

// ============================================================
// TARKEEB — SHOP CATALOG FOUNDATION
// Step 2G.1
//
// Shop menggunakan tier progression global:
// Tier 1 = awal Nahwu Village
// Tier 2 = Chapter I selesai / Forest terbuka
// Tier 3 = Chapter II selesai / Fi'il Desert terbuka
// Tier 4 = Chapter III selesai / Castle terbuka
// ============================================================

export const SHOP_TIER_INFO = Object.freeze({
  1: {
    name: "Student Gear",
    description: "Perlengkapan dasar untuk petualang Nahwu.",
  },
  2: {
    name: "Forest Gear",
    description: "Perlengkapan untuk menghadapi tantangan Forest.",
  },
  3: {
    name: "Desert Gear",
    description: "Perlengkapan kuat untuk Chapter Fi'il Desert.",
  },
  4: {
    name: "Royal Gear",
    description: "Perlengkapan persiapan menghadapi boss Castle.",
  },
});

export const SHOP_CATALOG = Object.freeze([
  // ------------------------------
  // TIER 1
  // ------------------------------
  {
    itemId: "woodenNahwuBlade",
    price: 150,
    requiredTier: 1,
  },
  {
    itemId: "studentRobe",
    price: 180,
    requiredTier: 1,
  },
  {
    itemId: "studyCharm",
    price: 140,
    requiredTier: 1,
  },

  // ------------------------------
  // TIER 2
  // ------------------------------
  {
    itemId: "forestBlade",
    price: 500,
    requiredTier: 2,
  },
  {
    itemId: "guardianArmor",
    price: 600,
    requiredTier: 2,
  },
  {
    itemId: "isimPendant",
    price: 450,
    requiredTier: 2,
  },

  // ------------------------------
  // TIER 3
  // ------------------------------
  {
    itemId: "fiilBlade",
    price: 1000,
    requiredTier: 3,
  },
  {
    itemId: "desertScholarArmor",
    price: 1200,
    requiredTier: 3,
  },
  {
    itemId: "fiilAmulet",
    price: 900,
    requiredTier: 3,
  },

  // ------------------------------
  // TIER 4
  // ------------------------------
  {
    itemId: "royalNahwuSword",
    price: 2000,
    requiredTier: 4,
  },
  {
    itemId: "royalScholarArmor",
    price: 2400,
    requiredTier: 4,
  },
  {
    itemId: "royalGrammarSeal",
    price: 1800,
    requiredTier: 4,
  },
]);

export function getShopEntries(shopTier = 1) {
  const normalizedTier = Math.max(
    1,
    Math.min(4, Number(shopTier) || 1)
  );

  return SHOP_CATALOG
    .filter(
      (entry) =>
        entry.requiredTier <= normalizedTier
    )
    .map((entry) => ({
      ...entry,
      item: items[entry.itemId] || null,
    }))
    .filter((entry) => entry.item);
}

export function getNewestTierEntries(shopTier = 1) {
  const normalizedTier = Math.max(
    1,
    Math.min(4, Number(shopTier) || 1)
  );

  return SHOP_CATALOG
    .filter(
      (entry) =>
        entry.requiredTier === normalizedTier
    )
    .map((entry) => ({
      ...entry,
      item: items[entry.itemId] || null,
    }))
    .filter((entry) => entry.item);
}

export function getShopEntry(itemId) {
  const entry = SHOP_CATALOG.find(
    (catalogEntry) =>
      catalogEntry.itemId === itemId
  );

  if (!entry) {
    return null;
  }

  const item = items[entry.itemId];

  if (!item) {
    return null;
  }

  return {
    ...entry,
    item,
  };
}
