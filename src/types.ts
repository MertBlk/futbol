export interface Player {
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number;
  offense: number;
  defense: number;
  passing: number;
  fitness: number;
}

export interface Team {
  name: string;
  players: Player[];
  year?: number;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'injury' | 'substitution';
  team: string;
  player: string;
  description: string;
}

export interface TeamStats {
  shots: number;
  possession: number;
  passes: number;
  corners: number;
  fouls: number;
}

export interface MatchResult {
  score: string;
  events: string[];
  teamStats: {
    [teamName: string]: TeamStats;
  };
}

export interface ApiTeamResponse {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: ApiPlayer[];
}

export interface ApiPlayer {
  player: {
    id: number;
    name: string;
    age: number;
    photo: string;
  };
  statistics: Array<{
    games: {
      position: string;
      rating?: string;
    };
  }>;
}