import Phaser from "phaser";

class Monster {
  constructor(
    scene,
    x,
    y,
    monsterData
  ) {
    this.scene = scene;

    this.x = x;
    this.y = y;

    // ==================================================
    // MONSTER DATA
    // ==================================================

    this.id =
      monsterData.id;

    this.name =
      monsterData.name;

    this.maxHP =
      Number(
        monsterData.maxHP
      ) || 100;

    this.hp =
      this.maxHP;

    this.attack =
      Number(
        monsterData.attack
      ) || 10;

    this.defense =
      Number(
        monsterData.defense
      ) || 5;

    this.difficulty =
      monsterData.difficulty ||
      "Easy";

    this.stars =
      Number(
        monsterData.stars
      ) || 1;

    this.reward =
      monsterData.reward || {
        xp: 100,
        gold: 50,
      };

    // ==================================================
    // STATUS
    // ==================================================

    this.destroyed = false;
    this.isNearby = false;

    // ==================================================
    // PIXEL MONSTER BODY
    // ==================================================
    // Monster lama memakai circle merah. Mulai Step 2C.2,
    // body menggunakan PNG yang sudah ada di assets/monsters.

    const monsterVisuals = {
      nahwuSlime: {
        texture: "nahwuSlimePixel",
        width: 76,
        height: 76,
        bodyWidth: 46,
        bodyHeight: 34,
        bodyOffsetY: 18,
      },

      grammarGoblin: {
        texture: "grammarGoblinPixel",
        width: 78,
        height: 78,
        bodyWidth: 38,
        bodyHeight: 46,
        bodyOffsetY: 12,
      },

      irabGolem: {
        texture: "irabGolemPixel",
        width: 88,
        height: 88,
        bodyWidth: 52,
        bodyHeight: 52,
        bodyOffsetY: 12,
      },
    };

    const visual =
      monsterVisuals[this.id];

    if (
      visual &&
      scene.textures.exists(
        visual.texture
      )
    ) {
      this.body =
        scene.physics.add.image(
          x,
          y,
          visual.texture
        );

      this.body
        .setDisplaySize(
          visual.width,
          visual.height
        )
        .setDepth(24);

      // Collision dibuat lebih kecil dari gambar supaya
      // kaki / dasar monster terasa natural di map.
      this.body.body.setSize(
        visual.bodyWidth,
        visual.bodyHeight
      );

      this.body.body.setOffset(
        (
          this.body.width -
          visual.bodyWidth
        ) / 2,
        Math.max(
          0,
          this.body.height -
            visual.bodyHeight -
            visual.bodyOffsetY
        )
      );

      this.body.body.setImmovable(
        true
      );

      this.body.setData(
        "monsterId",
        this.id
      );

      this.body.setData(
        "monsterName",
        this.name
      );
    } else {
      // Fallback supaya game tetap jalan kalau texture belum termuat.
      this.body =
        scene.add.circle(
          x,
          y,
          25,
          0xc53030
        );

      scene.physics.add.existing(
        this.body
      );

      this.body.body.setImmovable(
        true
      );
    }

    // Mata dari prototype lama tidak lagi diperlukan.
    this.leftEye = null;
    this.rightEye = null;

    // ==================================================
    // NAME
    // ==================================================

    this.nameText =
      scene.add
        .text(
          x,
          y + 48,
          this.name,
          {
            fontSize: "13px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#1A202C",
            strokeThickness: 4,
          }
        )
        .setOrigin(0.5)
        .setDepth(26);

    // ==================================================
    // HP BACKGROUND
    // ==================================================

    this.hpBackground =
      scene.add.rectangle(
        x,
        y - 50,
        60,
        8,
        0x1a365d
      );

    this.hpBackground.setDepth(26);

    // ==================================================
    // HP BAR
    // ==================================================

    this.hpBar =
      scene.add.rectangle(
        x - 30,
        y - 50,
        60,
        8,
        0xdc2626
      );

    this.hpBar
      .setOrigin(0, 0.5)
      .setDepth(27);

    // ==================================================
    // DIFFICULTY
    // ==================================================

    this.difficultyText =
      scene.add
        .text(
          x,
          y + 64,
          this.getDifficultyDisplay(),
          {
            fontSize: "10px",
            color:
              this.getDifficultyColor(),
            fontStyle: "bold",
            stroke: "#1A202C",
            strokeThickness: 3,
          }
        )
        .setOrigin(0.5)
        .setDepth(26);

    // ==================================================
    // INTERACTION
    // ==================================================

    this.interactionText =
      scene.add
        .text(
          x,
          y - 78,
          "",
          {
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor: "#1A365D",

            padding: {
              left: 8,
              right: 8,
              top: 5,
              bottom: 5,
            },
          }
        )
        .setOrigin(0.5)
        .setDepth(28);

    this.interactionText.setVisible(
      false
    );
  }

  // ==================================================
  // DIFFICULTY DISPLAY
  // ==================================================

  getDifficultyDisplay() {
    const filled =
      "★".repeat(
        this.stars
      );

    const empty =
      "☆".repeat(
        5 -
          this.stars
      );

    return `${this.difficulty} ${filled}${empty}`;
  }

  // ==================================================
  // DIFFICULTY COLOR
  // ==================================================

  getDifficultyColor() {
    switch (
      String(
        this.difficulty
      ).toLowerCase()
    ) {
      case "easy":
        return "#68D391";

      case "medium":
        return "#ECC94B";

      case "hard":
        return "#FC8181";

      case "boss":
        return "#D6BCFA";

      default:
        return "#FFFFFF";
    }
  }

  // ==================================================
  // UPDATE
  // ==================================================

  update(player) {
    if (
      !player ||
      this.destroyed
    ) {
      return;
    }

    const distance =
      Phaser.Math.Distance.Between(
        player.x,
        player.y,
        this.x,
        this.y
      );

    // ==================================================
    // DISTANCE
    // ==================================================

    if (
      distance < 80
    ) {
      this.isNearby = true;

      this.interactionText.setText(
        `[ E ] Lawan ${this.name}`
      );

      this.interactionText.setVisible(
        true
      );
    } else {
      this.isNearby = false;

      this.interactionText.setVisible(
        false
      );
    }

    // ==================================================
    // HP BAR
    // ==================================================

    const percentage =
      Phaser.Math.Clamp(
        this.hp /
          this.maxHP,
        0,
        1
      );

    this.hpBar.setDisplaySize(
      60 * percentage,
      8
    );

    // ==================================================
    // POSITION
    // ==================================================

    if (
      this.body &&
      this.body.active
    ) {
      this.body.setPosition(
        this.x,
        this.y
      );
    }

    this.nameText.setPosition(
      this.x,
      this.y + 48
    );

    this.difficultyText.setPosition(
      this.x,
      this.y + 64
    );

    this.hpBackground.setPosition(
      this.x,
      this.y - 50
    );

    this.hpBar.setPosition(
      this.x - 30,
      this.y - 50
    );

    this.interactionText.setPosition(
      this.x,
      this.y - 78
    );
  }

  // ==================================================
  // TAKE DAMAGE
  // ==================================================

  takeDamage(
    damage
  ) {
    if (
      this.destroyed
    ) {
      return 0;
    }

    const finalDamage =
      Math.max(
        1,
        Number(
          damage
        ) || 0
      );

    this.hp -=
      finalDamage;

    if (
      this.hp < 0
    ) {
      this.hp = 0;
    }

    return finalDamage;
  }

  // ==================================================
  // IS DEAD
  // ==================================================

  isDead() {
    return (
      this.hp <= 0 ||
      this.destroyed
    );
  }

  // ==================================================
  // DESTROY
  // ==================================================

  destroy() {
    if (
      this.destroyed
    ) {
      return;
    }

    this.destroyed = true;
    this.isNearby = false;

    if (this.body) {
      const shadow =
        this.body.getData?.(
          "monsterVisualShadow"
        );

      const idleTween =
        this.body.getData?.(
          "monsterVisualIdleTween"
        );

      if (idleTween) {
        idleTween.stop();
      }

      if (
        shadow &&
        shadow.active
      ) {
        shadow.destroy();
      }

      this.body.destroy();
      this.body = null;
    }

    if (this.leftEye) {
      this.leftEye.destroy();
      this.leftEye = null;
    }

    if (this.rightEye) {
      this.rightEye.destroy();
      this.rightEye = null;
    }

    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = null;
    }

    if (
      this.difficultyText
    ) {
      this.difficultyText.destroy();
      this.difficultyText = null;
    }

    if (
      this.hpBackground
    ) {
      this.hpBackground.destroy();
      this.hpBackground = null;
    }

    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }

    if (
      this.interactionText
    ) {
      this.interactionText.destroy();
      this.interactionText = null;
    }
  }
}

export default Monster;
