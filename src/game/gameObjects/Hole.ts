import { GameObjects } from 'phaser';
import { HOLE_WIDTH, HOLE_HEIGHT } from '../Constants';
import { Person } from './Person';
import { GameScene } from '../scenes/GameScene';
import { GameObject } from '../../engine/Node';

export class Hole extends GameObject<GameScene> {
  private shape?: GameObjects.Rectangle;
  private orderPoint?: GameObjects.Arc;
  currentCustomer: Person | null = null;

  constructor(parent: GameScene, x: number, y: number) {
    super(parent, x, y);
    this.shape = this.parent.add.rectangle(0, 0, HOLE_WIDTH, HOLE_HEIGHT, 0x000000);

    // Punto di ordinazione (visibile solo in debug)
    this.orderPoint = this.parent.add.circle(0, HOLE_HEIGHT / 2 + 5, 3, 0xff0000);
    this.orderPoint.setVisible(false);
    this.add([this.shape])

    // Aggiungi testo di debug
    this.log(`Hole ${this.id} [FREE]`);
    this.addSignal('currentCustomer', () => {
      this.updateState()
    }, this.currentCustomer)
  }

  getId(): number {
    return this.id;
  }
  isAvailable(): boolean {
    return this.currentCustomer === null;
  }

  startServing(person: Person) {
    this.currentCustomer = person;
    this.log(`Hole ${this.id} [BUSY]`);
  }

  stopServing() {
    this.currentCustomer = null;
    this.log(`Hole ${this.id} [FREE]`);
  }

  updateState() {
    this.log(`Hole ${this.id} [${this.currentCustomer ? 'BUSY' : 'FREE'}]`);
  }
}
