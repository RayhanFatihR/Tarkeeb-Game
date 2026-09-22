import Phaser from "phaser";

class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");
  }

  // ==================================================
  // CREATE
  // ==================================================

  create() {
    this.finished = false;
    this.beatObjects = [];
    this.autoEvent = null;
    this.currentBeat = 0;
    this.isBeatTransitioning = false;

    this.createBase();
    this.createBeatTransitionOverlay();
    this.createCinematicBars();
    this.createStoryControls();
    this.createSkipButton();

    this.skipKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.S
      );

    this.nextKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );

    this.spaceKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

    this.cameras.main.fadeIn(
      500,
      5,
      9,
      18
    );

    this.showBeat(0);
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update() {
    if (this.finished) {
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.skipKey
      )
    ) {
      this.finishIntro();
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.nextKey
      ) ||
      Phaser.Input.Keyboard.JustDown(
        this.spaceKey
      )
    ) {
      this.advanceStory();
    }
  }

  // ==================================================
  // BASE
  // ==================================================

  createBase() {
    this.baseBackground =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x07101f
      );

    this.baseBackground.setDepth(0);

    this.skyGlow =
      this.add.circle(
        400,
        230,
        220,
        0x1a365d,
        0.22
      );

    this.skyGlow.setDepth(1);

    this.tweens.add({
      targets: this.skyGlow,
      alpha: 0.10,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 1900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.add.rectangle(
      400,
      545,
      800,
      110,
      0x040a13
    ).setDepth(2);
  }

  // ==================================================
  // CINEMATIC BARS
  // ==================================================

  createCinematicBars() {
    this.topBar =
      this.add.rectangle(
        400,
        28,
        800,
        56,
        0x000000,
        0.92
      );

    this.bottomBar =
      this.add.rectangle(
        400,
        572,
        800,
        56,
        0x000000,
        0.92
      );

    this.topBar.setDepth(5000);
    this.bottomBar.setDepth(5000);
  }

  // ==================================================
  // SKIP
  // ==================================================

  createSkipButton() {
    this.skipButton =
      this.add.rectangle(
        730,
        28,
        110,
        30,
        0x1a365d,
        0.94
      );

    this.skipButton
      .setStrokeStyle(
        1,
        0xd4af37,
        0.75
      )
      .setDepth(5002)
      .setInteractive({
        useHandCursor: true,
      });

    this.skipText =
      this.add
        .text(
          730,
          28,
          "SKIP  [ S ]",
          {
            fontSize: "11px",
            color: "#F6C453",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(5003);

    this.skipButton.on(
      "pointerover",
      () => {
        this.skipButton.setFillStyle(
          0x2d4d79
        );
      }
    );

    this.skipButton.on(
      "pointerout",
      () => {
        this.skipButton.setFillStyle(
          0x1a365d
        );
      }
    );

    this.skipButton.on(
      "pointerdown",
      () => {
        this.finishIntro();
      }
    );
  }

  // ==================================================
  // BEAT MANAGER
  // ==================================================

  showBeat(index) {
    if (this.finished) {
      return;
    }

    this.clearBeat();
    this.currentBeat = index;

    this.updateStoryProgress(
      index
    );

    if (index === 0) {
      this.showKingdomBeat();
      this.scheduleNext(4500);
      return;
    }

    if (index === 1) {
      this.showGrammarTreeBeat();
      this.scheduleNext(4500);
      return;
    }

    if (index === 2) {
      this.showCorruptionBeat();
      this.scheduleNext(4700);
      return;
    }

    if (index === 3) {
      this.showAlGhamisBeat();
      this.scheduleNext(4800);
      return;
    }

    if (index === 4) {
      this.showChosenBeat();
      this.scheduleNext(4600);
      return;
    }

    if (index === 5) {
      this.showMissionBeat();
      this.scheduleNext(4300);
      return;
    }

    if (index === 6) {
      this.showChapterBeat();
      this.scheduleNext(3500);
      return;
    }

    this.finishIntro();
  }

  scheduleNext(delay) {
    if (this.autoEvent) {
      this.autoEvent.remove(false);
      this.autoEvent = null;
    }

    this.autoEvent =
      this.time.delayedCall(
        delay,
        () => {
          this.transitionToBeat(
            this.currentBeat + 1
          );
        }
      );
  }

  clearBeat() {
    if (
      this.autoEvent
    ) {
      this.autoEvent.remove(false);
      this.autoEvent = null;
    }

    this.beatObjects.forEach(
      (object) => {
        if (
          object &&
          object.active
        ) {
          this.tweens.killTweensOf(
            object
          );

          object.destroy();
        }
      }
    );

    this.beatObjects = [];
  }

  addBeatObject(object) {
    this.beatObjects.push(
      object
    );

    return object;
  }

  // ==================================================
  // COMMON TEXT
  // ==================================================

  createNarration(
    title,
    body,
    accent = "#D4AF37"
  ) {
    const narrationPanel =
      this.addBeatObject(
        this.add.rectangle(
          400,
          458,
          710,
          148,
          0x030712,
          0.82
        )
          .setStrokeStyle(
            1,
            0x4a5568,
            0.52
          )
          .setDepth(88)
          .setAlpha(0)
      );

    const accentLine =
      this.addBeatObject(
        this.add.rectangle(
          400,
          389,
          110,
          2,
          0xd4af37,
          0.92
        )
          .setDepth(99)
          .setScale(
            0,
            1
          )
      );

    const titleText =
      this.addBeatObject(
        this.add
          .text(
            400,
            415,
            title,
            {
              fontSize: "21px",
              color: accent,
              fontStyle: "bold",
              align: "center",
              stroke: "#07101F",
              strokeThickness: 4,
            }
          )
          .setOrigin(0.5)
          .setDepth(100)
          .setAlpha(0)
          .setScale(0.94)
      );

    const bodyText =
      this.addBeatObject(
        this.add
          .text(
            400,
            465,
            body,
            {
              fontSize: "16px",
              color: "#E2E8F0",
              align: "center",
              lineSpacing: 6,
              wordWrap: {
                width: 650,
              },
            }
          )
          .setOrigin(0.5)
          .setDepth(100)
          .setAlpha(0)
      );

    this.tweens.add({
      targets:
        narrationPanel,
      alpha: 1,
      duration: 300,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: accentLine,
      scaleX: 1,
      duration: 380,
      delay: 80,
      ease: "Power2",
    });

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: 408,
      duration: 420,
      delay: 100,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: bodyText,
      alpha: 1,
      y: 458,
      delay: 260,
      duration: 440,
      ease: "Sine.easeOut",
    });
  }

  // ==================================================
  // BEAT 1 — KINGDOM
  // ==================================================

  showKingdomBeat() {
    const glow =
      this.addBeatObject(
        this.add.circle(
          400,
          235,
          175,
          0xf6c453,
          0.05
        ).setDepth(3)
      );

          this.addBeatObject(
        this.add.circle(
          635,
          115,
          28,
          0xf6e8b1,
          0.90
        ).setDepth(4)
      );

          this.addBeatObject(
        this.add.ellipse(
          400,
          380,
          760,
          170,
          0x102b32
        ).setDepth(4)
      );

    const houses = [
      [115, 330, 68, 62],
      [210, 345, 80, 54],
      [585, 340, 78, 58],
      [680, 326, 64, 68],
    ];

    houses.forEach(
      ([x, y, w, h], index) => {
                  this.addBeatObject(
            this.add.rectangle(
              x,
              y,
              w,
              h,
              index % 2 === 0
                ? 0x213a4a
                : 0x1b3140
            ).setDepth(5)
          );

                  this.addBeatObject(
            this.add.triangle(
              x,
              y - h / 2 - 18,
              -w / 2,
              18,
              0,
              -18,
              w / 2,
              18,
              0x553c2e
            ).setDepth(6)
          );

        const window =
          this.addBeatObject(
            this.add.rectangle(
              x,
              y,
              14,
              17,
              0xf6c453,
              0.62
            ).setDepth(7)
          );

        this.tweens.add({
          targets: window,
          alpha: 0.25,
          duration:
            800 + index * 130,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      }
    );

    this.createMiniTree(
      400,
      280,
      1.05,
      false
    );

    const kingdomTitle =
      this.addBeatObject(
        this.add
          .text(
            400,
            92,
            "مَمْلَكَةُ التَّرْكِيب",
            {
              fontSize: "27px",
              color: "#F6C453",
              fontStyle: "bold",
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0)
      );

    const englishTitle =
      this.addBeatObject(
        this.add
          .text(
            400,
            128,
            "THE KINGDOM OF TARKEEB",
            {
              fontSize: "17px",
              color: "#FFFFFF",
              fontStyle: "bold",
              letterSpacing: 3,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0)
      );

    this.tweens.add({
      targets: [
        kingdomTitle,
        englishTitle,
      ],
      alpha: 1,
      duration: 650,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: glow,
      alpha: 0.10,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 1600,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.createNarration(
      "Dahulu, bahasa menjaga keseimbangan dunia.",
      "Di Kingdom of Tarkeeb, setiap kata memiliki tempat,\nperan, dan aturan yang menjaga keharmonisan kerajaan."
    );
  }

  // ==================================================
  // BEAT 2 — GRAMMAR TREE
  // ==================================================

  showGrammarTreeBeat() {
    const halo =
      this.addBeatObject(
        this.add.circle(
          400,
          240,
          160,
          0xd4af37,
          0.06
        ).setDepth(3)
      );

    this.createMiniTree(
      400,
      285,
      1.25,
      false
    );

    const words = [
      {
        text: "اِسْم",
        x: 210,
        y: 190,
        color: "#90CDF4",
      },
      {
        text: "فِعْل",
        x: 590,
        y: 190,
        color: "#F6C453",
      },
      {
        text: "حَرْف",
        x: 205,
        y: 315,
        color: "#9AE6B4",
      },
      {
        text: "إِعْرَاب",
        x: 600,
        y: 315,
        color: "#D6BCFA",
      },
    ];

    words.forEach(
      (item, index) => {
        const word =
          this.addBeatObject(
            this.add
              .text(
                item.x,
                item.y,
                item.text,
                {
                  fontSize: "24px",
                  color: item.color,
                  fontStyle: "bold",
                  stroke: "#07101F",
                  strokeThickness: 4,
                }
              )
              .setOrigin(0.5)
              .setDepth(30)
          );

        this.tweens.add({
          targets: word,
          y:
            item.y -
            (index % 2 === 0
              ? 12
              : 16),
          duration:
            1100 + index * 140,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      }
    );

    this.tweens.add({
      targets: halo,
      alpha: 0.12,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 1350,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.createNarration(
      "Di pusat kerajaan tumbuh Grammar Tree.",
      "Isim, Fi'il, Harf, dan I'rab terhubung melalui pohon ini.\nSelama strukturnya terjaga, bahasa tetap memiliki makna."
    );
  }

  // ==================================================
  // BEAT 3 — CORRUPTION
  // ==================================================

  showCorruptionBeat() {
    const corruptionGlow =
      this.addBeatObject(
        this.add.circle(
          400,
          250,
          190,
          0x5b1b66,
          0.14
        ).setDepth(3)
      );

    this.createMiniTree(
      400,
      285,
      1.18,
      true
    );

    for (
      let index = 0;
      index < 18;
      index += 1
    ) {
      const particle =
        this.addBeatObject(
          this.add.circle(
            250 +
              Math.random() * 300,
            160 +
              Math.random() * 230,
            2 +
              Math.random() * 3,
            index % 2 === 0
              ? 0x9f7aea
              : 0xc53030,
            0.75
          ).setDepth(35)
        );

      this.tweens.add({
        targets: particle,
        x:
          particle.x +
          Phaser.Math.Between(
            -45,
            45
          ),
        y:
          particle.y -
          Phaser.Math.Between(
            25,
            85
          ),
        alpha: 0,
        duration:
          Phaser.Math.Between(
            900,
            1700
          ),
        delay:
          Phaser.Math.Between(
            0,
            550
          ),
        repeat: -1,
      });
    }

    this.cameras.main.shake(
      360,
      0.004
    );

    this.tweens.add({
      targets: corruptionGlow,
      alpha: 0.04,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 620,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.createNarration(
      "Namun keseimbangan itu mulai runtuh...",
      "Sebuah kekuatan gelap meresap ke akar Grammar Tree.\nSusunan kata mulai berubah, dan aturan bahasa mulai terpecah.",
      "#D6BCFA"
    );
  }

  // ==================================================
  // BEAT 4 — AL-GHAMIS
  // ==================================================

  showAlGhamisBeat() {
    this.cameras.main.flash(
      220,
      80,
      12,
      90,
      false
    );

    this.cameras.main.shake(
      260,
      0.006
    );

    const darkAura =
      this.addBeatObject(
        this.add.circle(
          525,
          250,
          105,
          0x2d0f3d,
          0.62
        ).setDepth(3)
      );

          this.addBeatObject(
        this.add.ellipse(
          525,
          270,
          118,
          180,
          0x0a0710,
          0.98
        ).setDepth(10)
      );

          this.addBeatObject(
        this.add.circle(
          525,
          205,
          58,
          0x110819
        ).setDepth(11)
      );

    const eyeLeft =
      this.addBeatObject(
        this.add.circle(
          510,
          207,
          4,
          0xff3b30
        ).setDepth(12)
      );

    const eyeRight =
      this.addBeatObject(
        this.add.circle(
          540,
          207,
          4,
          0xff3b30
        ).setDepth(12)
      );

          this.addBeatObject(
        this.add
          .text(
            525,
            345,
            "الغَامِس",
            {
              fontSize: "27px",
              color: "#E53E3E",
              fontStyle: "bold",
              stroke: "#07101F",
              strokeThickness: 5,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
      );

          this.addBeatObject(
        this.add
          .text(
            525,
            374,
            "AL-GHĀMIS",
            {
              fontSize: "14px",
              color: "#D6BCFA",
              fontStyle: "bold",
              letterSpacing: 3,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
      );

    const brokenWords = [
      ["اِسْم", 160, 190, -16],
      ["فِعْل", 235, 265, 18],
      ["حَرْف", 145, 335, 11],
      ["إِعْرَاب", 275, 145, -9],
    ];

    brokenWords.forEach(
      ([text, x, y, angle], index) => {
        const word =
          this.addBeatObject(
            this.add
              .text(
                x,
                y,
                text,
                {
                  fontSize: "21px",
                  color:
                    index % 2 === 0
                      ? "#FC8181"
                      : "#B794F4",
                  fontStyle: "bold",
                }
              )
              .setOrigin(0.5)
              .setAngle(angle)
              .setDepth(16)
          );

        this.tweens.add({
          targets: word,
          x:
            x +
            Phaser.Math.Between(
              -8,
              8
            ),
          y:
            y +
            Phaser.Math.Between(
              -8,
              8
            ),
          duration:
            240 + index * 40,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      }
    );

    this.tweens.add({
      targets: [
        eyeLeft,
        eyeRight,
      ],
      alpha: 0.20,
      duration: 320,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: darkAura,
      scaleX: 1.14,
      scaleY: 1.14,
      alpha: 0.28,
      duration: 950,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.createNarration(
      "Al-Ghāmis datang membawa kekacauan.",
      "Ia percaya kata-kata tidak membutuhkan aturan.\nKetika peran kata menghilang, Kingdom of Tarkeeb mulai jatuh ke dalam chaos.",
      "#FC8181"
    );
  }

  // ==================================================
  // BEAT 5 — CHOSEN
  // ==================================================

  showChosenBeat() {
    this.cameras.main.flash(
      260,
      246,
      196,
      83,
      false
    );

    const playerGlow =
      this.addBeatObject(
        this.add.circle(
          245,
          275,
          70,
          0x3182ce,
          0.10
        ).setDepth(4)
      );

          this.addBeatObject(
        this.add.circle(
          245,
          285,
          29,
          0x3182ce
        ).setDepth(10)
      );

          this.addBeatObject(
        this.add.circle(
          245,
          248,
          18,
          0xf5cfa0
        ).setDepth(11)
      );

    const bookGlow =
      this.addBeatObject(
        this.add.circle(
          525,
          255,
          90,
          0xd4af37,
          0.08
        ).setDepth(4)
      );

    const bookLeft =
      this.addBeatObject(
        this.add.rectangle(
          500,
          260,
          58,
          78,
          0xf8f0d8
        )
          .setAngle(-7)
          .setDepth(10)
      );

    const bookRight =
      this.addBeatObject(
        this.add.rectangle(
          550,
          260,
          58,
          78,
          0xf8f0d8
        )
          .setAngle(7)
          .setDepth(10)
      );

    const bookSpine =
      this.addBeatObject(
        this.add.rectangle(
          525,
          260,
          7,
          84,
          0xd4af37
        ).setDepth(11)
      );

    const bookSymbol =
      this.addBeatObject(
        this.add
          .text(
            525,
            258,
            "ت",
            {
              fontSize: "34px",
              color: "#1A365D",
              fontStyle: "bold",
            }
          )
          .setOrigin(0.5)
          .setDepth(12)
      );

          this.addBeatObject(
        this.add.triangle(
          385,
          270,
          -18,
          -70,
          18,
          -70,
          0,
          78,
          0xf6c453,
          0.12
        ).setDepth(7)
      );

          this.addBeatObject(
        this.add
          .text(
            245,
            340,
            "GRAMMAR APPRENTICE",
            {
              fontSize: "12px",
              color: "#90CDF4",
              fontStyle: "bold",
              letterSpacing: 2,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
      );

    this.tweens.add({
      targets: [
        bookLeft,
        bookRight,
        bookSpine,
        bookSymbol,
      ],
      y: "-=10",
      duration: 1050,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: bookGlow,
      scaleX: 1.28,
      scaleY: 1.28,
      alpha: 0.02,
      duration: 900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: playerGlow,
      alpha: 0.22,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1100,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.createNarration(
      "Tetapi harapan belum hilang.",
      "The Book of Tarkeeb memilih seorang pelajar muda.\nBukan seorang pahlawan—melainkan seseorang yang masih harus belajar.",
      "#90CDF4"
    );
  }

  // ==================================================
  // BEAT 6 — MISSION
  // ==================================================

  showMissionBeat() {
          this.addBeatObject(
        this.add.rectangle(
          400,
          320,
          520,
          10,
          0xd4af37,
          0.20
        ).setDepth(4)
      );

    const locations = [
      {
        x: 175,
        label:
          "NAHWU\nVILLAGE",
        color:
          0x3182ce,
      },
      {
        x: 325,
        label:
          "FOREST\nOF ISIM",
        color:
          0x38a169,
      },
      {
        x: 475,
        label:
          "FI'IL\nDESERT",
        color:
          0xd69e2e,
      },
      {
        x: 625,
        label:
          "CASTLE\nOF I'RAB",
        color:
          0x805ad5,
      },
    ];

    locations.forEach(
      (item, index) => {
        const node =
          this.addBeatObject(
            this.add.circle(
              item.x,
              320,
              22,
              item.color
            ).setDepth(10)
          );

        const label =
          this.addBeatObject(
            this.add
              .text(
                item.x,
                360,
                item.label,
                {
                  fontSize: "11px",
                  color: "#FFFFFF",
                  fontStyle: "bold",
                  align: "center",
                  lineSpacing: 2,
                }
              )
              .setOrigin(0.5)
              .setDepth(10)
          );

        node.setScale(0);

        this.tweens.add({
          targets: node,
          scaleX: 1,
          scaleY: 1,
          delay:
            180 + index * 220,
          duration: 320,
          ease: "Back.easeOut",
        });

        label.setAlpha(0);

        this.tweens.add({
          targets: label,
          alpha: 1,
          delay:
            350 + index * 220,
          duration: 300,
        });
      }
    );

    const missionTitle =
      this.addBeatObject(
        this.add
          .text(
            400,
            165,
            "YOUR QUEST",
            {
              fontSize: "30px",
              color: "#F6C453",
              fontStyle: "bold",
              letterSpacing: 4,
              stroke: "#07101F",
              strokeThickness: 5,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
      );

    this.tweens.add({
      targets: missionTitle,
      scaleX: 1.035,
      scaleY: 1.035,
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.createNarration(
      "Pelajari aturan. Lawan corruption. Pulihkan Grammar Tree.",
      "Perjalananmu dimulai dari Nahwu Village.\nSetiap jawaban benar akan membawamu lebih dekat menuju Al-Ghāmis."
    );
  }

  // ==================================================
  // BEAT 7 — CHAPTER I
  // ==================================================

  showChapterBeat() {
    this.cameras.main.flash(
      320,
      212,
      175,
      55,
      false
    );

    const chapterGlow =
      this.addBeatObject(
        this.add.circle(
          400,
          275,
          180,
          0xd4af37,
          0.05
        ).setDepth(3)
      );

    const chapter =
      this.addBeatObject(
        this.add
          .text(
            400,
            210,
            "CHAPTER I",
            {
              fontSize: "18px",
              color: "#D4AF37",
              fontStyle: "bold",
              letterSpacing: 4,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0)
      );

    const title =
      this.addBeatObject(
        this.add
          .text(
            400,
            265,
            "NAHWU VILLAGE",
            {
              fontSize: "40px",
              color: "#FFFFFF",
              fontStyle: "bold",
              stroke: "#1A365D",
              strokeThickness: 6,
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0)
          .setScale(0.88)
      );

    const subtitle =
      this.addBeatObject(
        this.add
          .text(
            400,
            315,
            "Every journey begins with a single word.",
            {
              fontSize: "15px",
              color: "#CBD5E0",
              fontStyle: "italic",
            }
          )
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0)
      );

    this.tweens.add({
      targets: chapter,
      alpha: 1,
      duration: 420,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      delay: 220,
      duration: 520,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      delay: 520,
      duration: 420,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: chapterGlow,
      alpha: 0.11,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // ==================================================
  // MINI GRAMMAR TREE
  // ==================================================

  createMiniTree(
    x,
    y,
    scale = 1,
    corrupted = false
  ) {
    const tree =
      this.addBeatObject(
        this.add.container(
          x,
          y
        ).setDepth(10)
      );

    const trunkColor =
      corrupted
        ? 0x221426
        : 0x5b422f;

    const leafDark =
      corrupted
        ? 0x291532
        : 0x276749;

    const leafLight =
      corrupted
        ? 0x4a1d55
        : 0x38a169;

    const trunk =
      this.add.rectangle(
        0,
        48,
        27,
        120,
        trunkColor
      );

    const leftBranch =
      this.add.rectangle(
        -40,
        4,
        88,
        11,
        trunkColor
      );

    leftBranch.setAngle(-28);

    const rightBranch =
      this.add.rectangle(
        40,
        4,
        88,
        11,
        trunkColor
      );

    rightBranch.setAngle(28);

    const leaf1 =
      this.add.circle(
        -65,
        -34,
        41,
        leafLight
      );

    const leaf2 =
      this.add.circle(
        0,
        -70,
        52,
        leafDark
      );

    const leaf3 =
      this.add.circle(
        65,
        -34,
        41,
        leafLight
      );

    const leaf4 =
      this.add.circle(
        -34,
        -84,
        34,
        leafLight
      );

    const leaf5 =
      this.add.circle(
        34,
        -84,
        34,
        leafLight
      );

    const rootGlow =
      this.add.ellipse(
        0,
        110,
        125,
        22,
        corrupted
          ? 0x9f7aea
          : 0xd4af37,
        corrupted
          ? 0.12
          : 0.18
      );

    tree.add([
      rootGlow,
      trunk,
      leftBranch,
      rightBranch,
      leaf1,
      leaf2,
      leaf3,
      leaf4,
      leaf5,
    ]);

    tree.setScale(scale);

    this.tweens.add({
      targets: tree,
      scaleX:
        scale * 1.025,
      scaleY:
        scale * 1.025,
      angle:
        corrupted
          ? 1.4
          : 0.6,
      duration:
        corrupted
          ? 520
          : 1500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    return tree;
  }

  // ==================================================
  // FINISH INTRO
  // ==================================================

  finishIntro() {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.isBeatTransitioning = true;

    if (this.autoEvent) {
      this.autoEvent.remove(false);
      this.autoEvent = null;
    }

    this.input.enabled = false;

    this.cameras.main.fadeOut(
      650,
      5,
      9,
      18
    );

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start(
          "VillageScene"
        );
      }
    );
  }
}

export default IntroScene;
