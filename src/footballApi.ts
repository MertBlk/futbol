import { Team, Player, ApiTeamResponse, ApiPlayer } from './types';

export class FootballApi {
  private apiKey: string;
  private baseUrl: string = 'https://v3.football.api-sports.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  private convertPosition(apiPosition: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
    const pos = apiPosition.toLowerCase();
    if (pos.includes('goalkeeper') || pos === 'g') return 'GK';
    if (pos.includes('defender') || pos === 'd') return 'DEF';
    if (pos.includes('midfielder') || pos === 'm') return 'MID';
    return 'FWD'; // Forward/Attacker
  }

  private convertApiPlayerToPlayer(apiPlayer: ApiPlayer): Player {
    const stats = apiPlayer.statistics[0];
    const rating = stats?.games?.rating ? parseFloat(stats.games.rating) * 10 : 70; // API'dan 0-10 arası geliyorsa 100'e çevir
    
    // Pozisyona göre temel değerler
    const position = this.convertPosition(stats?.games?.position || 'M');
    let offense = 50, defense = 50, passing = 50;

    switch (position) {
      case 'GK':
        offense = 20;
        defense = rating;
        passing = 60;
        break;
      case 'DEF':
        offense = 30;
        defense = rating * 0.9;
        passing = rating * 0.7;
        break;
      case 'MID':
        offense = rating * 0.7;
        defense = rating * 0.6;
        passing = rating * 0.9;
        break;
      case 'FWD':
        offense = rating * 0.95;
        defense = 40;
        passing = rating * 0.6;
        break;
    }

    return {
      name: apiPlayer.player.name,
      position,
      rating: Math.min(Math.max(rating, 40), 99), // 40-99 arası sınırla
      offense: Math.min(Math.max(offense, 20), 99),
      defense: Math.min(Math.max(defense, 20), 99),
      passing: Math.min(Math.max(passing, 20), 99),
      fitness: 85 + Math.random() * 15 // 85-100 arası rastgele
    };
  }

  async getTeamSquad(teamId: number, season: number): Promise<Team> {
    try {
      const data = await this.makeRequest(`/players/squads?team=${teamId}`);
      
      if (!data || data.length === 0) {
        throw new Error(`Takım bulunamadı: ${teamId}`);
      }

      const teamData = data[0];
      
      // Detaylı oyuncu bilgileri için ayrı istek
      const playersData = await this.makeRequest(`/players?team=${teamId}&season=${season}`);
      
      const players: Player[] = playersData.map((playerData: ApiPlayer) => 
        this.convertApiPlayerToPlayer(playerData)
      );

      return {
        name: teamData.team.name,
        players: players.slice(0, 25), // İlk 25 oyuncu
        year: season
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async searchTeams(teamName: string): Promise<Array<{ id: number; name: string; logo: string }>> {
    try {
      const data = await this.makeRequest(`/teams?search=${encodeURIComponent(teamName)}`);
      
      return data.map((team: any) => ({
        id: team.team.id,
        name: team.team.name,
        logo: team.team.logo
      }));
    } catch (error) {
      console.error('Team search error:', error);
      throw error;
    }
  }

  async getAvailableSeasons(): Promise<number[]> {
    try {
      const data = await this.makeRequest('/leagues/seasons');
      return data.sort((a: number, b: number) => b - a); // En yeni sezonlar önce
    } catch (error) {
      console.error('Seasons error:', error);
      return [2024, 2023, 2022, 2021, 2020]; // Fallback
    }
  }
}