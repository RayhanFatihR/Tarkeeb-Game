import Phaser from "phaser";

class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  // ==================================================
  // CREATE
  // ==================================================

  create() {
    this.isStarting = false;

    this.createBackground();
    this.createGrammarTree();
    this.createFloatingGrammar();
    this.createTitle();
    this.createStartButton();
    this.createFooter();

    // Fade masuk saat game pertama dibuka.
    this.cameras.main.fadeIn(
      650,
      11,
      18,
      32
    );

    // ENTER / SPACE juga bisa digunakan untuk mulai.
    this.enterKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );

    this.spaceKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update() {
    if (this.isStarting) {
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.enterKey
      ) ||
      Phaser.Input.Keyboard.JustDown(
        this.spaceKey
      )
    ) {
      this.startAdventure();
    }
  }

  // ==================================================
  // BACKGROUND
  // ==================================================

  createBackground() {
    // Dasar background.
    this.add.rectangle(
      400,
      300,
      800,
      600,
      0x0b1220
    );

    // Layer biru tua untuk memberi sedikit depth.
    this.add.rectangle(
      400,
      420,
      800,
      360,
      0x101c33,
      0.82
    );

    // Cahaya pusat di belakang Grammar Tree.
    const glowOuter =
      this.add.circle(
        400,
        290,
        185,
        0xd4af37,
        0.035
      );

    const glowMiddle =
      this.add.circle(
        400,
        290,
        125,
        0xd4af37,
        0.055
      );

    const glowInner =
      this.add.circle(
        400,
        290,
        75,
        0xf6c453,
        0.075
      );

    this.tweens.add({
      targets: [
        glowOuter,
        glowMiddle,
        glowInner,
      ],
      alpha: {
        from: 0.035,
        to: 0.09,
      },
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 1800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Bintang / debu cahaya.
    const starPositions = [
      [90, 100],
      [150, 180],
      [235, 80],
      [320, 145],
      [485, 110],
      [565, 165],
      [650, 90],
      [720, 190],
      [110, 360],
      [690, 380],
      [210, 430],
      [590, 440],
    ];

    starPositions.forEach(
      ([x, y], index) => {
        const star =
          this.add.circle(
            x,
            y,
            index % 3 === 0
              ? 2
              : 1.3,
            index % 2 === 0
              ? 0xffffff
              : 0xd4af37,
            0.55
          );

        this.tweens.add({
          targets: star,
          alpha: 0.12,
          scaleX: 0.55,
          scaleY: 0.55,
          duration:
            900 + index * 75,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
          delay: index * 90,
        });
      }
    );

    // Tanah silhouette.
    this.add.rectangle(
      400,
      555,
      800,
      90,
      0x08111f
    );

    this.add.ellipse(
      400,
      520,
      520,
      85,
      0x0a1728
    );
  }

  // ==================================================
  // GRAMMAR TREE
  // ==================================================

  createGrammarTree() {
    this.treeContainer =
      this.add.container(
        400,
        315
      );

    // Batang.
    const trunk =
      this.add.rectangle(
        0,
        55,
        28,
        135,
        0x4a3528
      );

    const trunkHighlight =
      this.add.rectangle(
        -5,
        55,
        5,
        125,
        0x6b4c36,
        0.75
      );

    // Cabang.
    const branchLeft =
      this.add.rectangle(
        -42,
        12,
        92,
        12,
        0x4a3528
      );

    branchLeft.setAngle(-28);

    const branchRight =
      this.add.rectangle(
        42,
        6,
        92,
        12,
        0x4a3528
      );

    branchRight.setAngle(27);

    const branchTop =
      this.add.rectangle(
        0,
        -18,
        12,
        75,
        0x4a3528
      );

    // Daun utama.
    const leaf1 =
      this.add.circle(
        -72,
        -34,
        45,
        0x2f855a
      );

    const leaf2 =
      this.add.circle(
        0,
        -66,
        54,
        0x276749
      );

    const leaf3 =
      this.add.circle(
        72,
        -34,
        45,
        0x2f855a
      );

    const leaf4 =
      this.add.circle(
        -34,
        -88,
        38,
        0x38a169
      );

    const leaf5 =
      this.add.circle(
        38,
        -88,
        38,
        0x38a169
      );

    // Cahaya akar.
    const rootGlow =
      this.add.ellipse(
        0,
        122,
        135,
        24,
        0xd4af37,
        0.18
      );

    this.treeContainer.add([
      rootGlow,
      trunk,
      trunkHighlight,
      branchLeft,
      branchRight,
      branchTop,
      leaf1,
      leaf2,
      leaf3,
      leaf4,
      leaf5,
    ]);

    this.treeContainer.setDepth(5);
    this.treeContainer.setScale(0.92);

    // Pohon sedikit "bernapas".
    this.tweens.add({
      targets: this.treeContainer,
      scaleX: 0.95,
      scaleY: 0.95,
      y: 310,
      duration: 1700,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Cahaya akar.
    this.tweens.add({
      targets: rootGlow,
      scaleX: 1.3,
      alpha: 0.07,
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // ==================================================
  // FLOATING GRAMMAR
  // ==================================================

  createFloatingGrammar() {
    const grammarWords = [
      {
        text: "اِسْم",
        x: 185,
        y: 275,
        color: "#90CDF4",
      },
      {
        text: "فِعْل",
        x: 615,
        y: 260,
        color: "#F6C453",
      },
      {
        text: "حَرْف",
        x: 145,
        y: 410,
        color: "#9AE6B4",
      },
      {
        text: "إِعْرَاب",
        x: 655,
        y: 405,
        color: "#D6BCFA",
      },
    ];

    grammarWords.forEach(
      (item, index) => {
        const word =
          this.add
            .text(
              item.x,
              item.y,
              item.text,
              {
                fontSize:
                  index === 3
                    ? "19px"
                    : "22px",
                color: item.color,
                fontStyle: "bold",
              }
            )
            .setOrigin(0.5)
            .setAlpha(0.72)
            .setDepth(6);

        this.tweens.add({
          targets: word,
          y:
            item.y -
            (index % 2 === 0
              ? 10
              : 13),
          alpha: 0.95,
          duration:
            1500 + index * 180,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
          delay: index * 140,
        });
      }
    );
  }

  // ==================================================
  // TITLE
  // ==================================================

  createTitle() {
    const kingdomLabel =
      this.add
        .text(
          400,
          44,
          "مَمْلَكَةُ التَّرْكِيب",
          {
            fontSize: "17px",
            color: "#D4AF37",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(10);

    const title =
      this.add
        .text(
          400,
          82,
          "TARKEEB",
          {
            fontSize: "47px",
            color: "#FFFFFF",
            fontStyle: "bold",
            stroke: "#1A365D",
            strokeThickness: 6,
            letterSpacing: 4,
          }
        )
        .setOrigin(0.5)
        .setDepth(10);

    const subTitle =
      this.add
        .text(
          400,
          130,
          "NAHWU QUEST",
          {
            fontSize: "23px",
            color: "#F6C453",
            fontStyle: "bold",
            letterSpacing: 5,
          }
        )
        .setOrigin(0.5)
        .setDepth(10);

    const tagline =
      this.add
        .text(
          400,
          166,
          "Explore. Solve. Collect. Master.",
          {
            fontSize: "15px",
            color: "#CBD5E0",
            fontStyle: "italic",
          }
        )
        .setOrigin(0.5)
        .setDepth(10);

    title.setScale(0.92);
    title.setAlpha(0);

    subTitle.setAlpha(0);
    tagline.setAlpha(0);
    kingdomLabel.setAlpha(0);

    this.tweens.add({
      targets: kingdomLabel,
      alpha: 1,
      duration: 500,
      delay: 150,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 650,
      delay: 250,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: subTitle,
      alpha: 1,
      y: 126,
      duration: 520,
      delay: 500,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: tagline,
      alpha: 1,
      duration: 520,
      delay: 700,
      ease: "Sine.easeOut",
    });

    // Title pulse sangat halus.
    this.tweens.add({
      targets: title,
      scaleX: 1.018,
      scaleY: 1.018,
      duration: 1900,
      delay: 950,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // ==================================================
  // START BUTTON
  // ==================================================

  createStartButton() {
    this.startButtonGlow =
      this.add.rectangle(
        400,
        493,
        300,
        66,
        0xd4af37,
        0.14
      );

    this.startButtonGlow
      .setDepth(19);

    this.startButton =
      this.add.rectangle(
        400,
        493,
        280,
        54,
        0xd4af37
      );

    this.startButton
      .setStrokeStyle(
        3,
        0xf6e3a1
      )
      .setDepth(20)
      .setInteractive({
        useHandCursor: true,
      });

    this.startButtonText =
      this.add
        .text(
          400,
          493,
          "MULAI PETUALANGAN",
          {
            fontSize: "17px",
            color: "#10213A",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(21);

    this.keyHint =
      this.add
        .text(
          400,
          535,
          "ENTER / SPACE / CLICK",
          {
            fontSize: "11px",
            color: "#718096",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(21);

    this.tweens.add({
      targets:
        this.startButtonGlow,
      scaleX: 1.06,
      scaleY: 1.12,
      alpha: 0.04,
      duration: 900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.startButton.on(
      "pointerover",
      () => {
        if (this.isStarting) {
          return;
        }

        this.startButton.setFillStyle(
          0xf6c453
        );

        this.tweens.add({
          targets: [
            this.startButton,
            this.startButtonText,
          ],
          scaleX: 1.035,
          scaleY: 1.035,
          duration: 120,
          ease: "Back.easeOut",
        });
      }
    );

    this.startButton.on(
      "pointerout",
      () => {
        if (this.isStarting) {
          return;
        }

        this.startButton.setFillStyle(
          0xd4af37
        );

        this.tweens.add({
          targets: [
            this.startButton,
            this.startButtonText,
          ],
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: "Sine.easeOut",
        });
      }
    );

    this.startButton.on(
      "pointerdown",
      () => {
        this.startAdventure();
      }
    );
  }

  // ==================================================
  // START ADVENTURE
  // ==================================================

  startAdventure() {
    if (this.isStarting) {
      return;
    }

    this.isStarting = true;

    this.startButton.disableInteractive();

    this.tweens.add({
      targets: [
        this.startButton,
        this.startButtonText,
      ],
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 90,
      ease: "Power2",
      yoyo: true,
    });

    this.startButtonText.setText(
      "MEMULAI..."
    );

    // Fade out sebelum pindah scene.
    this.cameras.main.fadeOut(
      650,
      8,
      14,
      25
    );

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        // Step 1.12 nanti akan menambahkan IntroScene.
        // Kalau IntroScene sudah terdaftar, otomatis masuk ke sana.
        const introScene =
          this.scene.manager.keys[
            "IntroScene"
          ];

        if (introScene) {
          this.scene.start(
            "IntroScene"
          );

          return;
        }

        // Sementara tetap bisa dimainkan tanpa IntroScene.
        this.scene.start(
          "VillageScene"
        );
      }
    );
  }

  // ==================================================
  // FOOTER
  // ==================================================

  createFooter() {
    this.add
      .text(
        400,
        580,
        "The Kingdom of Tarkeeb awaits...",
        {
          fontSize: "11px",
          color: "#4A5568",
          fontStyle: "italic",
        }
      )
      .setOrigin(0.5)
      .setDepth(10);
  }
}

export default StartScene;
