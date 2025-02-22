import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';

// Importa Phaser da CDN
const phaserScript = document.createElement('script');
phaserScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js';
document.head.appendChild(phaserScript);

class BootScene extends Phaser.Scene {
      constructor() {
            super({ key: 'BootScene' });
      }

      preload() {
            // Carica assets di base
            this.load.setBaseURL('https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/');
            this.load.image('background', 'games/cooking/background.png');
            this.load.spritesheet('player', 'games/cooking/chef.png', { frameWidth: 32, frameHeight: 48 });
            this.load.image('station', 'games/cooking/counter.png');
            this.load.image('button', 'games/cooking/button.png');
      }

      create() {
            this.scene.start('GameScene');
      }
}

class GameScene extends Phaser.Scene {
      constructor() {
            super({ key: 'GameScene' });
      }

      create() {
            this.setupWorld();
            this.setupPlayer();
            this.setupStations();
            this.setupUI();
            this.setupInput();
      }

      setupWorld() {
            // Setup del mondo di gioco
            const width = this.scale.width;
            const height = this.scale.height;

            // Background
            this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0);

            // Griglia di gioco
            const gridSize = 64;
            for (let x = 0; x < width; x += gridSize) {
                  for (let y = 0; y < height; y += gridSize) {
                        this.add.rectangle(x, y, gridSize, gridSize, 0x222222, 0.1).setOrigin(0);
                  }
            }
      }

      setupPlayer() {
            // Player sprite e animazioni
            this.player = this.add.sprite(200, 200, 'player');
            this.player.setScale(2);
            this.player.holding = null;

            // Animazioni del player
            this.createPlayerAnimations();
      }

      setupStations() {
            // Stazioni di lavoro
            this.stations = this.add.group();

            const stationConfigs = [
                  { x: 100, y: 100, type: 'CUSTOMER_INFO', color: 0x4CAF50 },
                  { x: 100, y: 400, type: 'PRODUCT_SPECS', color: 0x2196F3 },
                  { x: 500, y: 100, type: 'PRICING_DATA', color: 0xFFC107 },
                  { x: 500, y: 400, type: 'TECH_SUPPORT', color: 0x9C27B0 },
                  { x: 300, y: 250, type: 'COMBINE', color: 0x666666 }
            ];

            stationConfigs.forEach(config => {
                  const station = this.add.rectangle(config.x, config.y, 64, 64, config.color);
                  station.type = config.type;
                  station.items = config.type === 'COMBINE' ? [] : null;
                  this.stations.add(station);
            });
      }

      setupUI() {
            // Score e timer
            this.scoreText = this.add.text(16, 16, 'Score: 0', {
                  fontSize: '32px',
                  fill: '#fff'
            });

            // Ordini attivi
            this.orders = [];
            this.orderTexts = [];
            this.updateOrders();

            // Virtual joystick per mobile
            this.setupVirtualJoystick();
      }

      setupInput() {
            // Touch input
            this.input.on('pointerdown', (pointer) => {
                  // Controlla se il touch è su una stazione
                  const touchX = pointer.x;
                  const touchY = pointer.y;

                  this.stations.getChildren().forEach(station => {
                        const distance = Phaser.Math.Distance.Between(
                              touchX, touchY,
                              station.x, station.y
                        );

                        if (distance < 32) {
                              this.interactWithStation(station);
                        }
                  });
            });

            // Virtual joystick events
            this.joystick.on('update', (pad) => {
                  const force = pad.forceX;
                  const angle = pad.angle;

                  // Muovi il player in base all'input del joystick
                  if (force > 0) {
                        const speed = 5;
                        this.player.x += Math.cos(angle) * speed;
                        this.player.y += Math.sin(angle) * speed;

                        // Animazione di movimento
                        if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
                              this.player.play(Math.cos(angle) > 0 ? 'walk-right' : 'walk-left');
                        } else {
                              this.player.play(Math.sin(angle) > 0 ? 'walk-down' : 'walk-up');
                        }
                  } else {
                        this.player.stop();
                  }
            });
      }

      setupVirtualJoystick() {
            // Plugin del joystick virtuale
            this.joystick = this.plugins.get('rexVirtualJoystick').add(this, {
                  x: 100,
                  y: this.scale.height - 100,
                  radius: 50,
                  base: this.add.circle(0, 0, 50, 0x888888),
                  thumb: this.add.circle(0, 0, 25, 0xcccccc),
            });
      }

      createPlayerAnimations() {
            // Animazioni del personaggio
            this.anims.create({
                  key: 'walk-down',
                  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                  frameRate: 8,
                  repeat: -1
            });

            this.anims.create({
                  key: 'walk-left',
                  frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
                  frameRate: 8,
                  repeat: -1
            });

            this.anims.create({
                  key: 'walk-right',
                  frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
                  frameRate: 8,
                  repeat: -1
            });

            this.anims.create({
                  key: 'walk-up',
                  frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
                  frameRate: 8,
                  repeat: -1
            });
      }

      interactWithStation(station) {
            if (station.type === 'COMBINE') {
                  if (this.player.holding) {
                        station.items.push(this.player.holding);
                        this.player.holding = null;
                        this.checkRecipe(station);
                  }
            } else {
                  if (!this.player.holding) {
                        this.player.holding = station.type;
                        // Cambia il colore del player per indicare cosa sta trasportando
                        this.player.setTint(station.fillColor);
                  }
            }
      }

      checkRecipe(station) {
            const items = station.items;
            // Verifica se gli item corrispondono a una ricetta valida
            if (items.length >= 3) {
                  this.score += 100;
                  this.scoreText.setText('Score: ' + this.score);
                  station.items = [];
            }
      }

      updateOrders() {
            // Genera nuovi ordini periodicamente
            if (this.orders.length < 3) {
                  this.orders.push({
                        type: 'Order ' + (this.orders.length + 1),
                        items: ['CUSTOMER_INFO', 'PRODUCT_SPECS', 'PRICING_DATA']
                  });
            }

            // Aggiorna i testi degli ordini
            this.orderTexts.forEach(text => text.destroy());
            this.orderTexts = this.orders.map((order, i) => {
                  return this.add.text(
                        this.scale.width - 200,
                        50 + (i * 30),
                        order.type,
                        { fontSize: '16px', fill: '#fff' }
                  );
            });
      }

      update() {
            // Update loop del gioco
            this.constrainPlayer();
            this.updatePlayerVisuals();
      }

      constrainPlayer() {
            // Mantieni il player dentro i bordi
            this.player.x = Phaser.Math.Clamp(
                  this.player.x,
                  0,
                  this.scale.width
            );
            this.player.y = Phaser.Math.Clamp(
                  this.player.y,
                  0,
                  this.scale.height
            );
      }

      updatePlayerVisuals() {
            // Aggiorna visuals del player in base a cosa sta trasportando
            if (this.player.holding) {
                  // Mostra quello che il player sta trasportando
                  if (!this.holdingText) {
                        this.holdingText = this.add.text(
                              0, 0,
                              this.player.holding,
                              { fontSize: '12px', fill: '#fff' }
                        );
                  }
                  this.holdingText.setPosition(
                        this.player.x - 20,
                        this.player.y - 30
                  );
            } else if (this.holdingText) {
                  this.holdingText.destroy();
                  this.holdingText = null;
            }
      }
}

const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
      scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
            default: 'arcade',
            arcade: {
                  gravity: { y: 0 },
                  debug: false
            }
      },
      scene: [BootScene, GameScene],
      plugins: {
            global: [{
                  key: 'rexVirtualJoystick',
                  plugin: VirtualJoystickPlugin,
                  start: true
            }]
      }
};

const DataCookingGame = () => {
      useEffect(() => {
            let game;

            // Aspetta che Phaser sia caricato
            const initGame = () => {
                  if (window.Phaser) {
                        game = new Phaser.Game(config);
                  } else {
                        setTimeout(initGame, 100);
                  }
            };

            initGame();

            return () => {
                  if (game) {
                        game.destroy(true);
                  }
            };
      }, []);

      return (
            <Card className="w-full max-w-4xl mx-auto p-4">
                  <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold">Data Cooking Game</h2>
                        <p className="text-gray-600">
                              Combina i dati per creare risposte perfette!
                        </p>
                  </div>
                  <div id="game-container" className="w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden" />
                  <div className="mt-4 text-sm text-gray-600">
                        <p>Usa il joystick virtuale per muoverti</p>
                        <p>Tocca le stazioni per interagire</p>
                  </div>
            </Card>
      );
};

export default DataCookingGame;