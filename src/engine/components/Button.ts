import { GameObjects } from "phaser";
import { GameObject, NodeScene } from "../Node";


type ButtonProps = {
  text: string,
  onClick?: () => void
  onLongClick?: () => void,
  longClickTimer?: number
}
export class Button extends GameObject<NodeScene> {

  private readonly button: GameObjects.Text
  private isClicked: boolean = false
  private pressTimer: number = 0
  private onLongClick?: () => void
  private longClickTimer: number = 100
  private _isActive: boolean = false;
  public get isActive(): boolean {
    return this._isActive;
  }
  public set isActive(value: boolean) {
    this._isActive = value;
    this.button?.setBackgroundColor(value ? '#666' : '#333');
  }
  private _text: string = '';
  public get text(): string {
    return this._text;
  }
  public set text(value: string) {
    this._text = value;
    this.button?.setText(value)
  }
  constructor(parent: NodeScene, x: number, y: number, {
    text,
    onClick,
    onLongClick,
    longClickTimer
  }: ButtonProps) {
    super(parent, 0, 0)
    this.onLongClick = onLongClick

    this.button = this.parent.add.text(x, y, text, {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#666',
      padding: { x: 4, y: 4 }
    })
      .setOrigin(0.5)
    this.text = text
    this.longClickTimer = longClickTimer ?? 100

    if (onClick || onLongClick) {
      this.button.setInteractive()

      this.button.on('pointerdown', () => {
        onClick?.()
        this.isClicked = true
      });

      if (onLongClick) {
        this.button
          .on('pointerup', () => {
            this.isClicked = false
          })
          .on('pointerout', () => {
            this.isClicked = false
          })

      }

    }


  }
  update(time: number, delta: number) {
    if (this.isClicked) {
      this.pressTimer += delta;

      if (this.pressTimer >= this.longClickTimer) {
        this.onLongClick?.();
        this.pressTimer = 0
      }
    }
  }
}