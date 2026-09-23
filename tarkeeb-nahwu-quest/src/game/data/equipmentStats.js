// ============================================================
// TARKEEB — EQUIPMENT STAT HELPERS
// Step 2G.4
//
// Satu sumber perhitungan bonus equipment untuk semua scene.
// Ini mencegah Weapon/Armor/Accessory dihitung berdasarkan rarity
// saja. Battle sekarang memakai effectType + effectValue asli item.
// ============================================================

export const EQUIPMENT_SLOTS = Object.freeze([
  "Weapon",
  "Armor",
  "Accessory",
]);

export function getEquippedItems(playerData) {
  const inventory = Array.isArray(playerData?.inventory)
    ? playerData.inventory
    : [];

  const equipped =
    playerData?.equipped && typeof playerData.equipped === "object"
      ? playerData.equipped
      : {};

  return EQUIPMENT_SLOTS
    .map((slot) => {
      const itemId = equipped[slot];

      if (!itemId) {
        return null;
      }

      return (
        inventory.find(
          (item) => item && item.id === itemId
        ) || null
      );
    })
    .filter(Boolean);
}

export function getEquipmentAttackBonus(playerData) {
  return getEquippedItems(playerData).reduce(
    (total, item) => {
      if (item.effectType !== "attack") {
        return total;
      }

      return total + (Number(item.effectValue) || 0);
    },
    0
  );
}

export function getEquipmentDefenseBonus(playerData) {
  return getEquippedItems(playerData).reduce(
    (total, item) => {
      if (item.effectType !== "defense") {
        return total;
      }

      return total + (Number(item.effectValue) || 0);
    },
    0
  );
}

export function getEquipmentXPBonus(
  playerData,
  questionType = "isim"
) {
  const normalizedType = String(
    questionType || ""
  ).toLowerCase();

  return getEquippedItems(playerData).reduce(
    (total, item) => {
      const effectType = item.effectType;
      const value = Number(item.effectValue) || 0;

      if (effectType === "allXp") {
        return total + value;
      }

      if (
        effectType === "isimXp" &&
        normalizedType === "isim"
      ) {
        return total + value;
      }

      if (
        effectType === "nahwuXp" &&
        normalizedType === "nahwu"
      ) {
        return total + value;
      }

      if (
        effectType === "fiilXp" &&
        normalizedType === "fiil"
      ) {
        return total + value;
      }

      return total;
    },
    0
  );
}
