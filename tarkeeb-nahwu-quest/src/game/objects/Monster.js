import Phaser from "phaser";

class Monster {
  constructor(
    scene,
    x,
    y,
    name = "Nahwu Slime"
  ) {
    this.scene = scene;

    this.x = x;
    this.y = y;

    this.name = name;

    // ==================================================
    // MONSTER STATS
    // ==================================================

    this.maxHP = 100;
    this.hp = 100;

    this.attack = 10;
    this.defense = 5;

    // ==================================================
    // CREATE VISUAL
    // ==================================================

    this.body =
      scene.add.circle(
        x,
        y,
        25,
        0xc53030
      );

    // Mata kiri
    this.leftEye =
      scene.add.circle(
        x - 9,
        y - 5,
        5,
        0xffffff
      );

    // Mata kanan
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
          name,
          {
            fontSize: "14px",
            color: "#ffffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

    // ==================================================
    // HP BAR BACKGROUND
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

    this.isNearby = false;

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
  // UPDATE
  // ==================================================

  update(player) {
    if (!player) {
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
    // CHECK DISTANCE
    // ==================================================

    if (
      distance < 80
    ) {
      this.isNearby = true;

      this.interactionText.setText(
        "[ E ] Lawan Monster"
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
    // UPDATE HP BAR
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

    // Update posisi visual
    this.nameText.setPosition(
      this.x,
      this.y + 38
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
    this.hp -=
      damage;

    if (
      this.hp < 0
    ) {
      this.hp = 0;
    }

    return this.hp;
  }

  // ==================================================
  // IS DEAD
  // ==================================================

  isDead() {
    return (
      this.hp <= 0
    );
  }

  // ==================================================
  // DESTROY
  // ==================================================

  destroy() {
    if (this.body) {
      this.body.destroy();
    }

    if (this.leftEye) {
      this.leftEye.destroy();
    }

    if (this.rightEye) {
      this.rightEye.destroy();
    }

    if (this.nameText) {
      this.nameText.destroy();
    }

    if (this.hpBackground) {
      this.hpBackground.destroy();
    }

    if (this.hpBar) {
      this.hpBar.destroy();
    }

    if (this.interactionText) {
      this.interactionText.destroy();
    }
  }
}

export default Monster;