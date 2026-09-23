import Phaser from "phaser";
import VisualFoundation from "./VisualFoundation";

import playerIdleAsset from "../../assets/player/player.png";
import playerWalkAsset from "../../assets/player/player_walk.png";

import grammarMasterAsset from "../../assets/npc/grammar_master.png";

import nahwuSlimeAsset from "../../assets/monsters/nahwu_slime.png";
import grammarGoblinAsset from "../../assets/monsters/grammar_goblin.png";
import irabGolemAsset from "../../assets/monsters/irab_golem.png";

import chestClosedAsset from "../../assets/objects/chest_closed.png";
import chestOpenAsset from "../../assets/objects/chest_open.png";
import treeAsset from "../../assets/objects/tree_01.png";
import forestGateAsset from "../../assets/objects/forest_gate.png";

import nahwuHouseAsset from "../../assets/buildings/nahwu_house.png";
import grammarHouseAsset from "../../assets/buildings/grammar_house.png";

import grassTileAsset from "../../assets/tiles/grass_tile.png";
import pathTileAsset from "../../assets/tiles/path_tile.png";

import NPC from "../objects/NPC";
import Monster from "../objects/Monster";

import quests from "../data/quests";
import questions from "../data/questions";
import items from "../data/items";
import monsters from "../data/monsters";
import battleQuestions from "../data/battleQuestions";
import skills from "../data/skills";
import skillQuestions from "../data/skillQuestions";
import {
  getEquipmentAttackBonus,
  getEquipmentDefenseBonus,
  getEquipmentXPBonus,
} from "../data/equipmentStats";
import {
  getShopEntries,
  SHOP_TIER_INFO,
} from "../data/shopCatalog";
import {
  getGameProgress,
  markMonsterDefeated,
  markQuestCompleted,
  markChestOpened,
  getAreaRequirementStatus,
  isAreaReadyToComplete,
  completeAreaAndUnlockNext,
  setCurrentArea,
  isShopItemPurchased,
  markShopItemPurchased,
} from "../data/progression";

class VillageScene extends Phaser.Scene {
  constructor() {
    super("VillageScene");
  }

  // ==================================================
  // PRELOAD PIXEL ASSETS
  // ==================================================

  preload() {
    this.load.image(
      "playerIdlePixel",
      playerIdleAsset
    );

    this.load.spritesheet(
      "playerWalkPixel",
      playerWalkAsset,
      {
        frameWidth: 320,
        frameHeight: 320,
      }
    );

    this.load.image(
      "grammarMasterPixel",
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
      "grassTilePixel",
      grassTileAsset
    );

    this.load.image(
      "pathTilePixel",
      pathTileAsset
    );

    this.load.image(
      "nahwuHousePixel",
      nahwuHouseAsset
    );

    this.load.image(
      "grammarHousePixel",
      grammarHouseAsset
    );

    this.load.image(
      "forestGatePixel",
      forestGateAsset
    );
  }

  // ==================================================
  // CREATE
  // ==================================================

  create() {
    this.visualFoundation = new VisualFoundation(this);

    // ==================================================
    // STEP 2E.2 — VILLAGE PROGRESSION + CHEST REDISTRIBUTION
    // ==================================================
    // Satu state progression dipakai untuk seluruh dunia Tarkeeb:
    // Nahwu Village -> Forest -> Fi'il Desert -> Castle.
    // Pada step ini kita baru menyiapkan fondasinya; requirement gate,
    // redistribusi chest, dan unlock chapter akan dipasang bertahap.
    this.gameProgress = getGameProgress(this);
    this.gameProgress = setCurrentArea(
      this,
      "nahwuVillage"
    );

    // Banner unlock hanya muncul ketika Chapter 1 baru saja selesai.
    this.pendingForestUnlockNotice = false;

    // ==================================================
    // PLAYER DATA
    // ==================================================

    let savedData =
      this.registry.get("playerData");

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

    savedData.level =
      Number(savedData.level) || 1;

    savedData.xp =
      Number(savedData.xp) || 0;

    savedData.gold =
      Number(savedData.gold) || 0;

    if (
      !Array.isArray(
        savedData.inventory
      )
    ) {
      savedData.inventory = [];
    }

    // REMOVE DUPLICATE EQUIPMENT
    // Setiap equipment hanya boleh muncul sekali berdasarkan ID.
    savedData.inventory = savedData.inventory.filter(
      (item, index, array) =>
        item &&
        item.id &&
        index ===
          array.findIndex(
            (other) =>
              other &&
              other.id === item.id
          )
    );

    if (!savedData.equipped) {
      savedData.equipped = {
        Weapon: null,
        Armor: null,
        Accessory: null,
      };
    }

    if (
      savedData.equipped.Weapon ===
      undefined
    ) {
      savedData.equipped.Weapon = null;
    }

    if (
      savedData.equipped.Armor ===
      undefined
    ) {
      savedData.equipped.Armor = null;
    }

    if (
      savedData.equipped.Accessory ===
      undefined
    ) {
      savedData.equipped.Accessory = null;
    }

    this.playerData =
      savedData;

    this.registry.set(
      "playerData",
      this.playerData
    );

    // ==================================================
    // XP
    // ==================================================

    this.xpNeeded = 200;

    // ==================================================
    // QUEST
    // ==================================================

    this.activeQuest =
      this.registry.get(
        "activeQuest"
      ) || null;

    this.questObjects = [];

    this.pendingQuestCompletion =
      false;

    // ==================================================
    // GAME STATE
    // ==================================================

    this.isQuizOpen = false;

    this.isBattleOpen = false;

    this.isBattleQuestionOpen =
      false;

    this.answerLocked = false;

    this.inventoryOpen = false;

    // Step 2G.2 — Merchant / Shop UI state.
    this.shopOpen = false;
    this.shopObjects = [];
    this.shopTierPage = 1;
    this.shopFeedbackText = null;

    this.npcDialogOpen = false;

    this.questCompleteOpen =
      false;

    // Step 2E.4 — modal feedback ketika Forest masih terkunci.
    this.forestGateInfoOpen = false;
    this.forestGateInfoObjects = [];

    this.isTransitioning =
      false;

    // ==================================================
    // OBJECT ARRAYS
    // ==================================================

    this.quizObjects = [];

    this.inventoryObjects = [];

    this.npcDialogObjects = [];

    this.questCompleteObjects =
      [];

    this.battleObjects = [];

    this.battleQuestionObjects =
      [];

    // ==================================================
    // CURRENT OBJECTS
    // ==================================================

    this.currentQuestion = null;

    this.currentChest = null;

    this.currentMonster = null;

    this.currentBattleQuestion =
      null;

    // ==================================================
    // SKILL SYSTEM
    // ==================================================

    this.skillMenuOpen = false;

    this.skillQuestionOpen = false;

    this.skillQuestionObjects = [];

    this.currentSkill = null;

    this.currentSkillQuestion = null;

    this.activeShieldTurns = 0;

    this.battleSkillButton = null;

    // ==================================================
    // BATTLE STATS
    // ==================================================

    this.playerMaxHP = 100;

    this.playerHP = 100;

    this.playerBaseAttack = 20;

    this.isDefending = false;

    // ==================================================
    // COMBO
    // ==================================================

    this.battleCombo = 0;

    this.battleMaxCombo = 0;

    this.battleComboText = null;

    // ==================================================
    // BATTLE UI
    // ==================================================

    this.battleLogText = null;

    this.battlePlayerHPText =
      null;

    this.battleMonsterHPText =
      null;

    // ==================================================
    // WORLD
    // ==================================================

    this.createWorld();

    this.createForestGate();

    // ==================================================
    // PLAYER
    // ==================================================

    this.createPlayer();

    // ==================================================
    // NPC
    // ==================================================

    this.grammarMaster =
      new NPC(
        this,
        220,
        420,
        "Grammar Master"
      );

    this.applyNPCPixelVisual(
      this.grammarMaster,
      "grammarMasterPixel"
    );

    // ==================================================
    // MERCHANT — STEP 2G.2
    // ==================================================

    this.merchant =
      new NPC(
        this,
        112,
        360,
        "Pedagang Tarkeeb"
      );

    this.applyMerchantPixelVisual(
      this.merchant,
      "grammarMasterPixel"
    );

    // ==================================================
    // INPUT
    // ==================================================

    this.input.topOnly = true;

    // ==================================================
    // HUD
    // ==================================================

    this.createHUD();

    // ==================================================
    // COLLISION
    // ==================================================

    this.physics.add.collider(
      this.player,
      this.obstacles
    );

    // ==================================================
    // HUD UPDATE
    // ==================================================

    this.updateHUD();

    // ==================================================
    // QUEST HUD
    // ==================================================

    if (this.activeQuest) {
      this.showQuestHUD();
    }

    // ==================================================
    // SCENE ENTRANCE CINEMATIC
    // ==================================================

    this.visualFoundation.playSceneEntrance(
      "NAHWU VILLAGE",
      "Chapter I • Awal perjalanan seorang Grammar Apprentice"
    );
  }

  // ==================================================
  // CREATE WORLD
  // ==================================================

  createWorld() {
    // ==================================================
    // BACKGROUND
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

    // ==================================================
    // ROADS
    // ==================================================

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

    this.add
      .tileSprite(
        400,
        300,
        800,
        96,
        "pathTilePixel"
      )
      .setDepth(-10)
      .setTileScale(0.62, 0.62);

    // ==================================================
    // OBSTACLES
    // ==================================================

    this.obstacles =
      this.physics.add.staticGroup();

    // ==================================================
    // TITLE
    // ==================================================

    this.add
      .text(
        400,
        178,
        "NAHWU VILLAGE",
        {
          fontSize: "32px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    // ==================================================
    // HOUSES
    // ==================================================

    this.createHouse(
      180,
      205,
      "Nahwu House",
      "nahwuHousePixel"
    );

    this.createHouse(
      620,
      205,
      "Grammar House",
      "grammarHousePixel"
    );

    // ==================================================
    // TREES
    // ==================================================

    this.createTree(82, 112);

    this.createTree(718, 112);

    this.createTree(84, 500);

    this.createTree(718, 500);

    this.createTree(152, 520);

    this.createTree(648, 520);

    // ==================================================
    // CHESTS
    // ==================================================

    this.chests = [];

    // Step 2E.2 — Village hanya menyisakan satu chest tutorial.
    // Dua equipment yang lebih kuat dipindahkan ke Forest.
    this.createChest(
      285,
      500,
      items.swordOfIsim,
      "village_sword_chest"
    );

    // ==================================================
    // MONSTERS
    // ==================================================

    this.monsters = [];

    // --------------------------------------------------
    // NAHWU SLIME
    // --------------------------------------------------

    const defeatedVillageMonsters =
      this.gameProgress?.nahwuVillage?.defeatedMonsters || [];

    const spawnVillageMonster = (
      x,
      y,
      monsterData
    ) => {
      if (
        defeatedVillageMonsters.includes(
          monsterData.id
        )
      ) {
        return null;
      }

      const monster = new Monster(
        this,
        x,
        y,
        monsterData
      );

      this.monsters.push(monster);
      return monster;
    };

    spawnVillageMonster(
      635,
      500,
      monsters.nahwuSlime
    );

    // --------------------------------------------------
    // GRAMMAR GOBLIN
    // --------------------------------------------------

    spawnVillageMonster(
      165,
      485,
      monsters.grammarGoblin
    );

    // --------------------------------------------------
    // I'RAB GOLEM
    // --------------------------------------------------

    spawnVillageMonster(
      555,
      165,
      monsters.irabGolem
    );

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
  }

  // ==================================================
  // CREATE PLAYER
  // ==================================================

  createPlayer() {
    this.createPlayerAnimations();

    this.player =
      this.physics.add.sprite(
        400,
        350,
        "playerWalkPixel",
        0
      );

    this.player
      .setDisplaySize(
        76,
        76
      )
      .setDepth(30);

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

    // ==================================================
    // KEYBOARD
    // ==================================================

    this.keys =
      this.input.keyboard.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
      });

    this.cursors =
      this.input.keyboard.createCursorKeys();

    // ==================================================
    // E
    // ==================================================

    this.interactKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

    // ==================================================
    // FOREST ENTRY KEY
    // ==================================================

    this.forestEntryHandler = (event) => {
      // E juga berfungsi untuk menutup panel requirement gate.
      if (this.forestGateInfoOpen) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.closeForestGateRequirements();
        return;
      }

      if (
        this.isBattleOpen ||
        this.isQuizOpen ||
        this.inventoryOpen ||
        this.npcDialogOpen ||
        this.questCompleteOpen ||
        !this.forestGate ||
        !this.player
      ) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.forestGate.x,
        this.forestGate.y
      );

      if (distance < 90) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.enterForest();
      }
    };

    this.input.keyboard.on(
      "keydown-E",
      this.forestEntryHandler
    );

    this.events.once("shutdown", () => {
      this.input.keyboard.off(
        "keydown-E",
        this.forestEntryHandler
      );
    });

    // ==================================================
    // I
    // ==================================================

    this.inventoryKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.I
      );

    this.shopCloseKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
      );

    // ==================================================
    // PLAYER LABEL
    // ==================================================

    this.playerLabel =
      this.add
        .text(
          this.player.x,
          this.player.y + 35,
          "PLAYER",
          {
            fontSize: "14px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setVisible(false);

    // ==================================================
    // INTERACTION PROMPT UI
    // ==================================================

    this.createInteractionPromptUI();

    this.visualFoundation.animatePlayer(this.player);
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
    // Ini mencegah prompt [ E ] tetap terlihat setelah dialog/quiz/battle dibuka.
    if (
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.shopOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.forestGateInfoOpen ||
      this.isBattleOpen ||
      this.isBattleQuestionOpen
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
  // UPDATE
  // ==================================================

  update() {
    if (!this.player) {
      return;
    }

    this.visualFoundation.syncPlayerVisuals(this.player);

    if (this.isTransitioning) {
      if (this.player.body) {
        this.player.body.setVelocity(
          0,
          0
        );
      }

      return;
    }

    // ==================================================
    // SHOP CLOSE KEY
    // ==================================================

    if (
      this.shopOpen &&
      Phaser.Input.Keyboard.JustDown(
        this.shopCloseKey
      )
    ) {
      this.closeShop();
      return;
    }

    // ==================================================
    // INVENTORY KEY
    // ==================================================

    if (
      Phaser.Input.Keyboard.JustDown(
        this.inventoryKey
      )
    ) {
      if (
        !this.isQuizOpen &&
        !this.shopOpen &&
        !this.npcDialogOpen &&
        !this.questCompleteOpen &&
        !this.forestGateInfoOpen &&
        !this.isBattleOpen &&
        !this.isBattleQuestionOpen
      ) {
        this.toggleInventory();
      }

      return;
    }

    // ==================================================
    // STOP GAMEPLAY
    // ==================================================

    if (
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.shopOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.isBattleOpen ||
      this.isBattleQuestionOpen
    ) {
      this.hideInteractionPrompt();

      this.player.body.setVelocity(
        0,
        0
      );

      this.stopPlayerPixelAnimation();

      return;
    }

    // ==================================================
    // RESET INTERACTION
    // ==================================================

    this.hideInteractionPrompt();

    this.player.body.setVelocity(
      0,
      0
    );

    // ==================================================
    // MOVEMENT
    // ==================================================

    if (
      this.keys.left.isDown ||
      this.cursors.left.isDown
    ) {
      this.player.body.setVelocityX(
        -this.playerSpeed
      );
    }

    if (
      this.keys.right.isDown ||
      this.cursors.right.isDown
    ) {
      this.player.body.setVelocityX(
        this.playerSpeed
      );
    }

    if (
      this.keys.up.isDown ||
      this.cursors.up.isDown
    ) {
      this.player.body.setVelocityY(
        -this.playerSpeed
      );
    }

    if (
      this.keys.down.isDown ||
      this.cursors.down.isDown
    ) {
      this.player.body.setVelocityY(
        this.playerSpeed
      );
    }

    // ==================================================
    // DIAGONAL
    // ==================================================

    if (
      this.player.body.velocity.length() >
      0
    ) {
      this.player.body.velocity
        .normalize()
        .scale(
          this.playerSpeed
        );
    }

    this.updatePlayerPixelAnimation();

    // ==================================================
    // PLAYER LABEL
    // ==================================================

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y + 35
    );

    // ==================================================
    // NPC
    // ==================================================

    if (this.grammarMaster) {
      this.grammarMaster.checkDistance(
        this.player
      );

      // Step 2D.2 memakai satu prompt global di bawah layar,
      // jadi bubble lama di atas NPC disembunyikan.
      if (this.grammarMaster.interactionText) {
        this.grammarMaster.interactionText.setVisible(false);
      }
    }

    if (this.merchant) {
      this.merchant.checkDistance(
        this.player
      );

      if (this.merchant.interactionText) {
        this.merchant.interactionText.setVisible(false);
      }
    }

    // ==================================================
    // MONSTERS
    // ==================================================

    this.monsters.forEach(
      (monster) => {
        if (!monster) {
          return;
        }

        if (
          !monster.isDead()
        ) {
          monster.update(
            this.player
          );
        }

        this.visualFoundation.syncMonsterVisuals(
          monster.body
        );
      }
    );

    // ==================================================
    // FIND NEAREST CHEST
    // ==================================================

    let nearestChest = null;

    let nearestChestDistance =
      Infinity;

    this.chests.forEach(
      (chest) => {
        if (chest.opened) {
          return;
        }

        const distance =
          Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            chest.x,
            chest.y
          );

        if (
          distance <
          nearestChestDistance
        ) {
          nearestChestDistance =
            distance;

          nearestChest =
            chest;
        }
      }
    );

    // ==================================================
    // CHEST VISUAL FEEDBACK
    // ==================================================

    this.chests.forEach(
      (chest) => {
        const isNearby =
          chest === nearestChest &&
          nearestChestDistance < 80 &&
          !chest.opened;

        this.visualFoundation.setChestNearby(
          chest,
          isNearby
        );
      }
    );

    // ==================================================
    // CHEST INTERACTION
    // ==================================================

    if (
      nearestChest &&
      nearestChestDistance < 80
    ) {
      this.showInteractionPrompt(
        "Buka chest"
      );

      if (
        Phaser.Input.Keyboard.JustDown(
          this.interactKey
        )
      ) {
        this.openChest(
          nearestChest
        );

        return;
      }
    }

    // ==================================================
    // MONSTER INTERACTION
    // ==================================================

    const nearestMonster =
      this.getNearestMonster();

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

      if (
        Phaser.Input.Keyboard.JustDown(
          this.interactKey
        )
      ) {
        this.startBattle(
          nearestMonster
        );

        return;
      }
    }

    // ==================================================
    // NPC INTERACTION
    // ==================================================

    if (
      this.grammarMaster &&
      (
        !nearestChest ||
        nearestChestDistance >= 80
      ) &&
      (
        !nearestMonster ||
        !nearestMonster.isNearby
      )
    ) {
      if (this.grammarMaster.isNearby) {
        this.showInteractionPrompt(
          "Bicara dengan Grammar Master"
        );

        if (
          Phaser.Input.Keyboard.JustDown(
            this.interactKey
          )
        ) {
          this.grammarMaster.talk();
        }
      }
    }

    // ==================================================
    // MERCHANT INTERACTION — STEP 2G.2
    // ==================================================

    if (
      this.merchant &&
      this.merchant.isNearby &&
      (
        !nearestChest ||
        nearestChestDistance >= 80
      ) &&
      (
        !nearestMonster ||
        !nearestMonster.isNearby
      ) &&
      (
        !this.grammarMaster ||
        !this.grammarMaster.isNearby
      )
    ) {
      this.showInteractionPrompt(
        "Buka Tarkeeb Equipment Shop"
      );

      if (
        Phaser.Input.Keyboard.JustDown(
          this.interactKey
        )
      ) {
        this.openShop();
        return;
      }
    }

    // ==================================================
    // FOREST GATE — STEP 2E.3 LOCK / UNLOCK
    // ==================================================

    if (this.forestGate) {
      const gateStatus =
        this.refreshForestGateState();

      const gateDistance =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.forestGate.x,
          this.forestGate.y
        );

      if (gateDistance < 90) {
        // Prompt floating lama tidak dipakai lagi;
        // semua interaksi memakai panel global yang konsisten.
        this.forestGatePrompt.setVisible(false);

        this.showInteractionPrompt(
          gateStatus.prompt
        );
      } else {
        this.forestGatePrompt.setVisible(false);
      }
    }

  }

  // ==================================================
  // ENTER FOREST
  // ==================================================

  enterForest() {
    if (
      this.isTransitioning ||
      this.isBattleOpen ||
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.shopOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.forestGateInfoOpen
    ) {
      return;
    }

    // Forest hanya dapat dimasuki setelah Chapter 1 benar-benar selesai.
    const gateStatus =
      this.refreshForestGateState();

    if (!gateStatus.unlocked) {
      this.hideInteractionPrompt();
      this.showForestGateRequirements();

      // Feedback kecil ketika mencoba membuka gate yang masih terkunci.
      this.tweens.killTweensOf(
        this.forestGate
      );

      this.tweens.add({
        targets: this.forestGate,
        x: { from: 397, to: 403 },
        duration: 55,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          if (this.forestGate) {
            this.forestGate.x = 400;
          }
        },
      });

      return;
    }

    this.isTransitioning =
      true;

    if (
      this.player &&
      this.player.body
    ) {
      this.player.body.setVelocity(
        0,
        0
      );
    }

    this.forestGatePrompt.setVisible(
      false
    );

    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);

    this.visualFoundation.playSceneTransition({
      title: "FOREST OF ISIM",
      subtitle:
        "Chapter II • Hutan Para Penjaga Isim",
      onComplete: () => {
        this.scene.start(
          "ForestScene"
        );
      },
    });
  }

  // ==================================================
  // FOREST GATE REQUIREMENT PANEL — STEP 2E.4
  // ==================================================

  showForestGateRequirements() {
    if (this.forestGateInfoOpen) {
      return;
    }

    this.gameProgress = getGameProgress(this);

    const status = getAreaRequirementStatus(
      this,
      "nahwuVillage"
    );

    if (status.nextAreaUnlocked) {
      return;
    }

    this.forestGateInfoOpen = true;
    this.forestGateInfoObjects = [];
    this.setGameplayHUDVisible(false);
    this.hideInteractionPrompt();

    if (this.player?.body) {
      this.player.body.setVelocity(0, 0);
    }

    this.stopPlayerPixelAnimation();

    const depth = 3200;

    const overlay = this.add
      .rectangle(400, 300, 800, 600, 0x06101b, 0.74)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive();

    const panel = this.add
      .rectangle(400, 300, 520, 392, 0x10233f, 0.99)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setStrokeStyle(3, 0xd4af37, 0.95);

    const accent = this.add
      .rectangle(400, 111, 516, 8, 0xd4af37, 1)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const chapter = this.add
      .text(400, 132, "CHAPTER I • NAHWU VILLAGE", {
        fontSize: "13px",
        color: "#FFE58A",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const title = this.add
      .text(400, 164, "FOREST OF ISIM MASIH TERKUNCI", {
        fontSize: "23px",
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const subtitle = this.add
      .text(400, 195, "Selesaikan ujian Chapter I untuk membuka Chapter II.", {
        fontSize: "13px",
        color: "#C9D8EC",
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const divider = this.add
      .rectangle(400, 220, 450, 2, 0x456381, 0.8)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const defeated = new Set(
      this.gameProgress?.nahwuVillage?.defeatedMonsters || []
    );

    const requirements = [
      {
        label: "Quest Grammar Master",
        done: status.questCompleted,
        detail: status.questCompleted ? "Selesai" : "Belum selesai",
      },
      {
        label: "Nahwu Slime",
        done: defeated.has("nahwuSlime"),
        detail: defeated.has("nahwuSlime") ? "Dikalahkan" : "Belum dikalahkan",
      },
      {
        label: "Grammar Goblin",
        done: defeated.has("grammarGoblin"),
        detail: defeated.has("grammarGoblin") ? "Dikalahkan" : "Belum dikalahkan",
      },
      {
        label: "I'rab Golem",
        done: defeated.has("irabGolem"),
        detail: defeated.has("irabGolem") ? "Dikalahkan" : "Belum dikalahkan",
      },
    ];

    const rows = requirements.map((requirement, index) => {
      const y = 252 + index * 42;
      const markColor = requirement.done ? "#8EF0AD" : "#FF9B9B";
      const mark = requirement.done ? "✓" : "○";

      const markText = this.add
        .text(198, y, mark, {
          fontSize: "20px",
          color: markColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(depth + 2)
        .setScrollFactor(0);

      const label = this.add
        .text(222, y - 9, requirement.label, {
          fontSize: "14px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setDepth(depth + 2)
        .setScrollFactor(0);

      const detail = this.add
        .text(222, y + 10, requirement.detail, {
          fontSize: "11px",
          color: requirement.done ? "#AEEFC1" : "#AFC1D8",
        })
        .setDepth(depth + 2)
        .setScrollFactor(0);

      return [markText, label, detail];
    });

    const progressText = this.add
      .text(400, 421, `Monster ${status.defeatedCount}/${status.requiredCount} dikalahkan`, {
        fontSize: "12px",
        color: "#FFE58A",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const closeButton = this.add
      .rectangle(400, 458, 170, 42, 0xd4af37, 1)
      .setDepth(depth + 2)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xffe58a, 0.8)
      .setInteractive({ useHandCursor: true });

    const closeText = this.add
      .text(400, 458, "TUTUP  [ E ]", {
        fontSize: "13px",
        color: "#10233F",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depth + 3)
      .setScrollFactor(0);

    closeButton.on("pointerover", () => {
      closeButton.setFillStyle(0xf0c94b);
    });

    closeButton.on("pointerout", () => {
      closeButton.setFillStyle(0xd4af37);
    });

    closeButton.on("pointerdown", () => {
      this.closeForestGateRequirements();
    });

    panel.setScale(0.96);
    panel.setAlpha(0);

    this.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 170,
      ease: "Back.easeOut",
    });

    this.forestGateInfoObjects.push(
      overlay,
      panel,
      accent,
      chapter,
      title,
      subtitle,
      divider,
      ...rows.flat(),
      progressText,
      closeButton,
      closeText
    );
  }

  closeForestGateRequirements() {
    if (!this.forestGateInfoOpen) {
      return;
    }

    this.forestGateInfoObjects.forEach((object) => {
      if (object?.active) {
        object.destroy();
      }
    });

    this.forestGateInfoObjects = [];
    this.forestGateInfoOpen = false;

    const shouldShowHUD = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.isTransitioning
    );

    this.setGameplayHUDVisible(shouldShowHUD);
  }

  // ==================================================
  // CREATE FOREST GATE
  // ==================================================

  createForestGate() {
    this.forestGate =
      this.add.image(
        400,
        58,
        "forestGatePixel"
      );

    this.forestGate
      .setDisplaySize(
        104,
        128
      )
      .setDepth(12);

    // Area interaksi/collision transparan agar
    // tampilan gate tetap memakai PNG pixel art.
    this.forestGateCollider =
      this.add.rectangle(
        400,
        76,
        66,
        58,
        0xffffff,
        0
      );

    this.physics.add.existing(
      this.forestGateCollider,
      true
    );

    this.obstacles.add(
      this.forestGateCollider
    );

    this.forestGateText =
      this.add
        .text(
          400,
          128,
          "🌳 FOREST",
          {
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor:
              "#1A365D",
            padding: 5,
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(13);

    this.forestGatePrompt =
      this.add
        .text(
          400,
          152,
          "[ E ] Masuk Forest",
          {
            fontSize: "15px",
            color: "#ffffff",
            backgroundColor:
              "#1A365D",
            padding: 7,
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(13);

    this.forestGatePrompt.setVisible(
      false
    );

    this.refreshForestGateState();
  }

  // ==================================================
  // FOREST GATE PROGRESSION STATE
  // ==================================================

  getForestGateStatus() {
    this.gameProgress = getGameProgress(this);

    const status = getAreaRequirementStatus(
      this,
      "nahwuVillage"
    );

    const forestUnlocked =
      this.gameProgress?.forest?.unlocked === true;

    if (forestUnlocked) {
      return {
        unlocked: true,
        title: "🌳 FOREST • OPEN",
        prompt: "Masuk Forest of Isim",
      };
    }

    // Belum mengambil / menyelesaikan quest utama Village.
    if (
      !status.questCompleted &&
      status.defeatedCount === 0 &&
      !this.activeQuest
    ) {
      return {
        unlocked: false,
        title: "🔒 FOREST • LOCKED",
        prompt: "Forest terkunci • Ambil quest Grammar Master",
      };
    }

    // Selama quest berjalan, tampilkan progres monster langsung di gate.
    if (!status.monstersCompleted) {
      return {
        unlocked: false,
        title: `🔒 FOREST • ${status.defeatedCount}/${status.requiredCount}`,
        prompt:
          `Forest terkunci • Monster ${status.defeatedCount}/${status.requiredCount}`,
      };
    }

    // Safety case: semua monster sudah kalah tetapi quest belum diselesaikan.
    if (!status.questCompleted) {
      return {
        unlocked: false,
        title: `🔒 FOREST • ${status.defeatedCount}/${status.requiredCount}`,
        prompt: "Forest terkunci • Selesaikan quest Grammar Master",
      };
    }

    return {
      unlocked: false,
      title: `🔒 FOREST • ${status.defeatedCount}/${status.requiredCount}`,
      prompt: "Forest terkunci • Selesaikan Chapter 1",
    };
  }

  refreshForestGateState() {
    const status =
      this.getForestGateStatus();

    if (this.forestGate) {
      if (status.unlocked) {
        this.forestGate.clearTint();
      } else {
        this.forestGate.setTint(0x8a929c);
      }
    }

    if (this.forestGateText) {
      this.forestGateText.setText(
        status.title
      );

      this.forestGateText.setBackgroundColor(
        status.unlocked
          ? "#1A365D"
          : "#4A2630"
      );
    }

    return status;
  }

  // ==================================================
  // GET NEAREST MONSTER
  // ==================================================

  getNearestMonster() {
    let nearestMonster = null;

    let nearestDistance =
      Infinity;

    this.monsters.forEach(
      (monster) => {
        if (
          !monster ||
          monster.isDead()
        ) {
          return;
        }

        const distance =
          Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            monster.x,
            monster.y
          );

        if (
          distance <
          nearestDistance
        ) {
          nearestDistance =
            distance;

          nearestMonster =
            monster;
        }
      }
    );

    return nearestMonster;
  }

  // ==================================================
  // START BATTLE
  // ==================================================

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

  // ==================================================
  // OPEN BATTLE QUESTION
  // ==================================================

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

  // ==================================================
  // GET RANDOM BATTLE QUESTION
  // ==================================================

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

  // ==================================================
  // SHOW BATTLE QUESTION
  // ==================================================

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

  // ==================================================
  // ANSWER BATTLE QUESTION
  // ==================================================

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

  // ==================================================
  // SKILL MENU
  // ==================================================

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

  // ==================================================
  // CLOSE SKILL MENU
  // ==================================================

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

  // ==================================================
  // OPEN SKILL QUESTION
  // ==================================================

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

  // ==================================================
  // SHOW SKILL QUESTION
  // ==================================================

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

  // ==================================================
  // ANSWER SKILL QUESTION
  // ==================================================

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

  // ==================================================
  // EXECUTE POWER STRIKE
  // ==================================================

  executePowerStrike(
    attackButton,
    skillButton,
    defendButton,
    updateBattleUI
  ) {
    // Power Strike harus terasa lebih kuat daripada serangan normal.
    // Sebelumnya skill hanya menghitung ATK - DEF, sementara serangan
    // normal juga mendapat bonus damage dari soal (20/30/45).
    // Akibatnya skill justru bisa lebih lemah.
    const baseDamage =
      Math.max(
        1,
        this.getPlayerAttack() -
          this.currentMonster.defense +
          (skills.powerStrike.bonusDamage || 30)
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

  // ==================================================
  // EXECUTE GRAMMAR SHIELD
  // ==================================================

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

  // ==================================================
  // CLEAR SKILL QUESTION
  // ==================================================

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

  // ==================================================
  // DAMAGE POPUP
  // ==================================================

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

  // ==================================================
  // CLEAR BATTLE QUESTION
  // ==================================================

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

  // ==================================================
  // MONSTER ATTACK
  // ==================================================

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

  // ==================================================
  // HANDLE VICTORY
  // ==================================================

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

        // Simpan progress monster Chapter 1 sebelum object dihancurkan.
        this.gameProgress = markMonsterDefeated(
          this,
          "nahwuVillage",
          monster.id
        );

        // Quest Grammar Master mengikuti jumlah monster unik
        // yang sudah dikalahkan, bukan chest/quiz.
        this.pendingQuestCompletion =
          this.syncVillageMonsterQuestProgress();

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

  // ==================================================
  // GET MONSTER REWARD
  // ==================================================

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

  // ==================================================
  // HANDLE DEFEAT
  // ==================================================

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

  // ==================================================
  // SHOW BATTLE RESULT
  // ==================================================

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

        // Jika monster terakhir menyelesaikan quest Grammar Master,
        // tampilkan reward quest setelah layar Victory ditutup.
        if (
          this.pendingQuestCompletion
        ) {
          this.pendingQuestCompletion = false;
          this.completeQuest();
          return;
        }

        // Battle selesai. Kembalikan HUD eksplorasi.
        this.setGameplayHUDVisible(true);
      }
    );
  }

  // ==================================================
  // CLEAR BATTLE
  // ==================================================

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

  // ==================================================
  // CLOSE BATTLE
  // ==================================================

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

  // ==================================================
  // PLAYER ATTACK
  // ==================================================

  getPlayerAttack() {
    return (
      this.playerBaseAttack +
      getEquipmentAttackBonus(
        this.playerData
      )
    );
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

    if (Array.isArray(this.questObjects)) {
      this.questObjects.forEach((object) => {
        if (object && object.active) {
          object.setVisible(visible);
        }
      });
    }
  }

  // ==================================================
  // CREATE HUD — STEP 2D.1
  // ==================================================

  createHUD() {
    const hudDepth = 2000;

    // --------------------------------------------------
    // LEFT STATUS CARD
    // --------------------------------------------------

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

    // --------------------------------------------------
    // GOLD CARD
    // --------------------------------------------------

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

  // ==================================================
  // UPDATE HUD
  // ==================================================

  updateHUD() {
    const level = Number(this.playerData.level) || 1;
    const xp = Number(this.playerData.xp) || 0;
    const gold = Number(this.playerData.gold) || 0;

    this.playerData.level = level;
    this.playerData.xp = xp;
    this.playerData.gold = gold;

    this.levelText.setText(
      `LVL ${level}  •  ${this.getLevelTitle(level)}`
    );

    this.goldText.setText(`GOLD  ${gold}`);
    this.xpText.setText(`XP  ${xp} / ${this.xpNeeded}`);

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

  // ==================================================
  // LEVEL TITLE
  // ==================================================

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

  // ==================================================
  // XP BONUS
  // ==================================================

  getTotalXPBonus(
    questionType = "isim"
  ) {
    return getEquipmentXPBonus(
      this.playerData,
      questionType
    );
  }

  // ==================================================
  // TOTAL DEFENSE
  // ==================================================

  getTotalDefense() {
    return getEquipmentDefenseBonus(
      this.playerData
    );
  }

  // ==================================================
  // ADD XP
  // ==================================================

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
  // PIXEL NPC VISUAL
  // ==================================================

  applyNPCPixelVisual(
    npc,
    textureKey
  ) {
    if (!npc) {
      return;
    }

    npc.list.forEach(
      (child) => {
        if (
          child &&
          child.type === "Arc"
        ) {
          child.setVisible(false);
        }
      }
    );

    const sprite =
      this.add.image(
        0,
        -10,
        textureKey
      );

    sprite.setDisplaySize(
      94,
      112
    );

    npc.addAt(
      sprite,
      0
    );

    if (npc.nameText) {
      npc.nameText
        .setY(54)
        .setFontSize(13)
        .setStroke(
          "#1A365D",
          3
        );
    }

    if (npc.interactionText) {
      npc.interactionText
        .setY(-80)
        .setFontSize(13);
    }

    if (!npc.questMarker) {
      npc.questMarker = this.add
        .text(
          0,
          -92,
          "!",
          {
            fontSize: "34px",
            color: "#FFE066",
            fontStyle: "bold",
            stroke: "#7B341E",
            strokeThickness: 6,
          }
        )
        .setOrigin(0.5);

      npc.add(npc.questMarker);

      this.tweens.add({
        targets: npc.questMarker,
        y: -98,
        duration: 650,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  // ==================================================
  // MERCHANT PIXEL VISUAL — STEP 2G.2
  // ==================================================

  applyMerchantPixelVisual(
    npc,
    textureKey
  ) {
    if (!npc) {
      return;
    }

    npc.list.forEach((child) => {
      if (
        child &&
        child.type === "Arc"
      ) {
        child.setVisible(false);
      }
    });

    const sprite = this.add.image(
      0,
      -10,
      textureKey
    );

    sprite
      .setDisplaySize(94, 112)
      .setTint(0xf0c987);

    npc.addAt(sprite, 0);

    if (npc.nameText) {
      npc.nameText
        .setY(54)
        .setFontSize(12)
        .setText("Pedagang Tarkeeb")
        .setStroke("#1A365D", 3);
    }

    if (npc.interactionText) {
      npc.interactionText
        .setY(-80)
        .setFontSize(13)
        .setVisible(false);
    }

    npc.shopMarker = this.add
      .text(0, -92, "SHOP", {
        fontSize: "13px",
        color: "#FFE58A",
        fontStyle: "bold",
        backgroundColor: "#7B4B16",
        padding: {
          left: 6,
          right: 6,
          top: 3,
          bottom: 3,
        },
        stroke: "#07111F",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    npc.add(npc.shopMarker);

    this.tweens.add({
      targets: npc.shopMarker,
      y: -97,
      duration: 750,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // ==================================================
  // SHOP UI — STEP 2G.2
  // ==================================================

  openShop() {
    if (
      this.shopOpen ||
      this.inventoryOpen ||
      this.isQuizOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.forestGateInfoOpen ||
      this.isBattleOpen ||
      this.isBattleQuestionOpen
    ) {
      return;
    }

    this.shopOpen = true;
    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);

    if (this.player?.body) {
      this.player.body.setVelocity(0, 0);
    }

    this.stopPlayerPixelAnimation();

    this.gameProgress = getGameProgress(this);
    this.shopTierPage = Math.max(
      1,
      Math.min(
        4,
        Number(this.gameProgress?.shop?.tier) || 1
      )
    );

    this.renderShopUI();
  }

  renderShopUI() {
    this.clearShopObjects();

    if (!this.shopOpen) {
      return;
    }

    this.gameProgress = getGameProgress(this);

    const unlockedTier = Math.max(
      1,
      Math.min(
        4,
        Number(this.gameProgress?.shop?.tier) || 1
      )
    );

    this.shopTierPage = Phaser.Math.Clamp(
      Number(this.shopTierPage) || unlockedTier,
      1,
      unlockedTier
    );

    const tierInfo =
      SHOP_TIER_INFO[this.shopTierPage] ||
      SHOP_TIER_INFO[1];

    const entries = getShopEntries(unlockedTier)
      .filter(
        (entry) =>
          entry.requiredTier === this.shopTierPage
      );

    const depth = 3300;

    const addObject = (object) => {
      if (!object) {
        return object;
      }

      object.setScrollFactor?.(0);
      this.shopObjects.push(object);
      return object;
    };

    addObject(
      this.add
        .rectangle(400, 300, 800, 600, 0x020817, 0.76)
        .setDepth(depth)
    );

    addObject(
      this.add
        .rectangle(400, 300, 716, 506, 0x0b1a2f, 0.99)
        .setDepth(depth + 1)
        .setStrokeStyle(3, 0xd4af37, 0.95)
    );

    addObject(
      this.add
        .text(74, 72, "TARKEEB EQUIPMENT SHOP", {
          fontSize: "25px",
          color: "#FFE58A",
          fontStyle: "bold",
          stroke: "#07111F",
          strokeThickness: 3,
        })
        .setDepth(depth + 3)
    );

    addObject(
      this.add
        .text(
          726,
          78,
          `GOLD  ${Number(this.playerData.gold) || 0}`,
          {
            fontSize: "15px",
            color: "#FFE58A",
            fontStyle: "bold",
          }
        )
        .setOrigin(1, 0.5)
        .setDepth(depth + 3)
    );

    addObject(
      this.add
        .rectangle(400, 111, 650, 2, 0x31577d, 0.9)
        .setDepth(depth + 2)
    );

    addObject(
      this.add
        .text(84, 130, `TIER ${this.shopTierPage} • ${tierInfo.name}`, {
          fontSize: "16px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setDepth(depth + 3)
    );

    addObject(
      this.add
        .text(84, 153, tierInfo.description, {
          fontSize: "11px",
          color: "#91AAC8",
        })
        .setDepth(depth + 3)
    );

    addObject(
      this.add
        .text(
          716,
          137,
          `Tier terbuka: 1–${unlockedTier}`,
          {
            fontSize: "11px",
            color: "#AFC4DE",
            fontStyle: "bold",
          }
        )
        .setOrigin(1, 0.5)
        .setDepth(depth + 3)
    );

    entries.forEach((entry, index) => {
      const item = entry.item;
      const y = 222 + index * 94;
      const rarityColor = this.getRarityColor(item.rarity);
      const rarityNumber = parseInt(
        rarityColor.replace("#", ""),
        16
      );

      addObject(
        this.add
          .rectangle(400, y, 632, 78, 0x132844, 1)
          .setDepth(depth + 2)
          .setStrokeStyle(2, rarityNumber, 0.72)
      );

      addObject(
        this.add
          .text(111, y, item.icon || "🎒", {
            fontSize: "31px",
          })
          .setOrigin(0.5)
          .setDepth(depth + 4)
      );

      addObject(
        this.add
          .text(145, y - 25, item.name, {
            fontSize: "14px",
            color: rarityColor,
            fontStyle: "bold",
          })
          .setDepth(depth + 4)
      );

      addObject(
        this.add
          .text(
            145,
            y - 4,
            `${String(item.rarity).toUpperCase()} • ${item.type}`,
            {
              fontSize: "9px",
              color: "#91AAC8",
              fontStyle: "bold",
            }
          )
          .setDepth(depth + 4)
      );

      addObject(
        this.add
          .text(145, y + 16, item.description, {
            fontSize: "10px",
            color: "#D6E3F4",
            wordWrap: { width: 315 },
          })
          .setDepth(depth + 4)
      );

      const purchased =
        isShopItemPurchased(this.gameProgress, entry.itemId) ||
        this.playerData.inventory.some(
          (ownedItem) => ownedItem?.id === entry.itemId
        );

      const affordable =
        (Number(this.playerData.gold) || 0) >= entry.price;

      addObject(
        this.add
          .text(560, y - 9, `${entry.price} GOLD`, {
            fontSize: "13px",
            color: purchased
              ? "#7FA2C5"
              : affordable
                ? "#FFE58A"
                : "#FC8181",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(depth + 4)
      );

      let buttonLabel = "BELI";
      let buttonColor = 0x8b6b13;
      let buttonStroke = 0xffe58a;

      if (purchased) {
        buttonLabel = "DIMILIKI";
        buttonColor = 0x30445f;
        buttonStroke = 0x5d82ad;
      } else if (!affordable) {
        buttonLabel = "GOLD KURANG";
        buttonColor = 0x6b2f3b;
        buttonStroke = 0xc45d6f;
      }

      const buyButton = addObject(
        this.add
          .rectangle(650, y + 17, 104, 30, buttonColor, 1)
          .setDepth(depth + 3)
          .setStrokeStyle(1, buttonStroke, 0.9)
          .setInteractive({ useHandCursor: !purchased })
      );

      const buyText = addObject(
        this.add
          .text(650, y + 17, buttonLabel, {
            fontSize: buttonLabel === "GOLD KURANG" ? "8px" : "10px",
            color: purchased ? "#AFC4DE" : "#FFFFFF",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(depth + 4)
      );

      if (!purchased) {
        buyButton.on("pointerover", () => {
          if (affordable) {
            buyButton.setFillStyle(0xa47c17, 1);
            buyText.setColor("#FFE58A");
          } else {
            buyButton.setFillStyle(0x7f3847, 1);
          }
        });

        buyButton.on("pointerout", () => {
          buyButton.setFillStyle(
            affordable ? 0x8b6b13 : 0x6b2f3b,
            1
          );
          buyText.setColor("#FFFFFF");
        });

        buyButton.on("pointerdown", () => {
          this.purchaseShopItem(entry);
        });
      }
    });

    const previousButton = addObject(
      this.add
        .rectangle(112, 505, 96, 32, 0x1a365d, 1)
        .setDepth(depth + 3)
        .setStrokeStyle(1, 0x5d82ad, 0.9)
        .setInteractive({ useHandCursor: true })
    );

    const previousText = addObject(
      this.add
        .text(112, 505, "◀ TIER", {
          fontSize: "10px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(depth + 4)
    );

    const nextButton = addObject(
      this.add
        .rectangle(220, 505, 96, 32, 0x1a365d, 1)
        .setDepth(depth + 3)
        .setStrokeStyle(1, 0x5d82ad, 0.9)
        .setInteractive({ useHandCursor: true })
    );

    const nextText = addObject(
      this.add
        .text(220, 505, "TIER ▶", {
          fontSize: "10px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(depth + 4)
    );

    const previousEnabled = this.shopTierPage > 1;
    const nextEnabled = this.shopTierPage < unlockedTier;

    previousButton.setAlpha(previousEnabled ? 1 : 0.35);
    previousText.setAlpha(previousEnabled ? 1 : 0.35);
    nextButton.setAlpha(nextEnabled ? 1 : 0.35);
    nextText.setAlpha(nextEnabled ? 1 : 0.35);

    previousButton.on("pointerdown", () => {
      if (!previousEnabled) {
        return;
      }

      this.shopTierPage -= 1;
      this.renderShopUI();
    });

    nextButton.on("pointerdown", () => {
      if (!nextEnabled) {
        return;
      }

      this.shopTierPage += 1;
      this.renderShopUI();
    });

    this.shopFeedbackText = addObject(
      this.add
        .text(
          400,
          505,
          "Pilih Tier untuk melihat stok yang sudah terbuka.",
          {
            fontSize: "10px",
            color: "#91AAC8",
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(depth + 4)
    );

    const closeButton = addObject(
      this.add
        .rectangle(666, 505, 126, 32, 0x1a365d, 1)
        .setDepth(depth + 3)
        .setStrokeStyle(2, 0xd4af37, 0.9)
        .setInteractive({ useHandCursor: true })
    );

    const closeText = addObject(
      this.add
        .text(666, 505, "TUTUP [ ESC ]", {
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
      this.closeShop();
    });
  }

  purchaseShopItem(entry) {
    if (!entry?.item || !entry.itemId) {
      this.setShopFeedback("Item tidak valid.");
      return;
    }

    this.gameProgress = getGameProgress(this);

    const alreadyOwned =
      isShopItemPurchased(this.gameProgress, entry.itemId) ||
      this.playerData.inventory.some(
        (ownedItem) => ownedItem?.id === entry.itemId
      );

    if (alreadyOwned) {
      this.setShopFeedback(`${entry.item.name} sudah dimiliki.`);
      return;
    }

    const currentGold = Number(this.playerData.gold) || 0;

    if (currentGold < entry.price) {
      const missingGold = entry.price - currentGold;
      this.setShopFeedback(
        `Gold tidak cukup • kurang ${missingGold} Gold.`
      );
      return;
    }

    this.playerData.gold = currentGold - entry.price;

    // Simpan copy object supaya inventory tidak bergantung pada reference catalog.
    this.playerData.inventory.push({
      ...entry.item,
    });

    // Jaga inventory tetap unik berdasarkan item ID.
    this.playerData.inventory = this.playerData.inventory.filter(
      (inventoryItem, index, array) =>
        inventoryItem?.id &&
        index ===
          array.findIndex(
            (otherItem) => otherItem?.id === inventoryItem.id
          )
    );

    this.registry.set("playerData", this.playerData);

    this.gameProgress = markShopItemPurchased(
      this,
      entry.itemId
    );

    // Render ulang agar GOLD dan status tombol langsung berubah.
    this.renderShopUI();
    this.setShopFeedback(
      `Berhasil membeli ${entry.item.name} • -${entry.price} Gold.`
    );
  }

  setShopFeedback(message) {
    if (!this.shopFeedbackText?.active) {
      return;
    }

    this.shopFeedbackText.setText(message);
    this.shopFeedbackText.setColor("#FFE58A");
  }

  clearShopObjects() {
    if (!Array.isArray(this.shopObjects)) {
      this.shopObjects = [];
      return;
    }

    this.shopObjects.forEach((object) => {
      if (object?.active) {
        object.destroy();
      }
    });

    this.shopObjects = [];
    this.shopFeedbackText = null;
  }

  closeShop() {
    this.clearShopObjects();
    this.shopOpen = false;

    const shouldShowHUD = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.forestGateInfoOpen
    );

    this.setGameplayHUDVisible(shouldShowHUD);
  }

  // ==================================================
  // PIXEL MONSTER VISUAL
  // ==================================================

  applyMonsterPixelVisual(
    monster,
    textureKey,
    width,
    height
  ) {
    if (
      !monster ||
      !monster.list
    ) {
      return;
    }

    monster.list.forEach(
      (child) => {
        if (!child) {
          return;
        }

        if (
          child.type === "Arc" ||
          child.type === "Rectangle"
        ) {
          child.setVisible(false);
        }
      }
    );

    const sprite =
      this.add.image(
        0,
        -13,
        textureKey
      );

    sprite
      .setDisplaySize(
        width,
        height
      )
      .setDepth(1);

    monster.addAt(
      sprite,
      0
    );
  }

  // ==================================================
  // CREATE HOUSE
  // ==================================================

  createHouse(
    x,
    y,
    name,
    textureKey
  ) {
    const house =
      this.add.image(
        x,
        y,
        textureKey
      );

    house
      .setDisplaySize(
        168,
        138
      )
      .setDepth(10);

    this.add
      .text(
        x,
        y + 78,
        name,
        {
          fontSize: "14px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#1A365D",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setDepth(11);

    // Collision hanya pada bagian bawah rumah,
    // supaya atap tidak terasa seperti tembok besar.
    const collider =
      this.add.rectangle(
        x,
        y + 20,
        118,
        66,
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
  // CREATE TREE
  // ==================================================

  createTree(
    x,
    y
  ) {
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
  // CREATE CHEST
  // ==================================================

  createChest(
    x,
    y,
    reward,
    chestId
  ) {
    const openedChests =
      this.gameProgress?.nahwuVillage?.openedChests || [];

    const chest = {
      id: chestId,
      x,
      y,
      opened:
        Boolean(chestId) &&
        openedChests.includes(chestId),
      isNearby: false,

      reward,

      body: null,
      lid: null,
      label: null,
    };

    chest.body =
      this.add.image(
        x,
        y,
        chest.opened
          ? "chestOpenPixel"
          : "chestClosedPixel"
      );

    chest.body
      .setDisplaySize(
        70,
        62
      )
      .setDepth(20);

    chest.label =
      this.add
        .text(
          x,
          y + 42,
          chest.opened
            ? "OPENED!"
            : "CHEST",
          {
            fontSize: "11px",
            color: "#F6E3A1",
            fontStyle: "bold",
            stroke: "#1A365D",
            strokeThickness: 3,
          }
        )
        .setOrigin(0.5)
        .setDepth(21);

    this.chests.push(
      chest
    );

    if (!chest.opened) {
      this.visualFoundation.animateChest(
        chest
      );
    }
  }

  // ==================================================
  // OPEN CHEST
  // ==================================================

  openChest(
    chest
  ) {
    if (
      !chest ||
      chest.opened
    ) {
      return;
    }

    this.currentChest =
      chest;

    this.currentQuestion =
      this.getRandomQuestion();

    if (
      !this.currentQuestion
    ) {
      return;
    }

    this.isQuizOpen =
      true;

    this.answerLocked =
      false;

    // Chest quiz adalah UI fokus penuh.
    // Sembunyikan HUD eksplorasi agar LVL / XP / GOLD / Quest
    // tidak menimpa panel soal.
    this.setGameplayHUDVisible(false);
    this.hideInteractionPrompt();

    this.showQuiz();
  }

  // ==================================================
  // GET RANDOM CHEST QUESTION
  // ==================================================

  getRandomQuestion() {
    const available =
      questions.filter(
        (question) =>
          question.type ===
          "isim"
      );

    if (
      available.length ===
      0
    ) {
      return null;
    }

    const index =
      Phaser.Math.Between(
        0,
        available.length - 1
      );

    return available[
      index
    ];
  }

  // ==================================================
  // SHOW CHEST QUIZ
  // ==================================================

  showQuiz() {
    this.quizObjects = [];

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.65
      );

    overlay.setDepth(100);

    const panel =
      this.add.rectangle(
        400,
        300,
        650,
        440,
        0xffffff
      );

    panel.setDepth(101);

    const title =
      this.add
        .text(
          400,
          105,
          "NAHWU CHALLENGE",
          {
            fontSize: "30px",
            color: "#1A365D",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(102);

    const difficulty =
      this.add
        .text(
          400,
          145,
          `Difficulty: ${this.currentQuestion.difficulty.toUpperCase()}`,
          {
            fontSize: "14px",
            color: "#D4AF37",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    difficulty.setDepth(102);

    const question =
      this.add
        .text(
          400,
          205,
          this.currentQuestion.question,
          {
            fontSize: "20px",
            color: "#2D3748",
            fontStyle: "bold",
            align: "center",

            wordWrap: {
              width: 540,
            },
          }
        )
        .setOrigin(0.5);

    question.setDepth(102);

    this.quizObjects.push(
      overlay,
      panel,
      title,
      difficulty,
      question
    );

    this.currentQuestion.answers.forEach(
      (
        answer,
        index
      ) => {
        const y =
          290 +
          index * 55;

        const button =
          this.add.rectangle(
            400,
            y,
            500,
            42,
            0xeaf2ff
          );

        button.setDepth(102);

        button.setInteractive({
          useHandCursor: true,
        });

        const text =
          this.add
            .text(
              400,
              y,
              answer.text,
              {
                fontSize: "19px",
                color: "#1A365D",
                fontStyle: "bold",
              }
            )
            .setOrigin(0.5);

        text.setDepth(103);

        this.quizObjects.push(
          button,
          text
        );

        button.on(
          "pointerover",
          () => {
            if (
              this.answerLocked
            ) {
              return;
            }

            button.setFillStyle(
              0x3182ce
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
              0xeaf2ff
            );

            text.setColor(
              "#1A365D"
            );
          }
        );

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

            this.answerQuiz(
              answer.correct
            );
          }
        );
      }
    );
  }

  // ==================================================
  // ANSWER CHEST QUIZ
  // ==================================================

  answerQuiz(
    isCorrect
  ) {
    if (!isCorrect) {
      this.showResult(
        "SALAH!",
        "Belum tepat.\nCoba tantangan berikutnya!",
        false
      );

      return;
    }

    const questionType =
      this.currentQuestion
        ? this.currentQuestion.type
        : "isim";

    const xpResult =
      this.addXP(
        100,
        questionType
      );

    this.playerData.gold =
      Number(
        this.playerData.gold
      ) + 50;

    if (
      this.currentChest &&
      this.currentChest.reward
    ) {
      const rewardItem = {
        ...this.currentChest.reward,
      };

      // Jangan masukkan equipment yang sama lebih dari sekali.
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

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.updateHUD();

    if (
      this.currentChest
    ) {
      this.currentChest.opened =
        true;

      if (this.currentChest.id) {
        this.gameProgress = markChestOpened(
          this,
          "nahwuVillage",
          this.currentChest.id
        );
      }

      if (
        this.currentChest.body &&
        this.currentChest.body.active
      ) {
        this.currentChest.body.setTexture(
          "chestOpenPixel"
        );

        this.currentChest.body.setDisplaySize(
          70,
          62
        );
      }

      this.currentChest.label.setText(
        "OPENED!"
      );
    }

    // Step 2E.2B — Chest tidak lagi menjadi syarat quest Village.
    // Quest Grammar Master sekarang murni meminta pemain
    // mengalahkan 3 monster utama Nahwu Village.
    const questCompleted = false;

    this.pendingQuestCompletion = false;

    let message =
      `+${xpResult.finalXP} XP`;

    if (
      xpResult.bonusXP >
      0
    ) {
      message +=
        `\nEquipment Bonus: +${xpResult.bonusXP} XP`;
    }

    message +=
      "\n+50 GOLD";

    if (
      this.currentChest &&
      this.currentChest.reward
    ) {
      message +=
        `\n${this.currentChest.reward.icon} ${this.currentChest.reward.name}`;
    }

    if (
      this.activeQuest &&
      !questCompleted
    ) {
      message +=
        `\n\nQuest: ${this.activeQuest.progress}/${this.activeQuest.requiredProgress}`;
    }

    if (
      xpResult.leveledUp
    ) {
      message +=
        "\n\nLEVEL UP!";
    }

    this.showResult(
      "BENAR!",
      message,
      true
    );
  }

  // ==================================================
  // SHOW CHEST RESULT
  // ==================================================

  showResult(
    titleText,
    messageText,
    success
  ) {
    this.clearQuiz();

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.65
      );

    overlay.setDepth(200);

    const panel =
      this.add.rectangle(
        400,
        300,
        550,
        340,
        success
          ? 0xecfdf5
          : 0xfff1f2
      );

    panel.setDepth(201);

    const title =
      this.add
        .text(
          400,
          190,
          titleText,
          {
            fontSize: "38px",
            color: success
              ? "#15803d"
              : "#dc2626",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(202);

    const message =
      this.add
        .text(
          400,
          285,
          messageText,
          {
            fontSize: "19px",
            color: "#2D3748",
            align: "center",

            wordWrap: {
              width: 450,
            },
          }
        )
        .setOrigin(0.5);

    message.setDepth(202);

    const button =
      this.add.rectangle(
        400,
        420,
        200,
        50,
        0x1a365d
      );

    button.setDepth(202);

    button.setInteractive({
      useHandCursor: true,
    });

    const buttonText =
      this.add
        .text(
          400,
          420,
          "LANJUT",
          {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    buttonText.setDepth(203);

    button.on(
      "pointerdown",
      () => {
        overlay.destroy();

        panel.destroy();

        title.destroy();

        message.destroy();

        button.destroy();

        buttonText.destroy();

        this.isQuizOpen =
          false;

        this.answerLocked =
          false;

        this.currentQuestion =
          null;

        if (
          this.pendingQuestCompletion
        ) {
          this.pendingQuestCompletion =
            false;

          this.completeQuest();

          return;
        }

        this.updateHUD();
        this.setGameplayHUDVisible(true);
      }
    );
  }

  // ==================================================
  // CLEAR QUIZ
  // ==================================================

  clearQuiz() {
    if (
      !this.quizObjects
    ) {
      return;
    }

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
  // NPC DIALOG
  // ==================================================

  showNPCDialog(
    npc
  ) {
    this.npcDialogOpen = true;

    // Modal dialog: world stays visible, but exploration HUD/prompt are hidden.
    this.hideInteractionPrompt();
    this.setGameplayHUDVisible(false);

    this.npcDialogObjects = [];

    const depth = 5000;

    // ==================================================
    // DARKEN WORLD
    // ==================================================

    const overlay = this.add
      .rectangle(
        400,
        300,
        800,
        600,
        0x050911,
        0.70
      )
      .setDepth(depth)
      .setScrollFactor(0);

    // ==================================================
    // MAIN DIALOG PANEL
    // ==================================================

    const panel = this.add
      .rectangle(
        400,
        438,
        730,
        264,
        0x0d1b2d,
        0.99
      )
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setStrokeStyle(
        3,
        0xd7ad3a,
        1
      );

    const topAccent = this.add
      .rectangle(
        400,
        307,
        730,
        5,
        0xe4bd4f,
        1
      )
      .setDepth(depth + 2)
      .setScrollFactor(0);

    // ==================================================
    // PORTRAIT COLUMN
    // ==================================================

    const portraitFrame = this.add
      .rectangle(
        128,
        425,
        130,
        174,
        0x091321,
        1
      )
      .setDepth(depth + 2)
      .setScrollFactor(0)
      .setStrokeStyle(
        2,
        0x5c86b2,
        1
      );

    const portrait = this.add
      .image(
        128,
        424,
        "grammarMasterPixel"
      )
      .setDisplaySize(
        96,
        132
      )
      .setDepth(depth + 3)
      .setScrollFactor(0);

    const roleBadge = this.add
      .text(
        128,
        522,
        "QUEST GIVER",
        {
          fontSize: "9px",
          color: "#FFE79A",
          fontStyle: "bold",
          backgroundColor: "#142A45",
          padding: {
            left: 7,
            right: 7,
            top: 3,
            bottom: 3,
          },
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 4)
      .setScrollFactor(0);

    // ==================================================
    // SPEAKER + DIALOGUE
    // ==================================================

    const name = this.add
      .text(
        212,
        326,
        npc.npcName,
        {
          fontSize: "21px",
          color: "#FFF1B8",
          fontStyle: "bold",
          stroke: "#07111F",
          strokeThickness: 4,
        }
      )
      .setDepth(depth + 3)
      .setScrollFactor(0);

    const divider = this.add
      .rectangle(
        465,
        357,
        506,
        2,
        0x36597c,
        0.9
      )
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const dialog = this.add
      .text(
        212,
        370,
        "Selamat datang di Nahwu Village!\n" +
          "Aku punya tantangan untuk melatih pemahaman Isim-mu.",
        {
          fontSize: "14px",
          color: "#E7F0FA",
          lineSpacing: 6,
          wordWrap: {
            width: 505,
          },
        }
      )
      .setDepth(depth + 3)
      .setScrollFactor(0);

    // ==================================================
    // QUEST CARD
    // ==================================================

    const quest = quests.basicIsim;

    const questCard = this.add
      .rectangle(
        465,
        463,
        506,
        82,
        0x132943,
        0.96
      )
      .setDepth(depth + 2)
      .setScrollFactor(0)
      .setStrokeStyle(
        1,
        0x557ea8,
        1
      );

    const questLabel = this.add
      .text(
        226,
        432,
        "NEW QUEST",
        {
          fontSize: "9px",
          color: "#8FC7FF",
          fontStyle: "bold",
        }
      )
      .setDepth(depth + 3)
      .setScrollFactor(0);

    const questTitle = this.add
      .text(
        226,
        448,
        quest.title,
        {
          fontSize: "14px",
          color: "#FFE58A",
          fontStyle: "bold",
        }
      )
      .setDepth(depth + 3)
      .setScrollFactor(0);

    const questDescription = this.add
      .text(
        226,
        474,
        quest.description,
        {
          fontSize: "12px",
          color: "#C9D9EA",
          wordWrap: {
            width: 468,
          },
        }
      )
      .setDepth(depth + 3)
      .setScrollFactor(0);

    // ==================================================
    // BUTTONS
    // ==================================================

    const closeButton = this.add
      .rectangle(
        500,
        542,
        150,
        38,
        0x172C45,
        1
      )
      .setDepth(depth + 4)
      .setScrollFactor(0)
      .setStrokeStyle(
        1,
        0x55789A,
        1
      )
      .setInteractive({
        useHandCursor: true,
      });

    const closeText = this.add
      .text(
        500,
        542,
        "NANTI",
        {
          fontSize: "13px",
          color: "#DCE9F6",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 5)
      .setScrollFactor(0);

    const acceptButton = this.add
      .rectangle(
        664,
        542,
        170,
        38,
        0xD7AD3A,
        1
      )
      .setDepth(depth + 4)
      .setScrollFactor(0)
      .setStrokeStyle(
        2,
        0xFFE68A,
        1
      )
      .setInteractive({
        useHandCursor: true,
      });

    const acceptText = this.add
      .text(
        664,
        542,
        "TERIMA QUEST",
        {
          fontSize: "13px",
          color: "#102039",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 5)
      .setScrollFactor(0);

    closeButton.on(
      "pointerover",
      () => {
        closeButton.setFillStyle(
          0x234766
        );
      }
    );

    closeButton.on(
      "pointerout",
      () => {
        closeButton.setFillStyle(
          0x172C45
        );
      }
    );

    closeButton.on(
      "pointerdown",
      () => {
        this.closeNPCDialog();
      }
    );

    acceptButton.on(
      "pointerover",
      () => {
        acceptButton.setFillStyle(
          0xF1CA58
        );
      }
    );

    acceptButton.on(
      "pointerout",
      () => {
        acceptButton.setFillStyle(
          0xD7AD3A
        );
      }
    );

    acceptButton.on(
      "pointerdown",
      () => {
        this.acceptQuest(
          quest
        );
      }
    );

    // Compact fade-in. All elements share the same timing to avoid
    // misalignment while the modal enters.
    [
      panel,
      topAccent,
      portraitFrame,
      portrait,
      roleBadge,
      name,
      divider,
      dialog,
      questCard,
      questLabel,
      questTitle,
      questDescription,
      closeButton,
      closeText,
      acceptButton,
      acceptText,
    ].forEach(
      (object) => {
        object.setAlpha(0);
      }
    );

    this.tweens.add({
      targets: [
        panel,
        topAccent,
        portraitFrame,
        portrait,
        roleBadge,
        name,
        divider,
        dialog,
        questCard,
        questLabel,
        questTitle,
        questDescription,
        closeButton,
        closeText,
        acceptButton,
        acceptText,
      ],
      alpha: 1,
      duration: 150,
      ease: "Power2",
    });

    this.npcDialogObjects.push(
      overlay,
      panel,
      topAccent,
      portraitFrame,
      portrait,
      roleBadge,
      name,
      divider,
      dialog,
      questCard,
      questLabel,
      questTitle,
      questDescription,
      closeButton,
      closeText,
      acceptButton,
      acceptText
    );
  }

  // ==================================================
  // ACCEPT QUEST
  // ==================================================

  acceptQuest(
    quest
  ) {
    this.activeQuest = {
      id: quest.id,

      title: quest.title,

      description:
        quest.description,

      type: quest.type,

      progress: 0,

      requiredProgress:
        Number(
          quest.requiredProgress
        ) || 0,

      reward: {
        xp:
          Number(
            quest.reward.xp
          ) || 0,

        gold:
          Number(
            quest.reward.gold
          ) || 0,
      },
    };

    this.registry.set(
      "activeQuest",
      this.activeQuest
    );

    // Jika pemain sudah mengalahkan monster sebelum menerima quest,
    // progress tersebut tetap dihitung agar tidak perlu respawn/grind ulang.
    const alreadyComplete =
      this.syncVillageMonsterQuestProgress();

    this.closeNPCDialog();

    if (alreadyComplete) {
      this.completeQuest();
      return;
    }

    this.showQuestHUD();
  }

  // ==================================================
  // CLOSE NPC DIALOG
  // ==================================================

  closeNPCDialog() {
    if (
      !this.npcDialogObjects
    ) {
      this.npcDialogOpen = false;
      return;
    }

    this.npcDialogObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.npcDialogObjects = [];
    this.npcDialogOpen = false;

    // HUD hanya kembali ketika benar-benar kembali ke exploration.
    const shouldShowHUD = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.questCompleteOpen
    );

    this.setGameplayHUDVisible(
      shouldShowHUD
    );
  }

  // ==================================================
  // QUEST HUD — STEP 2D.1
  // ==================================================

  showQuestHUD() {
    this.clearQuestHUD();

    if (!this.activeQuest) {
      return;
    }

    this.questObjects = [];

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
      .text(x + 14, y + 32, this.activeQuest.title, {
        fontSize: "14px",
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 2,
        wordWrap: { width: width - 28 },
      })
      .setDepth(hudDepth + 1)
      .setScrollFactor(0);

    const current = Number(this.activeQuest.progress) || 0;
    const required = Math.max(1, Number(this.activeQuest.requiredProgress) || 1);
    const ratio = Phaser.Math.Clamp(current / required, 0, 1);

    const progress = this.add
      .text(x + 14, y + 72, `Progress  ${current} / ${required}`, {
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

    this.questObjects.push(
      panel,
      label,
      title,
      progress,
      barBackground,
      barFill
    );

    // Quest dapat ter-update ketika battle / chest quiz / modal lain berlangsung.
    // Jangan biarkan quest panel muncul kembali di atas UI fokus penuh.
    const gameplayHUDShouldBeVisible = !(
      this.isBattleOpen ||
      this.isBattleQuestionOpen ||
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen
    );

    this.setGameplayHUDVisible(gameplayHUDShouldBeVisible);
  }

  // ==================================================
  // SYNC VILLAGE MONSTER QUEST
  // ==================================================

  syncVillageMonsterQuestProgress() {
    if (
      !this.activeQuest ||
      this.activeQuest.type !== "monsterHunt"
    ) {
      return false;
    }

    const requiredMonsterIds = [
      "nahwuSlime",
      "grammarGoblin",
      "irabGolem",
    ];

    const defeatedMonsters =
      this.gameProgress?.nahwuVillage?.defeatedMonsters || [];

    const defeatedRequired =
      requiredMonsterIds.filter((monsterId) =>
        defeatedMonsters.includes(monsterId)
      ).length;

    this.activeQuest.requiredProgress =
      requiredMonsterIds.length;

    this.activeQuest.progress =
      Math.min(
        defeatedRequired,
        this.activeQuest.requiredProgress
      );

    this.registry.set(
      "activeQuest",
      this.activeQuest
    );

    this.showQuestHUD();

    return (
      this.activeQuest.progress >=
      this.activeQuest.requiredProgress
    );
  }

  // ==================================================
  // UPDATE QUEST PROGRESS
  // ==================================================
  // Dipertahankan untuk quest tipe lain di chapter berikutnya.

  updateQuestProgress(
    type
  ) {
    if (
      !this.activeQuest
    ) {
      return false;
    }

    if (
      this.activeQuest.type !==
      type
    ) {
      return false;
    }

    this.activeQuest.progress =
      Number(
        this.activeQuest.progress
      ) || 0;

    this.activeQuest.requiredProgress =
      Number(
        this.activeQuest.requiredProgress
      ) || 0;

    this.activeQuest.progress +=
      1;

    if (
      this.activeQuest.progress >
      this.activeQuest.requiredProgress
    ) {
      this.activeQuest.progress =
        this.activeQuest.requiredProgress;
    }

    this.registry.set(
      "activeQuest",
      this.activeQuest
    );

    this.showQuestHUD();

    return (
      this.activeQuest.progress >=
      this.activeQuest.requiredProgress
    );
  }

  // ==================================================
  // COMPLETE QUEST
  // ==================================================

  completeQuest() {
    if (
      !this.activeQuest
    ) {
      return;
    }

    const completedQuest =
      this.activeQuest;

    // Simpan status quest Chapter 1 ke global progression.
    const forestWasUnlocked =
      this.gameProgress?.forest?.unlocked === true;

    this.gameProgress = markQuestCompleted(
      this,
      "nahwuVillage",
      true
    );

    // Requirement Chapter 1: quest selesai + semua monster wajib kalah.
    // Quest Village memang meminta 3 monster, tetapi pengecekan ganda ini
    // menjaga progression tetap aman jika quest diubah lagi nanti.
    if (
      isAreaReadyToComplete(
        this,
        "nahwuVillage"
      )
    ) {
      this.gameProgress = completeAreaAndUnlockNext(
        this,
        "nahwuVillage"
      );
    }

    const forestNowUnlocked =
      this.gameProgress?.forest?.unlocked === true;

    this.pendingForestUnlockNotice =
      !forestWasUnlocked &&
      forestNowUnlocked;

    this.refreshForestGateState();

    const reward =
      completedQuest.reward;

    const xpResult =
      this.addXP(
        reward.xp,
        completedQuest.type
      );

    this.playerData.gold =
      Number(
        this.playerData.gold
      ) +
      Number(
        reward.gold
      );

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.updateHUD();

    this.clearQuestHUD();

    this.activeQuest =
      null;

    this.registry.set(
      "activeQuest",
      null
    );

    let message =
      `+${xpResult.finalXP} XP\n` +
      `+${reward.gold} GOLD`;

    if (
      xpResult.bonusXP >
      0
    ) {
      message +=
        `\nEquipment Bonus: +${xpResult.bonusXP} XP`;
    }

    if (
      xpResult.leveledUp
    ) {
      message +=
        "\n\nLEVEL UP!";
    }

    this.showQuestComplete(
      completedQuest.title,
      message
    );
  }

  // ==================================================
  // QUEST COMPLETE — STEP 2D.9 REWARD POLISH
  // ==================================================

  showQuestComplete(
    titleText,
    rewardText
  ) {
    this.questCompleteOpen = true;

    // Reward screen adalah modal penuh. HUD eksplorasi tidak boleh
    // bersaing dengan informasi reward.
    this.setGameplayHUDVisible(false);
    this.hideInteractionPrompt();

    this.questCompleteObjects = [];

    const overlay = this.add
      .rectangle(400, 300, 800, 600, 0x050b14, 0.82)
      .setDepth(500);

    const panel = this.add
      .rectangle(400, 305, 590, 370, 0x10233f, 0.99)
      .setDepth(501)
      .setStrokeStyle(3, 0xd8b43f, 1);

    const topGlow = this.add
      .rectangle(400, 123, 590, 5, 0xf6d365, 1)
      .setDepth(502);

    const seal = this.add
      .circle(400, 170, 36, 0xd8b43f, 1)
      .setDepth(502)
      .setStrokeStyle(3, 0xffe59a, 1);

    const check = this.add
      .text(400, 170, "✓", {
        fontSize: "34px",
        color: "#0B1728",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(503);

    const eyebrow = this.add
      .text(400, 218, "QUEST CLEARED", {
        fontSize: "12px",
        color: "#F6D365",
        fontStyle: "bold",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(503);

    const title = this.add
      .text(400, 247, "QUEST COMPLETE!", {
        fontSize: "28px",
        color: "#FFF7D6",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(503);

    const questCard = this.add
      .rectangle(400, 295, 470, 48, 0x0a172a, 0.96)
      .setDepth(502)
      .setStrokeStyle(1, 0x527aa8, 0.9);

    const quest = this.add
      .text(400, 295, titleText, {
        fontSize: "17px",
        color: "#DCEBFF",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)
      .setDepth(503);

    const rewardLabel = this.add
      .text(400, 340, "REWARDS", {
        fontSize: "12px",
        color: "#F6D365",
        fontStyle: "bold",
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(503);

    const rewardCard = this.add
      .rectangle(400, 389, 470, 72, 0x142b4a, 0.96)
      .setDepth(502)
      .setStrokeStyle(1, 0xd8b43f, 0.72);

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
      .setDepth(503);

    const button = this.add
      .rectangle(400, 462, 220, 48, 0xd8b43f, 1)
      .setDepth(502)
      .setStrokeStyle(2, 0xffe59a, 1)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(400, 462, "LANJUTKAN", {
        fontSize: "15px",
        color: "#0B1728",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(503);

    this.questCompleteObjects.push(
      overlay,
      panel,
      topGlow,
      seal,
      check,
      eyebrow,
      title,
      questCard,
      quest,
      rewardLabel,
      rewardCard,
      reward,
      button,
      buttonText
    );

    // Sedikit entrance animation agar reward terasa sebagai momen penting.
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

    button.on("pointerover", () => {
      button.setFillStyle(0xf0c94b);
    });

    button.on("pointerout", () => {
      button.setFillStyle(0xd8b43f);
    });

    button.on("pointerdown", () => {
      this.questCompleteObjects.forEach((object) => {
        if (object) {
          object.destroy();
        }
      });

      this.questCompleteObjects = [];
      this.questCompleteOpen = false;

      this.updateHUD();
      this.setGameplayHUDVisible(true);
      this.refreshForestGateState();

      if (this.pendingForestUnlockNotice) {
        this.pendingForestUnlockNotice = false;
        this.showForestUnlockedNotice();
      }
    });
  }

  // ==================================================
  // FOREST UNLOCK BANNER
  // ==================================================

  showForestUnlockedNotice() {
    const banner = this.add
      .container(400, 175)
      .setDepth(1800)
      .setScrollFactor(0);

    const panel = this.add
      .rectangle(0, 0, 430, 104, 0x0b1f24, 0.98)
      .setStrokeStyle(3, 0x62d98b, 1);

    const chapter = this.add
      .text(0, -25, "CHAPTER I COMPLETE", {
        fontSize: "13px",
        color: "#8EF0AD",
        fontStyle: "bold",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const title = this.add
      .text(0, 6, "FOREST OF ISIM UNLOCKED", {
        fontSize: "23px",
        color: "#FFF4C2",
        fontStyle: "bold",
        stroke: "#07111F",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(0, 34, "Gate Forest sekarang dapat dimasuki.", {
        fontSize: "13px",
        color: "#D9F8E3",
      })
      .setOrigin(0.5);

    banner.add([
      panel,
      chapter,
      title,
      hint,
    ]);

    banner.setAlpha(0);
    banner.setScale(0.96);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          if (!banner.active) {
            return;
          }

          this.tweens.add({
            targets: banner,
            alpha: 0,
            y: 160,
            duration: 260,
            ease: "Quad.easeIn",
            onComplete: () => {
              banner.destroy();
            },
          });
        });
      },
    });
  }

  // ==================================================
  // CLEAR QUEST HUD
  // ==================================================

  clearQuestHUD() {
    if (
      !this.questObjects
    ) {
      return;
    }

    this.questObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.questObjects = [];
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
      this.npcDialogOpen ||
      this.questCompleteOpen
    );

    this.setGameplayHUDVisible(shouldShowHUD);
  }

}

export default VillageScene;