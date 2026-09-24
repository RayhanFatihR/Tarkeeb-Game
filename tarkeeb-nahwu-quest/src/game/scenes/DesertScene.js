import Phaser from "phaser";

import playerWalkAsset from "../../assets/player/player_walk.png";
import forestGateAsset from "../../assets/objects/forest_gate.png";
import grammarMasterAsset from "../../assets/npc/grammar_master.png";
import pathTileAsset from "../../assets/tiles/path_tile.png";

import quests from "../data/quests.js";

import {
  getGameProgress,
  getAreaRequirementStatus,
  markQuestAccepted,
  setCurrentArea,
} from "../data/progression.js";

class DesertScene extends Phaser.Scene {
  constructor() {
    super("FiilDesertScene");
  }

  preload() {
    this.load.spritesheet(
      "playerWalkPixel",
      playerWalkAsset,
      {
        frameWidth: 320,
        frameHeight: 320,
      }
    );

    // Gate Forest dipakai sementara sebagai placeholder.
    // Nanti Step 2H akan diganti asset desert gate khusus.
    this.load.image(
      "desertReturnGatePixel",
      forestGateAsset
    );

    // Placeholder Guru Fi'il. Asset khusus Desert akan dibuat pada
    // tahap visual polish agar logic Chapter III bisa dibangun dulu.
    this.load.image(
      "fiilMentorPixel",
      grammarMasterAsset
    );

    // Path tile lama dipakai sementara sebagai base pixel texture,
    // lalu diberi tint pasir agar map ketiga sudah punya identitas visual.
    this.load.image(
      "desertBaseTilePixel",
      pathTileAsset
    );
  }

  create() {
    this.gameProgress = getGameProgress(this);

    // Safety guard: Desert hanya boleh dimasuki setelah Chapter II selesai.
    if (this.gameProgress?.fiilDesert?.unlocked !== true) {
      this.scene.start("ForestScene");
      return;
    }

    this.gameProgress = setCurrentArea(
      this,
      "fiilDesert"
    );

    let savedData = this.registry.get("playerData");

    if (!savedData) {
      savedData = {
        level: 1,
        xp: 0,
        gold: 0,
        inventory: [],
        equipped: {
          Weapon: null,
          Armor: null,
          Accessory: null,
        },
      };
    }

    savedData.level = Number(savedData.level) || 1;
    savedData.xp = Number(savedData.xp) || 0;
    savedData.gold = Number(savedData.gold) || 0;

    if (!Array.isArray(savedData.inventory)) {
      savedData.inventory = [];
    }

    if (!savedData.equipped) {
      savedData.equipped = {
        Weapon: null,
        Armor: null,
        Accessory: null,
      };
    }

    this.playerData = savedData;
    this.registry.set("playerData", this.playerData);

    this.xpNeeded = 200;
    this.isTransitioning = false;
    this.inventoryOpen = false;
    this.inventoryObjects = [];

    // ==================================================
    // CHAPTER III — FI'IL DESERT QUEST FOUNDATION
    // ==================================================
    this.desertQuest = quests.fiilDesertTrial;
    this.fiilDialogOpen = false;
    this.fiilDialogObjects = [];

    this.obstacles = this.physics.add.staticGroup();

    this.createWorld();
    this.createPlayer();
    this.createFiilMentor();
    this.createForestReturnGate();
    this.createHUD();
    this.createDesertQuestHUD();
    this.updateHUD();
    this.updateDesertQuestHUD();

    this.physics.add.collider(
      this.player,
      this.obstacles
    );

    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    this.escapeKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    this.returnGateReady = false;
    this.time.delayedCall(500, () => {
      if (this.scene.isActive()) {
        this.returnGateReady = true;
      }
    });

    // Entrance banner sederhana untuk menandai Chapter III.
    const overlay = this.add
      .rectangle(400, 300, 800, 600, 0x140d05, 0.55)
      .setDepth(900);

    const chapterText = this.add
      .text(400, 265, "CHAPTER III", {
        fontSize: "18px",
        color: "#FFE58A",
        fontStyle: "bold",
        stroke: "#3A210C",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(901);

    const areaText = this.add
      .text(400, 305, "FI'IL DESERT", {
        fontSize: "34px",
        color: "#FFF7D6",
        fontStyle: "bold",
        stroke: "#3A210C",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(901);

    this.tweens.add({
      targets: [overlay, chapterText, areaText],
      alpha: 0,
      delay: 650,
      duration: 650,
      onComplete: () => {
        overlay.destroy();
        chapterText.destroy();
        areaText.destroy();
      },
    });
  }

  // ==================================================
  // WORLD FOUNDATION
  // ==================================================

  createWorld() {
    // Placeholder pixel-sand foundation.
    // Nanti diganti sand_tile.png pada Step 2H saat asset Desert dibuat.
    this.add
      .tileSprite(
        400,
        300,
        800,
        600,
        "desertBaseTilePixel"
      )
      .setDepth(-30)
      .setTileScale(0.58, 0.58)
      .setTint(0xd6ad63);

    // Jalan utama Desert: dari Forest di bawah menuju area inti di atas.
    this.add
      .tileSprite(
        400,
        300,
        118,
        600,
        "desertBaseTilePixel"
      )
      .setDepth(-20)
      .setTileScale(0.58, 0.58)
      .setTint(0xefcf8b);

    this.add
      .tileSprite(
        400,
        340,
        800,
        92,
        "desertBaseTilePixel"
      )
      .setDepth(-20)
      .setTileScale(0.58, 0.58)
      .setTint(0xefcf8b);

    this.add
      .text(400, 82, "FI'IL DESERT", {
        fontSize: "31px",
        color: "#FFF1C7",
        fontStyle: "bold",
        stroke: "#5B3515",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(
        400,
        116,
        "Chapter III • Tanah para penjaga Fi'il",
        {
          fontSize: "14px",
          color: "#FFE0A3",
          fontStyle: "italic",
          stroke: "#5B3515",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(20);

    // Placeholder batu gurun supaya map tidak kosong.
    this.createDesertRock(135, 185, 54, 38);
    this.createDesertRock(665, 185, 60, 42);
    this.createDesertRock(160, 430, 58, 40);
    this.createDesertRock(640, 430, 52, 36);

    // Dune cards sederhana — visual sementara sampai asset Desert tersedia.
    this.createDune(245, 220, 120, 34);
    this.createDune(555, 235, 130, 36);
    this.createDune(250, 500, 145, 38);
    this.createDune(550, 500, 138, 36);

    // Collision bounds; area bawah tengah dibiarkan untuk gate Forest.
    this.createWall(15, 300, 30, 600);
    this.createWall(785, 300, 30, 600);
    this.createWall(400, 15, 800, 30);
    this.createWall(160, 585, 320, 30);
    this.createWall(640, 585, 320, 30);
  }

  createDesertRock(x, y, width, height) {
    const shadow = this.add
      .ellipse(
        x,
        y + height * 0.28,
        width * 0.85,
        height * 0.35,
        0x5a3518,
        0.22
      )
      .setDepth(4);

    const rock = this.add
      .rectangle(
        x,
        y,
        width,
        height,
        0x8b6747,
        1
      )
      .setDepth(5)
      .setStrokeStyle(3, 0x5f432e, 1);

    const highlight = this.add
      .rectangle(
        x - width * 0.12,
        y - height * 0.12,
        width * 0.38,
        height * 0.18,
        0xb38a61,
        0.8
      )
      .setDepth(6);

    const collider = this.add.rectangle(
      x,
      y + height * 0.12,
      width * 0.75,
      height * 0.55,
      0xffffff,
      0
    );

    this.physics.add.existing(collider, true);
    this.obstacles.add(collider);

    return { shadow, rock, highlight };
  }

  createDune(x, y, width, height) {
    this.add
      .ellipse(
        x,
        y,
        width,
        height,
        0xf0c97f,
        0.42
      )
      .setDepth(-12);

    this.add
      .ellipse(
        x + width * 0.08,
        y + 4,
        width * 0.75,
        height * 0.45,
        0xb98443,
        0.18
      )
      .setDepth(-11);
  }

  createWall(x, y, width, height) {
    const wall = this.add.rectangle(
      x,
      y,
      width,
      height,
      0xffffff,
      0
    );

    this.physics.add.existing(wall, true);
    this.obstacles.add(wall);
  }

  // ==================================================
  // PLAYER
  // ==================================================

  createPlayer() {
    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(
      400,
      485,
      "playerWalkPixel",
      0
    );

    this.player
      .setDisplaySize(76, 76)
      .setDepth(30);

    this.player.body.setSize(120, 92);
    this.player.body.setOffset(100, 190);
    this.player.body.setCollideWorldBounds(true);

    this.playerSpeed = 200;

    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.inventoryKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.I
    );

    this.playerLabel = this.add
      .text(
        this.player.x,
        this.player.y + 46,
        "PLAYER",
        {
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#5B3515",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(31);

    this.createInteractionPromptUI();
  }

  createPlayerAnimations() {
    const configs = [
      { key: "playerWalkDown", start: 0, end: 3 },
      { key: "playerWalkLeft", start: 4, end: 7 },
      { key: "playerWalkRight", start: 8, end: 11 },
      { key: "playerWalkUp", start: 12, end: 15 },
    ];

    configs.forEach((config) => {
      if (this.anims.exists(config.key)) {
        return;
      }

      this.anims.create({
        key: config.key,
        frames: this.anims.generateFrameNumbers(
          "playerWalkPixel",
          {
            start: config.start,
            end: config.end,
          }
        ),
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  updatePlayerPixelAnimation() {
    const vx = this.player?.body?.velocity?.x || 0;
    const vy = this.player?.body?.velocity?.y || 0;

    if (Math.abs(vx) < 1 && Math.abs(vy) < 1) {
      if (this.player?.anims?.isPlaying) {
        this.player.anims.stop();
      }
      this.player?.setFrame(0);
      return;
    }

    if (Math.abs(vx) > Math.abs(vy)) {
      this.player.play(
        vx < 0 ? "playerWalkLeft" : "playerWalkRight",
        true
      );
      return;
    }

    this.player.play(
      vy < 0 ? "playerWalkUp" : "playerWalkDown",
      true
    );
  }

  // ==================================================
  // GURU FI'IL — CHAPTER III QUEST FOUNDATION
  // ==================================================

  createFiilMentor() {
    const x = 245;
    const y = 345;

    this.fiilMentorShadow = this.add
      .ellipse(x, y + 35, 52, 16, 0x4a2a10, 0.28)
      .setDepth(13);

    this.fiilMentor = this.add
      .image(x, y, "fiilMentorPixel")
      .setDisplaySize(94, 112)
      .setTint(0xffc56b)
      .setDepth(16);

    this.fiilMentorName = this.add
      .text(x, y + 61, "Guru Fi'il", {
        fontSize: "13px",
        color: "#FFF7D6",
        fontStyle: "bold",
        stroke: "#5B3515",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(18);

    this.fiilQuestMarker = this.add
      .text(x, y - 74, "!", {
        fontSize: "34px",
        color: "#FFE066",
        fontStyle: "bold",
        stroke: "#7B341E",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(19);

    this.tweens.add({
      targets: this.fiilQuestMarker,
      y: y - 82,
      duration: 650,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    const collider = this.add.rectangle(
      x,
      y + 28,
      42,
      44,
      0xffffff,
      0
    );

    this.physics.add.existing(collider, true);
    this.obstacles.add(collider);

    this.updateFiilMentorMarker();
  }

  updateFiilMentorMarker() {
    if (!this.fiilQuestMarker) {
      return;
    }

    this.gameProgress = getGameProgress(this);

    const desertProgress = this.gameProgress.fiilDesert;

    if (desertProgress?.questCompleted) {
      this.fiilQuestMarker
        .setText("✓")
        .setColor("#86EFAC");
      return;
    }

    if (desertProgress?.questAccepted) {
      this.fiilQuestMarker
        .setText("?")
        .setColor("#FCD34D");
      return;
    }

    this.fiilQuestMarker
      .setText("!")
      .setColor("#FFE066");
  }

  showFiilMentorDialog() {
    if (
      this.fiilDialogOpen ||
      this.inventoryOpen ||
      this.isTransitioning
    ) {
      return;
    }

    this.fiilDialogOpen = true;
    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);

    if (this.player?.body) {
      this.player.body.setVelocity(0, 0);
    }

    const depth = 3200;
    const addObject = (object) => {
      this.fiilDialogObjects.push(object);
      return object;
    };

    addObject(
      this.add
        .rectangle(400, 300, 800, 600, 0x140d05, 0.58)
        .setDepth(depth)
        .setScrollFactor(0)
    );

    addObject(
      this.add
        .rectangle(400, 425, 650, 250, 0x1d140b, 0.98)
        .setDepth(depth + 1)
        .setScrollFactor(0)
        .setStrokeStyle(3, 0xe2b955, 0.95)
    );

    addObject(
      this.add
        .rectangle(190, 416, 126, 170, 0x2c1c0d, 1)
        .setDepth(depth + 2)
        .setScrollFactor(0)
        .setStrokeStyle(2, 0xc98a3d, 0.95)
    );

    addObject(
      this.add
        .image(190, 410, "fiilMentorPixel")
        .setDisplaySize(96, 120)
        .setTint(0xffc56b)
        .setDepth(depth + 3)
        .setScrollFactor(0)
    );

    addObject(
      this.add
        .text(190, 487, "GURU FI'IL", {
          fontSize: "10px",
          color: "#FFE58A",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(depth + 4)
        .setScrollFactor(0)
    );

    addObject(
      this.add
        .text(278, 326, "Guru Fi'il", {
          fontSize: "22px",
          color: "#FFF1C7",
          fontStyle: "bold",
        })
        .setDepth(depth + 3)
        .setScrollFactor(0)
    );

    addObject(
      this.add
        .rectangle(490, 358, 420, 2, 0xb7863e, 0.8)
        .setDepth(depth + 3)
        .setScrollFactor(0)
    );

    this.gameProgress = getGameProgress(this);
    const accepted =
      this.gameProgress.fiilDesert?.questAccepted === true;

    if (!accepted) {
      addObject(
        this.add
          .text(
            278,
            375,
            "Selamat datang di Fi'il Desert.\nDi sini kamu akan menguasai tiga bentuk Fi'il.",
            {
              fontSize: "14px",
              color: "#F8E7C1",
              lineSpacing: 7,
              wordWrap: { width: 500 },
            }
          )
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      addObject(
        this.add
          .rectangle(500, 447, 445, 72, 0x2b1b0d, 0.98)
          .setDepth(depth + 2)
          .setScrollFactor(0)
          .setStrokeStyle(2, 0x9e6a32, 0.9)
      );

      addObject(
        this.add
          .text(294, 419, "NEW QUEST", {
            fontSize: "10px",
            color: "#EAB84F",
            fontStyle: "bold",
          })
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      addObject(
        this.add
          .text(294, 438, this.desertQuest.title, {
            fontSize: "15px",
            color: "#FFF1C7",
            fontStyle: "bold",
          })
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      addObject(
        this.add
          .text(294, 462, this.desertQuest.description, {
            fontSize: "11px",
            color: "#E8D3A6",
          })
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      const laterButton = addObject(
        this.add
          .rectangle(550, 515, 122, 38, 0x31445b, 1)
          .setDepth(depth + 3)
          .setScrollFactor(0)
          .setStrokeStyle(1, 0x6f89a7, 0.9)
          .setInteractive({ useHandCursor: true })
      );

      addObject(
        this.add
          .text(550, 515, "NANTI", {
            fontSize: "12px",
            color: "#FFFFFF",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(depth + 4)
          .setScrollFactor(0)
      );

      laterButton.on("pointerdown", () => {
        this.closeFiilDialog();
      });

      const acceptButton = addObject(
        this.add
          .rectangle(690, 515, 144, 38, 0xd7a92e, 1)
          .setDepth(depth + 3)
          .setScrollFactor(0)
          .setStrokeStyle(2, 0xffe28a, 0.95)
          .setInteractive({ useHandCursor: true })
      );

      addObject(
        this.add
          .text(690, 515, "TERIMA QUEST", {
            fontSize: "12px",
            color: "#23170A",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(depth + 4)
          .setScrollFactor(0)
      );

      acceptButton.on("pointerdown", () => {
        this.acceptFiilQuest();
      });
    } else {
      const status = getAreaRequirementStatus(
        this,
        "fiilDesert"
      );

      addObject(
        this.add
          .text(
            278,
            382,
            "Ujianmu sudah dimulai. Taklukkan tiga Penjaga Fi'il\ndan buktikan pemahamanmu tentang Fi'il.",
            {
              fontSize: "14px",
              color: "#F8E7C1",
              lineSpacing: 7,
            }
          )
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      addObject(
        this.add
          .rectangle(500, 460, 445, 76, 0x2b1b0d, 0.98)
          .setDepth(depth + 2)
          .setScrollFactor(0)
          .setStrokeStyle(2, 0x9e6a32, 0.9)
      );

      addObject(
        this.add
          .text(294, 432, this.desertQuest.title, {
            fontSize: "14px",
            color: "#FFE58A",
            fontStyle: "bold",
          })
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      addObject(
        this.add
          .text(
            294,
            460,
            `Progress Penjaga Fi'il  ${status.defeatedCount} / ${status.requiredCount}`,
            {
              fontSize: "13px",
              color: "#FFFFFF",
              fontStyle: "bold",
            }
          )
          .setDepth(depth + 3)
          .setScrollFactor(0)
      );

      const closeButton = addObject(
        this.add
          .rectangle(672, 515, 150, 38, 0xd7a92e, 1)
          .setDepth(depth + 3)
          .setScrollFactor(0)
          .setStrokeStyle(2, 0xffe28a, 0.95)
          .setInteractive({ useHandCursor: true })
      );

      addObject(
        this.add
          .text(672, 515, "LANJUTKAN", {
            fontSize: "12px",
            color: "#23170A",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(depth + 4)
          .setScrollFactor(0)
      );

      closeButton.on("pointerdown", () => {
        this.closeFiilDialog();
      });
    }
  }

  acceptFiilQuest() {
    this.gameProgress = markQuestAccepted(
      this,
      "fiilDesert",
      true
    );

    this.updateFiilMentorMarker();
    this.closeFiilDialog();
    this.updateDesertQuestHUD();
  }

  closeFiilDialog() {
    this.fiilDialogObjects.forEach((object) => {
      if (object?.active) {
        object.destroy();
      }
    });

    this.fiilDialogObjects = [];
    this.fiilDialogOpen = false;
    this.setGameplayHUDVisible(true);
    this.updateFiilMentorMarker();
  }

  // ==================================================
  // DESERT QUEST HUD
  // ==================================================

  createDesertQuestHUD() {
    const depth = 2000;

    this.desertQuestPanel = this.add
      .rectangle(520, 72, 266, 116, 0x2a1a0c, 0.94)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xe2b955, 0.85);

    this.desertQuestLabel = this.add
      .text(534, 85, "ACTIVE QUEST", {
        fontSize: "11px",
        color: "#FFE58A",
        fontStyle: "bold",
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.desertQuestTitle = this.add
      .text(534, 106, this.desertQuest.title, {
        fontSize: "12px",
        color: "#FFF7D6",
        fontStyle: "bold",
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.desertQuestProgressText = this.add
      .text(534, 139, "", {
        fontSize: "11px",
        color: "#FFFFFF",
        fontStyle: "bold",
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.desertQuestBarBg = this.add
      .rectangle(534, 169, 236, 10, 0x120a03, 0.95)
      .setOrigin(0, 0.5)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0xb7863e, 0.8);

    this.desertQuestBarFill = this.add
      .rectangle(536, 169, 232, 6, 0xe2b955, 1)
      .setOrigin(0, 0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);
  }

  setDesertQuestHUDVisible(visible) {
    [
      this.desertQuestPanel,
      this.desertQuestLabel,
      this.desertQuestTitle,
      this.desertQuestProgressText,
      this.desertQuestBarBg,
      this.desertQuestBarFill,
    ].forEach((object) => {
      object?.setVisible(visible);
    });
  }

  updateDesertQuestHUD() {
    if (!this.desertQuestPanel) {
      return;
    }

    this.gameProgress = getGameProgress(this);
    const desertProgress = this.gameProgress.fiilDesert;

    if (
      desertProgress?.questAccepted !== true ||
      desertProgress?.questCompleted === true
    ) {
      this.setDesertQuestHUDVisible(false);
      return;
    }

    const status = getAreaRequirementStatus(
      this,
      "fiilDesert"
    );

    this.setDesertQuestHUDVisible(true);
    this.desertQuestProgressText.setText(
      `Penjaga Fi'il  ${status.defeatedCount} / ${status.requiredCount}`
    );

    const percentage = status.requiredCount > 0
      ? Phaser.Math.Clamp(
          status.defeatedCount / status.requiredCount,
          0,
          1
        )
      : 0;

    this.desertQuestBarFill.setDisplaySize(
      Math.max(0, 232 * percentage),
      6
    );
  }

  // ==================================================
  // RETURN GATE TO FOREST
  // ==================================================

  createForestReturnGate() {
    this.forestReturnGate = this.add.image(
      400,
      548,
      "desertReturnGatePixel"
    );

    this.forestReturnGate
      .setDisplaySize(118, 150)
      .setDepth(12)
      .setTint(0xc5a46b);

    this.add
      .text(400, 475, "FOREST OF ISIM", {
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "#5B3515",
        padding: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  returnToForest() {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);

    if (this.player?.body) {
      this.player.body.setVelocity(0, 0);
    }

    this.cameras.main.fadeOut(320, 20, 12, 5);

    this.time.delayedCall(340, () => {
      setCurrentArea(this, "forest");
      this.scene.start("ForestScene");
    });
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update() {
    if (!this.player || this.isTransitioning) {
      return;
    }

    if (
      this.inventoryKey &&
      Phaser.Input.Keyboard.JustDown(this.inventoryKey) &&
      !this.fiilDialogOpen
    ) {
      if (this.inventoryOpen) {
        this.closeInventory();
      } else {
        this.showInventory();
      }
      return;
    }

    if (this.inventoryOpen) {
      this.hideInteractionPrompt();
      this.player.body.setVelocity(0, 0);
      return;
    }

    if (this.fiilDialogOpen) {
      this.hideInteractionPrompt();
      this.player.body.setVelocity(0, 0);

      if (
        this.escapeKey &&
        Phaser.Input.Keyboard.JustDown(this.escapeKey)
      ) {
        this.closeFiilDialog();
      }

      return;
    }

    const left = this.keys.left.isDown || this.cursors.left.isDown;
    const right = this.keys.right.isDown || this.cursors.right.isDown;
    const up = this.keys.up.isDown || this.cursors.up.isDown;
    const down = this.keys.down.isDown || this.cursors.down.isDown;

    const velocityX = (left ? -1 : 0) + (right ? 1 : 0);
    const velocityY = (up ? -1 : 0) + (down ? 1 : 0);

    if (velocityX !== 0 || velocityY !== 0) {
      const direction = new Phaser.Math.Vector2(
        velocityX,
        velocityY
      ).normalize();

      this.player.body.setVelocity(
        direction.x * this.playerSpeed,
        direction.y * this.playerSpeed
      );
    } else {
      this.player.body.setVelocity(0, 0);
    }

    this.updatePlayerPixelAnimation();

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y + 46
    );

    this.hideInteractionPrompt();

    const mentorDistance = this.fiilMentor
      ? Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.fiilMentor.x,
          this.fiilMentor.y
        )
      : Number.POSITIVE_INFINITY;

    if (mentorDistance < 105) {
      const questAccepted =
        this.gameProgress?.fiilDesert?.questAccepted === true;

      this.showInteractionPrompt(
        questAccepted
          ? "Bicara dengan Guru Fi'il"
          : "Ambil Quest dari Guru Fi'il"
      );

      if (
        Phaser.Input.Keyboard.JustDown(this.interactKey)
      ) {
        this.showFiilMentorDialog();
      }

      return;
    }

    const gateDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.forestReturnGate.x,
      this.forestReturnGate.y
    );

    if (gateDistance < 92) {
      this.showInteractionPrompt(
        "Kembali ke Forest of Isim"
      );

      if (
        this.returnGateReady &&
        Phaser.Input.Keyboard.JustDown(this.interactKey)
      ) {
        this.returnToForest();
      }
    }
  }

  // ==================================================
  // INTERACTION PROMPT
  // ==================================================

  createInteractionPromptUI() {
    this.interactionPrompt = this.add.container(400, 548);

    this.interactionPrompt
      .setDepth(1500)
      .setScrollFactor(0)
      .setVisible(false);

    const panel = this.add.graphics();
    panel.fillStyle(0x17110a, 0.95);
    panel.fillRoundedRect(-176, -24, 352, 48, 14);
    panel.lineStyle(2, 0xe2b955, 0.95);
    panel.strokeRoundedRect(-176, -24, 352, 48, 14);

    const keyCap = this.add.graphics();
    keyCap.fillStyle(0xfff8e7, 1);
    keyCap.fillRoundedRect(-158, -16, 34, 32, 8);
    keyCap.lineStyle(2, 0xe2b955, 1);
    keyCap.strokeRoundedRect(-158, -16, 34, 32, 8);

    this.interactKeyText = this.add
      .text(-141, 0, "E", {
        fontSize: "16px",
        color: "#23170A",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.interactText = this.add
      .text(-112, 0, "", {
        fontSize: "15px",
        color: "#FFF8E7",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.interactionPrompt.add([
      panel,
      keyCap,
      this.interactKeyText,
      this.interactText,
    ]);
  }

  showInteractionPrompt(message) {
    if (
      !this.interactionPrompt ||
      this.inventoryOpen ||
      this.fiilDialogOpen
    ) {
      return;
    }

    this.interactText.setText(message);
    this.interactionPrompt.setVisible(true);
  }

  hideInteractionPrompt() {
    this.interactionPrompt?.setVisible(false);
  }

  // ==================================================
  // HUD
  // ==================================================

  createHUD() {
    const depth = 2000;

    this.hudLeftPanel = this.add
      .rectangle(14, 12, 292, 88, 0x2a1a0c, 0.92)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xe2b955, 0.85);

    this.levelText = this.add
      .text(28, 23, "", {
        fontSize: "17px",
        color: "#FFF7D6",
        fontStyle: "bold",
        stroke: "#120a03",
        strokeThickness: 3,
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.xpText = this.add
      .text(28, 51, "", {
        fontSize: "12px",
        color: "#FFE2A8",
        fontStyle: "bold",
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.xpBarBackground = this.add
      .rectangle(28, 78, 250, 12, 0x120a03, 0.95)
      .setOrigin(0, 0.5)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0xb7863e, 0.8);

    this.xpBarFill = this.add
      .rectangle(30, 78, 246, 8, 0xf2b84b, 1)
      .setOrigin(0, 0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    this.hudGoldPanel = this.add
      .rectangle(626, 12, 160, 48, 0x2a1a0c, 0.92)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xe2b955, 0.85);

    this.goldText = this.add
      .text(706, 36, "", {
        fontSize: "16px",
        color: "#FFE58A",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)
      .setScrollFactor(0);
  }

  updateHUD() {
    const level = Number(this.playerData.level) || 1;
    const xp = Number(this.playerData.xp) || 0;
    const gold = Number(this.playerData.gold) || 0;

    this.levelText.setText(
      `LVL ${level}  •  ${this.getLevelTitle(level)}`
    );
    this.xpText.setText(`XP  ${xp} / ${this.xpNeeded}`);
    this.goldText.setText(`GOLD  ${gold}`);

    const percentage = Phaser.Math.Clamp(
      xp / this.xpNeeded,
      0,
      1
    );

    this.xpBarFill.setDisplaySize(
      Math.max(0, 246 * percentage),
      8
    );
  }

  setGameplayHUDVisible(visible) {
    [
      this.hudLeftPanel,
      this.levelText,
      this.xpText,
      this.xpBarBackground,
      this.xpBarFill,
      this.hudGoldPanel,
      this.goldText,
    ].forEach((object) => {
      object?.setVisible(visible);
    });

    if (!visible) {
      this.setDesertQuestHUDVisible(false);
    } else {
      this.updateDesertQuestHUD();
    }
  }

  getLevelTitle(level) {
    const titles = {
      1: "طالب",
      2: "Nahwu Explorer",
      3: "Grammar Apprentice",
      4: "Nahwu Warrior",
      5: "Grammar Master",
    };

    return titles[level] || "Grammar Master";
  }

  // ==================================================
  // INVENTORY — SAME FOUNDATION AS VILLAGE / FOREST
  // ==================================================

  equipItem(index) {
    const item = this.playerData.inventory[index];

    if (!item) {
      return;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        this.playerData.equipped,
        item.type
      )
    ) {
      return;
    }

    this.playerData.equipped[item.type] = item.id;
    this.registry.set("playerData", this.playerData);

    this.closeInventory();
    this.showInventory();
  }

  unequipItem(item) {
    if (!item) {
      return;
    }

    if (
      this.playerData.equipped?.[item.type] === item.id
    ) {
      this.playerData.equipped[item.type] = null;
    }

    this.registry.set("playerData", this.playerData);

    this.closeInventory();
    this.showInventory();
  }

  isItemEquipped(item) {
    return Boolean(
      item &&
      this.playerData.equipped?.[item.type] === item.id
    );
  }

  getRarityColor(rarity) {
    switch (String(rarity).toLowerCase()) {
      case "common":
        return "#718096";
      case "rare":
        return "#3182CE";
      case "epic":
        return "#805AD5";
      case "legendary":
        return "#D69E2E";
      default:
        return "#718096";
    }
  }

  showInventory() {
    this.inventoryOpen = true;
    this.inventoryObjects = [];

    this.setGameplayHUDVisible(false);
    this.hideInteractionPrompt();

    const depth = 3000;

    const addObject = (object) => {
      if (object) {
        object.setScrollFactor?.(0);
        this.inventoryObjects.push(object);
      }
      return object;
    };

    addObject(
      this.add
        .rectangle(400, 300, 800, 600, 0x050b14, 0.84)
        .setDepth(depth)
    );

    addObject(
      this.add
        .rectangle(400, 300, 720, 520, 0x0d1b2f, 0.99)
        .setDepth(depth + 1)
        .setStrokeStyle(3, 0xd4af37, 0.95)
    );

    addObject(
      this.add
        .text(75, 58, "INVENTORY", {
          fontSize: "28px",
          color: "#FFE58A",
          fontStyle: "bold",
        })
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .text(75, 91, "Perlengkapan Petualang Nahwu", {
          fontSize: "12px",
          color: "#9FB6D6",
        })
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .text(
          725,
          67,
          `LVL ${this.playerData.level}   •   XP ${this.playerData.xp}   •   GOLD ${this.playerData.gold}`,
          {
            fontSize: "13px",
            color: "#FFFFFF",
            fontStyle: "bold",
          }
        )
        .setOrigin(1, 0.5)
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .rectangle(400, 117, 650, 2, 0x31577d, 0.9)
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .text(92, 138, "EQUIPMENT", {
          fontSize: "15px",
          color: "#FFE58A",
          fontStyle: "bold",
        })
        .setDepth(depth + 2)
    );

    const equipmentTypes = [
      { type: "Weapon", label: "WEAPON", fallback: "🗡️" },
      { type: "Armor", label: "ARMOR", fallback: "🛡️" },
      { type: "Accessory", label: "ACCESSORY", fallback: "💍" },
    ];

    equipmentTypes.forEach((slot, index) => {
      const y = 190 + index * 92;
      const equippedId = this.playerData.equipped?.[slot.type];
      const equippedItem = this.playerData.inventory.find(
        (item) => item && item.id === equippedId
      );

      addObject(
        this.add
          .rectangle(180, y, 210, 74, 0x132844, 1)
          .setDepth(depth + 2)
          .setStrokeStyle(
            2,
            equippedItem ? 0xd4af37 : 0x31577d,
            equippedItem ? 0.9 : 0.7
          )
      );

      addObject(
        this.add
          .text(94, y - 26, slot.label, {
            fontSize: "10px",
            color: "#89A7CC",
            fontStyle: "bold",
          })
          .setDepth(depth + 3)
      );

      addObject(
        this.add
          .text(105, y + 7, equippedItem?.icon || slot.fallback, {
            fontSize: "29px",
          })
          .setOrigin(0.5)
          .setDepth(depth + 3)
      );

      addObject(
        this.add
          .text(
            135,
            y - 2,
            equippedItem ? equippedItem.name : "Belum digunakan",
            {
              fontSize: equippedItem ? "12px" : "11px",
              color: equippedItem
                ? this.getRarityColor(equippedItem.rarity)
                : "#7890AD",
              fontStyle: equippedItem ? "bold" : "normal",
              wordWrap: { width: 130 },
            }
          )
          .setDepth(depth + 3)
      );
    });

    addObject(
      this.add
        .rectangle(180, 462, 210, 72, 0x0a1628, 0.92)
        .setDepth(depth + 2)
        .setStrokeStyle(1, 0x31577d, 0.75)
    );

    addObject(
      this.add
        .text(92, 438, "TIP", {
          fontSize: "10px",
          color: "#FFE58A",
          fontStyle: "bold",
        })
        .setDepth(depth + 3)
    );

    addObject(
      this.add
        .text(
          92,
          456,
          "Equip item untuk mendapat bonus saat\nbelajar dan bertarung.",
          {
            fontSize: "9px",
            color: "#AFC4DE",
            lineSpacing: 4,
          }
        )
        .setDepth(depth + 3)
    );

    addObject(
      this.add
        .text(
          310,
          138,
          `ITEM BAG  ${this.playerData.inventory.length}`,
          {
            fontSize: "15px",
            color: "#FFE58A",
            fontStyle: "bold",
          }
        )
        .setDepth(depth + 2)
    );

    if (this.playerData.inventory.length === 0) {
      addObject(
        this.add
          .rectangle(515, 310, 390, 270, 0x10233f, 0.75)
          .setDepth(depth + 2)
          .setStrokeStyle(1, 0x31577d, 0.75)
      );

      addObject(
        this.add
          .text(515, 290, "🎒", { fontSize: "44px" })
          .setOrigin(0.5)
          .setDepth(depth + 3)
      );

      addObject(
        this.add
          .text(515, 340, "Inventory masih kosong", {
            fontSize: "16px",
            color: "#DCEBFF",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(depth + 3)
      );
    } else {
      // Maksimal 4 item per halaman agar daftar tidak keluar panel
      // dan tidak menabrak tombol TUTUP ketika inventory mulai penuh.
      const inventoryPageSize = 4;
      const inventoryTotalPages = Math.max(
        1,
        Math.ceil(this.playerData.inventory.length / inventoryPageSize)
      );

      this.inventoryPage = Phaser.Math.Clamp(
        Number(this.inventoryPage) || 0,
        0,
        inventoryTotalPages - 1
      );

      const inventoryStartIndex =
        this.inventoryPage * inventoryPageSize;

      const visibleInventoryItems =
        this.playerData.inventory.slice(
          inventoryStartIndex,
          inventoryStartIndex + inventoryPageSize
        );

      visibleInventoryItems.forEach((item, slotIndex) => {
        const actualIndex = inventoryStartIndex + slotIndex;
        const y = 182 + slotIndex * 78;
        const rarityColor = this.getRarityColor(item.rarity);
        const rarityNumber = parseInt(
          rarityColor.replace("#", ""),
          16
        );
        const equipped = this.isItemEquipped(item);

        const card = addObject(
          this.add
            .rectangle(515, y, 390, 66, 0x132844, 1)
            .setDepth(depth + 2)
            .setStrokeStyle(
              2,
              rarityNumber,
              equipped ? 1 : 0.65
            )
        );

        addObject(
          this.add
            .text(340, y, item.icon || "🎒", {
              fontSize: "28px",
            })
            .setOrigin(0.5)
            .setDepth(depth + 3)
        );

        addObject(
          this.add
            .text(370, y - 21, item.name, {
              fontSize: "12px",
              color: rarityColor,
              fontStyle: "bold",
            })
            .setDepth(depth + 3)
        );

        addObject(
          this.add
            .text(
              370,
              y - 3,
              `${item.type}  •  ${String(item.rarity).toUpperCase()}`,
              {
                fontSize: "8px",
                color: "#91AAC8",
                fontStyle: "bold",
              }
            )
            .setDepth(depth + 3)
        );

        addObject(
          this.add
            .text(
              370,
              y + 13,
              item.description || "Tidak ada deskripsi.",
              {
                fontSize: "8px",
                color: "#D6E3F4",
                wordWrap: { width: 200 },
              }
            )
            .setDepth(depth + 3)
        );

        const equipButton = addObject(
          this.add
            .rectangle(
              675,
              y,
              82,
              28,
              equipped ? 0x8b6b13 : 0x1d5f91,
              1
            )
            .setDepth(depth + 3)
            .setStrokeStyle(
              1,
              equipped ? 0xffe58a : 0x63a7d8,
              0.9
            )
            .setInteractive({ useHandCursor: true })
        );

        const equipText = addObject(
          this.add
            .text(675, y, equipped ? "UNEQUIP" : "EQUIP", {
              fontSize: "8px",
              color: "#FFFFFF",
              fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(depth + 4)
        );

        equipButton.on("pointerover", () => {
          equipButton.setFillStyle(
            equipped ? 0xa47c17 : 0x2b78ad
          );
          card.setFillStyle(0x183251, 1);
        });

        equipButton.on("pointerout", () => {
          equipButton.setFillStyle(
            equipped ? 0x8b6b13 : 0x1d5f91
          );
          card.setFillStyle(0x132844, 1);
        });

        equipButton.on("pointerdown", () => {
          if (equipped) {
            this.unequipItem(item);
          } else {
            this.equipItem(actualIndex);
          }
        });

        equipText.disableInteractive?.();
      });

      // Pagination hanya muncul ketika item lebih dari 4.
      if (inventoryTotalPages > 1) {
        const navY = 480;
        const canPrev = this.inventoryPage > 0;
        const canNext = this.inventoryPage < inventoryTotalPages - 1;

        const prevButton = addObject(
          this.add
            .rectangle(
              410,
              navY,
              74,
              26,
              canPrev ? 0x1d5f91 : 0x132033,
              1
            )
            .setDepth(depth + 3)
            .setStrokeStyle(1, canPrev ? 0x63a7d8 : 0x31577d, 0.8)
        );

        addObject(
          this.add
            .text(410, navY, "◀ PREV", {
              fontSize: "8px",
              color: canPrev ? "#FFFFFF" : "#657A96",
              fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(depth + 4)
        );

        addObject(
          this.add
            .text(
              515,
              navY,
              `${this.inventoryPage + 1} / ${inventoryTotalPages}`,
              {
                fontSize: "10px",
                color: "#FFE58A",
                fontStyle: "bold",
              }
            )
            .setOrigin(0.5)
            .setDepth(depth + 4)
        );

        const nextButton = addObject(
          this.add
            .rectangle(
              620,
              navY,
              74,
              26,
              canNext ? 0x1d5f91 : 0x132033,
              1
            )
            .setDepth(depth + 3)
            .setStrokeStyle(1, canNext ? 0x63a7d8 : 0x31577d, 0.8)
        );

        addObject(
          this.add
            .text(620, navY, "NEXT ▶", {
              fontSize: "8px",
              color: canNext ? "#FFFFFF" : "#657A96",
              fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(depth + 4)
        );

        if (canPrev) {
          prevButton.setInteractive({ useHandCursor: true });
          prevButton.on("pointerdown", () => {
            this.inventoryPage -= 1;
            this.closeInventory();
            this.showInventory();
          });
        }

        if (canNext) {
          nextButton.setInteractive({ useHandCursor: true });
          nextButton.on("pointerdown", () => {
            this.inventoryPage += 1;
            this.closeInventory();
            this.showInventory();
          });
        }
      }
    }

    addObject(
      this.add
        .rectangle(400, 510, 650, 1, 0x31577d, 0.7)
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .text(
          75,
          528,
          "Klik EQUIP untuk mengganti perlengkapan.",
          {
            fontSize: "9px",
            color: "#7890AD",
          }
        )
        .setOrigin(0, 0.5)
        .setDepth(depth + 3)
    );

    const closeButton = addObject(
      this.add
        .rectangle(660, 528, 132, 32, 0x1a365d, 1)
        .setDepth(depth + 3)
        .setStrokeStyle(2, 0xd4af37, 0.9)
        .setInteractive({ useHandCursor: true })
    );

    addObject(
      this.add
        .text(660, 528, "TUTUP   [ I ]", {
          fontSize: "10px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(depth + 4)
    );

    closeButton.on("pointerdown", () => {
      this.closeInventory();
    });
  }

  closeInventory() {
    this.inventoryObjects.forEach((object) => {
      if (object?.active) {
        object.destroy();
      }
    });

    this.inventoryObjects = [];
    this.inventoryOpen = false;
    this.setGameplayHUDVisible(true);
  }
}

export default DesertScene;
