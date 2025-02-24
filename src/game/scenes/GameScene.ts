import { Person } from '../gameObjects/Person'
import { Math as PMath } from 'phaser';
import { PERSON_RADIUS, ROAD_HEIGHT, WALL_Y, WALL_HEIGHT, HOLE_WIDTH, PERSON_NUMBER } from '../Constants';
import { Hole } from '../gameObjects/Hole';
import { NodeScene } from '../../engine/Node';
import { Player } from '../gameObjects/Player';
import { Information } from '../gameObjects/Information';
import { Button } from '../../engine/components/Button';

export class GameScene extends NodeScene {
  private readonly NUM_PEOPLE = PERSON_NUMBER;
  private readonly NUM_HOLES = 3;
  private customers: Person[] = [];
  private holes: Hole[] = [];
  private player!: Player;
  private informations: Information[] = [];
  private _debugMode: boolean = false;
  public get debugMode(): boolean {
    return this._debugMode;
  }
  public set debugMode(value: boolean) {
    this.emitSignal('debugMode', value)
    this._debugMode = value;
  }
  private roadTop: number = 0
  private roadBottom: number = 0
  private debugButton!: Button

  constructor() {
    super('GameScene')
  }

  protected createUI() {
    const { width, height } = this.scale;
    this.roadTop = height - ROAD_HEIGHT + PERSON_RADIUS * 2;
    this.roadBottom = height - PERSON_RADIUS * 2;
    // Crea il muro
    this.add.rectangle(
      width / 2,
      WALL_Y,
      width,
      WALL_HEIGHT,
      0x666666
    );

    // Crea i buchi
    const spacing = width / (this.NUM_HOLES + 1);
    for (let i = 0; i < this.NUM_HOLES; i++) {
      const x = spacing * (i + 1);
      const hole = new Hole(this, x, WALL_Y);
      this.holes.push(hole);
    }

    // Crea la strada (rettangolo grigio)
    this.add.rectangle(
      width / 2,
      height - ROAD_HEIGHT / 2,
      width,
      ROAD_HEIGHT,
      0x333333
    );

    for (let i = 0; i < this.NUM_PEOPLE; i++) {
      this.spawnCustomer()
    }

    this.addSignal('debugMode', this.updateDebug, this.debugMode)

    this.player = new Player(this)

    for (let i = 0; i < 5; i++) {
      this.spawnInformation()
    }

    new Button(this, width - 100, 20, {
      text: 'Menu',
      onClick: () => {
        this.scene.start('MenuScene');
      }
    });

    const DebugButton = new Button(this, width - 100, 60, {
      text: 'Debug',
      onClick: () => {
        this.debugMode = !this.debugMode;
        DebugButton.isActive = this.debugMode
      }
    });

    const AddCustomerButton = new Button(this, width - 100, 100, {
      text: `Customers (${this.customers.length})`,
      onClick: () => {
        this.spawnCustomer()
        AddCustomerButton.text = `Customers (${this.customers.length})`
      },
      onLongClick: () => {
        this.spawnCustomer()
        AddCustomerButton.text = `Customers (${this.customers.length})`
      },
      longClickTimer: 10
    });

    const AddInfoButton = new Button(this, width - 100, 160, {
      text: `Info (${this.informations.length})`,
      onClick: () => {
        this.spawnInformation()
        AddInfoButton.text = `Info (${this.informations.length})`
      },
      onLongClick: () => {
        this.spawnInformation()
        AddInfoButton.text = `Info (${this.informations.length})`
      },
      longClickTimer: 10
    })

  }

  private spawnInformation() {
    const bounds = this.player.getMovementBounds();
    const x = Phaser.Math.Between(bounds.minX, bounds.maxX);
    const y = Phaser.Math.Between(bounds.minY, bounds.maxY);

    const info = new Information(this, x, y, bounds);
    this.informations.push(info);
  }

  updateDebug() {
    console.log('signal debug')
    // Imposta lo stato iniziale del debug per tutti i pedoni
    this.informations.forEach(e => e.setDebugVisible?.(this.debugMode));
    this.customers.forEach(e => e.setDebugVisible?.(this.debugMode));
    this.holes.forEach(e => e.setDebugVisible?.(this.debugMode));
    this.player.setDebugVisible?.(this.debugMode);
  }

  spawnCustomer() {
    const { width, height } = this.scale;
    // Crea i pedoni con posizioni distribuite
    const spacingPeople = width / (this.NUM_PEOPLE + 1);
    const roadY = height - ROAD_HEIGHT / 2; // Centro della strada
    const x = spacingPeople * (this.customers.length + 1);
    // Distribuzione casuale dei pedoni lungo l'altezza della strada
    const y = roadY - PERSON_RADIUS + (PMath.Between(0, ROAD_HEIGHT - PERSON_RADIUS) / 2);
    const person = new Person(this, x, y);
    person.setDebugVisible?.(this.debugMode)
    this.customers.push(person);
  }

  update(time: number, delta: number) {

    this.customers.forEach(person => {
      // Controlla se la persona è vicina a un buco
      if (Math.random() < 0.1) { // 1% di probabilità per frame
        const nearbyHole = this.holes.find(hole =>
          Math.abs(hole.x - person.x) < HOLE_WIDTH &&
          hole.isAvailable()
        );

        if (nearbyHole) {
          person.tryToOrder(nearbyHole);
        }
      }
    });
  }

  getOtherPeople(me: Person): Person[] {
    return this.customers.filter(p => p !== me)
  }

  getInformations(): Information[] {
    return this.informations
  }

  getRoadSize() {
    return [this.roadTop, this.roadBottom]
  }
}
