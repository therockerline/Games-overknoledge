import { GameObjects, Scene as PhaserScene } from 'phaser';

interface INode {
  id: number;
  add?: (objs: any[]) => void
}

type Constructor<T = {}> = new (...args: any[]) => T;

function NodeMixin<T extends Constructor>(Base: T) {
  return class MixedNode extends Base implements INode {
    private static _ID: number = 0;
    public readonly id: number;
    private signals: Map<string, { oldValue?: any, callback: Function }[]>;

    constructor(...args: any[]) {
      super(...args);
      this.id = ++MixedNode._ID;
      this.signals = new Map();
    }

    protected addSignal(name: string, callback: Function, defaultValue: any): void {
      if (!this.signals.has(name)) {
        this.signals.set(name, []);
      }
      const signals = this.signals.get(name);
      if (signals) {
        signals.push({ callback, oldValue: defaultValue });
      }
    }

    protected emitSignal(name: string, ...args: any[]): void {
      const signals = this.signals.get(name);
      if (signals) {
        signals.forEach(signal => {
          const newValue = JSON.stringify(args);
          const oldValue = signal.oldValue ? JSON.stringify(signal.oldValue) : undefined;

          if (oldValue !== newValue) {
            signal.callback.apply(this, args);
            signal.oldValue = args;
          }
        });
      }
    }
  };
}


export class NodeScene extends NodeMixin(PhaserScene) {
  constructor(config: string) {
    super(config);
  }

  create(): void {
    this.createUI();
  }

  protected createUI(): void { }
}

const MixedMode = NodeMixin(GameObjects.Container);

export class GameObject<T extends NodeScene> extends MixedMode {
  protected readonly parent: T;
  private debugText?: GameObjects.Text;
  private isDebugMode: boolean = false;

  constructor(scene: T, x: number, y: number) {
    super(scene, x, y);
    this.parent = scene;
    this.x = x
    this.y = y
    this.debugText = scene.add.text(0, -10, `id: ${this.id}`, {
      fontSize: '12px',
      color: '#fff',
      backgroundColor: 'transparent',
      padding: { x: 2, y: 2 }
    }).setOrigin(0.5).setVisible(this.isDebugMode);
    this.add([this.debugText])

    // Aggiungi il GameObject alla scena e al sistema di update
    scene.add.existing(this);

    this.scene.events.on('update', this.update, this);
  }

  update(time: number, delta: number) {
    return
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    super.destroy();
  }

  log(...messages: any[]): void {
    if (!this.isDebugMode) return;

    try {
      const message = messages.map(m =>
        typeof m === 'object' ? JSON.stringify(m) : String(m)
      ).join(' ');



      if (this.debugText) {
        this.debugText.setText(message);
      }
    } catch (e) {
      console.warn('Debug log failed:', e);
    }
  }

  setDebugVisible(visible: boolean): void {
    this.isDebugMode = visible;
    this.debugText?.setVisible(visible);
  }
}