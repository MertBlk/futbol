import { Player2D, Ball } from '../canvasTypes.js';

/**
 * Oyuncu hareketi ve çarpışma kontrolü
 */
export class PlayerMovement {
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
   * Pozisyon koruma - çarpışmadan kaçınma
   */
  maintainPosition(player: Player2D, teammates: Player2D[]): void {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      let moveX = (dx / dist) * player.speed * 0.8;
      let moveY = (dy / dist) * player.speed * 0.8;
      
      // Çarpışma önleme - çok vektörlü sistem
      const nearbyPlayers = teammates.filter(t => 
        t !== player && this.getDistance(player, t) < 50
      );
      
      let avoidX = 0;
      let avoidY = 0;
      
      nearbyPlayers.forEach(nearby => {
        const avoidDist = this.getDistance(player, nearby);
        if (avoidDist < 50) {
          const avoidStrength = (50 - avoidDist) / 50;
          const awayDx = player.x - nearby.x;
          const awayDy = player.y - nearby.y;
          const awayLen = Math.sqrt(awayDx * awayDx + awayDy * awayDy);
          
          if (awayLen > 0) {
            avoidX += (awayDx / awayLen) * avoidStrength * 2;
            avoidY += (awayDy / awayLen) * avoidStrength * 2;
          }
        }
      });
      
      moveX += avoidX;
      moveY += avoidY;
      
      // Hız düzenleme
      const hasCloseTeammate = nearbyPlayers.some(t => this.getDistance(player, t) < 30);
      const speedMultiplier = hasCloseTeammate ? 0.6 : 1.0;
      
      player.x += moveX * speedMultiplier;
      player.y += moveY * speedMultiplier;
      
      // Saha sınırları
      const margin = 20;
      player.x = Math.max(margin, Math.min(this.fieldWidth - margin, player.x));
      player.y = Math.max(margin, Math.min(this.fieldHeight - margin, player.y));
    }
  }

  /**
   * Topa doğru hareket
   */
  moveTowardsBall(player: Player2D, ball: Ball, teammates: Player2D[]): void {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      let targetX = ball.x;
      let targetY = ball.y;
      
      // Yakındaki takım arkadaşlarından kaç
      const nearbyTeammate = teammates.find(t => 
        t !== player && this.getDistance(player, t) < 35
      );
      
      if (nearbyTeammate) {
        const awayDx = player.x - nearbyTeammate.x;
        const awayDy = player.y - nearbyTeammate.y;
        
        targetX = ball.x * 0.7 + (player.x + awayDx) * 0.3;
        targetY = ball.y * 0.7 + (player.y + awayDy) * 0.3;
      }
      
      const finalDx = targetX - player.x;
      const finalDy = targetY - player.y;
      const finalDist = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
      
      if (finalDist > 0) {
        const moveSpeed = player.speed * 1.15;
        player.x += (finalDx / finalDist) * moveSpeed;
        player.y += (finalDy / finalDist) * moveSpeed;
      }
    }
  }

  /**
   * Hedef pozisyon hesapla
   */
  calculateTargetPosition(
    player: Player2D,
    ball: Ball,
    possession: 'home' | 'away' | null,
    allPlayers: Player2D[],
    fieldWidth: number,
    fieldHeight: number
  ): { x: number; y: number } {
    const ballDist = this.getDistance(player, ball);
    const teammates = allPlayers.filter(p => p.team === player.team);
    
    // Kaleci özel
    if (player.position === 'GK') {
      return { x: player.baseX, y: player.baseY };
    }
    
    // Takım hücumdaysa
    if (possession === player.team) {
      const direction = player.team === 'home' ? 1 : -1;
      
      if (player.position === 'DEF') {
        return {
          x: player.baseX + direction * 50,
          y: player.baseY + (ball.y - fieldHeight / 2) * 0.3
        };
      } else if (player.position === 'MID') {
        return {
          x: player.baseX + direction * 70,
          y: player.baseY + (ball.y - fieldHeight / 2) * 0.5
        };
      } else {
        return {
          x: ball.x + direction * 40,
          y: ball.y + (Math.random() - 0.5) * 60
        };
      }
    }
    // Rakip hücumdaysa
    else if (possession !== null && possession !== player.team) {
      const direction = player.team === 'home' ? 1 : -1;
      return {
        x: player.baseX - direction * 30,
        y: player.baseY + (ball.y - fieldHeight / 2) * 0.4
      };
    }
    // Top serbest
    else {
      // En yakın oyuncu topu kovalasın
      const sortedByDistance = teammates
        .map(p => ({ player: p, distance: this.getDistance(p, ball) }))
        .sort((a, b) => a.distance - b.distance);
      
      if (sortedByDistance[0]?.player === player && ballDist < 150) {
        return { x: ball.x, y: ball.y };
      }
    }
    
    return { x: player.baseX, y: player.baseY };
  }

  /**
   * Oyuncuyu hareket ettir
   */
  movePlayer(
    player: Player2D,
    allPlayers: Player2D[],
    playerWithBall: Player2D | null,
    possession: 'home' | 'away' | null
  ): void {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 3) {
      let moveSpeed = player.speed;
      
      // Yakındaki takım arkadaşları varsa yavaşla
      const veryCloseTeammates = allPlayers.filter(p => 
        p.team === player.team && 
        p !== player && 
        this.getDistance(player, p) < 25
      );
      
      if (veryCloseTeammates.length > 0) {
        moveSpeed *= 0.6;
      }
      
      // Topa sahipse yavaşla
      if (player === playerWithBall) {
        moveSpeed *= 0.85;
      }
      // Pozisyonel hareket
      else if (possession !== player.team || possession === null) {
        moveSpeed *= 0.8;
      }
      // Hücumda
      else {
        moveSpeed *= 1.0;
      }
      
      player.x += (dx / dist) * moveSpeed;
      player.y += (dy / dist) * moveSpeed;
      
      // Saha sınırları
      const margin = 20;
      player.x = Math.max(margin, Math.min(this.fieldWidth - margin, player.x));
      player.y = Math.max(margin, Math.min(this.fieldHeight - margin, player.y));
    }
  }

  /**
   * Top kontrolü - dribbling
   */
  dribbleBall(player: Player2D, ball: Ball, opponents: Player2D[], opponentGoal: { x: number; width: number }): void {
    const direction = player.team === 'home' ? 1 : -1;
    const targetX = player.x + direction * 15 + (Math.random() - 0.5) * 8;
    const targetY = player.y + (Math.random() - 0.5) * 8;
    
    const distToOpponentGoal = Math.abs(player.x - (opponentGoal.x + opponentGoal.width / 2));
    
    // Rakip kaleciye çok yakınsa yan kaçış
    const nearOpponentGK = opponents.find(opp => 
      opp.position === 'GK' && 
      opp.team !== player.team && 
      this.getDistance(player, opp) < 50
    );
    
    if (nearOpponentGK && distToOpponentGoal < 80) {
      player.y += (Math.random() < 0.5 ? 1 : -1) * 35;
      player.x -= direction * 20;
    }
    
    // Herhangi bir kaleciye çok yakınsa
    const anyNearbyGK = opponents.find(opp => 
      opp.position === 'GK' && 
      this.getDistance(player, opp) < 40
    );
    
    if (anyNearbyGK) {
      player.y += (player.y < this.fieldHeight / 2 ? 1 : -1) * 35;
    }
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const moveSpeed = player.speed * 0.85;
      player.x += (dx / dist) * moveSpeed;
      player.y += (dy / dist) * moveSpeed;
    }
    
    // Top oyuncuyu takip eder
    ball.x = player.x;
    ball.y = player.y;
    ball.vx = 0;
    ball.vy = 0;
  }
}
