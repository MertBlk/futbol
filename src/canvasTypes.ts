// Oyuncu tipleri - pozisyona göre özel oyun tarzları
export type PlayerType = 
  // Kaleci tipleri
  | 'sweeper-keeper'    // Ceza alanı dışına çıkan, oyunu başlatan kaleci
  | 'traditional-gk'    // Klasik gol çizgisinde duran kaleci
  // Defans tipleri
  | 'ball-playing-def'  // Topla oynayan, pas kuran defans
  | 'stopper'           // Agresif, ileri çıkan, sert defans
  | 'covering-def'      // Pozisyonel, geriden kapatan defans
  // Orta saha tipleri
  | 'box-to-box'        // Her iki ceza alanına da giren, koşan
  | 'playmaker'         // Pas kuran, yaratıcı oyuncu
  | 'defensive-mid'     // Defansif, orta sahanın önünde duran
  | 'attacking-mid'     // Ofansif, hücuma katılan
  // Forvet tipleri
  | 'target-man'        // Fiziksel, ceza alanında bekleyen
  | 'poacher'           // Fırsatçı, gol arayan
  | 'false-nine'        // Geriye düşen, oyun kuran forvet
  | 'winger';           // Kanat oyuncusu, hızlı, dış koridorda

export interface Player2D {
  id: number;
  name: string;
  x: number;
  y: number;
  baseX: number; // Başlangıç/formasyondaki pozisyon
  baseY: number;
  team: 'home' | 'away';
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  role: string; // goalkeeper, centerback, winger vs.
  playerType: PlayerType; // YENI: Özel oyun tarzı
  targetX: number;
  targetY: number;
  vx: number; // Hız vektörleri
  vy: number;
  speed: number; // Mevcut hız
  maxSpeed: number; // Maksimum hız
  acceleration: number; // İvme
  deceleration: number; // Yavaşlama
  color: string;
  hasBall: boolean;
  stamina: number; // Kondisyon (0-100)
  skill: number; // Yetenek seviyesi (0-100)
  aggression: number; // Agresiflik (0-100)
  lastAction: number; // Son hareket zamanı
  // YENI: Oyuncu tipi özel özellikler
  passing?: number;     // Pas yeteneği (0-100)
  shooting?: number;    // Şut gücü (0-100)
  positioning?: number; // Pozisyon alma (0-100)
  workRate?: number;    // Çalışkanlık (0-100)
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
  team: 'home' | 'away';
}

export interface MatchEvent2D {
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'info' | 'foul' | 'offside';
  team: 'home' | 'away';
  player?: string;
  description: string;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  minute: number;
  score: { home: number; away: number };
  events: MatchEvent2D[];
  speed: number;
}