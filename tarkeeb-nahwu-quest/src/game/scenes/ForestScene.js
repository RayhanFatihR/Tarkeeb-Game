import Phaser from "phaser";
import VisualFoundation from "./VisualFoundation";

import playerWalkAsset from "../../assets/player/player_walk.png";

import grammarMasterAsset from "../../assets/npc/grammar_master.png";

import nahwuSlimeAsset from "../../assets/monsters/nahwu_slime.png";
import grammarGoblinAsset from "../../assets/monsters/grammar_goblin.png";
import irabGolemAsset from "../../assets/monsters/irab_golem.png";

import chestClosedAsset from "../../assets/objects/chest_closed.png";
import chestOpenAsset from "../../assets/objects/chest_open.png";
import treeAsset from "../../assets/objects/tree_01.png";
import forestGateAsset from "../../assets/objects/forest_gate.png";
import grassTileAsset from "../../assets/tiles/grass_tile.png";
import pathTileAsset from "../../assets/tiles/path_tile.png";

import Monster from "../objects/Monster";

import questions from "../data/questions";
import items from "../data/items";
import monsters from "../data/monsters";
import battleQuestions from "../data/battleQuestions";
import skills from "../data/skills";
import skillQuestions from "../data/skillQuestions";
import {
  getGameProgress,
  markChestOpened,
  setCurrentArea,
} from "../data/progression";

class ForestScene extends Phaser.Scene {
  constructor() {
    super("ForestScene");
  }

  // ==================================================
  // PRELOAD PIXEL ASSETS
  // ==================================================

  preload() {
    this.load.spritesheet(
      "playerWalkPixel",
      playerWalkAsset,
      {
        frameWidth: 320,
        frameHeight: 320,
      }
    );

    // Sementara Penjaga Isim memakai sprite NPC yang sudah tersedia.
    // Nanti bisa diganti asset khusus tanpa mengubah logic quest.
    this.load.image(
      "forestGuardianPixel",
      grammarMasterAsset
    );

    this.load.image(
      "nahwuSlimePixel",
      nahwuSlimeAsset
    );

    this.load.image(
      "grammarGoblinPixel",
      grammarGoblinAsset
    );

    this.load.image(
      "irabGolemPixel",
      irabGolemAsset
    );

    this.load.image(
      "chestClosedPixel",
      chestClosedAsset
    );

    this.load.image(
      "chestOpenPixel",
      chestOpenAsset
    );

    this.load.image(
      "treePixel",
      treeAsset
    );

    this.load.image(
      "forestGatePixel",
      forestGateAsset
    );

    this.load.image(
      "grassTilePixel",
      grassTileAsset
    );

    this.load.image(
      "pathTilePixel",
      pathTileAsset
    );
  }

  // ==================================================
  // CREATE
  // ==================================================

  create() {
    this.visualFoundation =
      new VisualFoundation(this);

    // ==================================================
    // STEP 2E.2 — FOREST CHESTS + GLOBAL PROGRESSION
    // ==================================================
    // Forest memakai state progression yang sama dengan Village, Desert,
    // dan Castle. Ini mencegah logic unlock tiap map dibuat terpisah.
    this.gameProgress = getGameProgress(this);

    // Safety guard: Forest tidak boleh dapat diakses sebelum Chapter 1 selesai.
    // Normal gameplay tetap masuk lewat gate Village; guard ini mencegah
    // akses langsung ke scene dari debug / state lama.
    if (this.gameProgress?.forest?.unlocked !== true) {
      this.scene.start("VillageScene");
      return;
    }

    this.gameProgress = setCurrentArea(
      this,
      "forest"
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

    // ==================================================
    // GAME STATE
    // ==================================================

    this.isTransitioning = false;

    // Forest chest quiz state.
    this.isQuizOpen = false;
    this.chestAnswerLocked = false;
    this.quizObjects = [];
    this.currentChest = null;
    this.currentQuestion = null;

    this.isBattleOpen = false;
    this.isBattleQuestionOpen = false;
    this.answerLocked = false;
    this.battleObjects = [];
    this.battleQuestionObjects = [];
    this.currentMonster = null;
    this.currentBattleQuestion = null;

    this.playerMaxHP = 100;
    this.playerHP = 100;
    this.playerBaseAttack = 20;
    this.isDefending = false;
    this.battleCombo = 0;
    this.battleMaxCombo = 0;
    this.battleComboText = null;
    this.battleLogText = null;
    this.battlePlayerHPText = null;
    this.battleMonsterHPText = null;

    this.skillMenuOpen = false;
    this.skillQuestionOpen = false;
    this.skillQuestionObjects = [];
    this.currentSkill = null;
    this.currentSkillQuestion = null;
    this.activeShieldTurns = 0;
    this.battleSkillButton = null;

    // ==================================================
    // FOREST QUEST
    // ==================================================

    this.forestQuest = this.registry.get("forestQuest") || null;
    this.forestQuestObjects = [];
    this.forestQuestDialogObjects = [];
    this.forestQuestDialogOpen = false;

    // Step 2D.9 — reward modal Forest.
    this.forestQuestCompleteOpen = false;
    this.forestQuestCompleteObjects = [];
    this.pendingForestQuestCompletion = null;

    // Inventory tersedia lintas map.
    this.inventoryOpen = false;
    this.inventoryObjects = [];

    this.xpNeeded = 200;

    this.obstacles = this.physics.add.staticGroup();
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    // ==================================================
    // VILLAGE RETURN KEY
    // ==================================================

    // The E key used to enter this scene must be released first.
    // We arm the return gate after a short delay, then reset the
    // Phaser Key state so the same press can never return here.
    this.forestGateReady = false;

    this.time.delayedCall(500, () => {
      if (!this.scene.isActive()) {
        return;
      }

      this.interactKey.reset();
      this.forestGateReady = true;
    });

    this.createWorld();
    this.createPlayer();
    this.createVillageGate();

    // Keep player movement active and collide with forest obstacles.
    this.physics.add.collider(
      this.player,
      this.obstacles
    );

    this.createForestQuestNPC();
    this.createHUD();
    this.updateHUD();

    if (this.forestQuest) {
      this.showForestQuestHUD();
    }

    // ==================================================
    // SCENE ENTRANCE CINEMATIC
    // ==================================================

    this.visualFoundation.playSceneEntrance(
      "FOREST OF ISIM",
      "Chapter II • Hutan Para Penjaga Isim"
    );
  }

  // ==================================================
  // CREATE WORLD
  // ==================================================

  createWorld() {
    // ==================================================
    // PIXEL FOREST GROUND
    // ==================================================

    this.add
      .tileSprite(
        400,
        300,
        800,
        600,
        "grassTilePixel"
      )
      .setDepth(-20)
      .setTileScale(0.62, 0.62);

    // Jalan vertikal utama dari Village ke Forest.
    this.add
      .tileSprite(
        400,
        300,
        112,
        600,
        "pathTilePixel"
      )
      .setDepth(-10)
      .setTileScale(0.62, 0.62);

    // Jalan horizontal menuju area monster / quest.
    this.add
      .tileSprite(
        400,
        350,
        800,
        96,
        "pathTilePixel"
      )
      .setDepth(-10)
      .setTileScale(0.62, 0.62);

    this.add
      .text(400, 78, "FOREST OF ISIM", {
        fontSize: "30px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(400, 112, "Hutan tempat para penjaga Isim berlatih.", {
        fontSize: "15px",
        color: "#e2e8f0",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setDepth(20);

    // ==================================================
    // TREES
    // ==================================================

    this.createTree(78, 128);
    this.createTree(235, 125);
    this.createTree(565, 125);
    this.createTree(722, 128);

    this.createTree(82, 500);
    this.createTree(235, 520);
    this.createTree(565, 520);
    this.createTree(718, 500);

    this.createTree(132, 300);
    this.createTree(668, 300);

    // ==================================================
    // ROCKS
    // ==================================================

    this.createRock(165, 195);
    this.createRock(635, 195);
    this.createRock(155, 420);
    this.createRock(650, 420);

    // ==================================================
    // SMALL FOREST DETAILS
    // ==================================================

    this.createBush(300, 170);
    this.createBush(500, 170);
    this.createBush(300, 500);
    this.createBush(500, 500);

    // ==================================================
    // FOREST CHESTS — STEP 2E.2
    // ==================================================
    // Shield dan Ring dipindahkan dari Village agar reward terasa
    // mengikuti progression area.

    this.chests = [];

    this.createForestChest(
      310,
      410,
      items.shieldOfMubtada,
      "forest_shield_chest"
    );

    this.createForestChest(
      510,
      410,
      items.ringOfRafa,
      "forest_ring_chest"
    );

    // ==================================================
    // FOREST MONSTERS
    // ==================================================

    this.monsters = [];

    const slime = new Monster(
      this,
      205,
      245,
      monsters.nahwuSlime
    );

    const goblin = new Monster(
      this,
      595,
      245,
      monsters.grammarGoblin
    );

    const golem = new Monster(
      this,
      650,
      455,
      monsters.irabGolem
    );

    this.monsters.push(slime, goblin, golem);

    // ==================================================
    // MONSTER VISUAL ANIMATION
    // ==================================================

    this.monsters.forEach(
      (monster, index) => {
        this.visualFoundation.animateMonster(
          monster.body,
          index
        );
      }
    );

    // ==================================================
    // COLLISION WALLS
    // ==================================================

    this.createWall(20, 300, 40, 600);
    this.createWall(780, 300, 40, 600);
    this.createWall(400, 15, 800, 30);
    this.createWall(20, 585, 320, 30);
    this.createWall(780, 585, 320, 30);
  }

  // ==================================================
  // CREATE PLAYER
  // ==================================================

  createPlayer() {
    this.createPlayerAnimations();

    this.player =
      this.physics.add.sprite(
        400,
        405,
        "playerWalkPixel",
        0
      );

    this.player
      .setDisplaySize(
        76,
        76
      )
      .setDepth(30);

    // Ukuran body mengikuti bagian kaki karakter,
    // bukan seluruh gambar sprite 320x320.
    this.player.body.setSize(
      120,
      92
    );

    this.player.body.setOffset(
      100,
      190
    );

    this.player.body.setCollideWorldBounds(
      true
    );

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
          stroke: "#1A365D",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(31);

    this.createInteractionPromptUI();
  }

  // ==================================================
  // MODERN INTERACTION PROMPT
  // ==================================================

  createInteractionPromptUI() {
    this.interactionPrompt = this.add.container(400, 548);
    this.interactionPrompt
      .setDepth(1500)
      .setScrollFactor(0)
      .setVisible(false);

    const panel = this.add.graphics();
    panel.fillStyle(0x111827, 0.94);
    panel.fillRoundedRect(-176, -24, 352, 48, 14);
    panel.lineStyle(2, 0xf6c453, 0.9);
    panel.strokeRoundedRect(-176, -24, 352, 48, 14);

    const keyCap = this.add.graphics();
    keyCap.fillStyle(0xf8fafc, 1);
    keyCap.fillRoundedRect(-158, -16, 34, 32, 8);
    keyCap.lineStyle(2, 0xf6c453, 1);
    keyCap.strokeRoundedRect(-158, -16, 34, 32, 8);

    this.interactKeyText = this.add
      .text(-141, 0, "E", {
        fontSize: "16px",
        color: "#111827",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.interactText = this.add
      .text(-112, 0, "", {
        fontSize: "15px",
        color: "#F8FAFC",
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
    if (!this.interactionPrompt || !this.interactText) {
      return;
    }

    // Jangan tampilkan prompt interaksi ketika UI modal sedang terbuka.
    if (
      this.forestQuestDialogOpen ||
      this.forestQuestCompleteOpen ||
      this.inventoryOpen ||
      this.isQuizOpen ||
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.skillQuestionOpen ||
      this.skillMenuOpen
    ) {
      this.hideInteractionPrompt();
      return;
    }

    const wasVisible = this.interactionPrompt.visible;
    this.interactText.setText(message);
    this.interactionPrompt.setVisible(true);

    if (!wasVisible) {
      this.interactionPrompt.setAlpha(0);
      this.interactionPrompt.setScale(0.96);

      this.tweens.killTweensOf(this.interactionPrompt);
      this.tweens.add({
        targets: this.interactionPrompt,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Quad.easeOut",
      });
    }
  }

  hideInteractionPrompt() {
    if (this.interactionPrompt) {
      this.interactionPrompt.setVisible(false);
    }
  }

  // ==================================================
  // CREATE FOREST QUEST NPC
  // ==================================================

  createForestQuestNPC() {
    // ==================================================
    // PIXEL FOREST GUARDIAN
    // ==================================================

    this.forestQuestNPC = this.add.image(
      210,
      365,
      "forestGuardianPixel"
    );

    this.forestQuestNPC
      .setDisplaySize(94, 112)
      .setDepth(25);

    // Bayangan kecil agar NPC terasa menempel di tanah.
    this.forestQuestNPCShadow = this.add
      .ellipse(
        210,
        407,
        44,
        12,
        0x000000,
        0.22
      )
      .setDepth(24);

    this.forestQuestNPCLabel = this.add
      .text(
        210,
        426,
        "Penjaga Isim",
        {
          fontSize: "13px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#1A365D",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(27);

    // Quest marker seperti Grammar Master di Village.
    this.forestQuestNPCIcon = this.add
      .text(
        210,
        292,
        "!",
        {
          fontSize: "34px",
          color: "#FFE066",
          fontStyle: "bold",
          stroke: "#7B341E",
          strokeThickness: 6,
        }
      )
      .setOrigin(0.5)
      .setDepth(28);

    this.tweens.add({
      targets: this.forestQuestNPCIcon,
      y: 286,
      duration: 650,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: this.forestQuestNPC,
      y: 362,
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // ==================================================
  // SHOW FOREST QUEST DIALOG
  // ==================================================

  showForestQuestDialog() {
    if (this.forestQuestDialogOpen) {
      return;
    }

    this.forestQuestDialogOpen = true;
    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);
    this.forestQuestDialogObjects = [];

    const overlay = this.add
      .rectangle(400, 300, 800, 600, 0x050b14, 0.72)
      .setDepth(400);

    const panel = this.add
      .rectangle(400, 420, 720, 280, 0x10233f, 0.98)
      .setDepth(401)
      .setStrokeStyle(3, 0x70a36b, 0.95);

    const portraitBox = this.add
      .rectangle(125, 416, 118, 170, 0x0a172a, 1)
      .setDepth(402)
      .setStrokeStyle(2, 0x4f7f58, 1);

    const portrait = this.add
      .image(125, 416, "forestGuardianPixel")
      .setDisplaySize(104, 136)
      .setDepth(403);

    const speakerLabel = this.add
      .text(200, 305, "FOREST QUEST", {
        fontSize: "11px",
        color: "#9FD29B",
        fontStyle: "bold",
      })
      .setDepth(403);

    const title = this.add
      .text(200, 328, "Penjaga Isim", {
        fontSize: "23px",
        color: "#E8FFE6",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 3,
      })
      .setDepth(403);

    const message = this.add
      .text(
        200,
        371,
        "Forest of Isim mulai dipenuhi monster.\n" +
          "Kalahkan 2 monster untuk membersihkan hutan\n" +
          "dan buktikan kemampuan Nahwu-mu!",
        {
          fontSize: "16px",
          color: "#EAF3FF",
          lineSpacing: 6,
          wordWrap: { width: 500 },
        }
      )
      .setDepth(403);

    const currentProgress =
      this.forestQuest && !this.forestQuest.completed
        ? `Progress  •  ${this.forestQuest.progress} / ${this.forestQuest.requiredProgress} monster`
        : this.forestQuest && this.forestQuest.completed
        ? "Quest selesai  •  Hutan sudah lebih aman."
        : "Quest belum diambil.";

    const progressCard = this.add
      .rectangle(450, 475, 490, 48, 0x0a172a, 0.92)
      .setDepth(402)
      .setStrokeStyle(1, 0x4f7f58, 0.85);

    const progress = this.add
      .text(220, 475, currentProgress, {
        fontSize: "14px",
        color: "#CFE8D0",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setDepth(403);

    const acceptButton = this.add
      .rectangle(570, 545, 190, 44, 0x70a36b, 1)
      .setDepth(405)
      .setStrokeStyle(2, 0xb9e6b5, 1)
      .setInteractive({ useHandCursor: true });

    const acceptText = this.add
      .text(
        570,
        545,
        this.forestQuest && !this.forestQuest.completed
          ? "LIHAT QUEST"
          : this.forestQuest && this.forestQuest.completed
          ? "SELESAI"
          : "TERIMA QUEST",
        {
          fontSize: "14px",
          color: "#07111F",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(406);

    const closeButton = this.add
      .rectangle(350, 545, 170, 44, 0x183451, 1)
      .setDepth(405)
      .setStrokeStyle(1, 0x426b98, 1)
      .setInteractive({ useHandCursor: true });

    const closeText = this.add
      .text(350, 545, "TUTUP", {
        fontSize: "14px",
        color: "#EAF3FF",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(406);

    this.forestQuestDialogObjects.push(
      overlay,
      panel,
      portraitBox,
      portrait,
      speakerLabel,
      title,
      message,
      progressCard,
      progress,
      acceptButton,
      acceptText,
      closeButton,
      closeText
    );

    acceptButton.on("pointerover", () => acceptButton.setFillStyle(0x8bc486));
    acceptButton.on("pointerout", () => acceptButton.setFillStyle(0x70a36b));

    acceptButton.on("pointerdown", () => {
      if (this.forestQuest && this.forestQuest.completed) {
        this.closeForestQuestDialog();
        return;
      }

      if (!this.forestQuest) {
        this.acceptForestQuest();
      } else {
        this.closeForestQuestDialog();
      }
    });

    closeButton.on("pointerover", () => closeButton.setFillStyle(0x24598a));
    closeButton.on("pointerout", () => closeButton.setFillStyle(0x183451));
    closeButton.on("pointerdown", () => this.closeForestQuestDialog());
  }

  // ==================================================
  // ACCEPT FOREST QUEST
  // ==================================================

  acceptForestQuest() {
    this.forestQuest = {
      id: "forest_isim_clear",
      title: "Bersihkan Forest of Isim",
      description:
        "Kalahkan 2 monster di Forest of Isim.",
      type: "forestMonster",
      progress: 0,
      requiredProgress: 2,
      reward: {
        xp: 100,
        gold: 50,
      },
      completed: false,
    };

    this.registry.set(
      "forestQuest",
      this.forestQuest
    );

    this.closeForestQuestDialog();
    this.showForestQuestHUD();
  }

  // ==================================================
  // CLOSE FOREST QUEST DIALOG
  // ==================================================

  closeForestQuestDialog() {
    if (this.forestQuestDialogObjects) {
      this.forestQuestDialogObjects.forEach((object) => {
        if (object) {
          object.destroy();
        }
      });
    }

    this.forestQuestDialogObjects = [];
    this.forestQuestDialogOpen = false;

    const shouldShowHUD = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.forestQuestCompleteOpen ||
      this.skillMenuOpen ||
      this.skillQuestionOpen
    );

    this.setGameplayHUDVisible(shouldShowHUD);
  }

  // ==================================================
  // FOREST QUEST HUD — STEP 2D.1
  // ==================================================

  showForestQuestHUD() {
    this.clearForestQuestHUD();

    if (!this.forestQuest) {
      return;
    }

    this.forestQuestObjects = [];

    const hudDepth = 2000;
    const x = 474;
    const y = 74;
    const width = 312;
    const height = 118;

    const panel = this.add
      .rectangle(x, y, width, height, 0x10233f, 0.92)
      .setOrigin(0, 0)
      .setDepth(hudDepth)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xd4af37, 0.75);

    const label = this.add
      .text(x + 14, y + 10, "ACTIVE QUEST", {
        fontSize: "12px",
        color: "#FFE58A",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 2,
      })
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);

    const title = this.add
      .text(x + 14, y + 32, this.forestQuest.title, {
        fontSize: "14px",
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 2,
        wordWrap: { width: width - 28 },
      })
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);

    const current = Number(this.forestQuest.progress) || 0;
    const required = Math.max(1, Number(this.forestQuest.requiredProgress) || 1);
    const ratio = Phaser.Math.Clamp(current / required, 0, 1);

    const progress = this.add
      .text(x + 14, y + 72, `Monster  ${current} / ${required}`, {
        fontSize: "12px",
        color: "#DCEBFF",
        fontStyle: "bold",
      })
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);

    const barBackground = this.add
      .rectangle(x + 14, y + 102, width - 28, 10, 0x07111f, 0.95)
      .setOrigin(0, 0.5)
      .setDepth(hudDepth + 1)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x7297c7, 0.65);

    const barFill = this.add
      .rectangle(x + 16, y + 102, Math.max(0, (width - 32) * ratio), 6, 0xd4af37, 1)
      .setOrigin(0, 0.5)
      .setDepth(hudDepth + 2)
      .setScrollFactor(0);

    this.forestQuestObjects.push(
      panel,
      label,
      title,
      progress,
      barBackground,
      barFill
    );

    // HUD eksplorasi tidak boleh muncul di atas battle atau dialog quest.
    const gameplayHUDShouldBeVisible = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.forestQuestDialogOpen ||
      this.forestQuestCompleteOpen ||
      this.skillMenuOpen ||
      this.skillQuestionOpen
    );

    this.setGameplayHUDVisible(gameplayHUDShouldBeVisible);
  }

  // ==================================================
  // CLEAR FOREST QUEST HUD
  // ==================================================

  clearForestQuestHUD() {
    if (this.forestQuestObjects) {
      this.forestQuestObjects.forEach(
        (object) => {
          if (object) {
            object.destroy();
          }
        }
      );
    }

    this.forestQuestObjects = [];
  }

  // ==================================================
  // UPDATE FOREST QUEST
  // ==================================================

  updateForestQuestProgress() {
    if (
      !this.forestQuest ||
      this.forestQuest.completed
    ) {
      return;
    }

    this.forestQuest.progress = Math.min(
      this.forestQuest.progress + 1,
      this.forestQuest.requiredProgress
    );

    if (
      this.forestQuest.progress >=
      this.forestQuest.requiredProgress
    ) {
      this.forestQuest.completed = true;

      const xpResult = this.addXP(
        Number(this.forestQuest.reward.xp) || 0,
        "isim"
      );

      const goldReward =
        Number(this.forestQuest.reward.gold) || 0;

      this.playerData.gold =
        Number(this.playerData.gold) + goldReward;

      this.registry.set(
        "playerData",
        this.playerData
      );

      this.updateHUD();

      let rewardText =
        `+${xpResult.finalXP} XP\n` +
        `+${goldReward} GOLD`;

      if (xpResult.bonusXP > 0) {
        rewardText +=
          `\nEquipment Bonus: +${xpResult.bonusXP} XP`;
      }

      if (xpResult.leveledUp) {
        rewardText += "\nLEVEL UP!";
      }

      // Battle result harus selesai dulu. Setelah player menekan LANJUT,
      // reward quest Forest baru ditampilkan agar modal tidak menumpuk.
      this.pendingForestQuestCompletion = {
        title: this.forestQuest.title,
        rewardText,
      };
    }

    this.registry.set(
      "forestQuest",
      this.forestQuest
    );

    this.showForestQuestHUD();
  }

  // ==================================================
  // FOREST QUEST COMPLETE — STEP 2D.9
  // ==================================================

  showForestQuestComplete(titleText, rewardText) {
    this.forestQuestCompleteOpen = true;
    this.setGameplayHUDVisible(false);
    this.hideInteractionPrompt();
    this.forestQuestCompleteObjects = [];

    const overlay = this.add
      .rectangle(400, 300, 800, 600, 0x04100a, 0.84)
      .setDepth(760);

    const panel = this.add
      .rectangle(400, 305, 590, 370, 0x10233f, 0.99)
      .setDepth(761)
      .setStrokeStyle(3, 0x70a36b, 1);

    const topGlow = this.add
      .rectangle(400, 123, 590, 5, 0x9fd29b, 1)
      .setDepth(762);

    const seal = this.add
      .circle(400, 170, 36, 0x70a36b, 1)
      .setDepth(762)
      .setStrokeStyle(3, 0xb9e6b5, 1);

    const check = this.add
      .text(400, 170, "✓", {
        fontSize: "34px",
        color: "#07111F",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(763);

    const eyebrow = this.add
      .text(400, 218, "FOREST QUEST CLEARED", {
        fontSize: "12px",
        color: "#9FD29B",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(763);

    const title = this.add
      .text(400, 247, "HUTAN BERHASIL DIBERSIHKAN!", {
        fontSize: "24px",
        color: "#E8FFE6",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(763);

    const questCard = this.add
      .rectangle(400, 295, 470, 48, 0x0a172a, 0.96)
      .setDepth(762)
      .setStrokeStyle(1, 0x4f7f58, 0.95);

    const quest = this.add
      .text(400, 295, titleText, {
        fontSize: "17px",
        color: "#CFE8D0",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)
      .setDepth(763);

    const rewardLabel = this.add
      .text(400, 340, "REWARDS", {
        fontSize: "12px",
        color: "#9FD29B",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(763);

    const rewardCard = this.add
      .rectangle(400, 389, 470, 72, 0x142b4a, 0.96)
      .setDepth(762)
      .setStrokeStyle(1, 0x70a36b, 0.9);

    const reward = this.add
      .text(400, 389, rewardText, {
        fontSize: "15px",
        color: "#F3F7FF",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)
      .setDepth(763);

    const button = this.add
      .rectangle(400, 462, 240, 48, 0x70a36b, 1)
      .setDepth(762)
      .setStrokeStyle(2, 0xb9e6b5, 1)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(400, 462, "KEMBALI KE HUTAN", {
        fontSize: "14px",
        color: "#07111F",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(763);

    this.forestQuestCompleteObjects.push(
      overlay, panel, topGlow, seal, check, eyebrow, title,
      questCard, quest, rewardLabel, rewardCard, reward,
      button, buttonText
    );

    panel.setScale(0.96);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: seal,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 700,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    button.on("pointerover", () => button.setFillStyle(0x8bc486));
    button.on("pointerout", () => button.setFillStyle(0x70a36b));

    button.on("pointerdown", () => {
      this.forestQuestCompleteObjects.forEach((object) => {
        if (object) object.destroy();
      });

      this.forestQuestCompleteObjects = [];
      this.forestQuestCompleteOpen = false;

      this.updateHUD();
      this.showForestQuestHUD();
      this.setGameplayHUDVisible(true);
    });
  }

  // ==================================================
  // CREATE VILLAGE GATE
  // ==================================================

  createVillageGate() {
    this.villageGate =
      this.add.image(
        400,
        548,
        "forestGatePixel"
      );

    this.villageGate
      .setDisplaySize(
        120,
        154
      )
      .setDepth(12);

    this.villageGateText = this.add
      .text(400, 475, "NAHWU VILLAGE", {
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "#1A365D",
        padding: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.villageGatePrompt = this.add
      .text(400, 505, "[ E ] Kembali ke Nahwu Village", {
        fontSize: "15px",
        color: "#ffffff",
        backgroundColor: "#1A365D",
        padding: 7,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.villageGatePrompt.setVisible(false);
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update() {
    if (!this.player || this.isTransitioning) {
      return;
    }

    // ==================================================
    // INVENTORY KEY
    // ==================================================

    if (
      this.inventoryKey &&
      Phaser.Input.Keyboard.JustDown(this.inventoryKey)
    ) {
      if (this.inventoryOpen) {
        this.closeInventory();
        return;
      }

      if (
        !this.forestQuestDialogOpen &&
        !this.forestQuestCompleteOpen &&
        !this.isQuizOpen &&
        !this.isBattleOpen &&
        !this.isBattleQuestionOpen &&
        !this.skillQuestionOpen &&
        !this.skillMenuOpen
      ) {
        this.showInventory();
      }

      return;
    }

    // Pause movement dan sembunyikan prompt selama UI modal terbuka.
    if (
      this.forestQuestDialogOpen ||
      this.forestQuestCompleteOpen ||
      this.inventoryOpen ||
      this.isQuizOpen ||
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.skillQuestionOpen ||
      this.skillMenuOpen
    ) {
      this.hideInteractionPrompt();
      this.player.body.setVelocity(0, 0);
      return;
    }

    const left = this.keys.left.isDown || this.cursors.left.isDown;
    const right = this.keys.right.isDown || this.cursors.right.isDown;
    const up = this.keys.up.isDown || this.cursors.up.isDown;
    const down = this.keys.down.isDown || this.cursors.down.isDown;

    const velocityX = (left ? -1 : 0) + (right ? 1 : 0);
    const velocityY = (up ? -1 : 0) + (down ? 1 : 0);

    if (velocityX !== 0 || velocityY !== 0) {
      const direction = new Phaser.Math.Vector2(velocityX, velocityY);
      direction.normalize();
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

    // Monsters only chase while the player is free to move.
    this.monsters.forEach((monster) => {
      if (!monster) {
        return;
      }

      if (!monster.isDead()) {
        monster.update(this.player);
      }

      this.visualFoundation.syncMonsterVisuals(
        monster.body
      );
    });

    this.hideInteractionPrompt();
    this.villageGatePrompt.setVisible(false);

    // Arm the return gate only after the E key has been released.
    // This prevents the E press used to enter ForestScene from
    // immediately triggering the return gate.
    if (!this.forestGateReady) {
      if (this.interactKey.isUp) {
        this.forestGateReady = true;
      }
    }

    // ==================================================
    // FOREST QUEST NPC
    // ==================================================

    if (this.forestQuestNPC) {
      const npcDistance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.forestQuestNPC.x,
        this.forestQuestNPC.y
      );

      if (npcDistance < 85) {
        this.showInteractionPrompt(
          "Bicara dengan Penjaga Isim"
        );

        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.showForestQuestDialog();
          return;
        }
      }
    }

    // ==================================================
    // FOREST CHEST INTERACTION
    // ==================================================

    let nearestChest = null;
    let nearestChestDistance = Infinity;

    this.chests.forEach((chest) => {
      if (!chest || chest.opened) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        chest.x,
        chest.y
      );

      if (distance < nearestChestDistance) {
        nearestChest = chest;
        nearestChestDistance = distance;
      }
    });

    this.chests.forEach((chest) => {
      const nearby =
        chest === nearestChest &&
        nearestChestDistance < 80 &&
        !chest.opened;

      this.visualFoundation.setChestNearby(
        chest,
        nearby
      );
    });

    if (
      nearestChest &&
      nearestChestDistance < 80
    ) {
      this.showInteractionPrompt(
        "Buka Forest Chest"
      );

      if (
        Phaser.Input.Keyboard.JustDown(
          this.interactKey
        )
      ) {
        this.openForestChest(
          nearestChest
        );
        return;
      }
    }

    const nearestMonster = this.getNearestMonster();

    if (
      nearestMonster &&
      nearestMonster.isNearby &&
      !nearestMonster.isDead() &&
      (
        !nearestChest ||
        nearestChestDistance >= 80
      )
    ) {
      this.showInteractionPrompt(
        `Lawan ${nearestMonster.name}`
      );

      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.startBattle(nearestMonster);
        return;
      }
    }

    const gateDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.villageGate.x,
      this.villageGate.y
    );

    if (gateDistance < 90) {
      this.villageGatePrompt.setVisible(false);
      this.showInteractionPrompt(
        "Kembali ke Nahwu Village"
      );

      if (
        this.forestGateReady &&
        Phaser.Input.Keyboard.JustDown(this.interactKey)
      ) {
        this.returnToVillage();
        return;
      }
    }
  }

  // ==================================================
  // RETURN TO VILLAGE
  // ==================================================

  returnToVillage() {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.forestGateReady = false;

    if (
      this.player &&
      this.player.body
    ) {
      this.player.body.setVelocity(
        0,
        0
      );
    }

    this.villageGatePrompt.setVisible(
      false
    );

    this.hideInteractionPrompt();

    this.visualFoundation.playSceneTransition({
      title: "NAHWU VILLAGE",
      subtitle:
        "Kembali ke tempat perjalanan dimulai",
      onComplete: () => {
        this.scene.start(
          "VillageScene"
        );
      },
    });
  }

  // ==================================================
  // CREATE FOREST CHEST
  // ==================================================

  createForestChest(
    x,
    y,
    reward,
    chestId
  ) {
    const openedChests =
      this.gameProgress?.forest?.openedChests || [];

    const chest = {
      id: chestId,
      x,
      y,
      reward,
      opened:
        Boolean(chestId) &&
        openedChests.includes(chestId),
      isNearby: false,
      body: null,
      lid: null,
      label: null,
    };

    chest.body = this.add.image(
      x,
      y,
      chest.opened
        ? "chestOpenPixel"
        : "chestClosedPixel"
    );

    chest.body
      .setDisplaySize(70, 62)
      .setDepth(20);

    chest.label = this.add
      .text(
        x,
        y + 42,
        chest.opened
          ? "OPENED!"
          : "FOREST CHEST",
        {
          fontSize: "10px",
          color: "#E8F8D8",
          fontStyle: "bold",
          stroke: "#17351F",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(21);

    this.chests.push(chest);

    if (!chest.opened) {
      this.visualFoundation.animateChest(
        chest
      );
    }
  }

  // ==================================================
  // OPEN FOREST CHEST
  // ==================================================

  openForestChest(chest) {
    if (!chest || chest.opened) {
      return;
    }

    this.currentChest = chest;
    this.currentQuestion =
      this.getForestChestQuestion();

    if (!this.currentQuestion) {
      return;
    }

    this.isQuizOpen = true;
    this.chestAnswerLocked = false;

    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);

    if (
      this.player &&
      this.player.body
    ) {
      this.player.body.setVelocity(0, 0);
    }

    this.showForestChestQuiz();
  }

  getForestChestQuestion() {
    const available = questions.filter(
      (question) =>
        question.type === "isim"
    );

    if (available.length === 0) {
      return null;
    }

    return available[
      Phaser.Math.Between(
        0,
        available.length - 1
      )
    ];
  }

  // ==================================================
  // FOREST CHEST QUIZ UI
  // ==================================================

  showForestChestQuiz() {
    this.clearForestChestQuiz();
    this.quizObjects = [];

    const depth = 5200;

    const overlay = this.add
      .rectangle(
        400,
        300,
        800,
        600,
        0x030a08,
        0.82
      )
      .setDepth(depth);

    const panel = this.add
      .rectangle(
        400,
        300,
        650,
        450,
        0x10261b,
        0.99
      )
      .setDepth(depth + 1)
      .setStrokeStyle(
        3,
        0xd4af37,
        0.95
      );

    const title = this.add
      .text(
        400,
        105,
        "FOREST CHEST CHALLENGE",
        {
          fontSize: "25px",
          color: "#FFE58A",
          fontStyle: "bold",
          stroke: "#07110A",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const difficulty = this.add
      .text(
        400,
        142,
        `Difficulty: ${this.currentQuestion.difficulty.toUpperCase()}`,
        {
          fontSize: "13px",
          color: "#A9D6A3",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const question = this.add
      .text(
        400,
        200,
        this.currentQuestion.question,
        {
          fontSize: "19px",
          color: "#FFFFFF",
          fontStyle: "bold",
          align: "center",
          wordWrap: {
            width: 540,
          },
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 2);

    this.quizObjects.push(
      overlay,
      panel,
      title,
      difficulty,
      question
    );

    this.currentQuestion.answers.forEach(
      (answer, index) => {
        const y = 282 + index * 55;

        const button = this.add
          .rectangle(
            400,
            y,
            500,
            42,
            0x183929,
            1
          )
          .setDepth(depth + 2)
          .setStrokeStyle(
            1,
            0x6b9f70,
            0.9
          )
          .setInteractive({
            useHandCursor: true,
          });

        const text = this.add
          .text(
            400,
            y,
            answer.text,
            {
              fontSize: "17px",
              color: "#F2FFF0",
              fontStyle: "bold",
            }
          )
          .setOrigin(0.5)
          .setDepth(depth + 3);

        button.on(
          "pointerover",
          () => {
            if (this.chestAnswerLocked) {
              return;
            }

            button.setFillStyle(
              0x2f6b48
            );
          }
        );

        button.on(
          "pointerout",
          () => {
            if (this.chestAnswerLocked) {
              return;
            }

            button.setFillStyle(
              0x183929
            );
          }
        );

        button.on(
          "pointerdown",
          () => {
            if (this.chestAnswerLocked) {
              return;
            }

            this.chestAnswerLocked = true;
            this.answerForestChestQuiz(
              answer.correct
            );
          }
        );

        this.quizObjects.push(
          button,
          text
        );
      }
    );
  }

  answerForestChestQuiz(isCorrect) {
    if (!isCorrect) {
      this.showForestChestResult(
        "BELUM TEPAT",
        "Jawabanmu belum benar.\nKamu bisa mencoba chest ini lagi.",
        false
      );
      return;
    }

    const questionType =
      this.currentQuestion?.type ||
      "isim";

    const xpResult = this.addXP(
      125,
      questionType
    );

    this.playerData.gold =
      Number(this.playerData.gold) +
      75;

    if (
      this.currentChest &&
      this.currentChest.reward
    ) {
      const rewardItem = {
        ...this.currentChest.reward,
      };

      const alreadyOwned =
        this.playerData.inventory.some(
          (item) =>
            item &&
            item.id === rewardItem.id
        );

      if (!alreadyOwned) {
        this.playerData.inventory.push(
          rewardItem
        );
      }
    }

    if (this.currentChest) {
      this.currentChest.opened = true;

      if (this.currentChest.id) {
        this.gameProgress = markChestOpened(
          this,
          "forest",
          this.currentChest.id
        );
      }

      if (
        this.currentChest.body &&
        this.currentChest.body.active
      ) {
        this.currentChest.body
          .setTexture("chestOpenPixel")
          .setDisplaySize(70, 62);
      }

      if (this.currentChest.label) {
        this.currentChest.label.setText(
          "OPENED!"
        );
      }
    }

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.updateHUD();

    let message =
      `+${xpResult.finalXP} XP\n` +
      `+75 GOLD`;

    if (
      this.currentChest?.reward
    ) {
      message +=
        `\n${this.currentChest.reward.icon} ` +
        `${this.currentChest.reward.name}`;
    }

    if (xpResult.leveledUp) {
      message += "\n\nLEVEL UP!";
    }

    this.showForestChestResult(
      "CHEST TERBUKA!",
      message,
      true
    );
  }

  showForestChestResult(
    titleText,
    messageText,
    success
  ) {
    this.clearForestChestQuiz();

    const depth = 5300;

    const overlay = this.add
      .rectangle(
        400,
        300,
        800,
        600,
        0x030a08,
        0.84
      )
      .setDepth(depth);

    const panel = this.add
      .rectangle(
        400,
        300,
        520,
        320,
        0x10261b,
        0.99
      )
      .setDepth(depth + 1)
      .setStrokeStyle(
        3,
        success
          ? 0xd4af37
          : 0xa85a5a,
        0.95
      );

    const title = this.add
      .text(
        400,
        205,
        titleText,
        {
          fontSize: "30px",
          color: success
            ? "#FFE58A"
            : "#FFB4B4",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const message = this.add
      .text(
        400,
        292,
        messageText,
        {
          fontSize: "18px",
          color: "#F4FFF2",
          align: "center",
          wordWrap: {
            width: 430,
          },
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const button = this.add
      .rectangle(
        400,
        400,
        190,
        48,
        0xd4af37,
        1
      )
      .setDepth(depth + 2)
      .setInteractive({
        useHandCursor: true,
      });

    const buttonText = this.add
      .text(
        400,
        400,
        "LANJUT",
        {
          fontSize: "17px",
          color: "#10261B",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 3);

    button.on(
      "pointerdown",
      () => {
        [
          overlay,
          panel,
          title,
          message,
          button,
          buttonText,
        ].forEach((object) => {
          if (object) {
            object.destroy();
          }
        });

        this.isQuizOpen = false;
        this.chestAnswerLocked = false;
        this.currentQuestion = null;
        this.currentChest = null;

        this.updateHUD();
        this.setGameplayHUDVisible(true);
      }
    );
  }

  clearForestChestQuiz() {
    this.quizObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.quizObjects = [];
  }

  // ==================================================
  // CREATE TREE
  // ==================================================

  createTree(x, y) {
    const tree =
      this.add.image(
        x,
        y,
        "treePixel"
      );

    tree
      .setDisplaySize(
        118,
        146
      )
      .setDepth(8);

    this.visualFoundation.animateTree([
      tree,
    ]);

    // Collision hanya berada pada batang / bagian bawah
    // agar kanopi pohon tidak menjadi tembok besar.
    const collider =
      this.add.rectangle(
        x,
        y + 36,
        52,
        54,
        0xffffff,
        0
      );

    this.physics.add.existing(
      collider,
      true
    );

    this.obstacles.add(
      collider
    );
  }

  // ==================================================
  // CREATE ROCK
  // ==================================================

  createRock(x, y) {
    // Pixel-style rock dari block sederhana.
    // Tidak memakai circle supaya lebih menyatu dengan asset pixel.
    const shadow = this.add
      .ellipse(x, y + 14, 46, 12, 0x000000, 0.18)
      .setDepth(4);

    const base = this.add
      .rectangle(x, y + 2, 42, 26, 0x667085)
      .setDepth(5);

    const top = this.add
      .rectangle(x - 4, y - 8, 30, 15, 0x8892a3)
      .setDepth(6);

    const highlight = this.add
      .rectangle(x - 10, y - 11, 10, 5, 0xb7bec9)
      .setDepth(7);

    this.visualFoundation.animateRock([
      base,
      top,
      highlight,
      shadow,
    ]);

    const collider = this.add.rectangle(
      x,
      y + 5,
      40,
      27,
      0xffffff,
      0
    );

    this.physics.add.existing(collider, true);
    this.obstacles.add(collider);
  }

  // ==================================================
  // CREATE BUSH
  // ==================================================

  createBush(x, y) {
    // Bush dibuat dari block pixel sederhana agar tidak terasa vector.
    const back = this.add
      .rectangle(x, y + 4, 50, 26, 0x285e3b)
      .setDepth(5);

    const left = this.add
      .rectangle(x - 15, y - 7, 24, 20, 0x2f855a)
      .setDepth(6);

    const middle = this.add
      .rectangle(x, y - 11, 26, 24, 0x38a169)
      .setDepth(7);

    const right = this.add
      .rectangle(x + 15, y - 5, 22, 18, 0x2f855a)
      .setDepth(6);

    const highlight = this.add
      .rectangle(x - 5, y - 16, 9, 5, 0x68d391)
      .setDepth(8);

    this.visualFoundation.animateBush([
      back,
      left,
      middle,
      right,
      highlight,
    ]);
  }

  // ==================================================
  // CREATE WALL
  // ==================================================

  createWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(wall, true);
    this.obstacles.add(wall);
  }

  // ==================================================
  // GET NEAREST MONSTER
  // ==================================================

  getNearestMonster() {
    let nearestMonster = null;
    let nearestDistance = Infinity;

    this.monsters.forEach((monster) => {
      if (!monster || monster.isDead()) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        monster.x,
        monster.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMonster = monster;
      }
    });

    return nearestMonster;
  }

  startBattle(
    monster
  ) {
    if (
      !monster ||
      monster.isDead()
    ) {
      return;
    }

    this.currentMonster =
      monster;

    this.isBattleOpen =
      true;

    // Reset question lock
    this.answerLocked =
      false;

    // Reset battle question
    this.currentBattleQuestion =
      null;

    // Reset HP
    this.playerHP =
      this.playerMaxHP;

    // Reset defend
    this.isDefending =
      false;

    // Reset combo
    this.battleCombo = 0;

    this.battleMaxCombo = 0;

    this.battleComboText = null;

    // ==================================================
    // RESET SKILL
    // ==================================================

    this.skillMenuOpen = false;

    this.skillQuestionOpen = false;

    this.skillQuestionObjects = [];

    this.currentSkill = null;

    this.currentSkillQuestion = null;

    this.activeShieldTurns = 0;

    this.battleSkillButton = null;

    // Hide interaction
    this.hideInteractionPrompt();

    // Battle harus fokus penuh ke arena battle.
    // HUD eksplorasi (LVL / XP / GOLD / Quest) disembunyikan sementara.
    this.setGameplayHUDVisible(false);

    this.battleObjects = [];

    // ==================================================
    // OVERLAY
    // ==================================================

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.78
      );

    overlay.setDepth(600);

    // ==================================================
    // PANEL
    // ==================================================

    const panel =
      this.add.rectangle(
        400,
        300,
        720,
        535,
        0x0b1728,
        0.98
      );

    panel
      .setDepth(601)
      .setStrokeStyle(
        3,
        0xd8b43f,
        1
      );

    // ==================================================
    // TITLE
    // ==================================================

    const title =
      this.add
        .text(
          400,
          58,
          "⚔ BATTLE ARENA",
          {
            fontSize: "28px",
            color: "#F6D365",
            fontStyle: "bold",
            stroke: "#07111F",
            strokeThickness: 4,
          }
        )
        .setOrigin(0.5);

    title.setDepth(602);

    // ==================================================
    // MONSTER NAME
    // ==================================================

    const monsterName =
      this.add
        .text(
          400,
          103,
          monster.name,
          {
            fontSize: "22px",
            color: "#F87171",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    monsterName.setDepth(602);

    // ==================================================
    // MONSTER HP
    // ==================================================

    const monsterHPBackground =
      this.add.rectangle(
        235,
        140,
        330,
        18,
        0x07111f
      );

    monsterHPBackground
      .setDepth(602)
      .setOrigin(0, 0.5)
      .setStrokeStyle(
        1,
        0x34516f,
        1
      );

    const monsterHPBar =
      this.add.rectangle(
        235,
        140,
        330,
        18,
        0xdc3f4f
      );

    monsterHPBar
      .setDepth(603)
      .setOrigin(0, 0.5);

    this.battleMonsterHPText =
      this.add
        .text(
          400,
          166,
          "",
          {
            fontSize: "14px",
            color: "#D7E5F5",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battleMonsterHPText.setDepth(602);

    // ==================================================
    // PLAYER NAME
    // ==================================================

    const playerName =
      this.add
        .text(
          400,
          220,
          "PLAYER",
          {
            fontSize: "21px",
            color: "#73B7FF",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    playerName.setDepth(602);

    // ==================================================
    // PLAYER HP
    // ==================================================

    const playerHPBackground =
      this.add.rectangle(
        235,
        257,
        330,
        18,
        0x07111f
      );

    playerHPBackground
      .setDepth(602)
      .setOrigin(0, 0.5)
      .setStrokeStyle(
        1,
        0x34516f,
        1
      );

    const playerHPBar =
      this.add.rectangle(
        235,
        257,
        330,
        18,
        0x3b8edb
      );

    playerHPBar
      .setDepth(603)
      .setOrigin(0, 0.5);

    this.battlePlayerHPText =
      this.add
        .text(
          400,
          283,
          "",
          {
            fontSize: "14px",
            color: "#D7E5F5",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battlePlayerHPText.setDepth(602);

    // ==================================================
    // PLAYER STATS
    // ==================================================

    const playerStats =
      this.add
        .text(
          400,
          312,
          `ATK ${this.getPlayerAttack()}    •    DEF ${this.getTotalDefense()}`,
          {
            fontSize: "14px",
            color: "#AFC5DB",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    playerStats.setDepth(602);

    // ==================================================
    // COMBO
    // ==================================================

    this.battleComboText =
      this.add
        .text(
          400,
          338,
          "COMBO x0",
          {
            fontSize: "15px",
            color: "#F6D365",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battleComboText.setDepth(602);

    // ==================================================
    // BATTLE LOG
    // ==================================================

    const battleLogBackground =
      this.add.rectangle(
        400,
        382,
        590,
        58,
        0x132842,
        1
      );

    battleLogBackground
      .setDepth(602)
      .setStrokeStyle(
        1,
        0x355b7d,
        1
      );

    this.battleLogText =
      this.add
        .text(
          400,
          382,
          `Battle melawan ${monster.name} dimulai!`,
          {
            fontSize: "14px",
            color: "#E8F0F8",
            align: "center",
            wordWrap: {
              width: 545,
            },
          }
        )
        .setOrigin(0.5);

    this.battleLogText.setDepth(603);

    // ==================================================
    // BATTLE CHARACTER VISUALS
    // ==================================================

    this.battlePlayerVisual =
      this.add.container(
        150,
        255
      );

    const battlePlayerBody =
      this.add.sprite(
        0,
        0,
        "playerWalkPixel",
        0
      );

    battlePlayerBody.setDisplaySize(
      90,
      90
    );

    const battlePlayerMark =
      this.add
        .text(
          0,
          50,
          "YOU",
          {
            fontSize: "10px",
            color: "#F6D365",
            fontStyle: "bold",
            backgroundColor: "#0B1728",
            padding: {
              left: 5,
              right: 5,
              top: 2,
              bottom: 2,
            },
          }
        )
        .setOrigin(0.5);

    this.battlePlayerVisual.add([
      battlePlayerBody,
      battlePlayerMark,
    ]);

    this.battlePlayerVisual.setDepth(603);

    this.battleMonsterVisual =
      this.add.container(
        650,
        140
      );

    const battleTexture =
      this.currentMonster?.body?.texture?.key ||
      "nahwuSlimePixel";

    const battleMonsterBody =
      this.add.image(
        0,
        0,
        battleTexture
      );

    battleMonsterBody.setDisplaySize(
      this.currentMonster?.id === "irabGolem"
        ? 118
        : 102,
      this.currentMonster?.id === "irabGolem"
        ? 118
        : 102
    );

    this.battleMonsterVisual.add(
      battleMonsterBody
    );

    this.battleMonsterVisual.setDepth(603);

    this.visualFoundation.animateBattleEntry(
      this.battlePlayerVisual,
      this.battleMonsterVisual
    );

    // ==================================================
    // ATTACK
    // ==================================================

    const attackButton =
      this.add.rectangle(
        200,
        462,
        170,
        52,
        0xb8323e
      );

    attackButton
      .setDepth(602)
      .setStrokeStyle(
        2,
        0xf6d365,
        0.65
      );

    attackButton.setInteractive({
      useHandCursor: true,
    });

    const attackText =
      this.add
        .text(
          200,
          462,
          "⚔ SERANG",
          {
            fontSize: "16px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    attackText.setDepth(603);

    // ==================================================
    // SKILL
    // ==================================================

    const skillButton =
      this.add.rectangle(
        400,
        462,
        170,
        52,
        0x596274
      );

    skillButton
      .setDepth(602)
      .setStrokeStyle(
        2,
        0xf6d365,
        0.65
      );

    skillButton.setInteractive({
      useHandCursor: true,
    });

    const skillText =
      this.add
        .text(
          400,
          462,
          "✦ SKILL",
          {
            fontSize: "16px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    skillText.setDepth(603);

    this.battleSkillButton =
      skillButton;

    // ==================================================
    // DEFEND
    // ==================================================

    const defendButton =
      this.add.rectangle(
        600,
        462,
        170,
        52,
        0x2f76b7
      );

    defendButton
      .setDepth(602)
      .setStrokeStyle(
        2,
        0xf6d365,
        0.65
      );

    defendButton.setInteractive({
      useHandCursor: true,
    });

    const defendText =
      this.add
        .text(
          600,
          462,
          "🛡 BERTAHAN",
          {
            fontSize: "16px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    defendText.setDepth(603);

    // ==================================================
    // SKILL BUTTON
    // ==================================================

    skillButton.on(
      "pointerdown",
      () => {
        if (
          !this.isBattleOpen ||
          !monster ||
          monster.isDead()
        ) {
          return;
        }

        this.showSkillMenu(
          attackButton,
          skillButton,
          defendButton,
          updateBattleUI
        );
      }
    );

    skillButton.on(
      "pointerover",
      () => {
        if (this.isBattleQuestionOpen) {
          return;
        }

        if (
          this.battleCombo >=
          skills.powerStrike.requiredCombo
        ) {
          skillButton.setFillStyle(
            0x8b5cf6
          );
        }
      }
    );

    skillButton.on(
      "pointerout",
      () => {
        if (
          this.battleCombo >=
          skills.powerStrike.requiredCombo
        ) {
          skillButton.setFillStyle(
            0x7651c9
          );
        } else {
          skillButton.setFillStyle(
            0x596274
          );
        }
      }
    );

    // ==================================================
    // EXIT
    // ==================================================

    const exitButton =
      this.add.rectangle(
        400,
        527,
        170,
        38,
        0x14243a
      );

    exitButton
      .setDepth(602)
      .setStrokeStyle(
        1,
        0x5f7891,
        1
      );

    exitButton.setInteractive({
      useHandCursor: true,
    });

    const exitText =
      this.add
        .text(
          400,
          527,
          "KELUAR",
          {
            fontSize: "13px",
            color: "#C9D6E4",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    exitText.setDepth(603);

    // ==================================================
    // UPDATE BATTLE UI
    // ==================================================

    const updateBattleUI =
      () => {
        if (
          !monster ||
          !this.currentMonster
        ) {
          return;
        }

        const monsterHP =
          Phaser.Math.Clamp(
            monster.hp,
            0,
            monster.maxHP
          );

        const playerHP =
          Phaser.Math.Clamp(
            this.playerHP,
            0,
            this.playerMaxHP
          );

        const monsterPercentage =
          monsterHP /
          monster.maxHP;

        const playerPercentage =
          playerHP /
          this.playerMaxHP;

        monsterHPBar.setDisplaySize(
          330 *
            monsterPercentage,
          18
        );

        playerHPBar.setDisplaySize(
          330 *
            playerPercentage,
          18
        );

        this.battleMonsterHPText.setText(
          `HP: ${monsterHP} / ${monster.maxHP}`
        );

        this.battlePlayerHPText.setText(
          `HP: ${playerHP} / ${this.playerMaxHP}`
        );

        if (
          this.battleComboText
        ) {
          this.battleComboText.setText(
            `COMBO x${this.battleCombo}`
          );
        }

        if (this.battleSkillButton) {
          if (
            this.battleCombo >=
            skills.powerStrike.requiredCombo
          ) {
            this.battleSkillButton.setFillStyle(
              0x7651c9
            );
          } else {
            this.battleSkillButton.setFillStyle(
              0x596274
            );
          }
        }
      };

    updateBattleUI();

    // ==================================================
    // ATTACK BUTTON
    // ==================================================

    attackButton.on(
      "pointerdown",
      () => {
        if (
          !this.isBattleOpen ||
          !monster ||
          monster.isDead()
        ) {
          return;
        }

        this.openBattleQuestion(
          attackButton,
          skillButton,
          defendButton,
          updateBattleUI
        );
      }
    );

    // ==================================================
    // DEFEND BUTTON
    // ==================================================

    defendButton.on(
      "pointerdown",
      () => {
        if (
          !this.isBattleOpen ||
          !monster ||
          monster.isDead()
        ) {
          return;
        }

        this.isDefending =
          true;

        attackButton.disableInteractive();

        skillButton.disableInteractive();

        defendButton.disableInteractive();

        this.battleLogText.setText(
          "🛡️ Kamu bersiap bertahan!"
        );

        this.time.delayedCall(
          500,
          () => {
            if (
              !this.isBattleOpen ||
              !monster ||
              monster.isDead()
            ) {
              return;
            }

            this.monsterAttack(
              monster,
              updateBattleUI
            );

            if (
              this.isBattleOpen &&
              this.playerHP > 0 &&
              !monster.isDead()
            ) {
              attackButton.setInteractive({
                useHandCursor: true,
              });

              skillButton.setInteractive({
                useHandCursor: true,
              });

              defendButton.setInteractive({
                useHandCursor: true,
              });
            }
          }
        );
      }
    );

    // ==================================================
    // EXIT
    // ==================================================

    exitButton.on(
      "pointerdown",
      () => {
        this.closeBattle();
      }
    );

    // ==================================================
    // HOVER ATTACK
    // ==================================================

    attackButton.on(
      "pointerover",
      () => {
        if (
          this.isBattleQuestionOpen
        ) {
          return;
        }

        attackButton.setFillStyle(
          0xd94855
        );
      }
    );

    attackButton.on(
      "pointerout",
      () => {
        attackButton.setFillStyle(
          0xb8323e
        );
      }
    );

    // ==================================================
    // HOVER DEFEND
    // ==================================================

    defendButton.on(
      "pointerover",
      () => {
        if (
          this.isBattleQuestionOpen
        ) {
          return;
        }

        defendButton.setFillStyle(
          0x3f93d8
        );
      }
    );

    defendButton.on(
      "pointerout",
      () => {
        defendButton.setFillStyle(
          0x2f76b7
        );
      }
    );

    // ==================================================
    // SAVE BATTLE OBJECTS
    // ==================================================

    this.battleObjects.push(
      overlay,
      panel,
      title,
      monsterName,

      monsterHPBackground,
      monsterHPBar,
      this.battleMonsterHPText,

      playerName,
      playerHPBackground,
      playerHPBar,
      this.battlePlayerHPText,

      playerStats,
      this.battleComboText,

      battleLogBackground,
      this.battleLogText,

      attackButton,
      attackText,

      skillButton,
      skillText,

      defendButton,
      defendText,

      exitButton,
      exitText
    );
  }

  openBattleQuestion(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    if (
      !this.currentMonster ||
      this.currentMonster.isDead()
    ) {
      return;
    }

    this.isBattleQuestionOpen =
      true;

    // IMPORTANT
    // Reset lock setiap kali
    // pertanyaan dibuka.
    this.answerLocked =
      false;

    this.currentBattleQuestion =
      this.getRandomBattleQuestion();

    if (
      !this.currentBattleQuestion
    ) {
      this.isBattleQuestionOpen =
        false;

      return;
    }

    attackButton.disableInteractive();

    skillButton.disableInteractive();

    defendButton.disableInteractive();

    this.showBattleQuestion(
      attackButton,
      skillButton,
      defendButton,
      updateBattleUI
    );
  }

  getRandomBattleQuestion() {
    if (
      !battleQuestions ||
      battleQuestions.length === 0
    ) {
      return null;
    }

    let difficulty =
      "Easy";

    if (
      this.currentMonster &&
      this.currentMonster.difficulty
    ) {
      difficulty =
        this.currentMonster.difficulty;
    }

    let availableQuestions =
      battleQuestions.filter(
        (question) =>
          question.difficulty ===
          difficulty
      );

    // Fallback
    if (
      availableQuestions.length ===
      0
    ) {
      availableQuestions =
        battleQuestions;
    }

    const index =
      Phaser.Math.Between(
        0,
        availableQuestions.length - 1
      );

    return availableQuestions[
      index
    ];
  }

  showBattleQuestion(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    this.battleQuestionObjects =
      [];

    // ==================================================
    // OVERLAY
    // ==================================================

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x020817,
        0.9
      );

    overlay.setDepth(800);

    // ==================================================
    // PANEL
    // ==================================================

    const panel =
      this.add.rectangle(
        400,
        300,
        660,
        480,
        0x0b1728,
        1
      );

    panel
      .setDepth(801)
      .setStrokeStyle(
        3,
        0xd8b43f,
        1
      );

    // ==================================================
    // TITLE
    // ==================================================

    const title =
      this.add
        .text(
          400,
          72,
          "📖 NAHWU CHALLENGE",
          {
            fontSize: "26px",
            color: "#F6D365",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(802);

    // ==================================================
    // INFO
    // ==================================================

    const info =
      this.add
        .text(
          400,
          112,
          "Jawab dengan benar untuk melancarkan serangan",
          {
            fontSize: "13px",
            color: "#9DB5CC",
          }
        )
        .setOrigin(0.5);

    info.setDepth(802);

    // ==================================================
    // DIFFICULTY
    // ==================================================

    const difficulty =
      this.add
        .text(
          400,
          140,
          `DIFFICULTY  •  ${String(this.currentBattleQuestion.difficulty).toUpperCase()}`,
          {
            fontSize: "12px",
            color: "#E7BE4E",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    difficulty.setDepth(802);

    // ==================================================
    // QUESTION
    // ==================================================

    const question =
      this.add
        .text(
          400,
          202,
          this.currentBattleQuestion.question,
          {
            fontSize: "19px",
            color: "#F4F7FB",
            fontStyle: "bold",
            align: "center",
            wordWrap: {
              width: 550,
            },
          }
        )
        .setOrigin(0.5);

    question.setDepth(802);

    this.battleQuestionObjects.push(
      overlay,
      panel,
      title,
      info,
      difficulty,
      question
    );

    // ==================================================
    // ANSWERS
    // ==================================================

    this.currentBattleQuestion.answers.forEach(
      (
        answer,
        index
      ) => {
        const y =
          275 +
          index * 53;

        const button =
          this.add.rectangle(
            400,
            y,
            520,
            42,
            0x142a46
          );

        button
          .setDepth(802)
          .setStrokeStyle(1, 0x355b7d, 1);

        button.setInteractive({
          useHandCursor: true,
        });

        const text =
          this.add
            .text(
              400,
              y,
              `${String.fromCharCode(65 + index)}.  ${answer.text}`,
              {
                fontSize: "18px",
                color: "#E8F0F8",
                fontStyle: "bold",
              }
            )
            .setOrigin(0.5);

        text.setDepth(803);

        this.battleQuestionObjects.push(
          button,
          text
        );

        // ==================================================
        // HOVER
        // ==================================================

        button.on(
          "pointerover",
          () => {
            if (
              this.answerLocked
            ) {
              return;
            }

            button.setFillStyle(
              0x245a87
            );

            text.setColor(
              "#ffffff"
            );
          }
        );

        button.on(
          "pointerout",
          () => {
            if (
              this.answerLocked
            ) {
              return;
            }

            button.setFillStyle(
              0x142a46
            );

            text.setColor(
              "#E8F0F8"
            );
          }
        );

        // ==================================================
        // CLICK
        // ==================================================

        button.on(
          "pointerdown",
          () => {
            if (
              this.answerLocked
            ) {
              return;
            }

            this.answerLocked =
              true;

            this.answerBattleQuestion(
              answer.correct,
              attackButton,
              skillButton,
              defendButton,
              updateBattleUI
            );
          }
        );
      }
    );
  }

  answerBattleQuestion(
    isCorrect,
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    // ==================================================
    // PENTING!
    //
    // Simpan object question TERLEBIH DAHULU.
    // Jangan clearBattleQuestion() dulu.
    // ==================================================

    const battleQuestion =
      this.currentBattleQuestion;

    // ==================================================
    // BARU HAPUS UI SOAL
    // ==================================================

    this.clearBattleQuestion();

    this.isBattleQuestionOpen =
      false;

    this.answerLocked =
      false;

    // ==================================================
    // CEK MONSTER
    // ==================================================

    if (
      !this.currentMonster ||
      this.currentMonster.isDead()
    ) {
      return;
    }

    // ==================================================
    // BENAR
    // ==================================================

    if (isCorrect) {
      // ------------------------------------------------
      // COMBO
      // ------------------------------------------------

      this.battleCombo +=
        1;

      if (
        this.battleCombo >
        this.battleMaxCombo
      ) {
        this.battleMaxCombo =
          this.battleCombo;
      }

      // Update combo UI
      if (
        this.battleComboText
      ) {
        this.battleComboText.setText(
          `COMBO x${this.battleCombo}`
        );
      }

      this.visualFoundation.playComboEffect(
        this.battleCombo,
        this.battleComboText
      );

      // ------------------------------------------------
      // ATTACK
      // ------------------------------------------------

      const attack =
        this.getPlayerAttack();

      const questionDamage =
        Number(
          battleQuestion?.damage
        ) || 20;

      const difficulty =
        battleQuestion?.difficulty ||
        "Easy";

      let damage =
        Math.max(
          1,
          attack -
            this.currentMonster.defense +
            questionDamage
        );

      // ------------------------------------------------
      // CRITICAL
      // ------------------------------------------------

      let isCritical =
        false;

      if (
        this.battleCombo >= 3
      ) {
        isCritical =
          true;

        damage =
          Math.floor(
            damage * 1.5
          );
      }

      // ------------------------------------------------
      // DAMAGE MONSTER
      // ------------------------------------------------

      this.currentMonster.takeDamage(
        damage
      );

      // ------------------------------------------------
      // ATTACK / HIT VISUAL
      // ------------------------------------------------

      this.visualFoundation.playPlayerAttack(
        this.battlePlayerVisual,
        this.battleMonsterVisual,
        isCritical
      );

      // ------------------------------------------------
      // LOG
      // ------------------------------------------------

      if (isCritical) {
        this.battleLogText.setText(
          `🔥 CRITICAL HIT!\n` +
            `Combo x${this.battleCombo}\n` +
            `⚔️ Damage: ${damage}`
        );
      } else {
        this.battleLogText.setText(
          `✅ BENAR!\n` +
            `Soal ${difficulty}\n` +
            `🔥 Combo x${this.battleCombo}\n` +
            `⚔️ Damage: ${damage}`
        );
      }

      // ------------------------------------------------
      // DAMAGE POPUP
      // ------------------------------------------------

      this.showDamagePopup(
        damage,
        isCritical
      );

      // ------------------------------------------------
      // UPDATE
      // ------------------------------------------------

      updateBattleUI();

      // ------------------------------------------------
      // MONSTER DEAD
      // ------------------------------------------------

      if (
        this.currentMonster.isDead()
      ) {
        attackButton.disableInteractive();

        defendButton.disableInteractive();

        this.handleVictory(
          this.currentMonster,
          updateBattleUI
        );

        return;
      }

      // ------------------------------------------------
      // MONSTER TURN
      // ------------------------------------------------

      attackButton.disableInteractive();

      skillButton.disableInteractive();

      defendButton.disableInteractive();

      this.time.delayedCall(
        600,
        () => {
          if (
            !this.isBattleOpen ||
            !this.currentMonster ||
            this.currentMonster.isDead()
          ) {
            return;
          }

          this.monsterAttack(
            this.currentMonster,
            updateBattleUI
          );

          if (
            this.isBattleOpen &&
            this.playerHP > 0 &&
            !this.currentMonster.isDead()
          ) {
            attackButton.setInteractive({
              useHandCursor: true,
            });

            skillButton.setInteractive({
              useHandCursor: true,
            });

            defendButton.setInteractive({
              useHandCursor: true,
            });
          }
        }
      );

      return;
    }

    // ==================================================
    // SALAH
    // ==================================================

    this.battleCombo =
      0;

    if (
      this.battleComboText
    ) {
      this.battleComboText.setText(
        "COMBO x0"
      );
    }

    this.battleLogText.setText(
      "❌ SALAH!\n" +
        "Combo terputus.\n" +
        "Kamu gagal menyerang."
    );

    attackButton.disableInteractive();

    defendButton.disableInteractive();

    // ==================================================
    // MONSTER TURN
    // ==================================================

    this.time.delayedCall(
      600,
      () => {
        if (
          !this.isBattleOpen ||
          !this.currentMonster ||
          this.currentMonster.isDead()
        ) {
          return;
        }

        this.monsterAttack(
          this.currentMonster,
          updateBattleUI
        );

        if (
          this.isBattleOpen &&
          this.playerHP > 0 &&
          !this.currentMonster.isDead()
        ) {
          attackButton.setInteractive({
            useHandCursor: true,
          });

          skillButton.setInteractive({
            useHandCursor: true,
          });

          defendButton.setInteractive({
            useHandCursor: true,
          });
        }
      }
    );
  }

  showSkillMenu(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    if (
      this.skillMenuOpen ||
      !this.isBattleOpen ||
      this.isBattleQuestionOpen
    ) {
      return;
    }

    const requiredCombo =
      skills.powerStrike.requiredCombo;

    if (
      this.battleCombo <
      requiredCombo
    ) {
      this.battleLogText.setText(
        `⚠️ Skill membutuhkan Combo x${requiredCombo}!`
      );

      return;
    }

    this.skillMenuOpen = true;

    this.skillObjects = [];

    attackButton.disableInteractive();
    skillButton.disableInteractive();
    defendButton.disableInteractive();

    const overlay =
      this.add.rectangle(
        400,
        360,
        560,
        245,
        0x0b1728,
        0.99
      );

    overlay
      .setDepth(900)
      .setStrokeStyle(2, 0xd8b43f, 0.9);

    overlay.setInteractive();

    const title =
      this.add
        .text(
          400,
          270,
          "✨ SKILL MENU",
          {
            fontSize: "25px",
            color: "#D4AF37",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(901);

    const powerButton =
      this.add.rectangle(
        400,
        330,
        440,
        48,
        0x805ad5
      );

    powerButton.setDepth(901);
    powerButton.setInteractive({
      useHandCursor: true,
    });

    const powerText =
      this.add
        .text(
          400,
          330,
          "✨ Power Strike  •  Combo x2",
          {
            fontSize: "17px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    powerText.setDepth(902);

    const shieldButton =
      this.add.rectangle(
        400,
        390,
        440,
        48,
        0x3182ce
      );

    shieldButton.setDepth(901);
    shieldButton.setInteractive({
      useHandCursor: true,
    });

    const shieldText =
      this.add
        .text(
          400,
          390,
          "🛡️ Grammar Shield  •  Combo x2",
          {
            fontSize: "17px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    shieldText.setDepth(902);

    const closeButton =
      this.add.rectangle(
        400,
        450,
        150,
        38,
        0x4a5568
      );

    closeButton.setDepth(901);
    closeButton.setInteractive({
      useHandCursor: true,
    });

    const closeText =
      this.add
        .text(
          400,
          450,
          "BATAL",
          {
            fontSize: "15px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    closeText.setDepth(902);

    this.skillObjects.push(
      overlay,
      title,
      powerButton,
      powerText,
      shieldButton,
      shieldText,
      closeButton,
      closeText
    );

    powerButton.on(
      "pointerdown",
      () => {
        this.openSkillQuestion(
          "powerStrike",
          attackButton,
          skillButton,
          defendButton,
          updateBattleUI
        );
      }
    );

    shieldButton.on(
      "pointerdown",
      () => {
        this.openSkillQuestion(
          "grammarShield",
          attackButton,
          skillButton,
          defendButton,
          updateBattleUI
        );
      }
    );

    closeButton.on(
      "pointerdown",
      () => {
        this.closeSkillMenu(
          attackButton,
          skillButton,
          defendButton
        );
      }
    );
  }

  closeSkillMenu(
    attackButton,
    skillButton,
    defendButton
  ) {
    this.skillObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.skillObjects = [];

    this.skillMenuOpen = false;

    if (
      this.isBattleOpen &&
      !this.isBattleQuestionOpen &&
      this.currentMonster &&
      !this.currentMonster.isDead()
    ) {
      attackButton.setInteractive({
        useHandCursor: true,
      });

      skillButton.setInteractive({
        useHandCursor: true,
      });

      defendButton.setInteractive({
        useHandCursor: true,
      });
    }
  }

  openSkillQuestion(
    skillId,
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    if (
      !this.isBattleOpen ||
      !this.currentMonster ||
      this.currentMonster.isDead()
    ) {
      return;
    }

    if (
      this.battleCombo <
      skills[skillId].requiredCombo
    ) {
      this.battleLogText.setText(
        `⚠️ ${skills[skillId].name} membutuhkan Combo x${skills[skillId].requiredCombo}!`
      );

      return;
    }

    const availableQuestions =
      skillQuestions.filter(
        (question) =>
          question.skill === skillId
      );

    if (
      availableQuestions.length === 0
    ) {
      this.battleLogText.setText(
        "⚠️ Soal skill belum tersedia."
      );

      return;
    }

    this.closeSkillMenu(
      attackButton,
      skillButton,
      defendButton
    );

    attackButton.disableInteractive();
    skillButton.disableInteractive();
    defendButton.disableInteractive();

    this.currentSkill =
      skillId;

    this.currentSkillQuestion =
      availableQuestions[
        Phaser.Math.Between(
          0,
          availableQuestions.length - 1
        )
      ];

    this.skillQuestionOpen =
      true;

    this.answerLocked = false;

    this.showSkillQuestion(
      attackButton,
      skillButton,
      defendButton,
      updateBattleUI
    );
  }

  showSkillQuestion(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    const question =
      this.currentSkillQuestion;

    if (!question) {
      return;
    }

    this.skillQuestionObjects = [];

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x020817,
        0.92
      );

    overlay.setDepth(1000);
    overlay.setInteractive();

    const panel =
      this.add.rectangle(
        400,
        300,
        660,
        480,
        0x0b1728,
        1
      );

    panel
      .setDepth(1001)
      .setStrokeStyle(
        3,
        0x9f7aea,
        1
      );

    const skill =
      skills[this.currentSkill];

    const title =
      this.add
        .text(
          400,
          78,
          `${skill.icon} ${skill.name}`,
          {
            fontSize: "27px",
            color: "#C4A7FF",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(1002);

    const info =
      this.add
        .text(
          400,
          118,
          "Jawab dengan benar untuk mengaktifkan skill",
          {
            fontSize: "13px",
            color: "#9DB5CC",
          }
        )
        .setOrigin(0.5);

    info.setDepth(1002);

    const questionText =
      this.add
        .text(
          400,
          205,
          question.question,
          {
            fontSize: "20px",
            color: "#F4F7FB",
            fontStyle: "bold",
            align: "center",
            wordWrap: {
              width: 550,
            },
          }
        )
        .setOrigin(0.5);

    questionText.setDepth(1002);

    this.skillQuestionObjects.push(
      overlay,
      panel,
      title,
      info,
      questionText
    );

    question.answers.forEach(
      (answer, index) => {
        const y =
          290 + index * 55;

        const button =
          this.add.rectangle(
            400,
            y,
            520,
            44,
            0x142a46
          );

        button
          .setDepth(1002)
          .setStrokeStyle(1, 0x4b3f72, 1);
        button.setInteractive({
          useHandCursor: true,
        });

        const answerText =
          this.add
            .text(
              400,
              y,
              `${String.fromCharCode(65 + index)}.  ${answer.text}`,
              {
                fontSize: "17px",
                color: "#E8F0F8",
                fontStyle: "bold",
              }
            )
            .setOrigin(0.5);

        answerText.setDepth(1003);

        this.skillQuestionObjects.push(
          button,
          answerText
        );

        button.on(
          "pointerover",
          () => {
            if (this.answerLocked) {
              return;
            }

            button.setFillStyle(
              0x6d4fb4
            );

            answerText.setColor(
              "#ffffff"
            );
          }
        );

        button.on(
          "pointerout",
          () => {
            if (this.answerLocked) {
              return;
            }

            button.setFillStyle(
              0x142a46
            );

            answerText.setColor(
              "#E8F0F8"
            );
          }
        );

        button.on(
          "pointerdown",
          () => {
            if (this.answerLocked) {
              return;
            }

            this.answerLocked = true;

            this.answerSkillQuestion(
              answer.correct,
              attackButton,
              skillButton,
              defendButton,
              updateBattleUI
            );
          }
        );
      }
    );
  }

  answerSkillQuestion(
    isCorrect,
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    const skillId =
      this.currentSkill;

    const skillQuestion =
      this.currentSkillQuestion;

    this.clearSkillQuestion();

    this.skillQuestionOpen =
      false;

    this.answerLocked = false;

    if (
      !this.currentMonster ||
      this.currentMonster.isDead()
    ) {
      return;
    }

    // ================================================
    // SALAH
    // ================================================

    if (!isCorrect) {
      this.battleCombo = 0;

      if (this.battleComboText) {
        this.battleComboText.setText(
          "COMBO x0"
        );
      }

      this.battleLogText.setText(
        `❌ SALAH!\n${skills[skillId].name} gagal digunakan.\nCombo kembali x0.`
      );

      attackButton.disableInteractive();
      skillButton.disableInteractive();
      defendButton.disableInteractive();

      this.time.delayedCall(
        600,
        () => {
          if (
            !this.isBattleOpen ||
            !this.currentMonster ||
            this.currentMonster.isDead()
          ) {
            return;
          }

          this.monsterAttack(
            this.currentMonster,
            updateBattleUI
          );

          if (
            this.isBattleOpen &&
            this.playerHP > 0 &&
            !this.currentMonster.isDead()
          ) {
            attackButton.setInteractive({
              useHandCursor: true,
            });

            skillButton.setInteractive({
              useHandCursor: true,
            });

            defendButton.setInteractive({
              useHandCursor: true,
            });
          }
        }
      );

      return;
    }

    // ================================================
    // BENAR
    // ================================================

    this.battleCombo =
      Math.max(
        0,
        this.battleCombo -
          skills[skillId].requiredCombo
      );

    updateBattleUI();

    if (skillQuestion) {
      this.battleLogText.setText(
        `✅ BENAR!\n${skillQuestion.difficulty}\n✨ ${skills[skillId].name} aktif!`
      );
    }

    // ================================================
    // POWER STRIKE
    // ================================================

    if (
      skillId ===
      "powerStrike"
    ) {
      this.executePowerStrike(
        attackButton,
        skillButton,
        defendButton,
        updateBattleUI
      );

      return;
    }

    // ================================================
    // GRAMMAR SHIELD
    // ================================================

    if (
      skillId ===
      "grammarShield"
    ) {
      this.executeGrammarShield(
        attackButton,
        skillButton,
        defendButton,
        updateBattleUI
      );
    }
  }

  executePowerStrike(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    const baseDamage =
      Math.max(
        1,
        this.getPlayerAttack() -
          this.currentMonster.defense
      );

    const damage =
      Math.floor(
        baseDamage *
          skills.powerStrike
            .damageMultiplier
      );

    this.currentMonster.takeDamage(
      damage
    );

    this.visualFoundation.playPowerStrikeEffect(
      this.battlePlayerVisual,
      this.battleMonsterVisual
    );

    this.visualFoundation.playPlayerAttack(
      this.battlePlayerVisual,
      this.battleMonsterVisual,
      true
    );

    this.battleLogText.setText(
      `✨ POWER STRIKE!\n⚔️ Damage: ${damage}`
    );

    this.showDamagePopup(
      damage,
      true
    );

    updateBattleUI();

    if (
      this.currentMonster.isDead()
    ) {
      attackButton.disableInteractive();
      skillButton.disableInteractive();
      defendButton.disableInteractive();

      this.handleVictory(
        this.currentMonster,
        updateBattleUI
      );

      return;
    }

    attackButton.disableInteractive();
    skillButton.disableInteractive();
    defendButton.disableInteractive();

    this.time.delayedCall(
      600,
      () => {
        if (
          !this.isBattleOpen ||
          !this.currentMonster
        ) {
          return;
        }

        this.monsterAttack(
          this.currentMonster,
          updateBattleUI
        );

        if (
          this.isBattleOpen &&
          this.playerHP > 0 &&
          !this.currentMonster.isDead()
        ) {
          attackButton.setInteractive({
            useHandCursor: true,
          });

          skillButton.setInteractive({
            useHandCursor: true,
          });

          defendButton.setInteractive({
            useHandCursor: true,
          });
        }
      }
    );
  }

  executeGrammarShield(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    this.activeShieldTurns =
      1;

    this.battleLogText.setText(
      "🛡️ GRAMMAR SHIELD AKTIF!\nDamage monster berikutnya -50%."
    );

    this.visualFoundation.playShieldEffect(
      this.battlePlayerVisual
    );

    updateBattleUI();

    attackButton.disableInteractive();
    skillButton.disableInteractive();
    defendButton.disableInteractive();

    this.time.delayedCall(
      600,
      () => {
        if (
          !this.isBattleOpen ||
          !this.currentMonster ||
          this.currentMonster.isDead()
        ) {
          return;
        }

        this.monsterAttack(
          this.currentMonster,
          updateBattleUI
        );

        if (
          this.isBattleOpen &&
          this.playerHP > 0 &&
          !this.currentMonster.isDead()
        ) {
          attackButton.setInteractive({
            useHandCursor: true,
          });

          skillButton.setInteractive({
            useHandCursor: true,
          });

          defendButton.setInteractive({
            useHandCursor: true,
          });
        }
      }
    );
  }

  clearSkillQuestion() {
    if (
      this.skillQuestionObjects
    ) {
      this.skillQuestionObjects.forEach(
        (object) => {
          if (object) {
            object.destroy();
          }
        }
      );
    }

    this.skillQuestionObjects = [];

    this.currentSkillQuestion =
      null;

    this.currentSkill =
      null;
  }

  showDamagePopup(
    damage,
    isCritical
  ) {
    const popup =
      this.add
        .text(
          400,
          145,
          isCritical
            ? `🔥 CRITICAL -${damage}`
            : `-${damage}`,
          {
            fontSize:
              isCritical
                ? "28px"
                : "24px",

            color:
              isCritical
                ? "#D69E2E"
                : "#DC2626",

            fontStyle: "bold",

            stroke: "#ffffff",

            strokeThickness: 4,
          }
        )
        .setOrigin(0.5);

    popup.setDepth(
      850
    );

    // Phaser Tween:
    // popup naik + transparan
    this.tweens.add({
      targets: popup,

      y: 115,

      alpha: 0,

      duration: 800,

      ease: "Power2",

      onComplete: () => {
        popup.destroy();
      },
    });
  }

  clearBattleQuestion() {
    if (
      !this.battleQuestionObjects
    ) {
      this.currentBattleQuestion =
        null;

      return;
    }

    this.battleQuestionObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.battleQuestionObjects =
      [];

    this.currentBattleQuestion =
      null;
  }

  monsterAttack(
    monster,
    updateBattleUI
  ) {
    if (!monster) {
      return;
    }

    const defense =
      this.getTotalDefense();

    let damage =
      Math.max(
        1,
        monster.attack -
          defense
      );

    // ==================================================
    // DEFEND
    // ==================================================

    if (
      this.activeShieldTurns > 0
    ) {
      damage =
        Math.max(
          1,
          Math.floor(
            damage * skills.grammarShield.damageReduction
          )
        );

      this.activeShieldTurns -= 1;
    }

    if (
      this.isDefending
    ) {
      damage =
        Math.max(
          1,
          Math.floor(
            damage / 2
          )
        );
    }

    // ==================================================
    // PLAYER HP
    // ==================================================

    this.playerHP -=
      damage;

    if (
      this.playerHP < 0
    ) {
      this.playerHP = 0;
    }

    // ==================================================
    // MONSTER ATTACK / PLAYER HIT VISUAL
    // ==================================================

    this.visualFoundation.playMonsterAttack(
      this.battleMonsterVisual,
      this.battlePlayerVisual
    );

    // ==================================================
    // LOG
    // ==================================================

    if (
      this.isDefending
    ) {
      this.battleLogText.setText(
        `🛡️ Kamu bertahan!\n` +
          `${monster.name} memberikan ${damage} damage.`
      );
    } else {
      this.battleLogText.setText(
        `🔴 ${monster.name} menyerang!\n` +
          `Damage: ${damage}`
      );
    }

    this.isDefending =
      false;

    updateBattleUI();

    // ==================================================
    // PLAYER DEFEATED
    // ==================================================

    if (
      this.playerHP <= 0
    ) {
      this.handleDefeat(
        monster
      );
    }
  }

  handleVictory(
    monster,
    updateBattleUI
  ) {
    if (!monster) {
      return;
    }

    this.battleLogText.setText(
      `🏆 ${monster.name} berhasil dikalahkan!`
    );

    updateBattleUI();

    this.visualFoundation.playMonsterDeath(
      this.battleMonsterVisual
    );

    this.visualFoundation.playVictoryEffect(
      this.battleMonsterVisual
    );

    // Tunggu agar HP 0 terlihat
    this.time.delayedCall(
      700,
      () => {
        if (
          !this.isBattleOpen
        ) {
          return;
        }

        // ==================================================
        // DESTROY MONSTER
        // ==================================================

        monster.destroy();

        // ==================================================
        // REMOVE FROM ARRAY
        // ==================================================

        this.monsters =
          this.monsters.filter(
            (item) =>
              item !== monster
          );

        // ==================================================
        // GET REWARD
        // ==================================================

        const reward =
          this.getMonsterReward(
            monster
          );

        // ==================================================
        // XP
        // ==================================================

        const xpResult =
          this.addXP(
            reward.xp,
            "isim"
          );

        // ==================================================
        // GOLD
        // ==================================================

        this.playerData.gold =
          Number(
            this.playerData.gold
          ) +
          reward.gold;

        // ==================================================
        // SAVE
        // ==================================================

        this.registry.set(
          "playerData",
          this.playerData
        );

        this.updateHUD();

        // ==================================================
        // FOREST QUEST PROGRESS
        // ==================================================

        this.updateForestQuestProgress();

        // ==================================================
        // VICTORY SCREEN
        // ==================================================

        this.showBattleResult(
          "VICTORY!",
          `${monster.name} berhasil dikalahkan!\n\n` +
            `+${xpResult.finalXP} XP\n` +
            `+${reward.gold} GOLD\n\n` +
            `Max Combo: x${this.battleMaxCombo}`,
          true
        );
      }
    );
  }

  getMonsterReward(
    monster
  ) {
    if (
      !monster ||
      !monster.reward
    ) {
      return {
        xp: 0,
        gold: 0,
      };
    }

    return {
      xp:
        Number(
          monster.reward.xp
        ) || 0,

      gold:
        Number(
          monster.reward.gold
        ) || 0,
    };
  }

  handleDefeat(
    monster
  ) {
    if (!monster) {
      return;
    }

    this.battleLogText.setText(
      "💀 Kamu kalah dalam pertarungan!"
    );

    this.visualFoundation.playPlayerDefeat(
      this.battlePlayerVisual
    );

    this.time.delayedCall(
      700,
      () => {
        if (
          !this.isBattleOpen
        ) {
          return;
        }

        this.showBattleResult(
          "DEFEAT",
          "Kamu belum berhasil mengalahkan monster.\n\n" +
            "Coba lagi setelah meningkatkan equipment-mu.",
          false
        );
      }
    );
  }

  showBattleResult(
    titleText,
    messageText,
    victory
  ) {
    this.clearBattle();

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.75
      );

    overlay.setDepth(700);

    const panel =
      this.add.rectangle(
        400,
        300,
        570,
        350,
        0x0b1728
      );

    panel
      .setDepth(701)
      .setStrokeStyle(3, 0xd8b43f, 1);

    const title =
      this.add
        .text(
          400,
          190,
          titleText,
          {
            fontSize: "40px",

            color:
              victory
                ? "#68D391"
                : "#FC8181",

            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(702);

    const message =
      this.add
        .text(
          400,
          285,
          messageText,
          {
            fontSize: "19px",

            color: "#D7E5F5",

            align: "center",

            wordWrap: {
              width: 470,
            },
          }
        )
        .setOrigin(0.5);

    message.setDepth(702);

    const button =
      this.add.rectangle(
        400,
        430,
        220,
        55,
        0xd8b43f
      );

    button
      .setDepth(702)
      .setStrokeStyle(2, 0xf6d365, 1);

    button.setInteractive({
      useHandCursor: true,
    });

    const buttonText =
      this.add
        .text(
          400,
          430,
          "LANJUT",
          {
            fontSize: "19px",
            color: "#0B1728",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    buttonText.setDepth(703);

    this.battleObjects.push(
      overlay,
      panel,
      title,
      message,
      button,
      buttonText
    );

    button.on(
      "pointerdown",
      () => {
        overlay.destroy();

        panel.destroy();

        title.destroy();

        message.destroy();

        button.destroy();

        buttonText.destroy();

        this.battleObjects =
          [];

        this.currentMonster =
          null;

        this.isBattleOpen =
          false;

        this.isBattleQuestionOpen =
          false;

        this.currentBattleQuestion =
          null;

        this.playerHP =
          this.playerMaxHP;

        this.isDefending =
          false;

        this.answerLocked =
          false;

        this.battleCombo =
          0;

        this.battleComboText =
          null;

        this.skillMenuOpen =
          false;

        this.skillQuestionOpen =
          false;

        this.currentSkill =
          null;

        this.currentSkillQuestion =
          null;

        this.activeShieldTurns =
          0;

        this.battleSkillButton =
          null;

        this.hideInteractionPrompt();

        // Jika battle terakhir sekaligus menyelesaikan Forest Quest,
        // tampilkan reward quest setelah result battle ditutup.
        if (this.pendingForestQuestCompletion) {
          const completion = this.pendingForestQuestCompletion;
          this.pendingForestQuestCompletion = null;

          this.showForestQuestComplete(
            completion.title,
            completion.rewardText
          );
        } else {
          // Battle selesai biasa. Kembalikan HUD eksplorasi.
          this.setGameplayHUDVisible(true);
        }
      }
    );
  }

  clearBattle() {
    this.clearSkillQuestion();

    if (this.skillObjects) {
      this.skillObjects.forEach(
        (object) => {
          if (object) {
            object.destroy();
          }
        }
      );

      this.skillObjects = [];
    }

    // ==================================================
    // CLEANUP BATTLE CHARACTER VISUALS
    // ==================================================
    // Step 1.8 fix:
    // battlePlayerVisual dan battleMonsterVisual dibuat sebagai
    // Container terpisah dan sebelumnya belum masuk battleObjects.
    // Karena itu avatar pedang / monster bisa tertinggal di map.

    if (
      this.battlePlayerVisual &&
      this.battlePlayerVisual.active
    ) {
      this.tweens.killTweensOf(
        this.battlePlayerVisual
      );

      this.battlePlayerVisual.destroy();
    }

    if (
      this.battleMonsterVisual &&
      this.battleMonsterVisual.active
    ) {
      this.tweens.killTweensOf(
        this.battleMonsterVisual
      );

      this.battleMonsterVisual.destroy();
    }

    this.battlePlayerVisual =
      null;

    this.battleMonsterVisual =
      null;

    if (
      !this.battleObjects
    ) {
      return;
    }

    this.battleObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.battleObjects =
      [];

    this.battleLogText =
      null;

    this.battlePlayerHPText =
      null;

    this.battleMonsterHPText =
      null;

    this.battlePlayerVisual =
      null;

    this.battleMonsterVisual =
      null;

    this.battleComboText =
      null;

    this.skillObjects =
      [];

    this.skillMenuOpen =
      false;

    this.skillQuestionOpen =
      false;

    this.currentSkill =
      null;

    this.currentSkillQuestion =
      null;

    this.activeShieldTurns =
      0;

    this.battleSkillButton =
      null;
  }

  closeBattle() {
    this.clearBattleQuestion();

    this.clearBattle();

    this.currentMonster =
      null;

    this.currentBattleQuestion =
      null;

    this.isBattleQuestionOpen =
      false;

    this.answerLocked =
      false;

    this.isDefending =
      false;

    this.playerHP =
      this.playerMaxHP;

    this.isBattleOpen =
      false;

    this.battleCombo =
      0;

    this.battleMaxCombo =
      0;

    this.skillMenuOpen =
      false;

    this.skillQuestionOpen =
      false;

    this.currentSkill =
      null;

    this.currentSkillQuestion =
      null;

    this.activeShieldTurns =
      0;

    this.battleSkillButton =
      null;

    // Player kembali ke map, tampilkan HUD lagi.
    this.setGameplayHUDVisible(true);
  }

  getPlayerAttack() {
    let attack =
      this.playerBaseAttack;

    if (
      !this.playerData.equipped
    ) {
      return attack;
    }

    const weaponId =
      this.playerData.equipped
        .Weapon;

    if (!weaponId) {
      return attack;
    }

    const weapon =
      this.playerData.inventory.find(
        (item) =>
          item &&
          item.id ===
            weaponId
      );

    if (!weapon) {
      return attack;
    }

    const rarity =
      String(
        weapon.rarity ||
          "Common"
      ).toLowerCase();

    const attackBonus = {
      common: 5,
      rare: 10,
      epic: 15,
      legendary: 25,
    };

    attack +=
      attackBonus[
        rarity
      ] || 0;

    return attack;
  }

  getLevelTitle(
    level
  ) {
    const titles = {
      1: "طالب",
      2: "Nahwu Explorer",
      3: "Grammar Apprentice",
      4: "Nahwu Warrior",
      5: "Grammar Master",
    };

    return (
      titles[level] ||
      "Grammar Master"
    );
  }

  getTotalXPBonus(
    questionType = "isim"
  ) {
    let totalBonus = 0;

    if (
      !this.playerData.equipped
    ) {
      return 0;
    }

    const slots = [
      "Weapon",
      "Armor",
      "Accessory",
    ];

    slots.forEach(
      (slot) => {
        const equippedId =
          this.playerData.equipped[
            slot
          ];

        if (!equippedId) {
          return;
        }

        const item =
          this.playerData.inventory.find(
            (inventoryItem) =>
              inventoryItem &&
              inventoryItem.id ===
                equippedId
          );

        if (!item) {
          return;
        }

        const effectType =
          item.effectType;

        const effectValue =
          Number(
            item.effectValue
          ) || 0;

        if (
          effectType ===
            "isimXp" &&
          questionType ===
            "isim"
        ) {
          totalBonus +=
            effectValue;
        }

        if (
          effectType ===
          "nahwuXp"
        ) {
          totalBonus +=
            effectValue;
        }

        if (
          effectType ===
          "allXp"
        ) {
          totalBonus +=
            effectValue;
        }
      }
    );

    return totalBonus;
  }

  getTotalDefense() {
    let totalDefense = 0;

    if (
      !this.playerData.equipped
    ) {
      return 0;
    }

    const slots = [
      "Weapon",
      "Armor",
      "Accessory",
    ];

    slots.forEach(
      (slot) => {
        const equippedId =
          this.playerData.equipped[
            slot
          ];

        if (!equippedId) {
          return;
        }

        const item =
          this.playerData.inventory.find(
            (inventoryItem) =>
              inventoryItem &&
              inventoryItem.id ===
                equippedId
          );

        if (!item) {
          return;
        }

        if (
          item.effectType ===
          "defense"
        ) {
          totalDefense +=
            Number(
              item.effectValue
            ) || 0;
        }
      }
    );

    return totalDefense;
  }

  addXP(
    baseAmount,
    questionType = "isim"
  ) {
    const baseXP =
      Number(
        baseAmount
      ) || 0;

    const xpBonus =
      this.getTotalXPBonus(
        questionType
      );

    const bonusXP =
      Math.floor(
        baseXP *
          xpBonus
      );

    const finalXP =
      baseXP +
      bonusXP;

    let currentXP =
      Number(
        this.playerData.xp
      ) || 0;

    let level =
      Number(
        this.playerData.level
      ) || 1;

    let gold =
      Number(
        this.playerData.gold
      ) || 0;

    currentXP +=
      finalXP;

    let leveledUp =
      false;

    while (
      currentXP >=
      this.xpNeeded
    ) {
      currentXP -=
        this.xpNeeded;

      level +=
        1;

      gold +=
        100;

      leveledUp =
        true;
    }

    this.playerData.xp =
      currentXP;

    this.playerData.level =
      level;

    this.playerData.gold =
      gold;

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.updateHUD();

    return {
      baseXP,
      bonusXP,
      finalXP,
      xpBonus,
      leveledUp,
    };
  }

  // ==================================================
  // PIXEL PLAYER ANIMATIONS
  // ==================================================

  createPlayerAnimations() {
    const animationConfigs = [
      {
        key: "playerWalkDown",
        start: 0,
        end: 3,
      },
      {
        key: "playerWalkLeft",
        start: 4,
        end: 7,
      },
      {
        key: "playerWalkRight",
        start: 8,
        end: 11,
      },
      {
        key: "playerWalkUp",
        start: 12,
        end: 15,
      },
    ];

    animationConfigs.forEach(
      (config) => {
        if (
          this.anims.exists(
            config.key
          )
        ) {
          return;
        }

        this.anims.create({
          key: config.key,

          frames:
            this.anims.generateFrameNumbers(
              "playerWalkPixel",
              {
                start: config.start,
                end: config.end,
              }
            ),

          frameRate: 8,
          repeat: -1,
        });
      }
    );
  }

  updatePlayerPixelAnimation() {
    if (
      !this.player ||
      !this.player.body
    ) {
      return;
    }

    const vx =
      this.player.body.velocity.x;

    const vy =
      this.player.body.velocity.y;

    if (
      Math.abs(vx) < 1 &&
      Math.abs(vy) < 1
    ) {
      this.stopPlayerPixelAnimation();
      return;
    }

    if (
      Math.abs(vx) >
      Math.abs(vy)
    ) {
      if (vx < 0) {
        this.player.play(
          "playerWalkLeft",
          true
        );
      } else {
        this.player.play(
          "playerWalkRight",
          true
        );
      }

      return;
    }

    if (vy < 0) {
      this.player.play(
        "playerWalkUp",
        true
      );
    } else {
      this.player.play(
        "playerWalkDown",
        true
      );
    }
  }

  stopPlayerPixelAnimation() {
    if (!this.player) {
      return;
    }

    if (
      this.player.anims &&
      this.player.anims.isPlaying
    ) {
      this.player.anims.stop();
    }

    if (
      this.player.texture?.key ===
      "playerWalkPixel"
    ) {
      this.player.setFrame(0);
    }
  }

  // ==================================================
  // EQUIP ITEM
  // ==================================================

  equipItem(
    index
  ) {
    const item =
      this.playerData.inventory[
        index
      ];

    if (!item) {
      return;
    }

    const type =
      item.type;

    if (
      !Object.prototype.hasOwnProperty.call(
        this.playerData.equipped,
        type
      )
    ) {
      return;
    }

    this.playerData.equipped[
      type
    ] = item.id;

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.closeInventory();

    this.showInventory();
  }

  // ==================================================
  // UNEQUIP ITEM
  // ==================================================

  unequipItem(
    item
  ) {
    if (!item) {
      return;
    }

    const type =
      item.type;

    if (
      !Object.prototype.hasOwnProperty.call(
        this.playerData.equipped,
        type
      )
    ) {
      return;
    }

    if (
      this.playerData.equipped[
        type
      ] === item.id
    ) {
      this.playerData.equipped[
        type
      ] = null;
    }

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.closeInventory();

    this.showInventory();
  }

  // ==================================================
  // CHECK EQUIPPED
  // ==================================================

  isItemEquipped(
    item
  ) {
    if (!item) {
      return false;
    }

    return (
      this.playerData.equipped[
        item.type
      ] === item.id
    );
  }

  // ==================================================
  // RARITY COLOR
  // ==================================================

  getRarityColor(
    rarity
  ) {
    switch (
      String(
        rarity
      ).toLowerCase()
    ) {
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

  // ==================================================
  // TOGGLE INVENTORY
  // ==================================================

  toggleInventory() {
    if (
      this.inventoryOpen
    ) {
      this.closeInventory();
    } else {
      this.showInventory();
    }
  }

  // ==================================================
  // SHOW INVENTORY — STEP 2D.7 RPG INVENTORY
  // ==================================================

  showInventory() {
    this.inventoryOpen = true;
    this.inventoryObjects = [];

    // Inventory adalah layar fokus penuh.
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

    // --------------------------------------------------
    // OVERLAY + MAIN PANEL
    // --------------------------------------------------

    addObject(
      this.add
        .rectangle(400, 300, 800, 600, 0x050b14, 0.82)
        .setDepth(depth)
    );

    addObject(
      this.add
        .rectangle(400, 300, 720, 520, 0x0d1b2f, 0.98)
        .setDepth(depth + 1)
        .setStrokeStyle(3, 0xd4af37, 0.95)
    );

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    addObject(
      this.add
        .text(75, 58, "INVENTORY", {
          fontSize: "28px",
          color: "#FFE58A",
          fontStyle: "bold",
          stroke: "#07111F",
          strokeThickness: 3,
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

    // --------------------------------------------------
    // LEFT: EQUIPMENT
    // --------------------------------------------------

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

      if (equippedItem) {
        addObject(
          this.add
            .text(135, y + 22, String(equippedItem.rarity).toUpperCase(), {
              fontSize: "9px",
              color: this.getRarityColor(equippedItem.rarity),
              fontStyle: "bold",
            })
            .setDepth(depth + 3)
        );
      }
    });

    // TIP CARD dibuat lebih compact dan diberi napas dari slot equipment.
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
          letterSpacing: 1,
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
            wordWrap: { width: 170 },
          }
        )
        .setDepth(depth + 3)
    );

    // --------------------------------------------------
    // RIGHT: ITEM BAG
    // --------------------------------------------------

    addObject(
      this.add
        .text(310, 138, `ITEM BAG  ${this.playerData.inventory.length}`, {
          fontSize: "15px",
          color: "#FFE58A",
          fontStyle: "bold",
        })
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
      this.playerData.inventory.forEach((item, index) => {
        const y = 185 + index * 86;
        const rarityColor = this.getRarityColor(item.rarity);
        const rarityNumber = parseInt(rarityColor.replace("#", ""), 16);
        const equipped = this.isItemEquipped(item);

        const card = addObject(
          this.add
            .rectangle(515, y, 390, 72, 0x132844, 1)
            .setDepth(depth + 2)
            .setStrokeStyle(2, rarityNumber, equipped ? 1 : 0.65)
        );

        addObject(
          this.add
            .text(340, y, item.icon || "🎒", {
              fontSize: "30px",
            })
            .setOrigin(0.5)
            .setDepth(depth + 3)
        );

        addObject(
          this.add
            .text(370, y - 24, item.name, {
              fontSize: "13px",
              color: rarityColor,
              fontStyle: "bold",
            })
            .setDepth(depth + 3)
        );

        addObject(
          this.add
            .text(370, y - 4, `${item.type}  •  ${String(item.rarity).toUpperCase()}`, {
              fontSize: "9px",
              color: "#91AAC8",
              fontStyle: "bold",
            })
            .setDepth(depth + 3)
        );

        addObject(
          this.add
            .text(370, y + 15, item.description || "Tidak ada deskripsi.", {
              fontSize: "9px",
              color: "#D6E3F4",
              wordWrap: { width: 205 },
            })
            .setDepth(depth + 3)
        );

        const equipButton = addObject(
          this.add
            .rectangle(
              675,
              y,
              82,
              30,
              equipped ? 0x8b6b13 : 0x1d5f91,
              1
            )
            .setDepth(depth + 3)
            .setStrokeStyle(1, equipped ? 0xffe58a : 0x63a7d8, 0.9)
            .setInteractive({ useHandCursor: true })
        );

        const equipText = addObject(
          this.add
            .text(675, y, equipped ? "UNEQUIP" : "EQUIP", {
              fontSize: "9px",
              color: "#FFFFFF",
              fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(depth + 4)
        );

        equipButton.on("pointerover", () => {
          equipButton.setFillStyle(equipped ? 0xa47c17 : 0x2b78ad);
          card.setFillStyle(0x183251, 1);
        });

        equipButton.on("pointerout", () => {
          equipButton.setFillStyle(equipped ? 0x8b6b13 : 0x1d5f91);
          card.setFillStyle(0x132844, 1);
        });

        equipButton.on("pointerdown", () => {
          if (equipped) {
            this.unequipItem(item);
          } else {
            this.equipItem(index);
          }
        });

        // Agar text tidak menyerap klik tombol.
        equipText.disableInteractive?.();
      });
    }

    // --------------------------------------------------
    // FOOTER / CLOSE
    // --------------------------------------------------

    // Divider memisahkan isi inventory dan action footer.
    addObject(
      this.add
        .rectangle(400, 510, 650, 1, 0x31577d, 0.7)
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .text(75, 528, "Klik EQUIP untuk mengganti perlengkapan.", {
          fontSize: "9px",
          color: "#7890AD",
        })
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

    const closeText = addObject(
      this.add
        .text(660, 528, "TUTUP   [ I ]", {
          fontSize: "10px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(depth + 4)
    );

    closeButton.on("pointerover", () => {
      closeButton.setFillStyle(0x244a73, 1);
      closeText.setColor("#FFE58A");
    });

    closeButton.on("pointerout", () => {
      closeButton.setFillStyle(0x1a365d, 1);
      closeText.setColor("#FFFFFF");
    });

    closeButton.on("pointerdown", () => {
      this.closeInventory();
    });
  }

  // ==================================================
  // CLOSE INVENTORY
  // ==================================================

  closeInventory() {
    if (!this.inventoryObjects) {
      this.inventoryOpen = false;
      return;
    }

    this.inventoryObjects.forEach((object) => {
      if (object && object.active) {
        object.destroy();
      }
    });

    this.inventoryObjects = [];
    this.inventoryOpen = false;

    const shouldShowHUD = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.isQuizOpen ||
      this.forestQuestDialogOpen ||
      this.forestQuestCompleteOpen
    );

    this.setGameplayHUDVisible(shouldShowHUD);
  }


  // ==================================================
  // GAMEPLAY HUD VISIBILITY
  // ==================================================

  setGameplayHUDVisible(visible) {
    const hudObjects = [
      this.hudLeftPanel,
      this.levelText,
      this.xpText,
      this.xpBarBackground,
      this.xpBarFill,
      this.hudGoldPanel,
      this.goldText,
    ];

    hudObjects.forEach((object) => {
      if (object && object.active) {
        object.setVisible(visible);
      }
    });

    if (Array.isArray(this.forestQuestObjects)) {
      this.forestQuestObjects.forEach((object) => {
        if (object && object.active) {
          object.setVisible(visible);
        }
      });
    }
  }

  // ==================================================
  // HUD — STEP 2D.1
  // ==================================================

  createHUD() {
    const hudDepth = 2000;

    this.hudLeftPanel = this.add
      .rectangle(14, 12, 292, 88, 0x10233f, 0.9)
      .setOrigin(0, 0)
      .setDepth(hudDepth)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xd4af37, 0.75);

    this.levelText = this.add
      .text(28, 23, "", {
        fontSize: "17px",
        color: "#FFF7D6",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 3,
      })
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);

    this.xpText = this.add
      .text(28, 51, "", {
        fontSize: "12px",
        color: "#DCEBFF",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 2,
      })
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);

    this.xpBarBackground = this.add
      .rectangle(28, 78, 250, 12, 0x07111f, 0.95)
      .setOrigin(0, 0.5)
      .setDepth(hudDepth + 1)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x7297c7, 0.75);

    this.xpBarFill = this.add
      .rectangle(30, 78, 246, 8, 0x5fb3ff, 1)
      .setOrigin(0, 0.5)
      .setDepth(hudDepth + 2)
      .setScrollFactor(0);

    this.hudGoldPanel = this.add
      .rectangle(626, 12, 160, 48, 0x10233f, 0.9)
      .setOrigin(0, 0)
      .setDepth(hudDepth)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xd4af37, 0.75);

    this.goldText = this.add
      .text(706, 36, "", {
        fontSize: "16px",
        color: "#FFE58A",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);
  }

  updateHUD() {
    if (!this.playerData || !this.levelText) {
      return;
    }

    const level = Number(this.playerData.level) || 1;
    const xp = Number(this.playerData.xp) || 0;
    const gold = Number(this.playerData.gold) || 0;

    this.levelText.setText(`LVL ${level}  •  ${this.getLevelTitle(level)}`);
    this.goldText.setText(`GOLD  ${gold}`);
    this.xpText.setText(`XP  ${xp} / ${this.xpNeeded}`);

    const percentage = Phaser.Math.Clamp(xp / this.xpNeeded, 0, 1);

    this.xpBarFill.setDisplaySize(
      Math.max(0, 246 * percentage),
      8
    );
  }
}

export default ForestScene;
