const monsters = {
  // ==================================================
  // NAHWU SLIME
  // ==================================================

  nahwuSlime: {
    id: "nahwuSlime",

    name: "Nahwu Slime",

    maxHP: 100,
    attack: 10,
    defense: 5,

    difficulty: "Easy",
    stars: 1,

    reward: {
      xp: 100,
      gold: 75,
    },
  },

  // ==================================================
  // GRAMMAR GOBLIN
  // ==================================================

  grammarGoblin: {
    id: "grammarGoblin",

    name: "Grammar Goblin",

    maxHP: 150,
    attack: 18,
    defense: 8,

    difficulty: "Medium",
    stars: 3,

    reward: {
      xp: 150,
      gold: 100,
    },
  },

  // ==================================================
  // I'RAB GOLEM
  // ==================================================

  irabGolem: {
    id: "irabGolem",

    name: "I'rab Golem",

    maxHP: 300,
    attack: 25,
    defense: 15,

    difficulty: "Hard",
    stars: 5,

    reward: {
      xp: 300,
      gold: 200,
    },
  },
};

export default monsters;