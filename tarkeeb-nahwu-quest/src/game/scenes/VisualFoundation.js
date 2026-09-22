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
      // Simpan ukuran dasar hasil setDisplaySize().
      // Jangan tween scale ke angka 1 karena itu membuat PNG
      // kembali ke ukuran aslinya yang sangat besar.
      chest.body.setData(
        "chestBaseScaleX",
        chest.body.scaleX
      );

      chest.body.setData(
        "chestBaseScaleY",
        chest.body.scaleY
      );

      chest.body.setData(
        "chestBaseY",
        chest.body.y
      );

      // Idle chest cukup bobbing kecil pada posisi Y.
      // Scale tetap aman sesuai ukuran 54x48 dari VillageScene.
      this.tweens.add({
        targets: chest.body,
        y: chest.body.y - 2,
        duration: 950,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }

    if (chest.lid) {
      chest.lid.setData(
        "chestBaseScaleX",
        chest.lid.scaleX
      );

      chest.lid.setData(
        "chestBaseScaleY",
        chest.lid.scaleY
      );

      this.tweens.add({
        targets: chest.lid,
        y: chest.lid.y - 2,
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

    if (chest.isNearby === nearby) {
      return;
    }

    chest.isNearby = nearby;

    const bodyBaseScaleX =
      chest.body.getData(
        "chestBaseScaleX"
      ) ?? chest.body.scaleX;

    const bodyBaseScaleY =
      chest.body.getData(
        "chestBaseScaleY"
      ) ?? chest.body.scaleY;

    // Hentikan hanya tween scale sebelumnya.
    // Tween idle Y tetap berjalan.
    this.tweens.killTweensOf(
      chest.body,
      [
        "scaleX",
        "scaleY",
      ]
    );

    this.tweens.add({
      targets: chest.body,

      scaleX:
        nearby
          ? bodyBaseScaleX * 1.10
          : bodyBaseScaleX,

      scaleY:
        nearby
          ? bodyBaseScaleY * 1.10
          : bodyBaseScaleY,

      duration: 180,

      ease:
        nearby
          ? "Back.easeOut"
          : "Sine.easeOut",
    });

    if (chest.lid) {
      const lidBaseScaleX =
        chest.lid.getData(
          "chestBaseScaleX"
        ) ?? chest.lid.scaleX;

      const lidBaseScaleY =
        chest.lid.getData(
          "chestBaseScaleY"
        ) ?? chest.lid.scaleY;

      this.tweens.killTweensOf(
        chest.lid,
        [
          "scaleX",
          "scaleY",
        ]
      );

      this.tweens.add({
        targets: chest.lid,

        scaleX:
          nearby
            ? lidBaseScaleX * 1.10
            : lidBaseScaleX,

        scaleY:
          nearby
            ? lidBaseScaleY * 1.10
            : lidBaseScaleY,

        duration: 180,

        ease:
          nearby
            ? "Back.easeOut"
            : "Sine.easeOut",
      });
    }

    if (chest.label) {
      this.tweens.killTweensOf(
        chest.label,
        [
          "scaleX",
          "scaleY",
        ]
      );

      this.tweens.add({
        targets: chest.label,

        scaleX:
          nearby
            ? 1.08
            : 1,

        scaleY:
          nearby
            ? 1.08
            : 1,

        alpha: 1,

        duration: 180,

        ease:
          nearby
            ? "Back.easeOut"
            : "Sine.easeOut",
      });
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

    this.playImpactEffect(
      monsterBaseX,
      monsterBaseY,
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

    this.playImpactEffect(
      playerBaseX,
      playerBaseY,
      false
    );
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
  // BATTLE POLISH
  // Step 1.9: impact, combo, skill & victory effects
  // ==================================================

  playImpactEffect(
    x = 400,
    y = 220,
    critical = false
  ) {
    const camera =
      this.scene.cameras?.main;

    if (camera) {
      camera.shake(
        critical ? 150 : 90,
        critical ? 0.008 : 0.004
      );
    }

    const flash =
      this.scene.add.rectangle(
        400,
        300,
        800,
        600,
        critical
          ? 0xf6c453
          : 0xffffff,
        critical
          ? 0.13
          : 0.08
      );

    flash.setDepth(890);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration:
        critical
          ? 180
          : 120,
      ease: "Power2",
      onComplete: () => {
        if (
          flash &&
          flash.active
        ) {
          flash.destroy();
        }
      },
    });

    const burst =
      this.scene.add.circle(
        x,
        y,
        critical
          ? 22
          : 16,
        critical
          ? 0xf6c453
          : 0xffffff,
        0.14
      );

    burst.setStrokeStyle(
      critical
        ? 5
        : 3,
      critical
        ? 0xf6c453
        : 0xffffff,
      0.95
    );

    burst.setDepth(891);

    this.tweens.add({
      targets: burst,
      scaleX:
        critical
          ? 3.2
          : 2.4,
      scaleY:
        critical
          ? 3.2
          : 2.4,
      alpha: 0,
      duration:
        critical
          ? 260
          : 190,
      ease: "Power2",
      onComplete: () => {
        if (
          burst &&
          burst.active
        ) {
          burst.destroy();
        }
      },
    });
  }

  playComboEffect(
    combo,
    comboText
  ) {
    if (
      !comboText ||
      !comboText.active ||
      combo < 2
    ) {
      return;
    }

    this.tweens.killTweensOf(
      comboText
    );

    comboText.setScale(1);

    this.tweens.add({
      targets: comboText,
      scaleX:
        combo >= 3
          ? 1.28
          : 1.16,
      scaleY:
        combo >= 3
          ? 1.28
          : 1.16,
      duration: 120,
      ease: "Back.easeOut",
      yoyo: true,
    });

    const comboPopup =
      this.scene.add
        .text(
          400,
          245,
          combo >= 3
            ? `🔥 COMBO x${combo}!`
            : `COMBO x${combo}!`,
          {
            fontSize:
              combo >= 3
                ? "27px"
                : "22px",
            color:
              combo >= 3
                ? "#F6C453"
                : "#FFFFFF",
            fontStyle: "bold",
            stroke: "#1A365D",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5);

    comboPopup.setDepth(892);
    comboPopup.setScale(0.72);

    this.tweens.add({
      targets: comboPopup,
      y: 215,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0,
      duration: 620,
      ease: "Power2",
      onComplete: () => {
        if (
          comboPopup &&
          comboPopup.active
        ) {
          comboPopup.destroy();
        }
      },
    });
  }

  playPowerStrikeEffect(
    playerVisual,
    monsterVisual
  ) {
    if (
      !playerVisual ||
      !monsterVisual ||
      !playerVisual.active ||
      !monsterVisual.active
    ) {
      return;
    }

    const aura =
      this.scene.add.circle(
        playerVisual.x,
        playerVisual.y,
        30,
        0xf6c453,
        0.08
      );

    aura.setStrokeStyle(
      5,
      0xf6c453,
      0.95
    );

    aura.setDepth(
      (playerVisual.depth || 603) + 1
    );

    this.tweens.add({
      targets: aura,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 360,
      ease: "Power2",
      onComplete: () => {
        if (
          aura &&
          aura.active
        ) {
          aura.destroy();
        }
      },
    });

    const skillText =
      this.scene.add
        .text(
          400,
          205,
          "⚡ POWER STRIKE!",
          {
            fontSize: "26px",
            color: "#F6C453",
            fontStyle: "bold",
            stroke: "#1A365D",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5);

    skillText.setDepth(893);
    skillText.setScale(0.75);

    this.tweens.add({
      targets: skillText,
      scaleX: 1.12,
      scaleY: 1.12,
      y: 180,
      alpha: 0,
      duration: 620,
      ease: "Back.easeOut",
      onComplete: () => {
        if (
          skillText &&
          skillText.active
        ) {
          skillText.destroy();
        }
      },
    });

    this.playImpactEffect(
      monsterVisual.x,
      monsterVisual.y,
      true
    );
  }

  playShieldEffect(
    playerVisual
  ) {
    if (
      !playerVisual ||
      !playerVisual.active
    ) {
      return;
    }

    const shieldOuter =
      this.scene.add.circle(
        playerVisual.x,
        playerVisual.y,
        28,
        0x3182ce,
        0.06
      );

    shieldOuter.setStrokeStyle(
      5,
      0x63b3ed,
      0.95
    );

    shieldOuter.setDepth(
      (playerVisual.depth || 603) + 1
    );

    const shieldInner =
      this.scene.add.circle(
        playerVisual.x,
        playerVisual.y,
        20,
        0x90cdf4,
        0.08
      );

    shieldInner.setStrokeStyle(
      2,
      0xffffff,
      0.85
    );

    shieldInner.setDepth(
      (playerVisual.depth || 603) + 2
    );

    this.tweens.add({
      targets: shieldOuter,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 650,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (
          shieldOuter &&
          shieldOuter.active
        ) {
          shieldOuter.destroy();
        }
      },
    });

    this.tweens.add({
      targets: shieldInner,
      scaleX: 1.45,
      scaleY: 1.45,
      alpha: 0,
      duration: 520,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (
          shieldInner &&
          shieldInner.active
        ) {
          shieldInner.destroy();
        }
      },
    });

    const shieldText =
      this.scene.add
        .text(
          playerVisual.x,
          playerVisual.y - 45,
          "🛡 SHIELD",
          {
            fontSize: "18px",
            color: "#90CDF4",
            fontStyle: "bold",
            stroke: "#1A365D",
            strokeThickness: 4,
          }
        )
        .setOrigin(0.5);

    shieldText.setDepth(893);

    this.tweens.add({
      targets: shieldText,
      y: shieldText.y - 20,
      alpha: 0,
      duration: 620,
      ease: "Power2",
      onComplete: () => {
        if (
          shieldText &&
          shieldText.active
        ) {
          shieldText.destroy();
        }
      },
    });
  }

  playVictoryEffect(
    monsterVisual
  ) {
    const camera =
      this.scene.cameras?.main;

    if (camera) {
      camera.shake(
        180,
        0.006
      );
    }

    const originX =
      monsterVisual?.x ?? 650;

    const originY =
      monsterVisual?.y ?? 150;

    const burst =
      this.scene.add.circle(
        originX,
        originY,
        24,
        0xf6c453,
        0.10
      );

    burst.setStrokeStyle(
      5,
      0xf6c453,
      0.95
    );

    burst.setDepth(892);

    this.tweens.add({
      targets: burst,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 520,
      ease: "Power2",
      onComplete: () => {
        if (
          burst &&
          burst.active
        ) {
          burst.destroy();
        }
      },
    });

    const directions = [
      [-55, -35],
      [-25, -60],
      [20, -58],
      [55, -30],
      [-58, 18],
      [58, 18],
      [-25, 52],
      [28, 50],
    ];

    directions.forEach(
      ([dx, dy], index) => {
        const spark =
          this.scene.add.circle(
            originX,
            originY,
            index % 2 === 0
              ? 5
              : 4,
            index % 3 === 0
              ? 0xffffff
              : 0xf6c453,
            0.95
          );

        spark.setDepth(893);

        this.tweens.add({
          targets: spark,
          x: originX + dx,
          y: originY + dy,
          scaleX: 0.25,
          scaleY: 0.25,
          alpha: 0,
          duration:
            420 + index * 20,
          ease: "Power2",
          onComplete: () => {
            if (
              spark &&
              spark.active
            ) {
              spark.destroy();
            }
          },
        });
      }
    );
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
  // SCENE TRANSITION & CINEMATIC FOUNDATION
  // Step 1.10
  // ==================================================

  playSceneEntrance(
    title,
    subtitle = ""
  ) {
    const overlay =
      this.scene.add.rectangle(
        400,
        300,
        800,
        600,
        0x0b1220,
        1
      );

    overlay
      .setDepth(3000)
      .setScrollFactor(0);

    const brand =
      this.scene.add
        .text(
          400,
          205,
          "TARKEEB: NAHWU QUEST",
          {
            fontSize: "13px",
            color: "#D4AF37",
            fontStyle: "bold",
            letterSpacing: 2,
          }
        )
        .setOrigin(0.5)
        .setDepth(3001)
        .setScrollFactor(0)
        .setAlpha(0);

    const titleText =
      this.scene.add
        .text(
          400,
          270,
          title,
          {
            fontSize: "34px",
            color: "#FFFFFF",
            fontStyle: "bold",
            align: "center",
            stroke: "#1A365D",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5)
        .setDepth(3001)
        .setScrollFactor(0)
        .setAlpha(0)
        .setScale(0.92);

    const subtitleText =
      this.scene.add
        .text(
          400,
          320,
          subtitle,
          {
            fontSize: "15px",
            color: "#CBD5E0",
            fontStyle: "italic",
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(3001)
        .setScrollFactor(0)
        .setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0,
      delay: 650,
      duration: 650,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: brand,
      alpha: 1,
      y: 198,
      duration: 300,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 650,
    });

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: 260,
      duration: 360,
      ease: "Back.easeOut",
      yoyo: true,
      hold: 600,
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      y: 312,
      delay: 120,
      duration: 300,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 520,
    });

    this.scene.time.delayedCall(
      1450,
      () => {
        [
          overlay,
          brand,
          titleText,
          subtitleText,
        ].forEach((object) => {
          if (
            object &&
            object.active
          ) {
            object.destroy();
          }
        });
      }
    );
  }

  playSceneTransition({
    title,
    subtitle = "",
    onComplete,
  }) {
    if (
      this.sceneTransitionActive
    ) {
      return;
    }

    this.sceneTransitionActive =
      true;

    const overlay =
      this.scene.add.rectangle(
        400,
        300,
        800,
        600,
        0x0b1220,
        0
      );

    overlay
      .setDepth(3100)
      .setScrollFactor(0);

    const line =
      this.scene.add.rectangle(
        400,
        335,
        0,
        2,
        0xd4af37,
        0.95
      );

    line
      .setDepth(3101)
      .setScrollFactor(0);

    const titleText =
      this.scene.add
        .text(
          400,
          265,
          title,
          {
            fontSize: "30px",
            color: "#FFFFFF",
            fontStyle: "bold",
            align: "center",
            stroke: "#1A365D",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5)
        .setDepth(3101)
        .setScrollFactor(0)
        .setAlpha(0)
        .setScale(0.92);

    const subtitleText =
      this.scene.add
        .text(
          400,
          305,
          subtitle,
          {
            fontSize: "14px",
            color: "#D4AF37",
            fontStyle: "italic",
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(3101)
        .setScrollFactor(0)
        .setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 360,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 330,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      delay: 100,
      duration: 260,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: line,
      width: 260,
      delay: 120,
      duration: 320,
      ease: "Power2",
    });

    this.scene.time.delayedCall(
      760,
      () => {
        if (
          typeof onComplete ===
          "function"
        ) {
          onComplete();
        }
      }
    );
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
