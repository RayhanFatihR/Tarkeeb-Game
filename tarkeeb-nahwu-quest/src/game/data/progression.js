// ============================================================
// TARKEEB — GLOBAL PROGRESSION FOUNDATION
// Step 2E.3
//
// Satu sumber state untuk progression seluruh dunia:
// 1. Nahwu Village
// 2. Forest of Isim
// 3. Fi'il Desert
// 4. Castle / Final Boss
//
// Registry Phaser dipakai untuk runtime sekarang.
// Persistent save (localStorage / backend) akan ditambahkan pada Step 3D.
// ============================================================

export const AREA_KEYS = Object.freeze({
  VILLAGE: "nahwuVillage",
  FOREST: "forest",
  DESERT: "fiilDesert",
  CASTLE: "castle",
});

export const AREA_CONFIG = Object.freeze({
  nahwuVillage: {
    chapter: 1,
    name: "Nahwu Village",
    nextArea: "forest",
    requiredMonsterIds: [
      "nahwuSlime",
      "grammarGoblin",
      "irabGolem",
    ],
  },

  forest: {
    chapter: 2,
    name: "Forest of Isim",
    nextArea: "fiilDesert",
    requiredMonsterIds: [],
  },

  fiilDesert: {
    chapter: 3,
    name: "Fi'il Desert",
    nextArea: "castle",
    requiredMonsterIds: [],
  },

  castle: {
    chapter: 4,
    name: "Castle",
    nextArea: null,
    requiredMonsterIds: [],
  },
});

const createAreaState = (unlocked = false) => ({
  unlocked,
  questCompleted: false,
  defeatedMonsters: [],
  openedChests: [],
  completed: false,
});

export function createDefaultGameProgress() {
  return {
    version: 2,
    currentArea: AREA_KEYS.VILLAGE,

    nahwuVillage: createAreaState(true),
    forest: createAreaState(false),
    fiilDesert: createAreaState(false),

    castle: {
      ...createAreaState(false),
      bossDefeated: false,
    },

    // Shop akan diperluas pada Step 2G.
    // Tier meningkat seiring chapter yang berhasil diselesaikan.
    shop: {
      unlocked: true,
      tier: 1,
    },
  };
}

function normalizeMonsterList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (monsterId) =>
          typeof monsterId === "string" &&
          monsterId.trim().length > 0
      )
    ),
  ];
}

function normalizeAreaState(rawArea, defaultUnlocked) {
  const fallback = createAreaState(defaultUnlocked);
  const source = rawArea && typeof rawArea === "object" ? rawArea : {};

  return {
    unlocked:
      typeof source.unlocked === "boolean"
        ? source.unlocked
        : fallback.unlocked,

    questCompleted:
      source.questCompleted === true,

    defeatedMonsters:
      normalizeMonsterList(source.defeatedMonsters),

    openedChests:
      normalizeMonsterList(source.openedChests),

    completed:
      source.completed === true,
  };
}

export function normalizeGameProgress(rawProgress) {
  const defaults = createDefaultGameProgress();
  const source =
    rawProgress && typeof rawProgress === "object"
      ? rawProgress
      : {};

  const progress = {
    version: 2,

    currentArea:
      AREA_CONFIG[source.currentArea]
        ? source.currentArea
        : defaults.currentArea,

    nahwuVillage: normalizeAreaState(
      source.nahwuVillage,
      true
    ),

    forest: normalizeAreaState(
      source.forest,
      false
    ),

    fiilDesert: normalizeAreaState(
      source.fiilDesert,
      false
    ),

    castle: {
      ...normalizeAreaState(
        source.castle,
        false
      ),
      bossDefeated:
        source.castle?.bossDefeated === true,
    },

    shop: {
      unlocked:
        source.shop?.unlocked !== false,
      tier: Math.max(
        1,
        Number(source.shop?.tier) || 1
      ),
    },
  };

  // Chapter pertama selalu dapat diakses.
  progress.nahwuVillage.unlocked = true;

  // ==================================================
  // STEP 2E.3 — PROGRESSION MIGRATION / AUTO-HEAL
  // ==================================================
  // Jika save/runtime lama sudah memenuhi requirement chapter tetapi
  // flag completed/unlocked belum sempat tersimpan, perbaiki otomatis.
  // Ini juga membuat struktur progression aman untuk chapter berikutnya.

  const villageMonstersDone =
    AREA_CONFIG.nahwuVillage.requiredMonsterIds.every(
      (monsterId) =>
        progress.nahwuVillage.defeatedMonsters.includes(monsterId)
    );

  if (
    progress.nahwuVillage.questCompleted &&
    villageMonstersDone
  ) {
    progress.nahwuVillage.completed = true;
    progress.forest.unlocked = true;
    progress.shop.tier = Math.max(progress.shop.tier, 2);
  }

  if (progress.forest.completed) {
    progress.fiilDesert.unlocked = true;
    progress.shop.tier = Math.max(progress.shop.tier, 3);
  }

  if (progress.fiilDesert.completed) {
    progress.castle.unlocked = true;
    progress.shop.tier = Math.max(progress.shop.tier, 4);
  }

  return progress;
}

export function getGameProgress(scene) {
  if (!scene?.registry) {
    return createDefaultGameProgress();
  }

  const progress = normalizeGameProgress(
    scene.registry.get("gameProgress")
  );

  scene.registry.set(
    "gameProgress",
    progress
  );

  return progress;
}

export function saveGameProgress(scene, progress) {
  const normalized = normalizeGameProgress(progress);

  if (scene?.registry) {
    scene.registry.set(
      "gameProgress",
      normalized
    );
  }

  return normalized;
}

export function getAreaProgress(scene, areaKey) {
  const progress = getGameProgress(scene);

  if (!AREA_CONFIG[areaKey]) {
    return null;
  }

  return progress[areaKey];
}

export function markMonsterDefeated(
  scene,
  areaKey,
  monsterId
) {
  const progress = getGameProgress(scene);

  if (
    !AREA_CONFIG[areaKey] ||
    !monsterId
  ) {
    return progress;
  }

  const area = progress[areaKey];

  area.defeatedMonsters = normalizeMonsterList([
    ...area.defeatedMonsters,
    monsterId,
  ]);

  return saveGameProgress(
    scene,
    progress
  );
}

export function markQuestCompleted(
  scene,
  areaKey,
  completed = true
) {
  const progress = getGameProgress(scene);

  if (!AREA_CONFIG[areaKey]) {
    return progress;
  }

  progress[areaKey].questCompleted =
    completed === true;

  return saveGameProgress(
    scene,
    progress
  );
}


export function markChestOpened(
  scene,
  areaKey,
  chestId
) {
  const progress = getGameProgress(scene);

  if (
    !AREA_CONFIG[areaKey] ||
    !chestId
  ) {
    return progress;
  }

  const area = progress[areaKey];

  area.openedChests = normalizeMonsterList([
    ...area.openedChests,
    chestId,
  ]);

  return saveGameProgress(
    scene,
    progress
  );
}

export function isChestOpened(
  progress,
  areaKey,
  chestId
) {
  const area = progress?.[areaKey];

  if (!area || !chestId) {
    return false;
  }

  return area.openedChests.includes(
    chestId
  );
}

export function setAreaUnlocked(
  scene,
  areaKey,
  unlocked = true
) {
  const progress = getGameProgress(scene);

  if (!AREA_CONFIG[areaKey]) {
    return progress;
  }

  progress[areaKey].unlocked =
    unlocked === true;

  return saveGameProgress(
    scene,
    progress
  );
}

export function areRequiredMonstersDefeated(
  progress,
  areaKey
) {
  const config = AREA_CONFIG[areaKey];
  const area = progress?.[areaKey];

  if (!config || !area) {
    return false;
  }

  return config.requiredMonsterIds.every(
    (monsterId) =>
      area.defeatedMonsters.includes(
        monsterId
      )
  );
}

export function getAreaRequirementStatus(
  scene,
  areaKey
) {
  const progress = getGameProgress(scene);
  const config = AREA_CONFIG[areaKey];
  const area = progress?.[areaKey];

  if (!config || !area) {
    return {
      valid: false,
      questCompleted: false,
      defeatedCount: 0,
      requiredCount: 0,
      monstersCompleted: false,
      completed: false,
      nextArea: null,
      nextAreaUnlocked: false,
    };
  }

  const requiredIds = config.requiredMonsterIds || [];
  const defeatedCount = requiredIds.filter(
    (monsterId) => area.defeatedMonsters.includes(monsterId)
  ).length;

  const monstersCompleted =
    defeatedCount >= requiredIds.length;

  const nextArea = config.nextArea || null;

  return {
    valid: true,
    questCompleted: area.questCompleted === true,
    defeatedCount,
    requiredCount: requiredIds.length,
    monstersCompleted,
    completed: area.completed === true,
    nextArea,
    nextAreaUnlocked:
      nextArea && progress[nextArea]
        ? progress[nextArea].unlocked === true
        : false,
  };
}

export function isAreaReadyToComplete(
  scene,
  areaKey
) {
  const progress = getGameProgress(scene);
  const area = progress[areaKey];

  if (!area || !AREA_CONFIG[areaKey]) {
    return false;
  }

  return (
    area.questCompleted === true &&
    areRequiredMonstersDefeated(
      progress,
      areaKey
    )
  );
}

export function completeAreaAndUnlockNext(
  scene,
  areaKey
) {
  const progress = getGameProgress(scene);
  const config = AREA_CONFIG[areaKey];

  if (!config || !progress[areaKey]) {
    return progress;
  }

  progress[areaKey].completed = true;

  if (
    config.nextArea &&
    progress[config.nextArea]
  ) {
    progress[config.nextArea].unlocked = true;

    // currentArea tetap menunjuk area tempat player berada.
    // Scene tujuan akan mengubah currentArea saat benar-benar dimasuki.

    // Shop tier mengikuti chapter yang sudah dibuka,
    // maksimal akan disempurnakan saat Step 2G.
    progress.shop.tier = Math.max(
      progress.shop.tier,
      AREA_CONFIG[config.nextArea]?.chapter || 1
    );
  }

  return saveGameProgress(
    scene,
    progress
  );
}

export function setCurrentArea(
  scene,
  areaKey
) {
  const progress = getGameProgress(scene);

  if (!AREA_CONFIG[areaKey]) {
    return progress;
  }

  progress.currentArea = areaKey;

  return saveGameProgress(scene, progress);
}

export function resetGameProgress(scene) {
  const progress = createDefaultGameProgress();
  return saveGameProgress(scene, progress);
}
