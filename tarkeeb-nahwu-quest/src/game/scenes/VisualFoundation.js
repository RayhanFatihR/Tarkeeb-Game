/**
 * Shared visual-only layer for VillageScene and ForestScene.
 * Step 1.6: Player movement visual feedback.
 * Tidak mengubah physics, speed, quest, battle, inventory, atau reward logic.
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

    const baseScale = player.scaleX || 1;

    player.setData("visualBaseScale", baseScale);
    player.setData("visualLastMoving", false);

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

  syncPlayerVisuals(player) {
    if (!player) return;

    const shadow = player.getData("visualShadow");
    const baseScale = player.getData("visualBaseScale") || 1;

    if (!shadow || !shadow.active) return;

    shadow.x = player.x;
    shadow.y = player.y + 23;

    const velocityX = player.body?.velocity?.x || 0;
    const velocityY = player.body?.velocity?.y || 0;

    const moving =
      Math.abs(velocityX) > 1 ||
      Math.abs(velocityY) > 1;

    if (moving) {
      const targetScaleX = baseScale * 1.07;
      const targetScaleY = baseScale * 0.94;

      player.scaleX +=
        (targetScaleX - player.scaleX) * 0.22;

      player.scaleY +=
        (targetScaleY - player.scaleY) * 0.22;

      shadow.scaleX +=
        (0.76 - shadow.scaleX) * 0.22;

      shadow.scaleY +=
        (0.78 - shadow.scaleY) * 0.22;

      shadow.alpha +=
        (0.18 - shadow.alpha) * 0.22;
    } else {
      player.scaleX +=
        (baseScale - player.scaleX) * 0.18;

      player.scaleY +=
        (baseScale - player.scaleY) * 0.18;

      shadow.scaleX +=
        (0.92 - shadow.scaleX) * 0.18;

      shadow.scaleY +=
        (0.82 - shadow.scaleY) * 0.18;

      shadow.alpha +=
        (0.22 - shadow.alpha) * 0.18;
    }

    player.setData("visualLastMoving", moving);
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

    if (chest.isNearby === nearby) return;

    chest.isNearby = nearby;

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
    } else {
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
  // MONSTER
  // ==================================================

  animateMonster(monster, index = 0) {
    if (!monster || !monster.setData) return;

    // Jangan pasang animasi dua kali ke monster yang sama.
    if (monster.getData("monsterVisualInitialized")) {
      return;
    }

    monster.setData("monsterVisualInitialized", true);
    monster.setData("monsterVisualBaseScaleX", monster.scaleX || 1);
    monster.setData("monsterVisualBaseScaleY", monster.scaleY || 1);
    monster.setData("monsterVisualPhase", index * 160);
    monster.setData("monsterVisualDeadCleaned", false);

    // Shadow visual. Posisi asli monster tidak diubah.
    const shadow = this.scene.add.ellipse(
      monster.x,
      monster.y + 28,
      42,
      12,
      0x000000,
      0.22
    );

    shadow.setDepth((monster.depth || 0) - 1);
    monster.setData("monsterVisualShadow", shadow);

    // Idle sway kecil. Hanya angle, jadi tidak mengubah
    // posisi monster maupun perhitungan jarak interaksi.
    const idleTween = this.tweens.add({
      targets: monster,
      angle: index % 2 === 0 ? 1.5 : -1.5,
      duration: 950 + index * 90,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    monster.setData("monsterVisualIdleTween", idleTween);
  }

  syncMonsterVisuals(monster) {
    if (!monster || !monster.getData) return;

    const shadow =
      monster.getData("monsterVisualShadow");

    const idleTween =
      monster.getData("monsterVisualIdleTween");

    const isDead =
      typeof monster.isDead === "function"
        ? monster.isDead()
        : false;

    // Saat monster mati, bersihkan efek visualnya.
    if (!monster.active || isDead) {
      if (
        !monster.getData("monsterVisualDeadCleaned")
      ) {
        monster.setData(
          "monsterVisualDeadCleaned",
          true
        );

        if (idleTween) {
          idleTween.stop();
        }

        if (shadow && shadow.active) {
          shadow.setVisible(false);
        }
      }

      return;
    }

    const baseScaleX =
      monster.getData(
        "monsterVisualBaseScaleX"
      ) || 1;

    const baseScaleY =
      monster.getData(
        "monsterVisualBaseScaleY"
      ) || 1;

    const phase =
      monster.getData(
        "monsterVisualPhase"
      ) || 0;

    const nearby =
      Boolean(monster.isNearby);

    // Pulse halus saat idle.
    const pulse =
      Math.sin(
        (this.scene.time.now + phase) / 260
      ) * 0.018;

    const targetScaleX =
      nearby
        ? baseScaleX * 1.11
        : baseScaleX * (1 + pulse);

    const targetScaleY =
      nearby
        ? baseScaleY * 1.11
        : baseScaleY * (1 - pulse * 0.55);

    monster.scaleX +=
      (targetScaleX - monster.scaleX) * 0.16;

    monster.scaleY +=
      (targetScaleY - monster.scaleY) * 0.16;

    // Shadow mengikuti monster bila Monster.update()
    // memindahkan posisinya.
    if (shadow && shadow.active) {
      shadow.setVisible(true);
      shadow.x = monster.x;
      shadow.y = monster.y + 28;

      const targetShadowScale =
        nearby ? 1.08 : 0.92;

      shadow.scaleX +=
        (targetShadowScale - shadow.scaleX) * 0.16;

      shadow.scaleY +=
        ((nearby ? 0.86 : 1) - shadow.scaleY) * 0.16;

      shadow.alpha +=
        ((nearby ? 0.28 : 0.20) - shadow.alpha) * 0.16;
    }
  }


  // ==================================================
  // BATTLE VISUALS
  // Step 1.8: Attack, Hit & Death Animation
  // ==================================================

  animateBattleEntry(
    playerVisual,
    monsterVisual
  ) {
    const visuals = [
      playerVisual,
      monsterVisual,
    ].filter(Boolean);

    visuals.forEach((visual) => {
      visual.setData(
        "battleBaseX",
        visual.x
      );

      visual.setData(
        "battleBaseY",
        visual.y
      );

      visual.setAlpha(0);
      visual.setScale(0.45);
    });

    if (playerVisual) {
      this.tweens.add({
        targets: playerVisual,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 320,
        ease: "Back.easeOut",
      });
    }

    if (monsterVisual) {
      this.tweens.add({
        targets: monsterVisual,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        delay: 80,
        ease: "Back.easeOut",
      });
    }
  }

  playPlayerAttack(
    playerVisual,
    monsterVisual,
    critical = false
  ) {
    if (
      !playerVisual ||
      !monsterVisual ||
      !playerVisual.active ||
      !monsterVisual.active
    ) {
      return;
    }

    const playerBaseX =
      playerVisual.getData("battleBaseX") ??
      playerVisual.x;

    const playerBaseY =
      playerVisual.getData("battleBaseY") ??
      playerVisual.y;

    const monsterBaseX =
      monsterVisual.getData("battleBaseX") ??
      monsterVisual.x;

    const monsterBaseY =
      monsterVisual.getData("battleBaseY") ??
      monsterVisual.y;

    this.tweens.killTweensOf(
      playerVisual
    );

    playerVisual.setPosition(
      playerBaseX,
      playerBaseY
    );

    // Player maju menyerang lalu kembali.
    this.tweens.add({
      targets: playerVisual,
      x: playerBaseX + 65,
      scaleX: critical ? 1.18 : 1.10,
      scaleY: critical ? 1.18 : 1.10,
      duration: critical ? 115 : 135,
      ease: "Power2",
      yoyo: true,
      onComplete: () => {
        if (
          playerVisual &&
          playerVisual.active
        ) {
          playerVisual.setPosition(
            playerBaseX,
            playerBaseY
          );

          playerVisual.setScale(1);
        }
      },
    });

    // Slash visual.
    const slash =
      this.scene.add.rectangle(
        (playerBaseX + monsterBaseX) / 2,
        (playerBaseY + monsterBaseY) / 2,
        critical ? 52 : 42,
        critical ? 9 : 6,
        critical
          ? 0xf6c453
          : 0xffffff,
        0.95
      );

    slash.setAngle(-35);

    slash.setDepth(
      Math.max(
        playerVisual.depth || 0,
        monsterVisual.depth || 0
      ) + 2
    );

    this.tweens.add({
      targets: slash,
      x: slash.x + 32,
      y: slash.y - 15,
      scaleX: 1.35,
      alpha: 0,
      duration: critical ? 260 : 220,
      ease: "Power2",
      onComplete: () => {
        if (slash && slash.active) {
          slash.destroy();
        }
      },
    });

    this.playMonsterHit(
      monsterVisual,
      critical
    );
  }

  playMonsterHit(
    monsterVisual,
    critical = false
  ) {
    if (
      !monsterVisual ||
      !monsterVisual.active
    ) {
      return;
    }

    const baseX =
      monsterVisual.getData("battleBaseX") ??
      monsterVisual.x;

    const baseY =
      monsterVisual.getData("battleBaseY") ??
      monsterVisual.y;

    this.tweens.killTweensOf(
      monsterVisual
    );

    monsterVisual.setPosition(
      baseX,
      baseY
    );

    // Shake + squash ketika kena serang.
    this.tweens.add({
      targets: monsterVisual,
      x: baseX + 10,
      scaleX: critical ? 1.22 : 1.12,
      scaleY: critical ? 0.78 : 0.88,
      alpha: 0.60,
      duration: 55,
      ease: "Linear",
      yoyo: true,
      repeat: critical ? 3 : 2,
      onComplete: () => {
        if (
          monsterVisual &&
          monsterVisual.active
        ) {
          monsterVisual.setPosition(
            baseX,
            baseY
          );

          monsterVisual.setScale(1);
          monsterVisual.setAlpha(1);
        }
      },
    });
  }

  playMonsterAttack(
    monsterVisual,
    playerVisual
  ) {
    if (
      !monsterVisual ||
      !playerVisual ||
      !monsterVisual.active ||
      !playerVisual.active
    ) {
      return;
    }

    const monsterBaseX =
      monsterVisual.getData("battleBaseX") ??
      monsterVisual.x;

    const monsterBaseY =
      monsterVisual.getData("battleBaseY") ??
      monsterVisual.y;

    const playerBaseX =
      playerVisual.getData("battleBaseX") ??
      playerVisual.x;

    const playerBaseY =
      playerVisual.getData("battleBaseY") ??
      playerVisual.y;

    this.tweens.killTweensOf(
      monsterVisual
    );

    this.tweens.killTweensOf(
      playerVisual
    );

    monsterVisual.setPosition(
      monsterBaseX,
      monsterBaseY
    );

    playerVisual.setPosition(
      playerBaseX,
      playerBaseY
    );

    // Monster menerjang ke arah player.
    this.tweens.add({
      targets: monsterVisual,
      x: monsterBaseX - 55,
      scaleX: 1.10,
      scaleY: 1.10,
      duration: 130,
      ease: "Power2",
      yoyo: true,
      onComplete: () => {
        if (
          monsterVisual &&
          monsterVisual.active
        ) {
          monsterVisual.setPosition(
            monsterBaseX,
            monsterBaseY
          );

          monsterVisual.setScale(1);
        }
      },
    });

    // Player terkena hit.
    this.tweens.add({
      targets: playerVisual,
      x: playerBaseX - 8,
      alpha: 0.62,
      scaleX: 1.10,
      scaleY: 0.90,
      duration: 55,
      ease: "Linear",
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (
          playerVisual &&
          playerVisual.active
        ) {
          playerVisual.setPosition(
            playerBaseX,
            playerBaseY
          );

          playerVisual.setScale(1);
          playerVisual.setAlpha(1);
        }
      },
    });
  }

  playMonsterDeath(
    monsterVisual
  ) {
    if (
      !monsterVisual ||
      !monsterVisual.active
    ) {
      return;
    }

    this.tweens.killTweensOf(
      monsterVisual
    );

    const baseY =
      monsterVisual.getData("battleBaseY") ??
      monsterVisual.y;

    this.tweens.add({
      targets: monsterVisual,
      y: baseY + 28,
      angle: 24,
      scaleX: 0.35,
      scaleY: 0.35,
      alpha: 0,
      duration: 560,
      ease: "Back.easeIn",
    });
  }

  playPlayerDefeat(
    playerVisual
  ) {
    if (
      !playerVisual ||
      !playerVisual.active
    ) {
      return;
    }

    this.tweens.killTweensOf(
      playerVisual
    );

    const baseY =
      playerVisual.getData("battleBaseY") ??
      playerVisual.y;

    this.tweens.add({
      targets: playerVisual,
      y: baseY + 25,
      angle: -22,
      scaleX: 0.65,
      scaleY: 0.65,
      alpha: 0.45,
      duration: 520,
      ease: "Power2",
    });
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

    const shadow =
      object.getData &&
      object.getData("visualShadow");

    if (shadow) {
      shadow.destroy();
    }
  }
}
