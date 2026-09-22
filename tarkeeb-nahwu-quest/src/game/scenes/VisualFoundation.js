/**
 * Shared visual-only layer for VillageScene and ForestScene.
 * Step 1.2: player movement / idle visual feedback.
 * Gameplay state, physics, quests and battle logic stay in the scenes.
 */
export default class VisualFoundation {
  constructor(scene) {
    this.scene = scene;
    this.tweens = scene.tweens;
  }

  // ==================================================
  // PLAYER VISUAL
  // ==================================================

  animatePlayer(player) {
    if (!player) return;

    player.setData("visualBaseScale", player.scaleX || 1);
    player.setData("visualLastMoving", false);

    // Shadow follows the player and gives a clearer floating / breathing feel.
    const shadow = this.scene.add.ellipse(
      player.x,
      player.y + 23,
      34,
      10,
      0x000000,
      0.22
    );

    shadow.setDepth((player.depth || 0) - 1);
    player.setData("visualShadow", shadow);

    // Idle breathing is intentionally subtle.
    this.tweens.add({
      targets: shadow,
      scaleX: 0.88,
      scaleY: 0.82,
      alpha: 0.14,
      duration: 700,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // Called from the Scene update loop.
  // This changes only visual properties, never physics velocity or game state.
  syncPlayerVisuals(player) {
    if (!player) return;

    const shadow = player.getData("visualShadow");
    const baseScale = player.getData("visualBaseScale") || 1;

    if (shadow && shadow.active) {
      shadow.x = player.x;
      shadow.y = player.y + 23;

      // Shadow becomes slightly narrower while moving.
      const moving =
        Math.abs(player.body?.velocity?.x || 0) > 1 ||
        Math.abs(player.body?.velocity?.y || 0) > 1;

      shadow.scaleX = moving ? 0.78 : 0.92;
      shadow.alpha = moving ? 0.18 : 0.22;

      // Player squash / stretch gives immediate visual feedback when walking.
      const targetScaleX = moving ? baseScale * 1.08 : baseScale;
      const targetScaleY = moving ? baseScale * 0.94 : baseScale;

      player.scaleX += (targetScaleX - player.scaleX) * 0.18;
      player.scaleY += (targetScaleY - player.scaleY) * 0.18;
    }
  }

  // ==================================================
  // TREE
  // ==================================================

  animateTree(parts = []) {
    parts.filter(Boolean).forEach((part, index) => {
      this.tweens.add({
        targets: part,
        angle: index % 2 === 0 ? 2.5 : -2.5,
        duration: 1500 + index * 120,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: index * 80,
      });
    });
  }

  // ==================================================
  // BUSH
  // ==================================================

  animateBush(parts = []) {
    parts.filter(Boolean).forEach((part, index) => {
      this.tweens.add({
        targets: part,
        scaleX: 1.03,
        scaleY: 0.98,
        duration: 1200 + index * 100,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: index * 100,
      });
    });
  }

  // ==================================================
  // ROCK
  // ==================================================

  animateRock(parts = []) {
    parts.filter(Boolean).forEach((part, index) => {
      this.tweens.add({
        targets: part,
        alpha: 0.92,
        duration: 1800 + index * 180,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }

  // ==================================================
  // CHEST
  // ==================================================

  animateChest(chest) {
    if (!chest) return;

    // Badan chest sedikit "bernapas"
    if (chest.body) {
      this.tweens.add({
        targets: chest.body,
        scaleX: 1.035,
        scaleY: 1.06,
        duration: 1000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }

    // Tutup chest bergerak sangat halus
    if (chest.lid) {
      this.tweens.add({
        targets: chest.lid,
        y: chest.lid.y - 2,
        scaleX: 1.025,
        duration: 900,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }

    // Label CHEST sedikit melayang
    if (chest.label) {
      this.tweens.add({
        targets: chest.label,
        y: chest.label.y - 3,
        alpha: 0.82,
        duration: 850,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  setChestNearby(chest, nearby) {
    if (!chest || !chest.body) return;

    // Simpan state sebelumnya
    const wasNearby = chest.getData
      ? chest.getData("isNearby")
      : false;

    // Jangan jalankan efek berulang-ulang
    if (wasNearby === nearby) {
      return;
    }

    if (chest.setData) {
      chest.setData("isNearby", nearby);
    }

    // ==========================================
    // PLAYER MENDEKAT
    // ==========================================
    if (nearby) {
      this.tweens.add({
        targets: chest.body,
        scaleX: 1.10,
        scaleY: 1.10,
        duration: 180,
        ease: "Back.easeOut",
      });

      if (chest.lid) {
        this.tweens.add({
          targets: chest.lid,
          scaleX: 1.10,
          duration: 180,
          ease: "Back.easeOut",
        });
      }

      if (chest.label) {
        this.tweens.add({
          targets: chest.label,
          scaleX: 1.08,
          scaleY: 1.08,
          alpha: 1,
          duration: 180,
          ease: "Back.easeOut",
        });
      }
    }

    // ==========================================
    // PLAYER MENJAUH
    // ==========================================
    else {
      this.tweens.add({
        targets: chest.body,
        scaleX: 1,
        scaleY: 1,
        duration: 180,
        ease: "Sine.easeOut",
      });

      if (chest.lid) {
        this.tweens.add({
          targets: chest.lid,
          scaleX: 1,
          duration: 180,
          ease: "Sine.easeOut",
        });
      }

      if (chest.label) {
        this.tweens.add({
          targets: chest.label,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          duration: 180,
          ease: "Sine.easeOut",
        });
      }
    }
  }

  // ==================================================
  // NPC
  // ==================================================

  animateNPC(objects = []) {
    objects.filter(Boolean).forEach((object, index) => {
      this.tweens.add({
        targets: object,
        scaleX: 1.025,
        scaleY: 1.025,
        duration: 1000 + index * 100,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }

  // ==================================================
  // TITLE
  // ==================================================

  animateTitle(title) {
    if (!title) return;

    this.tweens.add({
      targets: title,
      alpha: 0.82,
      duration: 1800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  // ==================================================
  // CLEANUP
  // ==================================================

  destroyObjectVisuals(object) {
    if (!object) return;

    const shadow = object.getData && object.getData("visualShadow");

    if (shadow) {
      shadow.destroy();
    }
  }
}
