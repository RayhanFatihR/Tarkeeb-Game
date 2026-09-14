import Phaser from "phaser";

class NPC extends Phaser.GameObjects.Container {
  constructor(scene, x, y, name) {
    super(scene, x, y);

    this.scene = scene;
    this.npcName = name;
    this.isNearby = false;

    // Tambahkan NPC ke Scene
    scene.add.existing(this);

    // =====================================
    // BADAN NPC
    // =====================================

    const body = scene.add.circle(
      0,
      0,
      24,
      0xd4af37
    );

    this.add(body);

    // =====================================
    // KEPALA NPC
    // =====================================

    const head = scene.add.circle(
      0,
      -32,
      18,
      0xf5cfa0
    );

    this.add(head);

    // =====================================
    // NAMA NPC
    // =====================================

    this.nameText = scene.add
      .text(
        0,
        28,
        name,
        {
          fontSize: "14px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    this.add(this.nameText);

    // =====================================
    // PROMPT INTERAKSI
    // =====================================

    this.interactionText = scene.add
      .text(
        0,
        -70,
        "[ E ] Bicara",
        {
          fontSize: "16px",
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

    this.add(
      this.interactionText
    );

    this.interactionText.setVisible(
      false
    );
  }

  // =====================================
  // CEK JARAK NPC DENGAN PLAYER
  // =====================================

  checkDistance(player) {
    const distance =
      Phaser.Math.Distance.Between(
        player.x,
        player.y,
        this.x,
        this.y
      );

    if (distance < 90) {
      this.isNearby = true;

      this.interactionText.setVisible(
        true
      );
    } else {
      this.isNearby = false;

      this.interactionText.setVisible(
        false
      );
    }
  }

  // =====================================
  // BICARA DENGAN NPC
  // =====================================

  talk() {
    if (!this.isNearby) {
      return;
    }

    // Pastikan VillageScene memiliki
    // fungsi showNPCDialog
    if (
      typeof this.scene.showNPCDialog ===
      "function"
    ) {
      this.scene.showNPCDialog(this);
    }
  }
}

export default NPC;