import { Ball, Player2D, Goal } from '../canvasTypes.js';

/**
 * Top fiziği ve hareketi
 */
export class BallPhysics {
  private fieldWidth: number;
  private fieldHeight: number;

  constructor(fieldWidth: number, fieldHeight: number) {
    this.fieldWidth = fieldWidth;
    this.fieldHeight = fieldHeight;
  }

  /**
   * Topu güncelle - fizik simülasyonu
   */
  updateBall(ball: Ball, playerWithBall: Player2D | null, gameMinute: number, onEvent?: (desc: string) => void): void {
    if (playerWithBall) {
      // Top oyuncuda - gerçekçi top kontrolü
      const offsetX = Math.cos(gameMinute * 0.1) * 2;
      const offsetY = Math.sin(gameMinute * 0.1) * 2;
      
      ball.x = playerWithBall.x + offsetX;
      ball.y = playerWithBall.y + offsetY;
      ball.vx = 0;
      ball.vy = 0;
    } else {
      // Serbest top - gelişmiş fizik
      const friction = 0.94; // Çim sürtünmesi
      ball.vx *= friction;
      ball.vy *= friction;
      
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Saha sınırları - daha gerçekçi sekme
      const bounceReduction = 0.6;
      
      if (ball.x < 15 || ball.x > this.fieldWidth - 15) {
        ball.vx *= -bounceReduction;
        ball.x = Math.max(15, Math.min(this.fieldWidth - 15, ball.x));
        
        if (Math.random() < 0.05 && Math.abs(ball.vx) > 1 && onEvent) {
          onEvent('🚩 Taç atışı');
        }
      }
      
      if (ball.y < 15 || ball.y > this.fieldHeight - 15) {
        ball.vy *= -bounceReduction;
        ball.y = Math.max(15, Math.min(this.fieldHeight - 15, ball.y));
        
        if (Math.random() < 0.04 && Math.abs(ball.vy) > 1 && onEvent) {
          const event = Math.random() < 0.6 ? 'Köşe vuruşu' : 'Kale vuruşu';
          onEvent(`🚩 ${event}`);
        }
      }
      
      // Top durma kontrolü
      const minSpeed = 0.2;
      if (Math.abs(ball.vx) < minSpeed && Math.abs(ball.vy) < minSpeed) {
        ball.vx = 0;
        ball.vy = 0;
      }
      
      // Maksimum hız limiti
      const maxSpeed = 18;
      const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      if (currentSpeed > maxSpeed) {
        ball.vx = (ball.vx / currentSpeed) * maxSpeed;
        ball.vy = (ball.vy / currentSpeed) * maxSpeed;
      }
    }
  }

  /**
   * Gol kontrolü
   */
  checkGoal(ball: Ball, goals: Goal[]): { scored: boolean; team: 'home' | 'away' | null } {
    for (const goal of goals) {
      const ballInGoalHeight = ball.y >= goal.y && ball.y <= goal.y + goal.height;
      if (!ballInGoalHeight) continue;
      
      const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (ballSpeed < 2.0) continue;
      
      let goalScored = false;
      let scoringTeam: 'home' | 'away' = 'home';
      
      if (goal.team === 'home') {
        if (ball.x <= goal.x + goal.width && ball.vx < -1.0) {
          goalScored = true;
          scoringTeam = 'away';
        }
      } else {
        if (ball.x >= goal.x && ball.vx > 1.0) {
          goalScored = true;
          scoringTeam = 'home';
        }
      }
      
      if (goalScored) {
        return { scored: true, team: scoringTeam };
      }
    }
    
    return { scored: false, team: null };
  }
}
