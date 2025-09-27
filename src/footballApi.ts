import { Team, Player, ApiTeamResponse, ApiPlayer } from './types';

export class FootballApi {
  private apiKey: string;
  private baseUrl: string = 'https://v3.football.api-sports.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public isDemoMode(): boolean {
    return this.apiKey === 'demo';
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
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
      id: apiPlayer.player.id || Math.random() * 10000,
      name: apiPlayer.player.name,
      position,
      rating: Math.min(Math.max(rating, 40), 99), // 40-99 arası sınırla
      offense: Math.min(Math.max(offense, 20), 99),
      defense: Math.min(Math.max(defense, 20), 99),
      passing: Math.min(Math.max(passing, 20), 99),
      fitness: 85 + Math.random() * 15, // 85-100 arası rastgele
      speed: rating * 0.7 + Math.random() * 20 // Hıza göre hesapla
    };
  }

  async getTeamSquad(teamId: number, season: number): Promise<Team> {
    if (this.isDemoMode()) {
      // Demo mode için sahte takım verisi oluştur
      const demoPlayers: Player[] = [];
      const positions = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];
      
      for (let i = 0; i < 11; i++) {
        demoPlayers.push({
          id: i + 1,
          name: `Oyuncu ${i + 1}`,
          position: positions[i] as any,
          rating: 70 + Math.random() * 25,
          offense: 60 + Math.random() * 30,
          defense: 60 + Math.random() * 30,
          passing: 60 + Math.random() * 30,
          fitness: 85 + Math.random() * 15,
          speed: 60 + Math.random() * 30
        });
      }

      const teamNames = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Bayern Munich', 'Paris Saint-Germain'];
      const teamName = teamNames.find(name => name.toLowerCase().includes(String(teamId))) || teamNames[teamId % teamNames.length];

      return {
        id: teamId,
        name: teamName,
        players: demoPlayers,
        year: season,
        logo: ''
      };
    }

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
        id: teamData.team.id || Math.random() * 1000,
        name: teamData.team.name,
        players: players.slice(0, 25), // İlk 25 oyuncu
        year: season,
        logo: teamData.team.logo || ''
      };
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  async searchTeams(teamName: string): Promise<Array<{ id: number; name: string; logo: string }>> {
    if (this.isDemoMode()) {
      // Demo mode için sahte takım verisi döndür
      const demoTeams = [
        { id: 1, name: 'Real Madrid', logo: '' },
        { id: 2, name: 'Barcelona', logo: '' },
        { id: 3, name: 'Manchester City', logo: '' },
        { id: 4, name: 'Liverpool', logo: '' },
        { id: 5, name: 'Bayern Munich', logo: '' },
        { id: 6, name: 'Paris Saint-Germain', logo: '' }
      ];
      
      return demoTeams.filter(team => 
        team.name.toLowerCase().includes(teamName.toLowerCase())
      );
    }

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
      return [2024, 2023, 2022, 2021, 2020, 2019]; // Fallback
    }
  }
}