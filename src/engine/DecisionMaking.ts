import { Player2D, Ball, PlayerType } from '../canvasTypes';

export interface DecisionResult {
  action: 'pass' | 'shoot' | 'dribble' | 'clear' | 'wait';
  target?: Player2D;
  confidence: number; // 0-1 arası karar güveni
}

export class DecisionMaking {
  private fieldWidth: number;
  private fieldHeight: number;
  private decisionInterval: number = 500; // 0.5 saniyede bir karar ver (ms)

  constructor(fieldWidth: number, fieldHeight: number) {
    this.fieldWidth = fieldWidth;
    this.fieldHeight = fieldHeight;
  }

  /**
   * Oyuncunun kale mesafesini hesaplar
   * @param player Oyuncu
   * @returns Kale mesafesi (piksel)
   */
  private getDistanceToGoal(player: Player2D): number {
    const goalX = player.team === 'home' ? this.fieldWidth : 0;
    const goalY = this.fieldHeight / 2;
    
    const dx = player.x - goalX;
    const dy = player.y - goalY;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Oyuncunun rakip baskısı altında olup olmadığını kontrol eder
   * @param player Oyuncu
   * @param allPlayers Tüm oyuncular
   * @returns Baskı altında mı?
   */
  private isUnderPressure(player: Player2D, allPlayers: Player2D[]): boolean {
    const pressureRadius = 50; // 50 piksel içinde rakip varsa baskı altında
    
    const opponents = allPlayers.filter(p => p.team !== player.team);
    
    for (const opponent of opponents) {
      const dx = player.x - opponent.x;
      const dy = player.y - opponent.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= pressureRadius) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * En iyi pas hedefini bulur
   * @param player Pas atacak oyuncu
   * @param allPlayers Tüm oyuncular
   * @returns En iyi pas hedefi veya null
   */
  findBestPassTarget(player: Player2D, allPlayers: Player2D[]): Player2D | null {
    const teammates = allPlayers.filter(
      p => p.team === player.team && p.id !== player.id && p.position !== 'GK'
    );

    if (teammates.length === 0) return null;

    let bestTarget: Player2D | null = null;
    let bestScore = -1;

    for (const teammate of teammates) {
      // Mesafe skoru (daha yakın = daha iyi, ama çok yakın kötü)
      const dx = teammate.x - player.x;
      const dy = teammate.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) continue; // Çok yakın oyunculara pas atma
      
      const distanceScore = Math.max(0, 1 - distance / 300); // 300px maksimum pas mesafesi

      // İleri pozisyon skoru (hücum yönünde = daha iyi)
      const forwardX = player.team === 'home' ? this.fieldWidth : 0;
      const isForward = player.team === 'home' 
        ? teammate.x > player.x 
        : teammate.x < player.x;
      const forwardScore = isForward ? 1.2 : 0.8;

      // Rakiplerden uzaklık skoru
      const opponentPressure = this.isUnderPressure(teammate, allPlayers) ? 0.5 : 1.0;

      // Toplam skor
      const totalScore = distanceScore * forwardScore * opponentPressure;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestTarget = teammate;
      }
    }

    return bestTarget;
  }

  /**
   * Oyuncu tipi bazlı karar önceliklerini döndürür
   * @param playerType Oyuncu tipi
   * @returns Öncelik sırası
   */
  private getPlayerTypePriorities(playerType: PlayerType): {
    pass: number;
    shoot: number;
    dribble: number;
  } {
    switch (playerType) {
      case 'playmaker':
        return { pass: 0.9, shoot: 0.4, dribble: 0.5 };
      case 'attacking-mid':
        return { pass: 0.7, shoot: 0.7, dribble: 0.6 };
      case 'box-to-box':
        return { pass: 0.6, shoot: 0.5, dribble: 0.7 };
      case 'defensive-mid':
        return { pass: 0.8, shoot: 0.2, dribble: 0.3 };
      case 'poacher':
      case 'target-man':
        return { pass: 0.3, shoot: 0.95, dribble: 0.4 };
      case 'false-nine':
        return { pass: 0.7, shoot: 0.7, dribble: 0.6 };
      case 'winger':
        return { pass: 0.6, shoot: 0.6, dribble: 0.8 };
      case 'ball-playing-def':
        return { pass: 0.85, shoot: 0.1, dribble: 0.4 };
      case 'stopper':
      case 'covering-def':
        return { pass: 0.6, shoot: 0.1, dribble: 0.2 };
      default:
        return { pass: 0.7, shoot: 0.5, dribble: 0.5 };
    }
  }

  /**
   * Topu olan oyuncu için en iyi aksiyonu belirler
   * @param player Topu olan oyuncu
   * @param allPlayers Tüm oyuncular
   * @param ball Top objesi
   * @param currentTime Mevcut oyun süresi (ms)
   * @returns DecisionResult
   */
  makeDecision(
    player: Player2D,
    allPlayers: Player2D[],
    ball: Ball,
    currentTime: number
  ): DecisionResult {
    // Oyuncu tipi öncelikleri
    const priorities = this.getPlayerTypePriorities(player.playerType);
    
    // Durum analizi
    const distanceToGoal = this.getDistanceToGoal(player);
    const underPressure = this.isUnderPressure(player, allPlayers);
    const bestPassTarget = this.findBestPassTarget(player, allPlayers);

    // Kaleci özel durum - hemen pas at
    if (player.position === 'GK') {
      if (bestPassTarget) {
        return {
          action: 'pass',
          target: bestPassTarget,
          confidence: 0.9
        };
      }
      return { action: 'clear', confidence: 0.8 };
    }

    // Defans özel durum - kendi yarı sahasında pas öncelikli
    const isInOwnHalf = player.team === 'home' 
      ? player.x < this.fieldWidth / 2 
      : player.x > this.fieldWidth / 2;

    if (player.position === 'DEF' && isInOwnHalf) {
      if (bestPassTarget) {
        return {
          action: 'pass',
          target: bestPassTarget,
          confidence: 0.85
        };
      }
      return { action: 'clear', confidence: 0.7 };
    }

    // Şut mesafesi kontrolü (200px içinde)
    const canShoot = distanceToGoal <= 200;

    // Karar skorları hesapla
    const scores = {
      shoot: canShoot ? priorities.shoot * (1 - distanceToGoal / 200) : 0,
      pass: bestPassTarget ? priorities.pass * (underPressure ? 1.3 : 1.0) : 0,
      dribble: priorities.dribble * (underPressure ? 0.5 : 1.2)
    };

    // En yüksek skoru bul
    const maxScore = Math.max(scores.shoot, scores.pass, scores.dribble);

    // Çok düşük skor - bekle
    if (maxScore < 0.3) {
      return { action: 'wait', confidence: 0.5 };
    }

    // En iyi aksiyonu seç
    if (scores.shoot === maxScore && canShoot) {
      return { action: 'shoot', confidence: scores.shoot };
    } else if (scores.pass === maxScore && bestPassTarget) {
      return { 
        action: 'pass', 
        target: bestPassTarget,
        confidence: scores.pass 
      };
    } else {
      return { action: 'dribble', confidence: scores.dribble };
    }
  }

  /**
   * Oyuncunun aksiyon alıp almayacağına karar verir (rastgele)
   * @param confidence Karar güveni (0-1)
   * @returns Aksiyon almalı mı?
   */
  shouldTakeAction(confidence: number): boolean {
    // Güven oranı ne kadar yüksekse aksiyon alma şansı o kadar fazla
    return Math.random() < confidence * 0.7; // %70 temel şans
  }
}
