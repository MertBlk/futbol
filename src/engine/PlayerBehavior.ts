import { Player2D, PlayerType } from '../canvasTypes.js';

/**
 * Oyuncu davranışları ve hareket mantığı
 */
export class PlayerBehavior {
  private fieldWidth: number;
  private fieldHeight: number;

  constructor(fieldWidth: number, fieldHeight: number) {
    this.fieldWidth = fieldWidth;
    this.fieldHeight = fieldHeight;
  }

  /**
   * Oyuncu tipi ataması - pozisyona göre rastgele ama dengeli
   */
  assignPlayerType(position: 'GK' | 'DEF' | 'MID' | 'FWD', index: number): PlayerType {
    if (position === 'GK') {
      return Math.random() < 0.7 ? 'traditional-gk' : 'sweeper-keeper';
    }
    
    if (position === 'DEF') {
      const rand = Math.random();
      if (rand < 0.35) return 'ball-playing-def';
      if (rand < 0.65) return 'stopper';
      return 'covering-def';
    }
    
    if (position === 'MID') {
      const rand = Math.random();
      if (rand < 0.3) return 'box-to-box';
      if (rand < 0.5) return 'playmaker';
      if (rand < 0.75) return 'defensive-mid';
      return 'attacking-mid';
    }
    
    if (position === 'FWD') {
      const rand = Math.random();
      if (rand < 0.3) return 'target-man';
      if (rand < 0.6) return 'poacher';
      if (rand < 0.8) return 'false-nine';
      return 'winger';
    }
    
    return 'traditional-gk';
  }

  /**
   * Oyuncu tipi bazlı özellikler
   */
  getPlayerAttributes(playerType: PlayerType) {
    const base = {
      speed: 1.5 + Math.random() * 0.5,
      maxSpeed: 2.5 + Math.random() * 1,
      skill: 65 + Math.random() * 20,
      aggression: 50 + Math.random() * 30,
      passing: 60 + Math.random() * 25,
      shooting: 55 + Math.random() * 25,
      positioning: 60 + Math.random() * 25,
      workRate: 60 + Math.random() * 25
    };
    
    switch (playerType) {
      case 'sweeper-keeper':
        return { ...base, speed: 1.3, maxSpeed: 2.2, passing: 75 + Math.random() * 15, positioning: 80 + Math.random() * 15 };
      
      case 'traditional-gk':
        return { ...base, speed: 1.0, maxSpeed: 1.8, positioning: 85 + Math.random() * 10, aggression: 40 + Math.random() * 20 };
      
      case 'ball-playing-def':
        return { ...base, passing: 75 + Math.random() * 20, skill: 70 + Math.random() * 20, aggression: 45 + Math.random() * 25 };
      
      case 'stopper':
        return { ...base, aggression: 75 + Math.random() * 20, speed: 1.7 + Math.random() * 0.6, workRate: 75 + Math.random() * 20 };
      
      case 'covering-def':
        return { ...base, positioning: 80 + Math.random() * 15, aggression: 40 + Math.random() * 20, speed: 1.4 + Math.random() * 0.4 };
      
      case 'box-to-box':
        return { ...base, workRate: 85 + Math.random() * 12, speed: 1.8 + Math.random() * 0.7, stamina: 90 };
      
      case 'playmaker':
        return { ...base, passing: 85 + Math.random() * 12, skill: 80 + Math.random() * 15, speed: 1.4 + Math.random() * 0.4 };
      
      case 'defensive-mid':
        return { ...base, positioning: 75 + Math.random() * 20, aggression: 70 + Math.random() * 20, passing: 70 + Math.random() * 20 };
      
      case 'attacking-mid':
        return { ...base, shooting: 75 + Math.random() * 20, passing: 75 + Math.random() * 20, skill: 75 + Math.random() * 20 };
      
      case 'target-man':
        return { ...base, shooting: 80 + Math.random() * 15, positioning: 80 + Math.random() * 15, speed: 1.3 + Math.random() * 0.4 };
      
      case 'poacher':
        return { ...base, shooting: 85 + Math.random() * 12, positioning: 90 + Math.random() * 8, speed: 1.6 + Math.random() * 0.6 };
      
      case 'false-nine':
        return { ...base, passing: 80 + Math.random() * 15, skill: 80 + Math.random() * 15, shooting: 70 + Math.random() * 20 };
      
      case 'winger':
        return { ...base, speed: 2.0 + Math.random() * 0.8, maxSpeed: 3.5 + Math.random() * 1, skill: 75 + Math.random() * 20 };
      
      default:
        return base;
    }
  }
}
