import { Math as PMath, GameObjects } from 'phaser';
import { PERSON_RADIUS, ORDER_TIME, HOLE_HEIGHT, ROAD_HEIGHT, HOLE_REVISIT_COOLDOWN, PERSONAL_SPACE, AVOIDANCE_FORCE, ORDERING_REPULSION_FORCE, ORDERING_PERSONAL_SPACE, VERTICAL_MOVEMENT_FACTOR } from '../Constants';
import { Hole } from './Hole';
import { GameObject } from '../../engine/Node';
import { GameScene } from '../scenes/GameScene';
import chroma from 'chroma-js';


export class Person extends GameObject<GameScene> {
  private velocity!: number; // Rimuoviamo l'inizializzazione = 0
  private isMovingRight: boolean = false;
  private readonly BOUNDS_PADDING: number = 60 + PERSON_RADIUS * 3;
  private sprite?: GameObjects.Arc = undefined;
  private mode: 'walking' | 'approaching' | 'ordering' | 'leaving' = 'walking';
  private targetHole: Hole | null = null;
  private orderTimer: number = 0;
  private lastVisitedHole: Hole | null = null;
  private lastVisitedHoleTimer: number = 0;
  private verticalVelocity: number = 0;
  private color: chroma.ChromaInput = 'greenyellow'

  constructor(parent: GameScene, x: number, y: number) {
    super(parent, x, y);
    this.velocity = PMath.Between(50, 150);
    this.initializeProperties();
    this.createSprite();
  }

  private initializeProperties() {
    this.isMovingRight = PMath.Between(0, 1) === 1;
    const [roadTop, roadBottom] = this.parent.getRoadSize()
    this.y = PMath.Between(roadTop + PERSON_RADIUS, roadBottom - PERSON_RADIUS);
  }

  private createSprite() {
    this.sprite = this.parent.add.circle(0, 0, PERSON_RADIUS)
    this.sprite.setFillStyle(chroma(this.color).num());
    this.add([this.sprite])
  }

  update(time: number, delta: number) {
    switch (this.mode) {
      case 'walking':
        this.updateWalking(delta);
        break;
      case 'approaching':
        this.updateApproaching(delta);
        break;
      case 'ordering':
        this.updateOrdering(delta);
        break;
      case 'leaving':
        this.updateLeaving(delta);
        break;
    }

    // Aggiorna il timer per lastVisitedHole
    if (this.lastVisitedHole && this.lastVisitedHoleTimer > 0) {
      this.lastVisitedHoleTimer -= delta;
      if (this.lastVisitedHoleTimer <= 0) {
        this.lastVisitedHole = null;
        this.lastVisitedHoleTimer = HOLE_REVISIT_COOLDOWN
      }
    }

    // Aggiorna il testo di debug con più informazioni
    const lastHoleId = this.lastVisitedHole ? `last:${(this.lastVisitedHole as Hole).getId()}(${Math.ceil(this.lastVisitedHoleTimer / 1000)}s)` : '';
    const targetHoleId = this.targetHole ? `target:${this.targetHole.getId()}` : '';
    this.log(`${this.id}-${this.mode} 
v:${this.velocity}
lh:${lastHoleId} 
th:${targetHoleId} (${(this.orderTimer / ORDER_TIME).toFixed(2)})
`)
  }

  private isStationary(): boolean {
    return this.mode === 'ordering' || this.mode === 'approaching';
  }

  private updateWalking(delta: number) {
    const deltaInSeconds = delta / 1000;
    let movement = this.velocity * deltaInSeconds;

    if (this.isStationary()) {
      return;
    }

    const others = this.parent.getOtherPeople(this);
    let totalForceY = 0;
    let shouldAttemptOvertake = false;

    // Controlla se c'è qualcuno più lento davanti
    const pedestriansAhead = others.filter(p => {
      const dx = p.x - this.x;
      const dy = Math.abs(p.y - this.y);
      const effectiveRadius = p.isStationary() ? PERSON_RADIUS * 3 : PERSON_RADIUS * 2;
      const isAhead = Math.abs(dx) < PERSONAL_SPACE * 2 &&
        Math.sign(dx) === (this.isMovingRight ? 1 : -1);

      if (isAhead && dy < effectiveRadius) {
        // Se troviamo qualcuno più lento davanti a noi
        if (p.getVelocity() < this.velocity) {
          shouldAttemptOvertake = true;
        }
        return true;
      }
      return false;
    });

    // Calcola le forze di repulsione come prima
    for (const other of others) {
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const effectivePersonalSpace = other.isStationary() ?
        ORDERING_PERSONAL_SPACE : PERSONAL_SPACE;
      const effectiveForce = other.isStationary() ?
        ORDERING_REPULSION_FORCE : AVOIDANCE_FORCE;

      if (distance < effectivePersonalSpace) {
        const force = (effectivePersonalSpace - distance) / effectivePersonalSpace * effectiveForce;
        totalForceY -= (dy / distance) * force;
      }
    }

    // Modifica il movimento verticale per il sorpasso
    const naturalVerticalMovement = this.velocity * VERTICAL_MOVEMENT_FACTOR * deltaInSeconds;
    if (shouldAttemptOvertake) {
      // Durante il sorpasso, aumenta la forza verso l'alto o il basso in base alla posizione
      const [roadTop, roadBottom] = this.parent.getRoadSize();
      const roadCenter = (roadTop + roadBottom) / 2;
      // Se siamo sopra la metà strada, forza verso l'alto, altrimenti verso il basso
      totalForceY += (this.y > roadCenter ? -1 : 1) * naturalVerticalMovement * 3;
    } else {
      // Movimento verticale normale
      totalForceY += this.isMovingRight ? naturalVerticalMovement : -naturalVerticalMovement;
    }

    // Aggiorna la velocità verticale con smorzamento
    this.verticalVelocity = (this.verticalVelocity + totalForceY * deltaInSeconds) * 0.9;

    // Limita il movimento verticale all'interno della strada con margini
    const newY = this.y + this.verticalVelocity * deltaInSeconds;
    const [roadTop, roadBottom] = this.parent.getRoadSize()
    if (newY > roadTop && newY < roadBottom) {
      this.y = newY;
    } else {
      this.verticalVelocity = 0;
      // Mantieni il pedone dentro i limiti della strada
      this.y = Math.max(roadTop, Math.min(roadBottom, this.y));
    }

    // Modifica il movimento orizzontale
    if (pedestriansAhead.length > 0 && !shouldAttemptOvertake) {
      movement *= 0.1; // Rallenta solo se non stiamo sorpassando
    }

    this.x += this.isMovingRight ? movement : -movement;

    // Gestione dei bordi
    if (this.x < -this.BOUNDS_PADDING) {
      this.x = -this.BOUNDS_PADDING;
      this.toggleDirection(true)
    } else if (this.x > this.parent.scale.width + this.BOUNDS_PADDING) {
      this.x = this.parent.scale.width + this.BOUNDS_PADDING;
      this.toggleDirection(false)
    }
  }

  toggleDirection(isMovingRight: boolean) {
    if (this.isMovingRight !== isMovingRight) {
      this.isMovingRight = isMovingRight
      this.initializeProperties()
    }
  }

  tryToOrder(hole: Hole) {
    if (this.mode === 'walking' &&
      hole.isAvailable() &&
      hole !== this.lastVisitedHole) {
      this.targetHole = hole;
      this.lastVisitedHole = hole;
      this.lastVisitedHoleTimer = HOLE_REVISIT_COOLDOWN;
      this.mode = 'approaching';
      hole.startServing(this);
    }
  }

  private updateApproaching(delta: number) {
    if (!this.targetHole) return;

    const deltaInSeconds = delta / 1000;
    const speed = this.velocity * deltaInSeconds;

    // Calcola la distanza dal buco
    const offset = PERSON_RADIUS + HOLE_HEIGHT / 2;
    const dx = this.targetHole.x - this.x;
    const dy = this.targetHole.y - this.y + offset
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) {
      // Arrivati a destinazione
      this.x = this.targetHole.x;
      this.y = this.targetHole.y + offset; // Si posiziona sotto il buco
      this.mode = 'ordering';
      this.orderTimer = ORDER_TIME;
    } else {
      // Movimento interpolato verso il buco
      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;

      this.x += moveX;
      this.y += moveY;
    }
  }

  private updateOrdering(delta: number) {
    this.orderTimer -= delta;
    if (this.orderTimer <= 0) {
      this.mode = 'leaving';
      if (this.targetHole) {
        this.targetHole.stopServing();
        this.targetHole = null;
      }
      this.sprite?.setFillStyle(chroma(this.color).num())
    } else {
      const percentage = this.orderTimer / ORDER_TIME
      const scaledDolor = chroma.scale(['red', this.color])(percentage).num()
      this.sprite?.setFillStyle(scaledDolor)
    }
  }

  private updateLeaving(delta: number) {
    const deltaInSeconds = delta / 1000;
    const speed = this.velocity * deltaInSeconds;

    // Torna sulla strada
    const targetY = this.parent.scale.height - ROAD_HEIGHT / 2;
    const dy = targetY - this.y;

    if (Math.abs(dy) < 2) {
      this.y = targetY;
      this.mode = 'walking';
      this.targetHole = null;
    } else {
      this.y += speed;
    }
  }

  // Aggiungi questo metodo per accedere alla velocità
  getVelocity(): number {
    return this.velocity;
  }
}
