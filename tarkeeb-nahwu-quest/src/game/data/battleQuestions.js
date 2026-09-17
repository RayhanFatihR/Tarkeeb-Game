const battleQuestions = [
  {
    id: 1,

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

  {
    id: 3,

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

  {
    id: 5,

    question:
      'ما نوع كلمة "من"؟',

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
        text: "حرف",
        correct: true,
      },

      {
        text: "مبتدأ",
        correct: false,
      },
    ],
  },
];

export default battleQuestions;