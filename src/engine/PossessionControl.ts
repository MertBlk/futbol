import { Player2D, Ball, Goal } from '../canvasTypes.js';

/**
 * Pozisyon kontrolü ve karar verme
 */
export class PossessionControl {
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
   * Top kontrolünü güncelle
   */
  updatePossession(
    players: Player2D[], 
    ball: Ball, 
    playerWithBall: Player2D | null,
    goals: Goal[]
  ): Player2D | null {
    if (playerWithBall) {
      const touchDist = this.getDistance(playerWithBall, ball);
      if (touchDist > 25) {
        return null;
      }
    }
    
    if (ball.vx === 0 && ball.vy === 0) {
      const playersNearBall = players
        .map(p => ({ player: p, dist: this.getDistance(p, ball) }))
        .filter(({ dist }) => dist < 30)
        .sort((a, b) => {
          const skillDiff = b.player.skill - a.player.skill;
          const distDiff = a.dist - b.dist;
          return distDiff * 0.7 + skillDiff * 0.3;
        });
      
      if (playersNearBall.length > 0) {
        const winner = playersNearBall[0].player;
        
        // Kaleci rakip kalede topla uğraşmasın
        if (winner.position === 'GK') {
          const opponentGoal = goals.find(g => g.team !== winner.team);
          if (opponentGoal) {
            const distToOpponentGoal = Math.abs(ball.x - (opponentGoal.x + opponentGoal.width / 2));
            if (distToOpponentGoal < 150) {
              return null;
            }
          }
        }
        
        return winner;
      }
    }
    
    return null;
  }

  /**
   * Oyuncu topa koşmalı mı?
   */
  shouldPlayerChaseBall(
    player: Player2D,
    ball: Ball,
    players: Player2D[],
    playerWithBall: Player2D | null,
    goals: Goal[]
  ): boolean {
    if (playerWithBall?.team === player.team) return false;
    if (player.position === 'GK') {
      const opponentGoal = goals.find(g => g.team !== player.team);
      if (opponentGoal) {
        const distToOpponentGoal = Math.abs(ball.x - (opponentGoal.x + opponentGoal.width / 2));
        if (distToOpponentGoal < 200) {
          return false;
        }
      }
    }
    
    const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (ballSpeed < 0.5) return true;
    
    const teammates = players.filter(p => p.team === player.team && p !== player);
    const ballDist = this.getDistance(player, ball);
    
    const closerTeammates = teammates.filter(t => this.getDistance(t, ball) < ballDist - 20);
    if (closerTeammates.length >= 2) return false;
    
    if (player.position === 'FWD' && playerWithBall?.team !== player.team) return true;
    if (player.position === 'MID' && ballDist < 150) return true;
    if (player.position === 'DEF' && ballDist < 120) {
      const ownGoalX = player.team === 'home' ? 0 : this.fieldWidth;
      const ballDistToOwnGoal = Math.abs(ball.x - ownGoalX);
      return ballDistToOwnGoal < 250;
    }
    
    return ballDist < 80;
  }
}
