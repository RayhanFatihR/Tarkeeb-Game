const quests = {
  // ==================================================
  // CHAPTER I — NAHWU VILLAGE
  // ==================================================
  basicIsim: {
    id: "basicIsim",
    title: "Ujian Nahwu Village",
    description:
      "Kalahkan 3 monster di Nahwu Village.",
    type: "monsterHunt",
    requiredProgress: 3,
    reward: {
      xp: 300,
      gold: 200,
    },
  },

  // ==================================================
  // CHAPTER III — FI'IL DESERT
  // ==================================================
  fiilDesertTrial: {
    id: "fiilDesertTrial",
    title: "Ujian Tiga Bentuk Fi'il",
    description:
      "Kalahkan 3 Penjaga Fi'il di Fi'il Desert.",
    type: "monsterHunt",
    requiredProgress: 3,
    requiredMonsterIds: [
      "fiilMadhiScorpion",
      "fiilMudhariRaider",
      "fiilAmrDjinn",
    ],
    reward: {
      xp: 500,
      gold: 450,
    },
  },
};

export default quests;
