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

    this.destroyed =
      false;

    this.isNearby =
      false;

    // ==================================================
    // BODY
    // ==================================================

    this.body =
      scene.add.circle(
        x,
        y,
        25,
        0xc53030
      );

    // ==================================================
    // EYES
    // ==================================================

    this.leftEye =
      scene.add.circle(
        x - 9,
        y - 5,
        5,
        0xffffff
      );

    this.rightEye =
      scene.add.circle(
        x + 9,
        y - 5,
        5,
        0xffffff
      );

    // ==================================================
    // NAME
    // ==================================================

    this.nameText =
      scene.add
        .text(
          x,
          y + 38,
          this.name,
          {
            fontSize: "14px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    // ==================================================
    // HP BACKGROUND
    // ==================================================

    this.hpBackground =
      scene.add.rectangle(
        x,
        y - 43,
        60,
        8,
        0x1a365d
      );

    // ==================================================
    // HP BAR
    // ==================================================

    this.hpBar =
      scene.add.rectangle(
        x - 30,
        y - 43,
        60,
        8,
        0xdc2626
      );

    this.hpBar.setOrigin(
      0,
      0.5
    );

    // ==================================================
    // DIFFICULTY
    // ==================================================

    this.difficultyText =
      scene.add
        .text(
          x,
          y + 55,
          this.getDifficultyDisplay(),
          {
            fontSize: "11px",
            color:
              this.getDifficultyColor(),
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    // ==================================================
    // PHYSICS
    // ==================================================

    scene.physics.add.existing(
      this.body
    );

    this.body.body.setImmovable(
      true
    );

    // ==================================================
    // INTERACTION
    // ==================================================

    this.interactionText =
      scene.add
        .text(
          x,
          y - 70,
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
        .setOrigin(0.5);

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
      this.isNearby =
        true;

      this.interactionText.setText(
        `[ E ] Lawan ${this.name}`
      );

      this.interactionText.setVisible(
        true
      );
    } else {
      this.isNearby =
        false;

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
      60 *
        percentage,
      8
    );

    // ==================================================
    // POSITION
    // ==================================================

    this.nameText.setPosition(
      this.x,
      this.y + 38
    );

    this.difficultyText.setPosition(
      this.x,
      this.y + 55
    );

    this.hpBackground.setPosition(
      this.x,
      this.y - 43
    );

    this.hpBar.setPosition(
      this.x - 30,
      this.y - 43
    );

    this.interactionText.setPosition(
      this.x,
      this.y - 70
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

    this.destroyed =
      true;

    this.isNearby =
      false;

    if (this.body) {
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