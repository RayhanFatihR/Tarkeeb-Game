const skillQuestions = [
  {
    id: 1,
    skill: "powerStrike",
    difficulty: "Easy",
    question: 'ما نوع كلمة "الكتابُ"؟',
    answers: [
      { text: "اسم", correct: true },
      { text: "فعل", correct: false },
      { text: "حرف", correct: false },
      { text: "ظرف", correct: false },
    ],
  },

  {
    id: 2,
    skill: "powerStrike",
    difficulty: "Medium",
    question: 'ما إعراب كلمة "الطالبُ" في الجملة "الطالبُ مجتهدٌ"؟',
    answers: [
      { text: "مبتدأ مرفوع", correct: true },
      { text: "خبر مرفوع", correct: false },
      { text: "فعل مضارع", correct: false },
      { text: "حرف جر", correct: false },
    ],
  },

  {
    id: 3,
    skill: "grammarShield",
    difficulty: "Easy",
    question: "أي كلمة هي حرف جر؟",
    answers: [
      { text: "الطالب", correct: false },
      { text: "يكتب", correct: false },
      { text: "في", correct: true },
      { text: "كتاب", correct: false },
    ],
  },

  {
    id: 4,
    skill: "grammarShield",
    difficulty: "Medium",
    question: 'ما إعراب كلمة "مجتهدٌ" في الجملة "الطالبُ مجتهدٌ"؟',
    answers: [
      { text: "مبتدأ مرفوع", correct: false },
      { text: "خبر مرفوع", correct: true },
      { text: "فعل ماضٍ", correct: false },
      { text: "حرف جر", correct: false },
    ],
  },
];

export default skillQuestions;
