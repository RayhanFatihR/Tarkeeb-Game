import Phaser from "phaser";
import VisualFoundation from "../scenes/VisualFoundation.js";

class NPC extends Phaser.GameObjects.Container {
  constructor(scene, x, y, name) {
    super(scene, x, y);

    this.scene = scene;
    this.npcName = name;
    this.isNearby = false;

    // Tambahkan NPC ke Scene
    scene.add.existing(this);

    // =====================================
    // VISUAL FOUNDATION / IDLE ANIMATION
    // =====================================

    // Animasi ini hanya mengubah tampilan NPC,
    // tidak mengubah logic interaksi atau quest.
    this.visualFoundation = new VisualFoundation(scene);
    this.visualFoundation.animateNPC([this]);

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

    // Prompt interaksi dibuat sedikit "bernapas"
    // agar terasa lebih hidup saat muncul.
    this.interactionPulseTween = scene.tweens.add({
      targets: this.interactionText,
      scaleX: 1.03,
      scaleY: 1.03,
      alpha: 0.88,
      duration: 650,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      paused: true,
    });
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

      if (this.interactionPulseTween) {
        this.interactionPulseTween.resume();
      }
    } else {
      this.isNearby = false;

      this.interactionText.setVisible(
        false
      );

      if (this.interactionPulseTween) {
        this.interactionPulseTween.pause();
        this.interactionText.setScale(1);
        this.interactionText.setAlpha(1);
      }
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