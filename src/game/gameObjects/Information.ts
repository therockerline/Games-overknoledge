import { GameObjects } from 'phaser';
import { GameObject } from '../../engine/Node';
import { GameScene } from '../scenes/GameScene';
import { Player } from './Player';

export class Information extends GameObject<GameScene> {
  private sprite: GameObjects.Arc;
  private readonly BASE_RADIUS = 4;
  private readonly PULSE_RANGE = 2;           // Range della pulsazione
  private readonly MASS = 1;
  private readonly MAX_SPEED = 300;
  private readonly ATTRACTION_FORCE = 800;    // Forza di attrazione verso il player
  private readonly REPULSION_FORCE = 2000;    // Forza di repulsione quando troppo vicini
  private readonly ORBITAL_FORCE = 400;       // Forza tangenziale per l'orbita
  private readonly FRICTION = 0.98;           // Attrito per smorzare il movimento
  private readonly MIN_DISTANCE = 30;         // Distanza minima dal player
  private readonly ORBIT_RANGE = 60;          // Distanza alla quale inizia l'orbita
  private readonly INFO_REPULSION_FORCE = 1000;  // Forza di repulsione tra info
  private readonly INFO_MIN_DISTANCE = 15;       // Distanza minima tra info

  private velocityX = 0;
  private velocityY = 0;
  private phase = Math.random() * Math.PI * 2;    // Fase casuale per ogni info
  private player: Player | null = null;
  public isAttached = false;
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;

  constructor(parent: GameScene, x: number, y: number, bounds: { minX: number, maxX: number, minY: number, maxY: number }) {
    super(parent, x, y);
    this.sprite = this.parent.add.circle(0, 0, this.BASE_RADIUS, 0xFFFFFF);
    this.add([this.sprite]);

    // Imposta i limiti dello schermo
    const safetyMargin = this.BASE_RADIUS + this.PULSE_RANGE;
    this.minX = bounds.minX + safetyMargin;
    this.maxX = bounds.maxX - safetyMargin;
    this.minY = bounds.minY + safetyMargin;
    this.maxY = bounds.maxY - safetyMargin;

    // Posizione iniziale sicura
    this.x = Math.max(this.minX, Math.min(this.maxX, x));
    this.y = Math.max(this.minY, Math.min(this.maxY, y));
  }

  attachTo(player: Player) {
    this.player = player;
    this.isAttached = true;
  }

  update(time: number, delta: number) {
    if (!this.player) return;

    const deltaSeconds = delta / 1000;
    this.phase += deltaSeconds * 3;
    const pulseFactor = (Math.sin(this.phase) + 1) / 2;

    // Calcola vettore direzione e distanza dal player
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const direction = { x: dx / distance, y: dy / distance };

    // Calcola le forze
    let forceX = 0;
    let forceY = 0;

    // Forza di attrazione verso il player
    const attractionMultiplier = Math.min(1, distance / this.ORBIT_RANGE);
    forceX += direction.x * this.ATTRACTION_FORCE * attractionMultiplier;
    forceY += direction.y * this.ATTRACTION_FORCE * attractionMultiplier;

    // Forza di repulsione quando troppo vicini
    if (distance < this.MIN_DISTANCE) {
      const repulsion = (1 - distance / this.MIN_DISTANCE) * this.REPULSION_FORCE;
      forceX -= direction.x * repulsion;
      forceY -= direction.y * repulsion;
    }

    // Forza tangenziale per l'orbita quando vicini
    if (distance < this.ORBIT_RANGE) {
      const orbitMultiplier = 1 - (distance / this.ORBIT_RANGE);
      const tangentX = -direction.y;
      const tangentY = direction.x;
      forceX += tangentX * this.ORBITAL_FORCE * orbitMultiplier;
      forceY += tangentY * this.ORBITAL_FORCE * orbitMultiplier;
    }

    // Aggiungi forze di repulsione da altre info
    this.parent.getInformations().forEach(info => {
      if (info.id !== this.id) {
        const dx = info.x - this.x;
        const dy = info.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Applica repulsione solo se le info sono abbastanza vicine
        if (distance < this.INFO_MIN_DISTANCE && distance > 0) {
          const repulsionStrength = (1 - distance / this.INFO_MIN_DISTANCE) *
            this.INFO_REPULSION_FORCE;
          const directionX = dx / distance;
          const directionY = dy / distance;

          forceX -= directionX * repulsionStrength;
          forceY -= directionY * repulsionStrength;
        }
      }
    });

    // Applica le forze (F = ma)
    const accelerationX = forceX / this.MASS;
    const accelerationY = forceY / this.MASS;

    // Aggiorna velocità
    this.velocityX += accelerationX * deltaSeconds;
    this.velocityY += accelerationY * deltaSeconds;

    // Applica attrito
    this.velocityX *= this.FRICTION;
    this.velocityY *= this.FRICTION;

    // Limita la velocità massima
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    if (speed > this.MAX_SPEED) {
      const reduction = this.MAX_SPEED / speed;
      this.velocityX *= reduction;
      this.velocityY *= reduction;
    }

    // Aggiorna posizione
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;

    // Mantieni all'interno dei limiti dello schermo
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));

    // Aggiorna visualizzazione
    this.sprite.setRadius(this.BASE_RADIUS + this.PULSE_RANGE * pulseFactor);

    this.log(`dist: ${Math.floor(distance)}, speed: ${Math.floor(speed)}`);
  }
}
