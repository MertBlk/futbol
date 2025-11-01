import { Player2D, Ball } from '../canvasTypes';

export interface TackleResult {
  success: boolean;
  newPossession?: Player2D;
  isFoul: boolean;
}

export class TackleSystem {
  private tackleRange: number = 30; // Top kapma menzili (piksel) - artırıldı
  private tackleCooldown: number = 300; // 0.3 saniye (ms) - daha dengeli
  private lastTackleTime: Map<Player2D, number> = new Map();

  /**
   * Oyuncunun top kapma girişiminde bulunup bulunamayacağını kontrol eder
   * @param player Kontrol edilecek oyuncu
   * @param currentTime Mevcut oyun süresi (ms)
   * @returns Tackle yapabilir mi?
   */
  canAttemptTackle(player: Player2D, currentTime: number): boolean {
    const lastTackle = this.lastTackleTime.get(player) || 0;
    return currentTime - lastTackle >= this.tackleCooldown;
  }

  /**
   * İki oyuncu arasındaki mesafe tackle menzilinde mi?
   * @param player1 Birinci oyuncu
   * @param player2 İkinci oyuncu
   * @returns Menzil içinde mi?
   */
  isInTackleRange(player1: Player2D, player2: Player2D): boolean {
    const dx = player1.x - player2.x;
    const dy = player1.y - player2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.tackleRange;
  }

  /**
   * Top kapma başarı oranını hesaplar
   * @param tackler Top kapan oyuncu
   * @param target Top sahibi oyuncu
   * @returns Başarı oranı (0-1)
   */
  calculateTackleSuccessRate(tackler: Player2D, target: Player2D): number {
    const tacklerSkill = tackler.skill || 50;
    const tacklerAggression = tackler.aggression || 50;
    const targetSkill = target.skill || 50;

    // Temel başarı oranı - daha dengeli formül
    const tacklerQuality = (tacklerSkill * 0.6 + tacklerAggression * 0.4) / 100;
    const targetQuality = targetSkill / 100;
    
    // Karşılaştırmalı başarı hesaplama
    const skillDifference = tacklerQuality - targetQuality;
    let baseRate = 0.25; // %25 temel şans
    
    // Beceri farkına göre artır/azalt
    if (skillDifference > 0) {
      baseRate += skillDifference * 0.3; // Daha iyi oyuncu avantajlı
    } else {
      baseRate += skillDifference * 0.2; // Kötü oyuncu dezavantajlı
    }
    
    // Agresiflik bonusu
    const aggressionBonus = (tacklerAggression / 100) * 0.1;
    baseRate += aggressionBonus;
    
    // %15 - %50 arası sınırla (gerçekçi)
    return Math.max(0.15, Math.min(baseRate, 0.50));
  }

  /**
   * Top kapma girişimi yapar
   * @param tackler Top kapan oyuncu
   * @param target Top sahibi oyuncu
   * @param ball Top objesi
   * @param currentTime Mevcut oyun süresi (ms)
   * @returns TackleResult
   */
  attemptTackle(
    tackler: Player2D,
    target: Player2D,
    ball: Ball,
    currentTime: number
  ): TackleResult {
    // Cooldown kontrolü
    if (!this.canAttemptTackle(tackler, currentTime)) {
      return { success: false, isFoul: false };
    }

    // Menzil kontrolü
    if (!this.isInTackleRange(tackler, target)) {
      return { success: false, isFoul: false };
    }

    // Başarı oranı hesapla
    const successRate = this.calculateTackleSuccessRate(tackler, target);
    const isSuccessful = Math.random() < successRate;

    // Tackle zamanını kaydet
    this.lastTackleTime.set(tackler, currentTime);

    if (isSuccessful) {
      // Başarılı tackle - top sahipliği değişir
      target.hasBall = false;
      tackler.hasBall = true;

      // Topu yeni sahibine ver
      ball.x = tackler.x;
      ball.y = tackler.y;
      ball.vx = 0;
      ball.vy = 0;
      ball.speed = 0;

      return {
        success: true,
        newPossession: tackler,
        isFoul: false
      };
    }

    // Başarısız tackle
    return { success: false, isFoul: false };
  }

  /**
   * Belirli bir oyuncunun son tackle zamanını sıfırlar
   * @param player Oyuncu
   */
  resetPlayerCooldown(player: Player2D): void {
    this.lastTackleTime.delete(player);
  }

  /**
   * Tüm tackle cooldown'larını sıfırlar
   */
  resetAllCooldowns(): void {
    this.lastTackleTime.clear();
  }

  /**
   * Tackle menzilini döndürür
   * @returns Menzil (piksel)
   */
  getTackleRange(): number {
    return this.tackleRange;
  }
}
