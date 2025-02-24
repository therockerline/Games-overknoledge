import { GameObjects, Input } from 'phaser';
import { GameObject } from '../../engine/Node';
import { GameScene } from '../scenes/GameScene';
import { Information } from './Information';
import { ROAD_HEIGHT, WALL_HEIGHT } from '../Constants'

export class Player extends GameObject<GameScene> {
  private sprite: GameObjects.Arc;
  private collectSprite: GameObjects.Arc;
  public readonly RADIUS = 10;
  public readonly COLLECT_RADIUS = 40;
  private readonly PULSE_RANGE = 8;
  public readonly MAX_SPEED = 300;
  private readonly ACCELERATION = 2000;
  private readonly DECELERATION = 0.92; // Fattore di decelerazione (più vicino a 1 = più scivoloso)
  private readonly BOUNCE_FACTOR = 0.7; // Fattore di rimbalzo (1 = rimbalzo perfetto, 0 = nessun rimbalzo)
  private readonly DEBUG_MODE = true;  // Aggiungi questa costante
  private readonly MOUSE_FOLLOW_SPEED = 0.1; // Velocità di inseguimento del mouse

  private phase = Math.PI * 2;
  private currentVelocityX = 0;
  private currentVelocityY = 0;
  public attachedInfo: Information[] = [];

  private movementBounds: { minX: number, maxX: number, minY: number, maxY: number }
  private keys!: {
    W: Input.Keyboard.Key,
    A: Input.Keyboard.Key,
    S: Input.Keyboard.Key,
    D: Input.Keyboard.Key
  };

  constructor(parent: GameScene) {
    const [x, y] = [parent.scale.width / 2,
    parent.scale.height / 2 - ROAD_HEIGHT - WALL_HEIGHT]
    super(parent, x, y);

    // Controllo collisioni con i bordi
    const minX = this.RADIUS;
    const maxX = this.parent.scale.width - this.RADIUS;
    const minY = this.RADIUS;
    const maxY = this.parent.scale.height - ROAD_HEIGHT - WALL_HEIGHT - this.RADIUS;

    this.movementBounds = {
      minX, maxX, minY, maxY
    }
    // Crea il portatore
    this.sprite = this.parent.add.circle(
      0, 0,
      this.RADIUS,
      0x00FF00
    );

    this.collectSprite = this.parent.add.circle(
      0, 0,
      this.RADIUS,
      0x00FF00,
      0.05
    );



    // Inizializza i controlli
    this.keys = this.parent.input.keyboard?.addKeys({
      W: 'W',
      A: 'A',
      S: 'S',
      D: 'D'
    }) as any;
    this.add([this.collectSprite, this.sprite]);
    this.log(`
[${this.x, this.y}]
(${this.attachedInfo.length})
`)

    // Aggiungi listener per il mouse
    if (this.DEBUG_MODE) {
      this.parent.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        // Salva la posizione del mouse come target
        this.mouseTarget = {
          x: pointer.x,
          y: pointer.y
        };
      });
    }
  }

  private mouseTarget: { x: number, y: number } | null = null;

  // Aggiungi getter pubblici per le proprietà necessarie
  public getRadius(): number {
    return this.RADIUS;
  }

  public getSpeed(): number {
    return Math.sqrt(
      this.currentVelocityX * this.currentVelocityX +
      this.currentVelocityY * this.currentVelocityY
    );
  }

  getMovementBounds() {

    return this.movementBounds
  }
  update(time: number, delta: number) {
    const deltaSeconds = delta / 1000;
    this.phase += deltaSeconds * 3;
    const pulseFactor = (Math.sin(this.phase) + 1) / 2;
    const collectionRadius = this.COLLECT_RADIUS + this.PULSE_RANGE * pulseFactor
    this.collectSprite.setRadius(collectionRadius);

    // Gestione movimento con mouse in debug mode
    if (this.DEBUG_MODE && this.mouseTarget) {
      // Calcola la direzione verso il target del mouse
      const dx = this.mouseTarget.x - this.x;
      const dy = this.mouseTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {  // Evita movimenti microscopici
        // Interpola la posizione verso il target
        this.x += dx * this.MOUSE_FOLLOW_SPEED;
        this.y += dy * this.MOUSE_FOLLOW_SPEED;

        // Mantieni all'interno dei limiti
        const { minX, maxX, minY, maxY } = this.movementBounds;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));
      }
    } else {
      // Movimento normale con tastiera
      let targetVelocityX = 0;
      let targetVelocityY = 0;

      if (this.keys.A.isDown) targetVelocityX = -this.MAX_SPEED;
      if (this.keys.D.isDown) targetVelocityX = this.MAX_SPEED;
      if (this.keys.W.isDown) targetVelocityY = -this.MAX_SPEED;
      if (this.keys.S.isDown) targetVelocityY = this.MAX_SPEED;

      // Accelera verso la velocità target
      if (targetVelocityX !== 0) {
        this.currentVelocityX += Math.sign(targetVelocityX) * this.ACCELERATION * deltaSeconds;
        this.currentVelocityX = Math.sign(this.currentVelocityX) *
          Math.min(Math.abs(this.currentVelocityX), this.MAX_SPEED);
      } else {
        // Decelera quando non c'è input
        this.currentVelocityX *= this.DECELERATION;
      }

      if (targetVelocityY !== 0) {
        this.currentVelocityY += Math.sign(targetVelocityY) * this.ACCELERATION * deltaSeconds;
        this.currentVelocityY = Math.sign(this.currentVelocityY) *
          Math.min(Math.abs(this.currentVelocityY), this.MAX_SPEED);
      } else {
        // Decelera quando non c'è input
        this.currentVelocityY *= this.DECELERATION;
      }

      // Calcola la nuova posizione
      const newX = this.x + this.currentVelocityX * deltaSeconds;
      const newY = this.y + this.currentVelocityY * deltaSeconds;

      const { minX, maxX, minY, maxY } = this.movementBounds

      // Collisione con i bordi orizzontali
      if (newX < minX) {
        this.x = minX;
        this.currentVelocityX = Math.abs(this.currentVelocityX) * this.BOUNCE_FACTOR;
      } else if (newX > maxX) {
        this.x = maxX;
        this.currentVelocityX = -Math.abs(this.currentVelocityX) * this.BOUNCE_FACTOR;
      } else {
        this.x = newX;
      }

      // Collisione con i bordi verticali e il muro
      if (newY < minY) {
        this.y = minY;
        this.currentVelocityY = Math.abs(this.currentVelocityY) * this.BOUNCE_FACTOR;
      } else if (newY > maxY) {
        this.y = maxY;
        this.currentVelocityY = -Math.abs(this.currentVelocityY) * this.BOUNCE_FACTOR;
      } else {
        this.y = newY;
      }
    }

    // Calcola la velocità corrente per Information
    const currentSpeed = Math.sqrt(
      this.currentVelocityX * this.currentVelocityX +
      this.currentVelocityY * this.currentVelocityY
    );

    this.log(`
speed: ${currentSpeed.toFixed(0)}
pos: [${Math.floor(this.x)}, ${Math.floor(this.y)}]
vel: [${Math.floor(this.currentVelocityX)}, ${Math.floor(this.currentVelocityY)}]
`);

    // Collisione con le informazioni
    this.parent.getInformations().forEach(information => {
      if (!information.isAttached) {
        const dx = this.x - information.x;
        const dy = this.y - information.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < collectionRadius) {
          console.log(information)
          information.attachTo(this)
          this.attachedInfo.push(information);
        }
      }
    });
  }
}
