import { Player2D, Ball, Goal } from '../canvasTypes.js';

/**
 * Taktiksel AI - takımsal hareketler ve organizasyon
 */
export class TacticalAI {
  private fieldWidth: number;
  private fieldHeight: number;

  constructor(fieldWidth: number, fieldHeight: number) {
    this.fieldWidth = fieldWidth;
    this.fieldHeight = fieldHeight;
  }

  private getDistance(obj1: { x: number; y: number }, obj2: { x: number; y: number }): number {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Hücum organizasyonu
   */
  attackingOrganization(player: Player2D, ball: Ball, ballDist: number, players: Player2D[]): void {
    const direction = player.team === 'home' ? 1 : -1;
    
    // Kaleci
    if (player.position === 'GK') {
      if (player.playerType === 'sweeper-keeper' && ball.x < this.fieldWidth * 0.3) {
        player.targetX = player.baseX + direction * 40;
        player.targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.4;
      } else {
        player.targetX = player.baseX;
        player.targetY = player.baseY;
      }
      return;
    }
    
    // Defans
    if (player.position === 'DEF') {
      const ballX = ball.x;
      
      if (player.playerType === 'ball-playing-def') {
        const targetX = player.team === 'home' 
          ? Math.min(player.baseX + 100, ballX - 40)
          : Math.max(player.baseX - 100, ballX + 40);
        const targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.5;
        player.targetX = targetX;
        player.targetY = Math.max(60, Math.min(this.fieldHeight - 60, targetY));
      } else if (player.playerType === 'stopper') {
        const targetX = player.team === 'home' 
          ? Math.min(player.baseX + 80, ballX - 50)
          : Math.max(player.baseX - 80, ballX + 50);
        const targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.4;
        player.targetX = targetX;
        player.targetY = Math.max(60, Math.min(this.fieldHeight - 60, targetY));
      } else {
        const targetX = player.team === 'home' 
          ? Math.min(player.baseX + 40, ballX - 100)
          : Math.max(player.baseX - 40, ballX + 100);
        const targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.2;
        player.targetX = targetX;
        player.targetY = Math.max(60, Math.min(this.fieldHeight - 60, targetY));
      }
      return;
    }
    
    // Orta Saha
    if (player.position === 'MID') {
      if (player.playerType === 'box-to-box') {
        if (ballDist < 80) {
          player.targetX = ball.x + direction * 60;
          player.targetY = ball.y + (Math.random() - 0.5) * 70;
        } else {
          player.targetX = player.baseX + direction * 60 + (Math.random() - 0.5) * 50;
          player.targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.6;
        }
      } else if (player.playerType === 'playmaker') {
        player.targetX = ball.x + direction * 40 + (Math.random() - 0.5) * 30;
        player.targetY = this.fieldHeight / 2 + (ball.y - this.fieldHeight / 2) * 0.3;
      } else if (player.playerType === 'defensive-mid') {
        player.targetX = player.baseX + direction * 25;
        player.targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.3;
      } else {
        player.targetX = ball.x + direction * 70 + (Math.random() - 0.5) * 50;
        player.targetY = ball.y + (Math.random() - 0.5) * 80;
      }
      return;
    }
    
    // Forvet
    if (player.position === 'FWD') {
      if (player.playerType === 'target-man') {
        player.targetX = player.baseX + direction * 30;
        player.targetY = this.fieldHeight / 2 + (Math.random() - 0.5) * 60;
      } else if (player.playerType === 'poacher') {
        player.targetX = ball.x + direction * 80 + (Math.random() - 0.5) * 40;
        player.targetY = ball.y + (Math.random() - 0.5) * 70;
      } else if (player.playerType === 'false-nine') {
        if (ballDist < 100) {
          player.targetX = ball.x + direction * 40;
          player.targetY = ball.y + (Math.random() - 0.5) * 60;
        } else {
          player.targetX = player.baseX - direction * 30;
          player.targetY = player.baseY;
        }
      } else {
        const isTopWinger = player.baseY < this.fieldHeight / 2;
        player.targetX = ball.x + direction * 70;
        player.targetY = isTopWinger ? 60 + Math.random() * 100 : this.fieldHeight - 160 + Math.random() * 100;
      }
      return;
    }
  }

  /**
   * Savunma organizasyonu
   */
  defendingOrganization(player: Player2D, ball: Ball, ballDist: number, players: Player2D[]): void {
    if (player.position === 'GK') {
      const goalCenter = this.fieldHeight / 2;
      player.targetX = player.baseX;
      player.targetY = goalCenter + (ball.y - goalCenter) * 0.6;
      return;
    }
    
    const ownGoalX = player.team === 'home' ? 100 : this.fieldWidth - 100;
    const ballToGoalDirection = (ownGoalX - ball.x) / Math.abs(ownGoalX - ball.x);
    
    if (player.position === 'DEF') {
      if (ballDist < 120) {
        player.targetX = ball.x + ballToGoalDirection * 40;
        player.targetY = ball.y + (player.baseY - this.fieldHeight / 2) * 0.3;
      } else {
        player.targetX = player.baseX + ballToGoalDirection * 20;
        player.targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.4;
      }
      return;
    }
    
    if (player.position === 'MID') {
      if (ballDist < 100) {
        const teammates = players.filter(p => 
          p.team === player.team && 
          p.position === 'MID' &&
          p !== player
        );
        const isClosest = teammates.every(t => 
          this.getDistance(player, ball) < this.getDistance(t, ball)
        );
        
        if (isClosest) {
          player.targetX = ball.x;
          player.targetY = ball.y;
        } else {
          player.targetX = player.baseX + ballToGoalDirection * 30;
          player.targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.5;
        }
      } else {
        const centerX = this.fieldWidth / 2;
        player.targetX = centerX + (player.baseX - centerX) * 0.5;
        player.targetY = player.baseY + (ball.y - this.fieldHeight / 2) * 0.3;
      }
      return;
    }
    
    if (player.position === 'FWD') {
      if (ballDist < 150) {
        player.targetX = ball.x + ballToGoalDirection * 60;
        player.targetY = ball.y + (Math.random() - 0.5) * 40;
      } else {
        const centerX = this.fieldWidth / 2;
        player.targetX = centerX + (player.baseX - centerX) * 0.6;
        player.targetY = player.baseY;
      }
      return;
    }
  }
}
