import Phaser from "phaser";

import Monster from "../objects/Monster";

import monsters from "../data/monsters";
import battleQuestions from "../data/battleQuestions";
import skills from "../data/skills";
import skillQuestions from "../data/skillQuestions";

class ForestScene extends Phaser.Scene {
  constructor() {
    super("ForestScene");
  }

  // ==================================================
  // CREATE
  // ==================================================

  create() {
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

    this.xpNeeded = 200;

    this.obstacles = this.physics.add.staticGroup();
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    this.createWorld();
    this.createPlayer();
    this.createVillageGate();
    this.createHUD();
    this.updateHUD();
  }

  // ==================================================
  // CREATE WORLD
  // ==================================================

  createWorld() {
    this.add.rectangle(400, 300, 800, 600, 0x3f6b3f);

    this.add.rectangle(400, 300, 110, 600, 0xb8a27a);
    this.add.rectangle(400, 350, 800, 80, 0xb8a27a);

    this.add
      .text(400, 75, "FOREST OF ISIM", {
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

    this.createTree(80, 90);
    this.createTree(250, 110);
    this.createTree(530, 110);
    this.createTree(720, 90);

    this.createTree(85, 470);
    this.createTree(250, 520);
    this.createTree(560, 520);
    this.createTree(720, 470);

    this.createTree(150, 270);
    this.createTree(650, 270);

    // ==================================================
    // ROCKS
    // ==================================================

    this.createRock(175, 175);
    this.createRock(625, 175);
    this.createRock(165, 400);
    this.createRock(640, 410);

    // ==================================================
    // SMALL FOREST DETAILS
    // ==================================================

    this.createBush(320, 150);
    this.createBush(470, 150);
    this.createBush(320, 500);
    this.createBush(470, 500);

    // ==================================================
    // FOREST MONSTERS
    // ==================================================

    this.monsters = [];

    const slime = new Monster(
      this,
      220,
      220,
      monsters.nahwuSlime
    );

    const goblin = new Monster(
      this,
      560,
      220,
      monsters.grammarGoblin
    );

    const golem = new Monster(
      this,
      620,
      450,
      monsters.irabGolem
    );

    this.monsters.push(slime, goblin, golem);

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
    this.player = this.add.circle(400, 470, 25, 0x3182ce);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.playerSpeed = 200;

    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.playerLabel = this.add
      .text(this.player.x, this.player.y + 35, "PLAYER", {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.interactText = this.add
      .text(400, 545, "", {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#1A365D",
        padding: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10,
        },
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.interactText.setVisible(false);
  }

  // ==================================================
  // CREATE VILLAGE GATE
  // ==================================================

  createVillageGate() {
    this.villageGate = this.add.rectangle(400, 555, 130, 55, 0x553c2e);
    this.villageGate.setStrokeStyle(4, 0xd4af37);

    this.villageGateText = this.add
      .text(400, 515, "NAHWU VILLAGE", {
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "#1A365D",
        padding: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.villageGatePrompt = this.add
      .text(400, 485, "[ E ] Kembali ke Nahwu Village", {
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

    // Pause movement while battle UI is open.
    if (this.isBattleOpen || this.isBattleQuestionOpen || this.skillQuestionOpen || this.skillMenuOpen) {
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

    this.playerLabel.setPosition(this.player.x, this.player.y + 35);

    // Monsters only chase while the player is free to move.
    this.monsters.forEach((monster) => {
      if (monster && !monster.isDead()) {
        monster.update(this.player);
      }
    });

    this.interactText.setVisible(false);
    this.villageGatePrompt.setVisible(false);

    const nearestMonster = this.getNearestMonster();

    if (nearestMonster && nearestMonster.isNearby && !nearestMonster.isDead()) {
      this.interactText.setText(`[ E ] Lawan ${nearestMonster.name}`);
      this.interactText.setVisible(true);

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
      this.villageGatePrompt.setVisible(true);
      this.interactText.setText("[ E ] Kembali ke Nahwu Village");
      this.interactText.setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
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
    this.villageGatePrompt.setVisible(false);
    this.interactText.setVisible(false);
    this.scene.start("VillageScene");
  }

  // ==================================================
  // CREATE TREE
  // ==================================================

  createTree(x, y) {
    this.add.rectangle(x, y + 30, 18, 45, 0x8b4513);
    this.add.circle(x, y, 32, 0x1f6b3a);
    this.add.circle(x - 18, y + 10, 23, 0x2e7d4f);
    this.add.circle(x + 18, y + 10, 23, 0x2e7d4f);

    const collider = this.add.rectangle(x, y + 18, 55, 65, 0xffffff, 0);
    this.physics.add.existing(collider, true);
    this.obstacles.add(collider);
  }

  // ==================================================
  // CREATE ROCK
  // ==================================================

  createRock(x, y) {
    this.add.circle(x, y, 18, 0x718096);
    this.add.circle(x - 8, y - 5, 8, 0xa0aec0);

    const collider = this.add.rectangle(x, y, 42, 36, 0xffffff, 0);
    this.physics.add.existing(collider, true);
    this.obstacles.add(collider);
  }

  // ==================================================
  // CREATE BUSH
  // ==================================================

  createBush(x, y) {
    this.add.circle(x, y, 22, 0x285e3b);
    this.add.circle(x - 15, y + 5, 16, 0x2f855a);
    this.add.circle(x + 15, y + 5, 16, 0x2f855a);
  }

  // ==================================================
  // CREATE WALL
  // ==================================================

  createWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(wall, true);
    this.obstacles.add(wall);
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
  // HUD
  // ==================================================

  createHUD() {
    this.add.rectangle(80, 35, 180, 42, 0x1a365d, 0.95).setDepth(200);

    this.levelText = this.add
      .text(80, 35, "LVL 1", {
        fontSize: "17px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(201);

    this.add.rectangle(720, 35, 150, 42, 0x1a365d, 0.95).setDepth(200);

    this.goldText = this.add
      .text(720, 35, "GOLD: 0", {
        fontSize: "17px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(201);

    this.xpText = this.add
      .text(20, 65, "XP 0 / 200", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setDepth(201);

    this.xpBarBackground = this.add.rectangle(20, 88, 250, 14, 0x1a365d, 0.8);
    this.xpBarBackground.setOrigin(0, 0.5).setDepth(200);

    this.xpBarFill = this.add.rectangle(20, 88, 250, 14, 0xd4af37);
    this.xpBarFill.setOrigin(0, 0.5).setDepth(201);
  }

  updateHUD() {
    if (!this.playerData || !this.levelText) {
      return;
    }

    const level = Number(this.playerData.level) || 1;
    const xp = Number(this.playerData.xp) || 0;
    const gold = Number(this.playerData.gold) || 0;

    this.levelText.setText(`LVL ${level} — ${this.getLevelTitle(level)}`);
    this.goldText.setText(`GOLD: ${gold}`);
    this.xpText.setText(`XP ${xp} / ${this.xpNeeded}`);

    const percentage = Phaser.Math.Clamp(xp / this.xpNeeded, 0, 1);
    this.xpBarFill.setDisplaySize(250 * percentage, 14);
  }
}

export default ForestScene;
