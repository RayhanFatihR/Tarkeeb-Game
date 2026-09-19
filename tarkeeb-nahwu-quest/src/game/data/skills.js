const skills = {
  powerStrike: {
    id: "powerStrike",

    name: "Power Strike",

    icon: "✨",

    description:
      "Serangan kuat yang membutuhkan Combo x2.",

    requiredCombo: 2,

    damageMultiplier: 1.75,

    cooldown: 0,
  },

  grammarShield: {
    id: "grammarShield",

    name: "Grammar Shield",

    icon: "🛡️",

    description:
      "Mengurangi damage monster sebesar 50%.",

    requiredCombo: 2,

    damageReduction: 0.5,

    cooldown: 0,
  },
};

export default skills;