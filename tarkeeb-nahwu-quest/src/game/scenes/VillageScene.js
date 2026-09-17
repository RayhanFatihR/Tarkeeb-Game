import Phaser from "phaser";
import NPC from "../objects/NPC";
import Monster from "../objects/Monster";
import quests from "../data/quests";
import questions from "../data/questions";
import items from "../data/items";
import monsters from "../data/monsters";
import battleQuestions from "../data/battleQuestions";

class VillageScene extends Phaser.Scene {
  constructor() {
    super("VillageScene");
  }

  // ==================================================
  // CREATE
  // ==================================================

  create() {
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

    if (
      savedData.equipped.Weapon === undefined
    ) {
      savedData.equipped.Weapon = null;
    }

    if (
      savedData.equipped.Armor === undefined
    ) {
      savedData.equipped.Armor = null;
    }

    if (
      savedData.equipped.Accessory === undefined
    ) {
      savedData.equipped.Accessory = null;
    }

    this.playerData = savedData;

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

    this.pendingQuestCompletion = false;

    // ==================================================
    // GAME STATE
    // ==================================================

    this.isQuizOpen = false;
    this.isBattleOpen = false;
    this.isBattleQuestionOpen = false;

    this.answerLocked = false;

    this.inventoryOpen = false;
    this.npcDialogOpen = false;
    this.questCompleteOpen = false;

    // ==================================================
    // OBJECT ARRAYS
    // ==================================================

    this.quizObjects = [];
    this.inventoryObjects = [];
    this.npcDialogObjects = [];
    this.questCompleteObjects = [];
    this.battleObjects = [];
    this.battleQuestionObjects = [];

    // ==================================================
    // CURRENT OBJECTS
    // ==================================================

    this.currentQuestion = null;
    this.currentChest = null;
    this.currentMonster = null;
    this.currentBattleQuestion = null;

    // ==================================================
    // PLAYER BATTLE STATS
    // ==================================================

    this.playerMaxHP = 100;
    this.playerHP = 100;

    this.playerBaseAttack = 20;

    this.isDefending = false;

    // ==================================================
    // BATTLE UI REFERENCES
    // ==================================================

    this.battleLogText = null;
    this.battlePlayerHPText = null;
    this.battleMonsterHPText = null;

    // ==================================================
    // WORLD
    // ==================================================

    this.createWorld();

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
        250,
        420,
        "Grammar Master"
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
    // UPDATE HUD
    // ==================================================

    this.updateHUD();

    // ==================================================
    // QUEST HUD
    // ==================================================

    if (this.activeQuest) {
      this.showQuestHUD();
    }
  }

  // ==================================================
  // CREATE WORLD
  // ==================================================

  createWorld() {
    // Background
    this.add.rectangle(
      400,
      300,
      800,
      600,
      0x7cb342
    );

    // Jalan vertikal
    this.add.rectangle(
      400,
      300,
      120,
      600,
      0xd8c39b
    );

    // Jalan horizontal
    this.add.rectangle(
      400,
      300,
      800,
      100,
      0xd8c39b
    );

    // Obstacles
    this.obstacles =
      this.physics.add.staticGroup();

    // ==================================================
    // TITLE
    // ==================================================

    this.add
      .text(
        400,
        100,
        "NAHWU VILLAGE",
        {
          fontSize: "32px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    // ==================================================
    // HOUSE
    // ==================================================

    this.createHouse(
      180,
      230,
      "Nahwu House"
    );

    this.createHouse(
      620,
      230,
      "Grammar House"
    );

    // ==================================================
    // TREES
    // ==================================================

    this.createTree(80, 100);
    this.createTree(720, 100);

    this.createTree(80, 500);
    this.createTree(720, 500);

    this.createTree(150, 520);
    this.createTree(650, 520);

    // ==================================================
    // CHESTS
    // ==================================================

    this.chests = [];

    this.createChest(
      620,
      420,
      items.swordOfIsim
    );

    this.createChest(
      300,
      500,
      items.shieldOfMubtada
    );

    this.createChest(
      720,
      350,
      items.ringOfRafa
    );

    // ==================================================
    // MONSTERS
    // ==================================================

    this.monsters = [];

    // Nahwu Slime
    const slime =
      new Monster(
        this,
        580,
        500,
        monsters.nahwuSlime
      );

    this.monsters.push(
      slime
    );

    // Grammar Goblin
    const goblin =
      new Monster(
        this,
        180,
        500,
        monsters.grammarGoblin
      );

    this.monsters.push(
      goblin
    );

    // I'rab Golem
    const golem =
      new Monster(
        this,
        700,
        250,
        monsters.irabGolem
      );

    this.monsters.push(
      golem
    );
  }

  // ==================================================
  // CREATE PLAYER
  // ==================================================

  createPlayer() {
    this.player =
      this.add.circle(
        400,
        350,
        25,
        0x3182ce
      );

    this.physics.add.existing(
      this.player
    );

    this.player.body.setCollideWorldBounds(
      true
    );

    this.playerSpeed = 200;

    // Keyboard
    this.keys =
      this.input.keyboard.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
      });

    this.cursors =
      this.input.keyboard.createCursorKeys();

    // E
    this.interactKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

    // I
    this.inventoryKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.I
      );

    // Player label
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
        .setOrigin(0.5);

    // Interaction text
    this.interactText =
      this.add
        .text(
          400,
          550,
          "",
          {
            fontSize: "20px",
            color: "#ffffff",
            backgroundColor: "#1A365D",

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
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update() {
    if (!this.player) {
      return;
    }

    // ==================================================
    // INVENTORY
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

    // Diagonal
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

    // Player label
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
        if (
          monster &&
          !monster.isDead()
        ) {
          monster.update(
            this.player
          );
        }
      }
    );

    // ==================================================
    // CHEST
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

    this.playerHP =
      this.playerMaxHP;

    this.isDefending =
      false;

    this.interactText.setVisible(
      false
    );

    this.battleObjects =
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
        0.78
      );

    overlay.setDepth(
      600
    );

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

    panel.setDepth(
      601
    );

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

    title.setDepth(
      602
    );

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

    monsterName.setDepth(
      602
    );

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

    monsterHPBar.setDepth(
      603
    );

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
    // PLAYER
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

    playerName.setDepth(
      602
    );

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

    playerHPBar.setDepth(
      603
    );

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

    const playerAttack =
      this.getPlayerAttack();

    const playerDefense =
      this.getTotalDefense();

    const playerStats =
      this.add
        .text(
          400,
          325,
          `ATK: ${playerAttack}    DEF: ${playerDefense}`,
          {
            fontSize: "16px",
            color: "#4A5568",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    playerStats.setDepth(
      602
    );

    // ==================================================
    // BATTLE LOG
    // ==================================================

    const battleLogBackground =
      this.add.rectangle(
        400,
        370,
        570,
        55,
        0xf1f5f9
      );

    battleLogBackground.setDepth(
      602
    );

    this.battleLogText =
      this.add
        .text(
          400,
          370,
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
    // ATTACK BUTTON
    // ==================================================

    const attackButton =
      this.add.rectangle(
        300,
        450,
        200,
        55,
        0xc53030
      );

    attackButton.setDepth(
      602
    );

    attackButton.setInteractive({
      useHandCursor: true,
    });

    const attackText =
      this.add
        .text(
          300,
          450,
          "⚔️ SERANG",
          {
            fontSize: "19px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    attackText.setDepth(
      603
    );

    // ==================================================
    // DEFEND BUTTON
    // ==================================================

    const defendButton =
      this.add.rectangle(
        500,
        450,
        200,
        55,
        0x3182ce
      );

    defendButton.setDepth(
      602
    );

    defendButton.setInteractive({
      useHandCursor: true,
    });

    const defendText =
      this.add
        .text(
          500,
          450,
          "🛡️ BERTAHAN",
          {
            fontSize: "19px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    defendText.setDepth(
      603
    );

    // ==================================================
    // EXIT
    // ==================================================

    const exitButton =
      this.add.rectangle(
        400,
        500,
        180,
        40,
        0x4a5568
      );

    exitButton.setDepth(
      602
    );

    exitButton.setInteractive({
      useHandCursor: true,
    });

    const exitText =
      this.add
        .text(
          400,
          500,
          "KELUAR",
          {
            fontSize: "15px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    exitText.setDepth(
      603
    );

    // ==================================================
    // UPDATE BATTLE UI
    // ==================================================

    const updateBattleUI =
      () => {
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
      };

    updateBattleUI();

    // ==================================================
    // ATTACK
    // ==================================================

    attackButton.on(
      "pointerdown",
      () => {
        if (
          !this.isBattleOpen ||
          monster.isDead()
        ) {
          return;
        }

        this.openBattleQuestion(
          attackButton,
          defendButton,
          updateBattleUI
        );
      }
    );

    // ==================================================
    // DEFEND
    // ==================================================

    defendButton.on(
      "pointerdown",
      () => {
        if (
          !this.isBattleOpen ||
          monster.isDead()
        ) {
          return;
        }

        this.isDefending =
          true;

        attackButton.disableInteractive();
        defendButton.disableInteractive();

        this.battleLogText.setText(
          "🛡️ Kamu bersiap bertahan!"
        );

        this.time.delayedCall(
          500,
          () => {
            if (
              !this.isBattleOpen ||
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
      battleLogBackground,
      this.battleLogText,
      attackButton,
      attackText,
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
    defendButton.disableInteractive();

    this.showBattleQuestion(
      attackButton,
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
      battleQuestions.length ===
        0
    ) {
      return null;
    }

    const index =
      Phaser.Math.Between(
        0,
        battleQuestions.length - 1
      );

    return battleQuestions[
      index
    ];
  }

  // ==================================================
  // SHOW BATTLE QUESTION
  // ==================================================

  showBattleQuestion(
    attackButton,
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

    overlay.setDepth(
      800
    );

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

    panel.setDepth(
      801
    );

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

    title.setDepth(
      802
    );

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

    info.setDepth(
      802
    );

    // ==================================================
    // QUESTION
    // ==================================================

    const question =
      this.add
        .text(
          400,
          185,
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

    question.setDepth(
      802
    );

    this.battleQuestionObjects.push(
      overlay,
      panel,
      title,
      info,
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
          255 +
          index * 55;

        const button =
          this.add.rectangle(
            400,
            y,
            500,
            42,
            0xeaf2ff
          );

        button.setDepth(
          802
        );

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

        text.setDepth(
          803
        );

        this.battleQuestionObjects.push(
          button,
          text
        );

        // Hover
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

        // Click
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
    defendButton,
    updateBattleUI
  ) {
    this.clearBattleQuestion();

    this.isBattleQuestionOpen =
      false;

    this.answerLocked =
      false;

    if (
      !this.currentMonster ||
      this.currentMonster.isDead()
    ) {
      return;
    }

    // ==================================================
    // CORRECT
    // ==================================================

    if (isCorrect) {
      const attack =
        this.getPlayerAttack();

      // Bonus damage agar menjawab benar terasa rewarding
      const damage =
        Math.max(
          10,
          attack -
            this.currentMonster.defense +
            10
        );

      this.currentMonster.takeDamage(
        damage
      );

      this.battleLogText.setText(
        `✅ BENAR!\nKamu memberikan ${damage} damage!`
      );

      updateBattleUI();

      // Monster defeated
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

      // Monster counter attack
      attackButton.disableInteractive();
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

            defendButton.setInteractive({
              useHandCursor: true,
            });
          }
        }
      );

      return;
    }

    // ==================================================
    // WRONG
    // ==================================================

    this.battleLogText.setText(
      "❌ SALAH!\nKamu gagal menyerang."
    );

    attackButton.disableInteractive();
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

          defendButton.setInteractive({
            useHandCursor: true,
          });
        }
      }
    );
  }

  // ==================================================
  // CLEAR BATTLE QUESTION
  // ==================================================

  clearBattleQuestion() {
    if (
      !this.battleQuestionObjects
    ) {
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

    this.playerHP -=
      damage;

    if (
      this.playerHP < 0
    ) {
      this.playerHP = 0;
    }

    if (
      this.isDefending
    ) {
      this.battleLogText.setText(
        `🛡️ Kamu bertahan!\n${monster.name} memberikan ${damage} damage.`
      );
    } else {
      this.battleLogText.setText(
        `🔴 ${monster.name} menyerang!\nDamage: ${damage}`
      );
    }

    this.isDefending =
      false;

    updateBattleUI();

    // Player defeated
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

    this.time.delayedCall(
      700,
      () => {
        if (!this.isBattleOpen) {
          return;
        }

        // Destroy monster
        monster.destroy();

        // Remove from array
        this.monsters =
          this.monsters.filter(
            (item) =>
              item !== monster
          );

        // Reward
        const reward =
          this.getMonsterReward(
            monster
          );

        const xpResult =
          this.addXP(
            reward.xp,
            "isim"
          );

        this.playerData.gold =
          Number(
            this.playerData.gold
          ) +
          reward.gold;

        this.registry.set(
          "playerData",
          this.playerData
        );

        this.updateHUD();

        this.showBattleResult(
          "VICTORY!",
          `${monster.name} berhasil dikalahkan!\n\n` +
            `+${xpResult.finalXP} XP\n` +
            `+${reward.gold} GOLD`,
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
          "Kamu belum berhasil mengalahkan monster.\n\nCoba lagi setelah meningkatkan equipment-mu.",
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

    overlay.setDepth(
      700
    );

    const panel =
      this.add.rectangle(
        400,
        300,
        560,
        350,
        0xffffff
      );

    panel.setDepth(
      701
    );

    const title =
      this.add
        .text(
          400,
          190,
          titleText,
          {
            fontSize: "40px",
            color: victory
              ? "#15803d"
              : "#dc2626",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    title.setDepth(
      702
    );

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

    message.setDepth(
      702
    );

    const button =
      this.add.rectangle(
        400,
        430,
        220,
        55,
        0x1a365d
      );

    button.setDepth(
      702
    );

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

    buttonText.setDepth(
      703
    );

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

        this.playerHP =
          this.playerMaxHP;

        this.isDefending =
          false;

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

    this.isDefending =
      false;

    this.playerHP =
      this.playerMaxHP;

    this.isBattleOpen =
      false;
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
  // DEFENSE
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
  // HOUSE
  // ==================================================

  createHouse(
    x,
    y,
    name
  ) {
    this.add.rectangle(
      x,
      y,
      140,
      100,
      0xf5e5c0
    );

    this.add.triangle(
      x,
      y - 85,
      x - 70,
      y - 10,
      x + 70,
      y - 10,
      x,
      y - 110,
      0xb44a3a
    );

    this.add
      .text(
        x,
        y + 5,
        name,
        {
          fontSize: "15px",
          color: "#1A365D",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    const collider =
      this.add.rectangle(
        x,
        y,
        150,
        115,
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
  // TREE
  // ==================================================

  createTree(
    x,
    y
  ) {
    this.add.rectangle(
      x,
      y + 35,
      20,
      50,
      0x8b4513
    );

    this.add.circle(
      x,
      y,
      35,
      0x2e7d32
    );

    this.add.circle(
      x - 20,
      y + 10,
      25,
      0x388e3c
    );

    this.add.circle(
      x + 20,
      y + 10,
      25,
      0x388e3c
    );

    const collider =
      this.add.rectangle(
        x,
        y + 20,
        65,
        75,
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
  // CHEST
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
      reward,

      body: null,
      lid: null,
      label: null,
    };

    chest.body =
      this.add.rectangle(
        x,
        y,
        50,
        40,
        0x8b4513
      );

    chest.lid =
      this.add.rectangle(
        x,
        y - 15,
        50,
        15,
        0xd4af37
      );

    chest.label =
      this.add
        .text(
          x,
          y + 30,
          "CHEST",
          {
            fontSize: "14px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    this.chests.push(
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
  // RANDOM QUESTION
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
  // SHOW QUIZ
  // ==================================================

  showQuiz() {
    this.quizObjects =
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

    overlay.setDepth(
      100
    );

    const panel =
      this.add.rectangle(
        400,
        300,
        650,
        440,
        0xffffff
      );

    panel.setDepth(
      101
    );

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

    title.setDepth(
      102
    );

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

    difficulty.setDepth(
      102
    );

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

    question.setDepth(
      102
    );

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

        button.setDepth(
          102
        );

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

        text.setDepth(
          103
        );

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
  // ANSWER QUIZ
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

      this.playerData.inventory.push(
        rewardItem
      );
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

      this.currentChest.lid.setFillStyle(
        0x888888
      );

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
  // SHOW RESULT
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

    overlay.setDepth(
      200
    );

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

    panel.setDepth(
      201
    );

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

    title.setDepth(
      202
    );

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

    message.setDepth(
      202
    );

    const button =
      this.add.rectangle(
        400,
        420,
        200,
        50,
        0x1a365d
      );

    button.setDepth(
      202
    );

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

    buttonText.setDepth(
      203
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

    overlay.setDepth(
      400
    );

    const panel =
      this.add.rectangle(
        400,
        425,
        700,
        240,
        0xffffff
      );

    panel.setDepth(
      401
    );

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

    name.setDepth(
      402
    );

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

    dialog.setDepth(
      402
    );

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

    questTitle.setDepth(
      402
    );

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

    const acceptButton =
      this.add.rectangle(
        620,
        510,
        220,
        55,
        0xd4af37
      );

    acceptButton.setDepth(
      405
    );

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

    acceptText.setDepth(
      406
    );

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

    const closeButton =
      this.add.rectangle(
        620,
        575,
        220,
        40,
        0x1a365d
      );

    closeButton.setDepth(
      405
    );

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

    closeText.setDepth(
      406
    );

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

    this.npcDialogObjects = [];

    this.npcDialogOpen =
      false;
  }

  // ==================================================
  // QUEST HUD
  // ==================================================

  showQuestHUD() {
    this.clearQuestHUD();

    if (
      !this.activeQuest
    ) {
      return;
    }

    this.questObjects =
      [];

    const panel =
      this.add.rectangle(
        610,
        110,
        300,
        105,
        0x1a365d,
        0.95
      );

    panel.setDepth(
      50
    );

    const label =
      this.add.text(
        475,
        75,
        "QUEST",
        {
          fontSize: "16px",
          color: "#D4AF37",
          fontStyle: "bold",
        }
      );

    label.setDepth(
      51
    );

    const title =
      this.add.text(
        475,
        100,
        this.activeQuest.title,
        {
          fontSize: "15px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      );

    title.setDepth(
      51
    );

    const progress =
      this.add.text(
        475,
        125,
        `Progress: ${this.activeQuest.progress} / ${this.activeQuest.requiredProgress}`,
        {
          fontSize: "14px",
          color: "#ffffff",
        }
      );

    progress.setDepth(
      51
    );

    this.questObjects.push(
      panel,
      label,
      title,
      progress
    );
  }

  // ==================================================
  // UPDATE QUEST
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

    overlay.setDepth(
      500
    );

    const panel =
      this.add.rectangle(
        400,
        300,
        550,
        340,
        0xffffff
      );

    panel.setDepth(
      501
    );

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

    title.setDepth(
      502
    );

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

    quest.setDepth(
      502
    );

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

    reward.setDepth(
      502
    );

    const button =
      this.add.rectangle(
        400,
        420,
        200,
        50,
        0x1a365d
      );

    button.setDepth(
      502
    );

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

    buttonText.setDepth(
      503
    );

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
  // EQUIP
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
  // UNEQUIP
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
  // INVENTORY
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

    overlay.setDepth(
      300
    );

    const panel =
      this.add.rectangle(
        400,
        300,
        680,
        510,
        0xffffff
      );

    panel.setDepth(
      301
    );

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

    title.setDepth(
      302
    );

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

    stats.setDepth(
      302
    );

    this.inventoryObjects.push(
      overlay,
      panel,
      title,
      stats
    );

    // Empty
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

      empty.setDepth(
        302
      );

      this.inventoryObjects.push(
        empty
      );
    }

    // Items
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

        card.setDepth(
          302
        );

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

        icon.setDepth(
          303
        );

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

        itemName.setDepth(
          303
        );

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

        itemType.setDepth(
          303
        );

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

        rarity.setDepth(
          303
        );

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

        description.setDepth(
          303
        );

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

        equipButton.setDepth(
          303
        );

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

        equipText.setDepth(
          304
        );

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

    // Close
    const closeButton =
      this.add.rectangle(
        400,
        550,
        220,
        45,
        0x1a365d
      );

    closeButton.setDepth(
      302
    );

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

    closeText.setDepth(
      303
    );

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

  // ==================================================
  // CREATE HUD
  // ==================================================

  createHUD() {
    this.levelText =
      this.add.text(
        20,
        15,
        "",
        {
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      );

    this.goldText =
      this.add.text(
        620,
        15,
        "",
        {
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      );

    this.xpText =
      this.add.text(
        20,
        42,
        "",
        {
          fontSize: "14px",
          color: "#ffffff",
        }
      );

    this.xpBarBackground =
      this.add.rectangle(
        20,
        68,
        250,
        16,
        0x1a365d,
        0.8
      );

    this.xpBarBackground.setOrigin(
      0,
      0.5
    );

    this.xpBarFill =
      this.add.rectangle(
        20,
        68,
        250,
        16,
        0xd4af37
      );

    this.xpBarFill.setOrigin(
      0,
      0.5
    );
  }

  // ==================================================
  // UPDATE HUD
  // ==================================================

  updateHUD() {
    const level =
      Number(
        this.playerData.level
      ) || 1;

    const xp =
      Number(
        this.playerData.xp
      ) || 0;

    const gold =
      Number(
        this.playerData.gold
      ) || 0;

    this.playerData.level =
      level;

    this.playerData.xp =
      xp;

    this.playerData.gold =
      gold;

    this.levelText.setText(
      `LVL ${level} — ${this.getLevelTitle(level)}`
    );

    this.goldText.setText(
      `GOLD: ${gold}`
    );

    this.xpText.setText(
      `XP ${xp} / ${this.xpNeeded}`
    );

    const percentage =
      Phaser.Math.Clamp(
        xp / this.xpNeeded,
        0,
        1
      );

    this.xpBarFill.setDisplaySize(
      250 * percentage,
      16
    );
  }

  // ==================================================
  // LEVEL TITLE
  // ==================================================

  getLevelTitle(level) {
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
}

export default VillageScene;