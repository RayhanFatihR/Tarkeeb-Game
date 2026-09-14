const questions = [
  {
    id: 1,
    type: "isim",
    difficulty: "easy",

    question:
      'Apa jenis kata "كِتَابٌ"?',

    answers: [
      {
        text: "فِعْلٌ",
        correct: false,
      },
      {
        text: "اِسْمٌ",
        correct: true,
      },
      {
        text: "حَرْفٌ",
        correct: false,
      },
      {
        text: "جُمْلَةٌ",
        correct: false,
      },
    ],
  },

  {
    id: 2,
    type: "isim",
    difficulty: "easy",

    question:
      'Apa kedudukan "الطَّالِبُ" dalam kalimat "الطَّالِبُ مُجْتَهِدٌ"?',

    answers: [
      {
        text: "مُبْتَدَأٌ",
        correct: true,
      },
      {
        text: "خَبَرٌ",
        correct: false,
      },
      {
        text: "فَاعِلٌ",
        correct: false,
      },
      {
        text: "مَفْعُولٌ بِهِ",
        correct: false,
      },
    ],
  },

  {
    id: 3,
    type: "isim",
    difficulty: "easy",

    question:
      'Apa kedudukan "مُجْتَهِدٌ" dalam kalimat "الطَّالِبُ مُجْتَهِدٌ"?',

    answers: [
      {
        text: "مُبْتَدَأٌ",
        correct: false,
      },
      {
        text: "خَبَرٌ",
        correct: true,
      },
      {
        text: "فَاعِلٌ",
        correct: false,
      },
      {
        text: "حَرْفٌ",
        correct: false,
      },
    ],
  },

  {
    id: 4,
    type: "isim",
    difficulty: "medium",

    question:
      'Apa kedudukan "الطَّالِبَ" dalam kalimat "رَأَيْتُ الطَّالِبَ"?',

    answers: [
      {
        text: "فَاعِلٌ",
        correct: false,
      },
      {
        text: "مُبْتَدَأٌ",
        correct: false,
      },
      {
        text: "مَفْعُولٌ بِهِ",
        correct: true,
      },
      {
        text: "خَبَرٌ",
        correct: false,
      },
    ],
  },

  {
    id: 5,
    type: "isim",
    difficulty: "medium",

    question:
      'Kata "الْمَدْرَسَةِ" pada kalimat "ذَهَبْتُ إِلَى الْمَدْرَسَةِ" termasuk...',

    answers: [
      {
        text: "فَاعِلٌ",
        correct: false,
      },
      {
        text: "اِسْمٌ مَجْرُورٌ",
        correct: true,
      },
      {
        text: "مُبْتَدَأٌ",
        correct: false,
      },
      {
        text: "خَبَرٌ",
        correct: false,
      },
    ],
  },

  {
    id: 6,
    type: "isim",
    difficulty: "medium",

    question:
      'Manakah yang merupakan "اسم" berikut ini?',

    answers: [
      {
        text: "يَذْهَبُ",
        correct: false,
      },
      {
        text: "فِي",
        correct: false,
      },
      {
        text: "مُعَلِّمٌ",
        correct: true,
      },
      {
        text: "اِذْهَبْ",
        correct: false,
      },
    ],
  },
];

export default questions;