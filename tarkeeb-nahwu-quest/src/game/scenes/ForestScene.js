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

      this.registry.set("playerData", savedData);
    }

    this.playerData = savedData;

    // ==================================================
    // GAME STATE
    // ==================================================

    this.isTransitioning = false;
    this.obstacles = this.physics.add.staticGroup();

    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    // ==================================================
    // WORLD
    // ==================================================

    this.createWorld();

    // ==================================================
    // PLAYER
    // ==================================================

    this.createPlayer();

    // ==================================================
    // VILLAGE GATE
    // ==================================================

    this.createVillageGate();

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
    // MAIN PATH
    // ==================================================

    this.add.rectangle(
      400,
      300,
      110,
      600,
      0xb8a27a
    );

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
        75,
        "FOREST OF ISIM",
        {
          fontSize: "30px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(
        400,
        112,
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
    // COLLISION WALLS AT MAP EDGE
    // ==================================================

    this.createWall(20, 300, 40, 600);
    this.createWall(780, 300, 40, 600);
    this.createWall(400, 15, 800, 30);

    // Bottom edge is left open at the village gate.
    this.createWall(20, 585, 320, 30);
    this.createWall(780, 585, 320, 30);
  }

  // ==================================================
  // CREATE PLAYER
  // ==================================================

  createPlayer() {
    this.player = this.add.circle(
      400,
      470,
      25,
      0x3182ce
    );

    this.physics.add.existing(this.player);

    this.player.body.setCollideWorldBounds(true);

    this.playerSpeed = 200;

    // ==================================================
    // KEYBOARD
    // ==================================================

    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // ==================================================
    // PLAYER LABEL
    // ==================================================

    this.playerLabel = this.add
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
    // INTERACTION TEXT
    // ==================================================

    this.interactText = this.add
      .text(
        400,
        545,
        "",
        {
          fontSize: "18px",
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
      .setOrigin(0.5)
      .setDepth(100);

    this.interactText.setVisible(false);
  }

  // ==================================================
  // CREATE VILLAGE GATE
  // ==================================================

  createVillageGate() {
    this.villageGate = this.add.rectangle(
      400,
      555,
      130,
      55,
      0x553c2e
    );

    this.villageGate.setStrokeStyle(
      4,
      0xd4af37
    );

    this.villageGateText = this.add
      .text(
        400,
        515,
        "NAHWU VILLAGE",
        {
          fontSize: "13px",
          color: "#ffffff",
          backgroundColor: "#1A365D",
          padding: 5,
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(20);

    this.villageGatePrompt = this.add
      .text(
        400,
        485,
        "[ E ] Kembali ke Nahwu Village",
        {
          fontSize: "15px",
          color: "#ffffff",
          backgroundColor: "#1A365D",
          padding: 7,
          fontStyle: "bold",
        }
      )
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
    // MOVEMENT
    // ==================================================

    const left =
      this.keys.left.isDown || this.cursors.left.isDown;

    const right =
      this.keys.right.isDown || this.cursors.right.isDown;

    const up =
      this.keys.up.isDown || this.cursors.up.isDown;

    const down =
      this.keys.down.isDown || this.cursors.down.isDown;

    const velocityX =
      (left ? -1 : 0) +
      (right ? 1 : 0);

    const velocityY =
      (up ? -1 : 0) +
      (down ? 1 : 0);

    if (velocityX !== 0 || velocityY !== 0) {
      const direction = new Phaser.Math.Vector2(
        velocityX,
        velocityY
      );

      direction.normalize();

      this.player.body.setVelocity(
        direction.x * this.playerSpeed,
        direction.y * this.playerSpeed
      );
    } else {
      this.player.body.setVelocity(0, 0);
    }

    // ==================================================
    // PLAYER LABEL FOLLOW PLAYER
    // ==================================================

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y + 35
    );

    // ==================================================
    // RESET INTERACTION
    // ==================================================

    this.interactText.setVisible(false);
    this.villageGatePrompt.setVisible(false);

    // ==================================================
    // VILLAGE GATE INTERACTION
    // ==================================================

    const gateDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.villageGate.x,
      this.villageGate.y
    );

    if (gateDistance < 90) {
      this.villageGatePrompt.setVisible(true);

      this.interactText.setText(
        "[ E ] Kembali ke Nahwu Village"
      );

      this.interactText.setVisible(true);

      if (
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

    this.villageGatePrompt.setVisible(false);
    this.interactText.setVisible(false);

    this.scene.start("VillageScene");
  }

  // ==================================================
  // CREATE TREE
  // ==================================================

  createTree(x, y) {
    this.add.rectangle(
      x,
      y + 30,
      18,
      45,
      0x8b4513
    );

    this.add.circle(
      x,
      y,
      32,
      0x1f6b3a
    );

    this.add.circle(
      x - 18,
      y + 10,
      23,
      0x2e7d4f
    );

    this.add.circle(
      x + 18,
      y + 10,
      23,
      0x2e7d4f
    );

    const collider = this.add.rectangle(
      x,
      y + 18,
      55,
      65,
      0xffffff,
      0
    );

    this.physics.add.existing(collider, true);
    this.obstacles.add(collider);
  }

  // ==================================================
  // CREATE ROCK
  // ==================================================

  createRock(x, y) {
    this.add.circle(
      x,
      y,
      18,
      0x718096
    );

    this.add.circle(
      x - 8,
      y - 5,
      8,
      0xa0aec0
    );

    const collider = this.add.rectangle(
      x,
      y,
      42,
      36,
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
    this.add.circle(
      x,
      y,
      22,
      0x285e3b
    );

    this.add.circle(
      x - 15,
      y + 5,
      16,
      0x2f855a
    );

    this.add.circle(
      x + 15,
      y + 5,
      16,
      0x2f855a
    );
  }

  // ==================================================
  // CREATE WALL
  // ==================================================

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
  // HUD
  // ==================================================

  createHUD() {
    this.add.rectangle(
      80,
      35,
      120,
      42,
      0x1a365d,
      0.95
    ).setDepth(200);

    this.levelText = this.add
      .text(
        80,
        35,
        "LVL 1",
        {
          fontSize: "17px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(201);

    this.add.rectangle(
      720,
      35,
      150,
      42,
      0x1a365d,
      0.95
    ).setDepth(200);

    this.goldText = this.add
      .text(
        720,
        35,
        "GOLD: 0",
        {
          fontSize: "17px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(201);
  }

  // ==================================================
  // UPDATE HUD
  // ==================================================

  updateHUD() {
    if (!this.playerData) {
      return;
    }

    this.levelText.setText(
      `LVL ${this.playerData.level}`
    );

    this.goldText.setText(
      `GOLD: ${this.playerData.gold}`
    );
  }
}

export default ForestScene;
