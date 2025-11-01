import { Player2D, Ball, Goal } from '../canvasTypes.js';

/**
 * Oyuncu aksiyonları - pas, şut, dribbling
 */
export class PlayerActions {
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
   * Pas atma
   */
  attemptPass(
    passer: Player2D, 
    ball: Ball, 
    teammates: Player2D[], 
    opponents: Player2D[]
  ): { success: boolean; description?: string } {
    if (teammates.length === 0) return { success: false };
    
    const bestTarget = this.findBestPassTarget(passer, teammates, opponents);
    if (!bestTarget) return { success: false };
    
    const dist = this.getDistance(passer, bestTarget);
    
    // Mesafeye göre güç ayarla - daha hızlı paslar
    const power = Math.max(5, Math.min(dist / 12, 15));
    
    // Beceri ve baskıya göre isabetlilik
    const accuracy = passer.skill / 100;
    const pressure = this.calculatePressure(passer, opponents);
    const finalAccuracy = accuracy * (1 - pressure * 0.4);
    
    // Hata faktörü - daha düşük daha isabetli
    const errorFactor = (1 - finalAccuracy) * 15;
    
    const dx = bestTarget.x - ball.x + (Math.random() - 0.5) * errorFactor;
    const dy = bestTarget.y - ball.y + (Math.random() - 0.5) * errorFactor;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len > 0) {
      ball.vx = (dx / len) * power;
      ball.vy = (dy / len) * power;
      
      // Pas kalitesi mesajı
      let passQuality = '';
      if (dist > 200) passQuality = 'uzun ';
      else if (dist < 50) passQuality = 'kısa ';
      
      return { 
        success: true, 
        description: Math.random() < 0.35 ? `⚽ ${passer.name} ${passQuality}pas attı` : undefined 
      };
    }
    
    return { success: false };
  }

  /**
   * En iyi pas hedefini bul
   */
  private findBestPassTarget(passer: Player2D, teammates: Player2D[], opponents: Player2D[]): Player2D | null {
    let bestTarget: Player2D | null = null;
    let bestScore = -1;
    
    teammates.forEach(teammate => {
      const distance = this.getDistance(passer, teammate);
      const opponentsInPath = this.getOpponentsInPassPath(passer, teammate, opponents);
      
      let score = 100;
      
      // Uzaklık
      if (distance < 50) {
        score -= distance * 0.3;
      } else if (distance < 150) {
        score -= distance * 0.4;
      } else {
        score -= distance * 0.8;
      }
      
      score -= opponentsInPath.length * 35;
      score += teammate.skill * 0.4;
      
      // Pozisyonel bonus
      if (passer.position === 'DEF') {
        if (teammate.position === 'MID') score += 25;
        if (teammate.position === 'FWD') score += 15;
      } else if (passer.position === 'MID') {
        if (teammate.position === 'FWD') score += 30;
        if (teammate.position === 'MID') score += 10;
      } else if (passer.position === 'FWD') {
        if (teammate.position === 'FWD') score += 25;
        if (teammate.position === 'MID') score += 15;
      }
      
      // İleri pas bonusu
      const direction = passer.team === 'home' ? 1 : -1;
      const forwardProgress = (teammate.x - passer.x) * direction;
      if (forwardProgress > 0) {
        score += forwardProgress * 0.15;
      }
      
      // Açık alan
      const nearbyOpponents = opponents.filter(opp => this.getDistance(teammate, opp) < 40);
      if (nearbyOpponents.length === 0) {
        score += 20;
      } else {
        score -= nearbyOpponents.length * 8;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = teammate;
      }
    });
    
    return bestTarget;
  }

  private getOpponentsInPassPath(passer: Player2D, target: Player2D, opponents: Player2D[]): Player2D[] {
    return opponents.filter(opponent => {
      const distToLine = this.getDistanceToLine(passer, target, opponent);
      return distToLine < 25;
    });
  }

  private getDistanceToLine(point1: Player2D, point2: Player2D, point: Player2D): number {
    const A = point.x - point1.x;
    const B = point.y - point1.y;
    const C = point2.x - point1.x;
    const D = point2.y - point1.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return this.getDistance(point, point1);
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));
    
    const xx = point1.x + param * C;
    const yy = point1.y + param * D;
    
    return this.getDistance(point, { x: xx, y: yy });
  }

  /**
   * Şut çekme
   */
  attemptShot(
    shooter: Player2D,
    ball: Ball,
    targetGoal: Goal,
    opponents: Player2D[]
  ): string {
    const goalCenterX = targetGoal.x + targetGoal.width / 2;
    const goalCenterY = targetGoal.y + targetGoal.height / 2;
    const distance = this.getDistance(shooter, { x: goalCenterX, y: goalCenterY });
    
    const accuracy = (shooter.skill / 100) * (1 - Math.min(distance / 300, 0.8));
    const pressure = this.calculatePressure(shooter, opponents);
    
    const maxError = (1 - accuracy + pressure) * 60;
    const errorX = (Math.random() - 0.5) * maxError;
    const errorY = (Math.random() - 0.5) * maxError;
    
    const targetX = goalCenterX + errorX;
    const targetY = goalCenterY + errorY;
    
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    const basePower = Math.min(12 + distance / 30, 20);
    const powerVariation = shooter.skill / 100 * 4;
    const power = basePower + (Math.random() - 0.5) * powerVariation;
    
    if (len > 0) {
      ball.vx = (dx / len) * power;
      ball.vy = (dy / len) * power;
    }
    
    const shotQuality = accuracy > 0.7 ? 'güçlü' : accuracy > 0.4 ? 'orta' : 'zayıf';
    return `⚽ ${shooter.name} ${shotQuality} bir şut çekti! (${Math.round(distance)}m)`;
  }

  private calculatePressure(player: Player2D, opponents: Player2D[]): number {
    if (opponents.length === 0) return 0;
    
    let pressure = 0;
    opponents.forEach(opponent => {
      const distance = this.getDistance(player, opponent);
      const opponentSkill = opponent.skill / 100;
      
      if (distance < 30) {
        pressure += (1 - distance / 30) * opponentSkill;
      }
    });
    
    return Math.min(1, pressure);
  }

  /**
   * Kaleci uzun top
   */
  clearBall(player: Player2D, ball: Ball): string {
    const direction = player.team === 'home' ? 1 : -1;
    const power = 15 + Math.random() * 5;
    
    const targetX = player.x + direction * 300;
    const targetY = this.fieldHeight / 2 + (Math.random() - 0.5) * 200;
    
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len > 0) {
      ball.vx = (dx / len) * power;
      ball.vy = (dy / len) * power;
    }
    
    return `🦶 ${player.name} uzun top attı`;
  }
}
