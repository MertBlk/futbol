import { Player2D } from '../canvasTypes';

export interface FoulEvent {
  time: number;
  offender: Player2D;
  victim: Player2D;
  isFoul: boolean;
  cardType?: 'yellow' | 'red';
  position: { x: number; y: number };
}

export class FoulSystem {
  private lastFoulTime: number = 0;
  private foulCooldown: number = 2000; // 2 saniye faul cooldown

  /**
   * Tackle girişiminde faul olup olmadığını kontrol eder
   * @param tackler Top kapan oyuncu
   * @param target Top sahibi oyuncu
   * @param currentTime Mevcut oyun süresi (ms)
   * @returns FoulEvent veya null
   */
  checkForFoul(
    tackler: Player2D,
    target: Player2D,
    currentTime: number
  ): FoulEvent | null {
    // Son faulden yeterince zaman geçmemişse
    if (currentTime - this.lastFoulTime < this.foulCooldown) {
      return null;
    }

    // Faul şansı hesaplama - daha dengeli
    const aggressionFactor = (tackler.aggression || 50) / 100;
    const skillFactor = 1 - (tackler.skill || 50) / 100;
    
    // Yüksek agresyon + düşük beceri = yüksek faul şansı
    let foulChance = aggressionFactor * skillFactor * 0.4; // %40'a kadar
    
    // Çok agresif oyuncular için ekstra risk
    if (aggressionFactor > 0.85) {
      foulChance += 0.08;
    }
    
    // Çok yeteneksiz oyuncular için ekstra risk
    if (skillFactor > 0.6) {
      foulChance += 0.05;
    }
    
    const isFoul = Math.random() < Math.min(foulChance, 0.55); // Max %55

    if (!isFoul) {
      return null;
    }

    // Faul olduysa kart kontrolü - daha gerçekçi
    const cardChance = Math.random();
    let cardType: 'yellow' | 'red' | undefined;

    // Çok agresif ve kötü tackle = kırmızı kart riski
    if (aggressionFactor > 0.85 && skillFactor > 0.6 && cardChance < 0.12) {
      cardType = 'red'; // %12 kırmızı kart (çok sert fauller)
    } 
    // Normal agresif faul = sarı kart
    else if (aggressionFactor > 0.7 && cardChance < 0.35) {
      cardType = 'yellow'; // %35 sarı kart
    }
    // Hafif faul = bazen sarı kart
    else if (cardChance < 0.18) {
      cardType = 'yellow'; // %18 sarı kart (hafif fauller için)
    }

    this.lastFoulTime = currentTime;

    return {
      time: currentTime,
      offender: tackler,
      victim: target,
      isFoul: true,
      cardType,
      position: { x: target.x, y: target.y }
    };
  }

  /**
   * Serbest vuruş için topu yerleştirir
   * @param foulEvent Faul olayı
   * @returns Top pozisyonu
   */
  setupFreeKick(foulEvent: FoulEvent): { x: number; y: number } {
    return {
      x: foulEvent.position.x,
      y: foulEvent.position.y
    };
  }

  /**
   * Kart gösterme logunu oluşturur
   * @param foulEvent Faul olayı
   * @returns Log mesajı
   */
  getCardMessage(foulEvent: FoulEvent): string {
    if (!foulEvent.cardType) {
      return `Faul: ${foulEvent.offender.name} → ${foulEvent.victim.name}`;
    }

    const cardEmoji = foulEvent.cardType === 'yellow' ? '🟨' : '🟥';
    return `${cardEmoji} ${foulEvent.cardType.toUpperCase()} KART: ${foulEvent.offender.name}`;
  }

  /**
   * Faul cooldown süresini sıfırlar
   */
  resetCooldown(): void {
    this.lastFoulTime = 0;
  }
}
