import { useEffect, useRef } from "react";
import Phaser from "phaser";

import VillageScene from "./scenes/VillageScene";
import ForestScene from "./scenes/ForestScene";

function Game() {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);

  useEffect(() => {
    if (gameInstance.current) {
      return;
    }

    const config = {
      type: Phaser.AUTO,

      width: 800,
      height: 600,

      parent: gameRef.current,

      backgroundColor: "#1A365D",

      physics: {
        default: "arcade",

        arcade: {
          gravity: {
            x: 0,
            y: 0,
          },

          debug: false,
        },
      },

      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,

        width: 800,
        height: 600,

        min: {
          width: 640,
          height: 480,
        },

        max: {
          width: 1200,
          height: 900,
        },
      },

      scene: [VillageScene, ForestScene],
    };

    gameInstance.current =
      new Phaser.Game(config);

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={gameRef}
      style={{
        width: "100%",
        height: "100vh",

        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        overflow: "hidden",
      }}
    />
  );
}

export default Game;