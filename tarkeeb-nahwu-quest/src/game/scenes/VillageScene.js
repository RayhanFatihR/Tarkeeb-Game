import Phaser from "phaser";
import NPC from "../objects/NPC";
import quests from "../data/quests";
import questions from "../data/questions";
import items from "../data/items";

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

    // Pastikan data lama tetap aman
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

    if (savedData.equipped.Weapon === undefined) {
      savedData.equipped.Weapon = null;
    }

    if (savedData.equipped.Armor === undefined) {
      savedData.equipped.Armor = null;
    }

    if (savedData.equipped.Accessory === undefined) {
      savedData.equipped.Accessory = null;
    }

    this.playerData = savedData;

    // Simpan data yang sudah dinormalisasi
    this.registry.set("playerData", this.playerData);

    // ==================================================
    // XP CONFIG
    // ==================================================

    this.xpNeeded = 200;

    // ==================================================
    // QUEST
    // ==================================================

    this.activeQuest =
      this.registry.get("activeQuest") || null;

    this.questObjects = [];

    this.pendingQuestCompletion = false;

    // ==================================================
    // BACKGROUND
    // ==================================================

    this.add.rectangle(
      400,
      300,
      800,
      600,
      0x7cb342
    );

    // ==================================================
    // ROAD
    // ==================================================

    this.add.rectangle(
      400,
      300,
      120,
      600,
      0xd8c39b
    );

    this.add.rectangle(
      400,
      300,
      800,
      100,
      0xd8c39b
    );

    // ==================================================
    // OBSTACLE GROUP
    // ==================================================

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
    // HOUSES
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
    // PLAYER
    // ==================================================

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
        .setOrigin(0.5);

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

    // ==================================================
    // QUIZ
    // ==================================================

    this.isQuizOpen = false;
    this.answerLocked = false;

    this.quizObjects = [];

    this.currentQuestion = null;
    this.currentChest = null;

    // ==================================================
    // INVENTORY
    // ==================================================

    this.inventoryOpen = false;
    this.inventoryObjects = [];

    // ==================================================
    // NPC DIALOG
    // ==================================================

    this.npcDialogOpen = false;
    this.npcDialogObjects = [];

    // ==================================================
    // QUEST COMPLETE
    // ==================================================

    this.questCompleteOpen = false;
    this.questCompleteObjects = [];

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
        !this.questCompleteOpen
      ) {
        this.toggleInventory();
      }

      return;
    }

    // ==================================================
    // STOP PLAYER
    // ==================================================

    if (
      this.isQuizOpen ||
      this.inventoryOpen ||
      this.npcDialogOpen ||
      this.questCompleteOpen
    ) {
      this.player.body.setVelocity(
        0,
        0
      );

      return;
    }

    // ==================================================
    // RESET INTERACTION TEXT
    // ==================================================

    this.interactText.setVisible(
      false
    );

    // ==================================================
    // RESET VELOCITY
    // ==================================================

    this.player.body.setVelocity(
      0,
      0
    );

    // ==================================================
    // MOVE LEFT
    // ==================================================

    if (
      this.keys.left.isDown ||
      this.cursors.left.isDown
    ) {
      this.player.body.setVelocityX(
        -this.playerSpeed
      );
    }

    // ==================================================
    // MOVE RIGHT
    // ==================================================

    if (
      this.keys.right.isDown ||
      this.cursors.right.isDown
    ) {
      this.player.body.setVelocityX(
        this.playerSpeed
      );
    }

    // ==================================================
    // MOVE UP
    // ==================================================

    if (
      this.keys.up.isDown ||
      this.cursors.up.isDown
    ) {
      this.player.body.setVelocityY(
        -this.playerSpeed
      );
    }

    // ==================================================
    // MOVE DOWN
    // ==================================================

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

    // ==================================================
    // PLAYER LABEL
    // ==================================================

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y + 35
    );

    // ==================================================
    // NPC DISTANCE
    // ==================================================

    if (this.grammarMaster) {
      this.grammarMaster.checkDistance(
        this.player
      );
    }

    // ==================================================
    // FIND NEAREST CHEST
    // ==================================================

    let nearestChest = null;
    let nearestDistance = Infinity;

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
          nearestDistance
        ) {
          nearestDistance =
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
      nearestDistance < 80
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
    // NPC INTERACTION
    // ==================================================

    if (
      this.grammarMaster &&
      (!nearestChest ||
        nearestDistance >= 80)
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
  // CREATE HUD
  // ==================================================

  createHUD() {
    // LEVEL
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

    // GOLD
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

    // XP
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

    // XP BACKGROUND
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

    // XP FILL
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

    const title =
      this.getLevelTitle(
        level
      );

    this.levelText.setText(
      `LVL ${level} — ${title}`
    );

    this.goldText.setText(
      `GOLD: ${gold}`
    );

    this.xpText.setText(
      `XP ${xp} / ${this.xpNeeded}`
    );

    const percentage =
      Phaser.Math.Clamp(
        xp /
          this.xpNeeded,
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
  // GET TOTAL XP BONUS
  // ==================================================

  getTotalXPBonus() {
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

        const equippedItem =
          this.playerData.inventory.find(
            (item) =>
              item &&
              item.id ===
                equippedId
          );

        if (!equippedItem) {
          return;
        }

        const bonus =
          Number(
            equippedItem.xpBonus
          );

        if (
          Number.isFinite(
            bonus
          )
        ) {
          totalBonus +=
            bonus;
        }
      }
    );

    return totalBonus;
  }

  // ==================================================
  // ADD XP
  // ==================================================

  addXP(
    baseAmount
  ) {
    const baseXP =
      Number(baseAmount) || 0;

    const xpBonus =
      this.getTotalXPBonus();

    const bonusXP =
      Math.floor(
        baseXP * xpBonus
      );

    const finalXP =
      baseXP + bonusXP;

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

    // Tambahkan XP
    currentXP +=
      finalXP;

    let leveledUp = false;

    // ==================================================
    // LEVEL UP
    // ==================================================

    while (
      currentXP >=
      this.xpNeeded
    ) {
      currentXP -=
        this.xpNeeded;

      level += 1;

      gold += 100;

      leveledUp = true;
    }

    // ==================================================
    // SIMPAN HASIL
    // ==================================================

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

    // Update HUD
    this.updateHUD();

    // Debug
    console.log(
      "========== XP =========="
    );

    console.log(
      "Base XP:",
      baseXP
    );

    console.log(
      "Bonus:",
      xpBonus
    );

    console.log(
      "Bonus XP:",
      bonusXP
    );

    console.log(
      "Final XP:",
      finalXP
    );

    console.log(
      "Current XP:",
      currentXP
    );

    console.log(
      "Level:",
      level
    );

    console.log(
      "========================"
    );

    return {
      baseXP,
      bonusXP,
      finalXP,
      xpBonus,
      leveledUp,
    };
  }

  // ==================================================
  // CREATE HOUSE
  // ==================================================

  createHouse(
    x,
    y,
    name
  ) {
    // BODY
    this.add.rectangle(
      x,
      y,
      140,
      100,
      0xf5e5c0
    );

    // ROOF
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

    // NAME
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

    // COLLIDER
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
  // CREATE TREE
  // ==================================================

  createTree(
    x,
    y
  ) {
    // TRUNK
    this.add.rectangle(
      x,
      y + 35,
      20,
      50,
      0x8b4513
    );

    // CENTER
    this.add.circle(
      x,
      y,
      35,
      0x2e7d32
    );

    // LEFT
    this.add.circle(
      x - 20,
      y + 10,
      25,
      0x388e3c
    );

    // RIGHT
    this.add.circle(
      x + 20,
      y + 10,
      25,
      0x388e3c
    );

    // COLLIDER
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
      reward,
      body: null,
      lid: null,
      label: null,
    };

    // BODY
    chest.body =
      this.add.rectangle(
        x,
        y,
        50,
        40,
        0x8b4513
      );

    // LID
    chest.lid =
      this.add.rectangle(
        x,
        y - 15,
        50,
        15,
        0xd4af37
      );

    // LABEL
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
  // GET RANDOM QUESTION
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

    const randomIndex =
      Phaser.Math.Between(
        0,
        available.length - 1
      );

    return available[
      randomIndex
    ];
  }

  // ==================================================
  // SHOW QUIZ
  // ==================================================

  showQuiz() {
    this.quizObjects =
      [];

    // OVERLAY
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

    // PANEL
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

    // TITLE
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

    // DIFFICULTY
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

    // QUESTION
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

    // ==================================================
    // ANSWERS
    // ==================================================

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

        // HOVER
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

        // CLICK
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
    // WRONG
    if (!isCorrect) {
      this.showResult(
        "SALAH!",
        "Belum tepat.\nCoba pahami lagi materinya!",
        false
      );

      return;
    }

    // ==================================================
    // XP
    // ==================================================

    const xpResult =
      this.addXP(
        100
      );

    // ==================================================
    // GOLD
    // ==================================================

    this.playerData.gold =
      Number(
        this.playerData.gold
      ) + 50;

    // ==================================================
    // ITEM REWARD
    // ==================================================

    if (
      this.currentChest &&
      this.currentChest.reward
    ) {
      // Salin object supaya data inventory
      // tidak bergantung langsung ke object global
      const rewardItem = {
        ...this.currentChest.reward,
      };

      this.playerData.inventory.push(
        rewardItem
      );
    }

    // ==================================================
    // SAVE PLAYER
    // ==================================================

    this.registry.set(
      "playerData",
      this.playerData
    );

    this.updateHUD();

    // ==================================================
    // CHEST OPENED
    // ==================================================

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

    // ==================================================
    // QUEST
    // ==================================================

    const questCompleted =
      this.updateQuestProgress(
        "isim"
      );

    // ==================================================
    // MESSAGE
    // ==================================================

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

    // Reward item
    if (
      this.currentChest &&
      this.currentChest.reward
    ) {
      message +=
        `\n${this.currentChest.reward.icon} ${this.currentChest.reward.name}`;
    }

    // Quest progress
    if (
      this.activeQuest &&
      !questCompleted
    ) {
      message +=
        `\n\nQuest: ${this.activeQuest.progress}/${this.activeQuest.requiredProgress}`;
    }

    // Level up
    if (
      xpResult.leveledUp
    ) {
      message +=
        "\n\nLEVEL UP!";
    }

    this.pendingQuestCompletion =
      questCompleted;

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

    // OVERLAY
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

    // PANEL
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

    // TITLE
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

    // MESSAGE
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

    // BUTTON
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

    // OVERLAY
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

    // PANEL
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

    // NAME
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

    // DIALOG
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

    // QUEST
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
        quest.requiredProgress,

      reward: {
        xp: quest.reward.xp,
        gold: quest.reward.gold,
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
  // SHOW QUEST HUD
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

    // PANEL
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

    // LABEL
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

    // TITLE
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

    // PROGRESS
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

    // Reward XP
    const xpResult =
      this.addXP(
        reward.xp
      );

    // Reward Gold
    this.playerData.gold =
      Number(
        this.playerData.gold
      ) +
      Number(
        reward.gold
      );

    // Save
    this.registry.set(
      "playerData",
      this.playerData
    );

    this.updateHUD();

    // Hapus HUD quest
    this.clearQuestHUD();

    // Reset quest
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

    // OVERLAY
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

    // PANEL
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

    // TITLE
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

    // QUEST NAME
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

    // REWARD
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
          }
        )
        .setOrigin(0.5);

    reward.setDepth(
      502
    );

    // BUTTON
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

    const itemType =
      item.type;

    if (
      !Object.prototype.hasOwnProperty.call(
        this.playerData.equipped,
        itemType
      )
    ) {
      return;
    }

    this.playerData.equipped[
      itemType
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

    const itemType =
      item.type;

    if (
      !Object.prototype.hasOwnProperty.call(
        this.playerData.equipped,
        itemType
      )
    ) {
      return;
    }

    if (
      this.playerData.equipped[
        itemType
      ] === item.id
    ) {
      this.playerData.equipped[
        itemType
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
  // GET EQUIPPED ITEM
  // ==================================================

  getEquippedItem(
    type
  ) {
    const equippedId =
      this.playerData.equipped[
        type
      ];

    if (!equippedId) {
      return null;
    }

    return (
      this.playerData.inventory.find(
        (item) =>
          item.id ===
          equippedId
      ) || null
    );
  }

  // ==================================================
  // INVENTORY TOGGLE
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

    // OVERLAY
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

    // PANEL
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

    // TITLE
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

    // STATS
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

      empty.setDepth(
        302
      );

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

        // CARD
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

        // ICON
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

        // NAME
        const itemName =
          this.add.text(
            200,
            y - 20,
            item.name,
            {
              fontSize: "18px",
              color: "#1A365D",
              fontStyle: "bold",
            }
          );

        itemName.setDepth(
          303
        );

        // TYPE
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

        // RARITY
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
              color: "#D4AF37",
              fontStyle: "bold",
            }
          );

        rarity.setDepth(
          303
        );

        // DESCRIPTION
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

        // ==================================================
        // EQUIPPED
        // ==================================================

        const equipped =
          this.isItemEquipped(
            item
          );

        // ==================================================
        // BUTTON
        // ==================================================

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

        // HOVER
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

        // CLICK
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

        // SAVE OBJECTS
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
}

export default VillageScene;