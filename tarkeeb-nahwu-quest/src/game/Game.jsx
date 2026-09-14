import { useEffect, useRef } from "react";
import Phaser from "phaser";
import VillageScene from "./scenes/VillageScene";

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

      scene: [VillageScene],
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

  return <div ref={gameRef}></div>;
}

export default Game;