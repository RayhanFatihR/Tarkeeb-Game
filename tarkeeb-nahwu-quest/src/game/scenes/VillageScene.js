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

    this.npcDialogOpen = false;

    this.questCompleteOpen =
      false;

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

    this.createChest(
      560,
      410,
      items.swordOfIsim
    );

    this.createChest(
      288,
      505,
      items.shieldOfMubtada
    );

    this.createChest(
      657,
      385,
      items.ringOfRafa
    );

    // ==================================================
    // MONSTERS
    // ==================================================

    this.monsters = [];

    // --------------------------------------------------
    // NAHWU SLIME
    // --------------------------------------------------

    const slime =
      new Monster(
        this,
        635,
        500,
        monsters.nahwuSlime
      );

    // --------------------------------------------------
    // GRAMMAR GOBLIN
    // --------------------------------------------------

    const goblin =
      new Monster(
        this,
        165,
        485,
        monsters.grammarGoblin
      );

    // --------------------------------------------------
    // I'RAB GOLEM
    // --------------------------------------------------

    const golem =
      new Monster(
        this,
        555,
        165,
        monsters.irabGolem
      );

    this.monsters.push(
      slime,
      goblin,
      golem
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
    // INTERACTION TEXT
    // ==================================================

    this.interactText =
      this.add
        .text(
          400,
          550,
          "",
          {
            fontSize: "20px",
            color: "#ffffff",
            backgroundColor:
              "#1A365D",

            padding: {
              left: 15,
              right: 15,
              top: 10,
              bottom: 10,
            },
          }
        )
        .setOrigin(0.5);

    this.interactText.setVisible(
      false
    );

    this.visualFoundation.animatePlayer(this.player);
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
    // INVENTORY KEY
    // ==================================================

    if (
      Phaser.Input.Keyboard.JustDown(
        this.inventoryKey
      )
    ) {
      if (
        !this.isQuizOpen &&
        !this.npcDialogOpen &&
        !this.questCompleteOpen &&
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
      this.npcDialogOpen ||
      this.questCompleteOpen ||
      this.isBattleOpen ||
      this.isBattleQuestionOpen
    ) {
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

    this.interactText.setVisible(
      false
    );

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
      this.interactText.setText(
        "[ E ] Buka Chest"
      );

      this.interactText.setVisible(
        true
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
      this.interactText.setText(
        `[ E ] Lawan ${nearestMonster.name}`
      );

      this.interactText.setVisible(
        true
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
      if (
        this.grammarMaster.isNearby &&
        Phaser.Input.Keyboard.JustDown(
          this.interactKey
        )
      ) {
        this.grammarMaster.talk();
      }
    }

    // ==================================================
    // FOREST GATE
    // ==================================================

    if (
      this.forestGate
    ) {
      const gateDistance =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.forestGate.x,
          this.forestGate.y
        );

      if (
        gateDistance < 90
      ) {
        this.forestGatePrompt.setVisible(
          true
        );

        this.interactText.setText(
          "[ E ] Masuk Forest of Isim"
        );

        this.interactText.setVisible(
          true
        );

      } else {
        this.forestGatePrompt.setVisible(
          false
        );
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
      this.npcDialogOpen ||
      this.questCompleteOpen
    ) {
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

    this.interactText.setVisible(
      false
    );

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
    this.interactText.setVisible(
      false
    );

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
        700,
        520,
        0xffffff
      );

    panel.setDepth(601);

    // ==================================================
    // TITLE
    // ==================================================

    const title =
      this.add
        .text(
          400,
          55,
          "⚔️ BATTLE",
          {
            fontSize: "34px",
            color: "#1A365D",
            fontStyle: "bold",
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
          105,
          monster.name,
          {
            fontSize: "26px",
            color: "#C53030",
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
        230,
        150,
        340,
        20,
        0x1a365d
      );

    monsterHPBackground.setDepth(
      602
    );

    monsterHPBackground.setOrigin(
      0,
      0.5
    );

    const monsterHPBar =
      this.add.rectangle(
        230,
        150,
        340,
        20,
        0xdc2626
      );

    monsterHPBar.setDepth(603);

    monsterHPBar.setOrigin(
      0,
      0.5
    );

    this.battleMonsterHPText =
      this.add
        .text(
          400,
          180,
          "",
          {
            fontSize: "17px",
            color: "#2D3748",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battleMonsterHPText.setDepth(
      602
    );

    // ==================================================
    // PLAYER NAME
    // ==================================================

    const playerName =
      this.add
        .text(
          400,
          225,
          "PLAYER",
          {
            fontSize: "24px",
            color: "#3182CE",
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
        230,
        265,
        340,
        20,
        0x1a365d
      );

    playerHPBackground.setDepth(
      602
    );

    playerHPBackground.setOrigin(
      0,
      0.5
    );

    const playerHPBar =
      this.add.rectangle(
        230,
        265,
        340,
        20,
        0x3182ce
      );

    playerHPBar.setDepth(603);

    playerHPBar.setOrigin(
      0,
      0.5
    );

    this.battlePlayerHPText =
      this.add
        .text(
          400,
          295,
          "",
          {
            fontSize: "17px",
            color: "#2D3748",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battlePlayerHPText.setDepth(
      602
    );

    // ==================================================
    // PLAYER STATS
    // ==================================================

    const playerStats =
      this.add
        .text(
          400,
          325,
          `ATK: ${this.getPlayerAttack()}    DEF: ${this.getTotalDefense()}`,
          {
            fontSize: "16px",
            color: "#4A5568",
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
          350,
          "COMBO x0",
          {
            fontSize: "16px",
            color: "#D69E2E",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battleComboText.setDepth(
      602
    );

    // ==================================================
    // BATTLE LOG BACKGROUND
    // ==================================================

    const battleLogBackground =
      this.add.rectangle(
        400,
        390,
        570,
        55,
        0xf1f5f9
      );

    battleLogBackground.setDepth(
      602
    );

    // ==================================================
    // BATTLE LOG
    // ==================================================

    this.battleLogText =
      this.add
        .text(
          400,
          390,
          `Battle melawan ${monster.name} dimulai!`,
          {
            fontSize: "15px",
            color: "#2D3748",
            align: "center",

            wordWrap: {
              width: 530,
            },
          }
        )
        .setOrigin(0.5);

    this.battleLogText.setDepth(
      603
    );

    // ==================================================
    // BATTLE CHARACTER VISUALS
    // ==================================================

    this.battlePlayerVisual =
      this.add.container(
        150,
        265
      );

    const battlePlayerBody =
      this.add.circle(
        0,
        0,
        22,
        0x3182ce
      );

    const battlePlayerMark =
      this.add
        .text(
          0,
          0,
          "⚔",
          {
            fontSize: "19px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.battlePlayerVisual.add([
      battlePlayerBody,
      battlePlayerMark,
    ]);

    this.battlePlayerVisual.setDepth(
      603
    );

    this.battleMonsterVisual =
      this.add.container(
        650,
        150
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
        ? 120
        : 105,
      this.currentMonster?.id === "irabGolem"
        ? 120
        : 105
    );

    this.battleMonsterVisual.add(
      battleMonsterBody
    );

    this.battleMonsterVisual.setDepth(
      603
    );

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
        465,
        170,
        55,
        0xc53030
      );

    attackButton.setDepth(602);

    attackButton.setInteractive({
      useHandCursor: true,
    });

    const attackText =
      this.add
        .text(
          200,
          465,
          "⚔️ SERANG",
          {
            fontSize: "17px",
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
        465,
        170,
        55,
        0x718096
      );

    skillButton.setDepth(602);

    skillButton.setInteractive({
      useHandCursor: true,
    });

    const skillText =
      this.add
        .text(
          400,
          465,
          "✨ SKILL",
          {
            fontSize: "17px",
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
        465,
        170,
        55,
        0x3182ce
      );

    defendButton.setDepth(602);

    defendButton.setInteractive({
      useHandCursor: true,
    });

    const defendText =
      this.add
        .text(
          600,
          465,
          "🛡️ BERTAHAN",
          {
            fontSize: "19px",
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

    // ==================================================
    // HOVER SKILL
    // ==================================================

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
            0x9f7aea
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
            0x805ad5
          );
        } else {
          skillButton.setFillStyle(
            0x718096
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
        525,
        180,
        40,
        0x4a5568
      );

    exitButton.setDepth(602);

    exitButton.setInteractive({
      useHandCursor: true,
    });

    const exitText =
      this.add
        .text(
          400,
          525,
          "KELUAR",
          {
            fontSize: "15px",
            color: "#ffffff",
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
          340 *
            monsterPercentage,
          20
        );

        playerHPBar.setDisplaySize(
          340 *
            playerPercentage,
          20
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
              0x805ad5
            );
          } else {
            this.battleSkillButton.setFillStyle(
              0x718096
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
          0xe53e3e
        );
      }
    );

    attackButton.on(
      "pointerout",
      () => {
        attackButton.setFillStyle(
          0xc53030
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
          0x4299e1
        );
      }
    );

    defendButton.on(
      "pointerout",
      () => {
        defendButton.setFillStyle(
          0x3182ce
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
        0x000000,
        0.72
      );

    overlay.setDepth(800);

    // ==================================================
    // PANEL
    // ==================================================

    const panel =
      this.add.rectangle(
        400,
        300,
        650,
        470,
        0xffffff
      );

    panel.setDepth(801);

    // ==================================================
    // TITLE
    // ==================================================

    const title =
      this.add
        .text(
          400,
          75,
          "📖 NAHWU CHALLENGE",
          {
            fontSize: "30px",
            color: "#1A365D",
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
          120,
          "Jawab dengan benar untuk menyerang!",
          {
            fontSize: "15px",
            color: "#718096",
            fontStyle: "italic",
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
          150,
          `Difficulty: ${this.currentBattleQuestion.difficulty}`,
          {
            fontSize: "14px",
            color: "#D69E2E",
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
          205,
          this.currentBattleQuestion.question,
          {
            fontSize: "21px",
            color: "#2D3748",
            fontStyle: "bold",
            align: "center",

            wordWrap: {
              width: 540,
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
          270 +
          index * 55;

        const button =
          this.add.rectangle(
            400,
            y,
            500,
            42,
            0xeaf2ff
          );

        button.setDepth(802);

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
                fontSize: "18px",
                color: "#1A365D",
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
        0x111827,
        0.98
      );

    overlay.setDepth(900);

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
        0x000000,
        0.82
      );

    overlay.setDepth(1000);

    overlay.setInteractive();

    const panel =
      this.add.rectangle(
        400,
        300,
        650,
        470,
        0xffffff
      );

    panel.setDepth(1001);

    const skill =
      skills[this.currentSkill];

    const title =
      this.add
        .text(
          400,
          85,
          `${skill.icon} ${skill.name}`,
          {
            fontSize: "30px",
            color: "#805ad5",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(1002);

    const info =
      this.add
        .text(
          400,
          125,
          "Jawab dengan benar untuk menggunakan skill!",
          {
            fontSize: "15px",
            color: "#718096",
            fontStyle: "italic",
          }
        )
        .setOrigin(0.5);

    info.setDepth(1002);

    const questionText =
      this.add
        .text(
          400,
          215,
          question.question,
          {
            fontSize: "22px",
            color: "#2D3748",
            fontStyle: "bold",
            align: "center",
            wordWrap: {
              width: 540,
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
          300 + index * 58;

        const button =
          this.add.rectangle(
            400,
            y,
            500,
            44,
            0xeaf2ff
          );

        button.setDepth(1002);
        button.setInteractive({
          useHandCursor: true,
        });

        const answerText =
          this.add
            .text(
              400,
              y,
              answer.text,
              {
                fontSize: "17px",
                color: "#1A365D",
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
              0x3182ce
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
              0xeaf2ff
            );

            answerText.setColor(
              "#1A365D"
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
        560,
        350,
        0xffffff
      );

    panel.setDepth(701);

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
                ? "#15803D"
                : "#DC2626",

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

            color: "#2D3748",

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
        0x1a365d
      );

    button.setDepth(702);

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
            color: "#ffffff",
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

        this.interactText.setVisible(
          false
        );
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
  }

  // ==================================================
  // PLAYER ATTACK
  // ==================================================

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

  // ==================================================
  // TOTAL DEFENSE
  // ==================================================

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
    reward
  ) {
    const chest = {
      x,
      y,
      opened: false,
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
        "chestClosedPixel"
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
          "CHEST",
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

    this.visualFoundation.animateChest(
      chest
    );
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

    this.interactText.setVisible(
      false
    );

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

      if (
        this.currentChest.body &&
        this.currentChest.body.active
      ) {
        this.currentChest.body.setTexture(
          "chestOpenPixel"
        );

        this.currentChest.body.setDisplaySize(
          54,
          48
        );
      }

      this.currentChest.label.setText(
        "OPENED!"
      );
    }

    const questCompleted =
      this.updateQuestProgress(
        questionType
      );

    this.pendingQuestCompletion =
      questCompleted;

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
    this.npcDialogOpen =
      true;

    this.npcDialogObjects =
      [];

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.55
      );

    overlay.setDepth(400);

    const panel =
      this.add.rectangle(
        400,
        425,
        700,
        240,
        0xffffff
      );

    panel.setDepth(401);

    const name =
      this.add
        .text(
          80,
          325,
          "👨‍🏫 " +
            npc.npcName,
          {
            fontSize: "24px",
            color: "#1A365D",
            fontStyle: "bold",
          }
        );

    name.setDepth(402);

    const dialog =
      this.add.text(
        80,
        365,
        "Selamat datang di Nahwu Village!\n" +
          "Aku punya sebuah tantangan untukmu.",
        {
          fontSize: "19px",
          color: "#2D3748",
          lineSpacing: 8,
        }
      );

    dialog.setDepth(402);

    const quest =
      quests.basicIsim;

    const questTitle =
      this.add.text(
        80,
        425,
        `Quest: ${quest.title}`,
        {
          fontSize: "18px",
          color: "#D4AF37",
          fontStyle: "bold",
        }
      );

    questTitle.setDepth(402);

    const questDescription =
      this.add.text(
        80,
        455,
        quest.description,
        {
          fontSize: "16px",
          color: "#2D3748",
        }
      );

    questDescription.setDepth(
      402
    );

    // ==================================================
    // ACCEPT
    // ==================================================

    const acceptButton =
      this.add.rectangle(
        620,
        510,
        220,
        55,
        0xd4af37
      );

    acceptButton.setDepth(405);

    acceptButton.setInteractive({
      useHandCursor: true,
    });

    const acceptText =
      this.add
        .text(
          620,
          510,
          "TERIMA QUEST",
          {
            fontSize: "17px",
            color: "#1A365D",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    acceptText.setDepth(406);

    acceptButton.on(
      "pointerover",
      () => {
        acceptButton.setFillStyle(
          0xffdf70
        );
      }
    );

    acceptButton.on(
      "pointerout",
      () => {
        acceptButton.setFillStyle(
          0xd4af37
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

    // ==================================================
    // NANTI
    // ==================================================

    const closeButton =
      this.add.rectangle(
        620,
        575,
        220,
        40,
        0x1a365d
      );

    closeButton.setDepth(405);

    closeButton.setInteractive({
      useHandCursor: true,
    });

    const closeText =
      this.add
        .text(
          620,
          575,
          "NANTI",
          {
            fontSize: "15px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    closeText.setDepth(406);

    closeButton.on(
      "pointerdown",
      () => {
        this.closeNPCDialog();
      }
    );

    this.npcDialogObjects.push(
      overlay,
      panel,
      name,
      dialog,
      questTitle,
      questDescription,
      acceptButton,
      acceptText,
      closeButton,
      closeText
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

    this.closeNPCDialog();

    this.showQuestHUD();
  }

  // ==================================================
  // CLOSE NPC DIALOG
  // ==================================================

  closeNPCDialog() {
    if (
      !this.npcDialogObjects
    ) {
      this.npcDialogOpen =
        false;

      return;
    }

    this.npcDialogObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.npcDialogObjects =
      [];

    this.npcDialogOpen =
      false;
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
  }

  // ==================================================
  // UPDATE QUEST PROGRESS
  // ==================================================

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
  // QUEST COMPLETE
  // ==================================================

  showQuestComplete(
    titleText,
    rewardText
  ) {
    this.questCompleteOpen =
      true;

    this.questCompleteObjects =
      [];

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.65
      );

    overlay.setDepth(500);

    const panel =
      this.add.rectangle(
        400,
        300,
        550,
        340,
        0xffffff
      );

    panel.setDepth(501);

    const title =
      this.add
        .text(
          400,
          195,
          "QUEST COMPLETE!",
          {
            fontSize: "32px",
            color: "#D4AF37",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(502);

    const quest =
      this.add
        .text(
          400,
          250,
          titleText,
          {
            fontSize: "22px",
            color: "#1A365D",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    quest.setDepth(502);

    const reward =
      this.add
        .text(
          400,
          315,
          rewardText,
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

    reward.setDepth(502);

    const button =
      this.add.rectangle(
        400,
        420,
        200,
        50,
        0x1a365d
      );

    button.setDepth(502);

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
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    buttonText.setDepth(503);

    this.questCompleteObjects.push(
      overlay,
      panel,
      title,
      quest,
      reward,
      button,
      buttonText
    );

    button.on(
      "pointerdown",
      () => {
        this.questCompleteObjects.forEach(
          (object) => {
            if (object) {
              object.destroy();
            }
          }
        );

        this.questCompleteObjects =
          [];

        this.questCompleteOpen =
          false;
      }
    );
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
  // SHOW INVENTORY
  // ==================================================

  showInventory() {
    this.inventoryOpen =
      true;

    this.inventoryObjects =
      [];

    const overlay =
      this.add.rectangle(
        400,
        300,
        800,
        600,
        0x000000,
        0.65
      );

    overlay.setDepth(300);

    const panel =
      this.add.rectangle(
        400,
        300,
        680,
        510,
        0xffffff
      );

    panel.setDepth(301);

    const title =
      this.add
        .text(
          400,
          65,
          "INVENTORY",
          {
            fontSize: "32px",
            color: "#1A365D",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(302);

    const stats =
      this.add
        .text(
          400,
          110,
          `LVL ${this.playerData.level}   XP: ${this.playerData.xp}   GOLD: ${this.playerData.gold}`,
          {
            fontSize: "17px",
            color: "#2D3748",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    stats.setDepth(302);

    this.inventoryObjects.push(
      overlay,
      panel,
      title,
      stats
    );

    // ==================================================
    // EMPTY
    // ==================================================

    if (
      this.playerData.inventory
        .length === 0
    ) {
      const empty =
        this.add
          .text(
            400,
            300,
            "Inventory masih kosong.",
            {
              fontSize: "22px",
              color: "#666666",
            }
          )
          .setOrigin(0.5);

      empty.setDepth(302);

      this.inventoryObjects.push(
        empty
      );
    }

    // ==================================================
    // ITEMS
    // ==================================================

    this.playerData.inventory.forEach(
      (
        item,
        index
      ) => {
        const y =
          185 +
          index * 105;

        const card =
          this.add.rectangle(
            400,
            y,
            610,
            85,
            0xeaf2ff
          );

        card.setDepth(302);

        const icon =
          this.add
            .text(
              150,
              y,
              item.icon ||
                "🗡️",
              {
                fontSize: "36px",
              }
            )
            .setOrigin(0.5);

        icon.setDepth(303);

        const rarityColor =
          this.getRarityColor(
            item.rarity
          );

        const itemName =
          this.add.text(
            200,
            y - 20,
            item.name,
            {
              fontSize: "18px",
              color: rarityColor,
              fontStyle: "bold",
            }
          );

        itemName.setDepth(303);

        const itemType =
          this.add.text(
            200,
            y + 2,
            item.type,
            {
              fontSize: "12px",
              color: "#4A5568",
            }
          );

        itemType.setDepth(303);

        const rarity =
          this.add.text(
            200,
            y + 18,
            String(
              item.rarity ||
                "Common"
            ).toUpperCase(),
            {
              fontSize: "12px",
              color: rarityColor,
              fontStyle: "bold",
            }
          );

        rarity.setDepth(303);

        const description =
          this.add.text(
            350,
            y - 10,
            item.description ||
              "Tidak ada deskripsi.",
            {
              fontSize: "11px",
              color: "#2D3748",
              wordWrap: {
                width: 160,
              },
            }
          );

        description.setDepth(303);

        const equipped =
          this.isItemEquipped(
            item
          );

        const equipButton =
          this.add.rectangle(
            650,
            y,
            100,
            34,
            equipped
              ? 0x3182ce
              : 0x1a365d
          );

        equipButton.setDepth(303);

        equipButton.setInteractive({
          useHandCursor: true,
        });

        const equipText =
          this.add
            .text(
              650,
              y,
              equipped
                ? "EQUIPPED"
                : "EQUIP",
              {
                fontSize: "11px",
                color: "#ffffff",
                fontStyle: "bold",
              }
            )
            .setOrigin(0.5);

        equipText.setDepth(304);

        equipButton.on(
          "pointerover",
          () => {
            equipButton.setFillStyle(
              equipped
                ? 0x2b6cb0
                : 0x3182ce
            );
          }
        );

        equipButton.on(
          "pointerout",
          () => {
            equipButton.setFillStyle(
              equipped
                ? 0x3182ce
                : 0x1a365d
            );
          }
        );

        equipButton.on(
          "pointerdown",
          () => {
            if (equipped) {
              this.unequipItem(
                item
              );
            } else {
              this.equipItem(
                index
              );
            }
          }
        );

        this.inventoryObjects.push(
          card,
          icon,
          itemName,
          itemType,
          rarity,
          description,
          equipButton,
          equipText
        );
      }
    );

    // ==================================================
    // CLOSE
    // ==================================================

    const closeButton =
      this.add.rectangle(
        400,
        550,
        220,
        45,
        0x1a365d
      );

    closeButton.setDepth(302);

    closeButton.setInteractive({
      useHandCursor: true,
    });

    const closeText =
      this.add
        .text(
          400,
          550,
          "TUTUP [ I ]",
          {
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    closeText.setDepth(303);

    this.inventoryObjects.push(
      closeButton,
      closeText
    );

    closeButton.on(
      "pointerdown",
      () => {
        this.closeInventory();
      }
    );
  }

  // ==================================================
  // CLOSE INVENTORY
  // ==================================================

  closeInventory() {
    if (
      !this.inventoryObjects
    ) {
      this.inventoryOpen =
        false;

      return;
    }

    this.inventoryObjects.forEach(
      (object) => {
        if (object) {
          object.destroy();
        }
      }
    );

    this.inventoryObjects =
      [];

    this.inventoryOpen =
      false;
  }
}

export default VillageScene;