import { NodeScene } from '../../engine/Node';
import { Test } from '../gameObjects/Test';

export class MenuScene extends NodeScene {
  constructor() {
    super('MenuScene');
  }

  create() {
    super.create(); // Important: call parent create
    this.createUI();
  }

  createUI() {
    const { width, height } = this.scale;

    // Titolo
    this.add.text(width / 2, height * 0.2, 'LEADERBOARD', {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5);

    // Esempio di leaderboard
    const scores = [
      { name: 'Player 1', score: 1000 },
      { name: 'Player 2', score: 800 },
      { name: 'Player 3', score: 600 },
    ];

    scores.forEach((score, index) => {
      this.add.text(
        width / 2,
        height * 0.3 + (index * 40),
        `${score.name}: ${score.score}`,
        { fontSize: '24px', color: '#fff' }
      ).setOrigin(0.5);
    });

    // Pulsante Play
    const playButton = this.add.text(width / 2, height * 0.8, 'PLAY', {
      fontSize: '28px',
      color: '#fff',
      backgroundColor: '#333',
      padding: { x: 20, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive();

    playButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

  }
}
