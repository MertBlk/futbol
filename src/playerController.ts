import { Player2D, Ball } from './canvasTypes.js';

export class PlayerController {
  private controlledPlayer: Player2D | null = null;
  private keys: Set<string> = new Set();
  private isKeyboardControlEnabled: boolean = false;

  constructor() {
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (this.isKeyboardControlEnabled) {
        this.keys.add(e.key.toLowerCase());
        
        // Pas için Space
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
        }
        
        // Şut için X
        if (e.key.toLowerCase() === 'x') {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  public enableControl(player: Player2D): void {
    this.controlledPlayer = player;
    this.isKeyboardControlEnabled = true;
  }

  public disableControl(): void {
    this.controlledPlayer = null;
    this.isKeyboardControlEnabled = false;
    this.keys.clear();
  }

  public isControlEnabled(): boolean {
    return this.isKeyboardControlEnabled;
  }

  public getControlledPlayer(): Player2D | null {
    return this.controlledPlayer;
  }

  public updateControlledPlayer(): void {
    if (!this.controlledPlayer || !this.isKeyboardControlEnabled) return;

    const player = this.controlledPlayer;
    const moveSpeed = 4;

    // Hareket tuşları: W, A, S, D veya Arrow keys
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      player.targetY = player.y - moveSpeed * 5;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      player.targetY = player.y + moveSpeed * 5;
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      player.targetX = player.x - moveSpeed * 5;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      player.targetX = player.x + moveSpeed * 5;
    }
  }

  public shouldPass(): boolean {
    return this.isKeyboardControlEnabled && this.keys.has(' ');
  }

  public shouldShoot(): boolean {
    return this.isKeyboardControlEnabled && this.keys.has('x');
  }

  public clearActionKeys(): void {
    this.keys.delete(' ');
    this.keys.delete('x');
  }
}
