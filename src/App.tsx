import { useEffect, useRef } from 'react';
import { MenuScene } from './game/scenes/MenuScene';
import { GameScene } from './game/scenes/GameScene';
import { GameContainer } from './components/GameContainer';
import { AUTO, Game, Scale, Types } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TARGET_FPS } from './game/Constants';

function App() {
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    // Attendiamo il mounting del container
    const config: Types.Core.GameConfig = {
      type: AUTO,
      parent: 'game-container',
      scale: {
        mode: Scale.FIT,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        autoCenter: Scale.CENTER_BOTH
      },
      backgroundColor: '#000000',
      fps: {
        target: TARGET_FPS,
      },
      scene: [GameScene, MenuScene],
    };

    gameRef.current = new Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <GameContainer />
  );
}

export default App;
