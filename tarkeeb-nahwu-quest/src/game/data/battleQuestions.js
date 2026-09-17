const battleQuestions = [
  // ==================================================
  // EASY
  // ==================================================

  {
    id: 1,

    difficulty: "Easy",

    damage: 20,

    question:
      'ما نوع كلمة "الطالبُ"؟',

    answers: [
      {
        text: "فعل",
        correct: false,
      },

      {
        text: "اسم",
        correct: true,
      },

      {
        text: "حرف",
        correct: false,
      },

      {
        text: "ظرف",
        correct: false,
      },
    ],
  },

  {
    id: 2,

    difficulty: "Easy",

    damage: 20,

    question:
      'ما نوع كلمة "يكتبُ"؟',

    answers: [
      {
        text: "اسم",
        correct: false,
      },

      {
        text: "فعل",
        correct: true,
      },

      {
        text: "حرف",
        correct: false,
      },

      {
        text: "مبتدأ",
        correct: false,
      },
    ],
  },

  // ==================================================
  // MEDIUM
  // ==================================================

  {
    id: 3,

    difficulty: "Medium",

    damage: 30,

    question:
      'ما إعراب كلمة "الطالبُ" في الجملة "الطالبُ مجتهدٌ"؟',

    answers: [
      {
        text: "مبتدأ مرفوع",
        correct: true,
      },

      {
        text: "خبر مرفوع",
        correct: false,
      },

      {
        text: "فعل ماضٍ",
        correct: false,
      },

      {
        text: "حرف جر",
        correct: false,
      },
    ],
  },

  {
    id: 4,

    difficulty: "Medium",

    damage: 30,

    question:
      'أي كلمة هي حرف جر؟',

    answers: [
      {
        text: "الكتاب",
        correct: false,
      },

      {
        text: "يقرأ",
        correct: false,
      },

      {
        text: "في",
        correct: true,
      },

      {
        text: "الطالب",
        correct: false,
      },
    ],
  },

  // ==================================================
  // HARD
  // ==================================================

  {
    id: 5,

    difficulty: "Hard",

    damage: 45,

    question:
      'ما نوع كلمة "من" في الجملة "ذهبتُ من البيتِ"؟',

    answers: [
      {
        text: "اسم",
        correct: false,
      },

      {
        text: "فعل",
        correct: false,
      },

      {
        text: "حرف جر",
        correct: true,
      },

      {
        text: "مبتدأ",
        correct: false,
      },
    ],
  },

  {
    id: 6,

    difficulty: "Hard",

    damage: 45,

    question:
      'ما إعراب كلمة "مجتهدٌ" في الجملة "الطالبُ مجتهدٌ"؟',

    answers: [
      {
        text: "مبتدأ مرفوع",
        correct: false,
      },

      {
        text: "خبر مرفوع",
        correct: true,
      },

      {
        text: "فعل مضارع",
        correct: false,
      },

      {
        text: "حرف جر",
        correct: false,
      },
    ],
  },
];

export default battleQuestions;