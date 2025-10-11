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