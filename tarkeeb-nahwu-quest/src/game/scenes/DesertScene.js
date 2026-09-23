import Phaser from "phaser";

import playerWalkAsset from "../../assets/player/player_walk.png";
import forestGateAsset from "../../assets/objects/forest_gate.png";
import pathTileAsset from "../../assets/tiles/path_tile.png";

import {
  getGameProgress,
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

    this.obstacles = this.physics.add.staticGroup();

    this.createWorld();
    this.createPlayer();
    this.createForestReturnGate();
    this.createHUD();
    this.updateHUD();

    this.physics.add.collider(
      this.player,
      this.obstacles
    );

    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
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
      Phaser.Input.Keyboard.JustDown(this.inventoryKey)
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
    if (!this.interactionPrompt || this.inventoryOpen) {
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
          .text(515, 290, "🎒", {
            fontSize: "44px",
          })
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
        const rarityNumber = parseInt(
          rarityColor.replace("#", ""),
          16
        );
        const equipped = this.isItemEquipped(item);

        const card = addObject(
          this.add
            .rectangle(515, y, 390, 72, 0x132844, 1)
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
            .text(
              370,
              y - 4,
              `${item.type}  •  ${String(item.rarity).toUpperCase()}`,
              {
                fontSize: "9px",
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
              y + 15,
              item.description || "Tidak ada deskripsi.",
              {
                fontSize: "9px",
                color: "#D6E3F4",
                wordWrap: { width: 205 },
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
              30,
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

        addObject(
          this.add
            .text(
              675,
              y,
              equipped ? "UNEQUIP" : "EQUIP",
              {
                fontSize: "9px",
                color: "#FFFFFF",
                fontStyle: "bold",
              }
            )
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
            this.equipItem(index);
          }
        });
      });
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
