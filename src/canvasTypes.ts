export interface Player2D {
  id: number;
  name: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  hasBall: boolean;
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
  type: 'goal' | 'card' | 'substitution';
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