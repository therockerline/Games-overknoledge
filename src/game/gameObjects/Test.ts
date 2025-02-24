import { GameObjects } from "phaser";

export class Test extends GameObjects.Container {
  test: GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    // Chiamiamo il costruttore del Container con scene, x, y
    super(scene, x, y);

    // Creiamo il text
    this.test = scene.add.text(0, 0, 'X');

    // Aggiungiamo il text al container
    this.add(this.test);

    // Aggiungiamo il container alla scena
    scene.add.existing(this);

    // Impostiamo che questo oggetto deve essere aggiornato
    scene.sys.updateList.add(this);
  }

  update(time: number, delta: number) {
    this.test.x += 1;
    if (this.test.x > 300) {
      this.test.x = 0;
    }
  }
}