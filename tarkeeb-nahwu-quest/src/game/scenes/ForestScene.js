import Phaser from "phaser";

class ForestScene extends Phaser.Scene {
  constructor() {
    super("ForestScene");
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

      this.registry.set(
        "playerData",
        savedData
      );
    }

    this.playerData = savedData;

    // ==================================================
    // GAME STATE
    // ==================================================

    this.isTransitioning = false;

    // ==================================================
    // OBJECT
    // ==================================================

    this.obstacles =
      this.physics.add.staticGroup();

    // ==================================================
    // WORLD
    // ==================================================

    this.createWorld();

    // ==================================================
    // PLAYER
    // ==================================================

    this.createPlayer();

    // ==================================================
    // GATE
    // ==================================================

    this.createVillageGate();

    // ==================================================
    // INPUT
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

    this.interactKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

    // ==================================================
    // HUD
    // ==================================================

    this.createHUD();
    this.updateHUD();
  }

  // ==================================================
  // CREATE WORLD
  // ==================================================

  createWorld() {
    // ==================================================
    // BACKGROUND
    // ==================================================

    this.add.rectangle(
      400,
      300,
      800,
      600,
      0x3f6b3f
    );

    // ==================================================
    // PATH
    // ==================================================

    this.add.rectangle(
      400,
      300,
      110,
      600,
      0xb8a27a
    );

    // ==================================================
    // SECONDARY PATH
    // ==================================================

    this.add.rectangle(
      400,
      350,
      800,
      80,
      0xb8a27a
    );

    // ==================================================
    // TITLE
    // ==================================================

    this.add
      .text(
        400,
        95,
        "FOREST OF ISIM",
        {
          fontSize: "32px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(
        400,
        130,
        "Hutan tempat para penjaga Isim berlatih.",
        {
          fontSize: "15px",
          color: "#e2e8f0",
          fontStyle: "italic",
        }
      )
      .setOrigin(0.5)
      .setDepth(20);

    // ==================================================
    // TREES
    // ==================================================

    this.createTree(70, 100);
    this.createTree(170, 150);
    this.createTree(730, 100);
    this.createTree(620, 160);

    this.createTree(80, 500);
    this.createTree(180, 450);
    this.createTree(720, 500);
    this.createTree(620, 450);

    this.createTree(100, 300);
    this.createTree(700, 300);

    // ==================================================
    // DECORATIVE ROCKS
    // ==================================================

    this.createRock(250, 150);
    this.createRock(550, 150);
    this.createRock(250, 500);
    this.createRock(550, 500);
  }

  // ==================================================
  // CREATE TREE
  // ==================================================

  createTree(x, y) {
    // Batang

    this.add.rectangle(
      x,
      y + 30,
      18,
      45,
      0x744210
    );

    // Daun utama

    this.add.circle(
      x,
      y,
      32,
      0x22543d
    );

    // Daun kiri

    this.add.circle(
      x - 20,
      y + 8,
      23,
      0x276749
    );

    // Daun kanan

    this.add.circle(
      x + 20,
      y + 8,
      23,
      0x2f855a
    );

    // Collider

    const collider =
      this.add.rectangle(
        x,
        y + 15,
        55,
        70,
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
    const rock =
      this.add.circle(
        x,
        y,
        15,
        0x718096
      );

    rock.setStrokeStyle(
      2,
      0x4a5568
    );

    const collider =
      this.add.rectangle(
        x,
        y,
        32,
        32,
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
  // CREATE PLAYER
  // ==================================================

  createPlayer() {
    this.player =
      this.add.circle(
        400,
        390,
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
        .setDepth(30);

    // ==================================================
    // INTERACTION
    // ==================================================

    this.interactText =
      this.add
        .text(
          400,
          550,
          "",
          {
            fontSize: "19px",
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
        .setOrigin(0.5)
        .setDepth(100);

    this.interactText.setVisible(
      false
    );
  }

  // ==================================================
  // CREATE VILLAGE GATE
  // ==================================================

  createVillageGate() {
    // Gerbang
    this.villageGate =
      this.add.rectangle(
        400,
        550,
        130,
        55,
        0x553c2e
      );

    this.villageGate
      .setStrokeStyle(
        4,
        0xd4af37
      )
      .setDepth(25);

    // Icon
    this.add
      .text(
        400,
        540,
        "🚪",
        {
          fontSize: "24px",
        }
      )
      .setOrigin(0.5)
      .setDepth(26);

    // Label
    this.add
      .text(
        400,
        575,
        "NAHWU VILLAGE",
        {
          fontSize: "13px",
          color: "#ffffff",
          fontStyle: "bold",
          backgroundColor:
            "#1A365D",
          padding: 4,
        }
      )
      .setOrigin(0.5)
      .setDepth(26);
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update() {
    if (
      !this.player ||
      this.isTransitioning
    ) {
      return;
    }

    // ==================================================
    // RESET INTERACTION
    // ==================================================

    this.interactText.setVisible(
      false
    );

    // ==================================================
    // MOVEMENT
    // ==================================================

    this.player.body.setVelocity(
      0,
      0
    );

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

    // ==================================================
    // PLAYER LABEL
    // ==================================================

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y + 35
    );

    // ==================================================
    // VILLAGE GATE
    // ==================================================

    const gateDistance =
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.villageGate.x,
        this.villageGate.y
      );

    if (
      gateDistance < 90
    ) {
      this.interactText.setText(
        "[ E ] Kembali ke Nahwu Village"
      );

      this.interactText.setVisible(
        true
      );

      if (
        Phaser.Input.Keyboard.JustDown(
          this.interactKey
        )
      ) {
        this.returnToVillage();
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

    this.scene.start(
      "VillageScene"
    );
  }

  // ==================================================
  // HUD
  // ==================================================

  createHUD() {
    this.levelText =
      this.add
        .text(
          20,
          20,
          "",
          {
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
            backgroundColor:
              "#1A365D",
            padding: 8,
          }
        )
        .setDepth(100);

    this.goldText =
      this.add
        .text(
          650,
          20,
          "",
          {
            fontSize: "18px",
            color: "#ffd700",
            fontStyle: "bold",
            backgroundColor:
              "#1A365D",
            padding: 8,
          }
        )
        .setDepth(100);
  }

  // ==================================================
  // UPDATE HUD
  // ==================================================

  updateHUD() {
    const level =
      Number(
        this.playerData.level
      ) || 1;

    const gold =
      Number(
        this.playerData.gold
      ) || 0;

    this.levelText.setText(
      `LVL ${level}`
    );

    this.goldText.setText(
      `🪙 GOLD: ${gold}`
    );
  }
}

export default ForestScene;