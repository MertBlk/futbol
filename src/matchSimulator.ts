import { FootballApi } from './footballApi.js';
import { Team, Player, MatchEvent, TeamStats, MatchResult } from './types.js';

export class MatchSimulator {
  private api: FootballApi;
  private team1!: Team;
  private team2!: Team;
  private events: MatchEvent[] = [];
  private score = { team1: 0, team2: 0 };
  private team1Stats: TeamStats = { shots: 0, possession: 50, passes: 0, corners: 0, fouls: 0 };
  private team2Stats: TeamStats = { shots: 0, possession: 50, passes: 0, corners: 0, fouls: 0 };

  constructor(apiKey: string) {
    this.api = new FootballApi(apiKey);
  }

  // API metodları
  async searchAndSelectTeam(teamName: string): Promise<Array<{ id: number; name: string; logo: string }>> {
    return await this.api.searchTeams(teamName);
  }

  async getAvailableSeasons(): Promise<number[]> {
    return await this.api.getAvailableSeasons();
  }

  // Simülasyon metodları
  private selectStarting11(team: Team): Player[] {
    const sorted = [...team.players].sort((a, b) => b.rating - a.rating);
    
    // Temel 4-4-2 formasyonu
    const gk = sorted.filter(p => p.position === 'GK')[0];
    const defenders = sorted.filter(p => p.position === 'DEF').slice(0, 4);
    const midfielders = sorted.filter(p => p.position === 'MID').slice(0, 4);
    const forwards = sorted.filter(p => p.position === 'FWD').slice(0, 2);

    return [gk, ...defenders, ...midfielders, ...forwards].filter(Boolean);
  }

  private calculateGoalProbability(player: Player, minute: number): number {
    let baseProb = (player.rating + player.offense) / 10000; // 0-0.02 arası
    
    // Pozisyona göre artırım
    if (player.position === 'FWD') baseProb *= 2.5;
    else if (player.position === 'MID') baseProb *= 1.2;
    else if (player.position === 'DEF') baseProb *= 0.2;
    else baseProb *= 0.05; // Kaleci

    // Son dakikalarda artış
    if (minute > 80) baseProb *= 1.3;
    
    return Math.min(baseProb, 0.008); // Max %0.8 şans
  }

  private simulateMinute(minute: number): void {
    const team1Starting = this.selectStarting11(this.team1);
    const team2Starting = this.selectStarting11(this.team2);

    // Gol simülasyonu
    [...team1Starting, ...team2Starting].forEach(player => {
      const goalProb = this.calculateGoalProbability(player, minute);
      
      if (Math.random() < goalProb) {
        const isTeam1 = team1Starting.includes(player);
        const team = isTeam1 ? this.team1 : this.team2;
        
        if (isTeam1) this.score.team1++;
        else this.score.team2++;

        this.events.push({
          minute,
          type: 'goal',
          team: team.name,
          player: player.name,
          description: `⚽ ${team.name} gol attı (${player.name})`
        });

        // İstatistik güncelle
        if (isTeam1) this.team1Stats.shots++;
        else this.team2Stats.shots++;
      }
    });

    // Kart simülasyonu (düşük olasılık)
    if (Math.random() < 0.05) { // %0.5 şans
      const allPlayers = [...team1Starting, ...team2Starting];
      const player = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      const isTeam1 = team1Starting.includes(player);
      const team = isTeam1 ? this.team1 : this.team2;

      const cardType = Math.random() < 0.8 ? 'yellow_card' : 'red_card';
      this.events.push({
        minute,
        type: cardType,
        team: team.name,
        player: player.name,
        description: `${cardType === 'yellow_card' ? '🟨' : '🟥'} ${player.name} kart gördü`
      });
    }

    // Her dakika istatistik güncelle
    this.team1Stats.passes += Math.floor(Math.random() * 8) + 2;
    this.team2Stats.passes += Math.floor(Math.random() * 8) + 2;
  }

  private resetMatch(): void {
    this.events = [];
    this.score = { team1: 0, team2: 0 };
    this.team1Stats = { shots: 0, possession: 50, passes: 0, corners: 0, fouls: 0 };
    this.team2Stats = { shots: 0, possession: 50, passes: 0, corners: 0, fouls: 0 };
  }

  async simulateMatch(
    team1Id: number,
    team2Id: number,
    season: number = 2024
  ): Promise<MatchResult> {
    try {
      // API çağrıları devre dışı - demo mode kontrol
      if (!this.api.isDemoMode()) {
        console.warn('⚠️  Gerçek API çağrısı engellendi - sadece demo mode kullanılabilir');
        throw new Error('API çağrıları devre dışı - lütfen demo mode kullanın');
      }
      
      console.log('📥 Takım kadroları yükleniyor (demo mode)...');
      
      // Demo mode'da API çağrısı yapma - ID'leri takım ismi olarak kullan
      const [team1, team2] = [
        this.createDemoTeam(`Takım ${team1Id}`),
        this.createDemoTeam(`Takım ${team2Id}`)
      ];

      this.team1 = team1;
      this.team2 = team2;
      this.resetMatch();

      console.log(`⚽ ${team1.name} vs ${team2.name} (${season} sezonu)`);

      // 90 dakika simülasyonu
      for (let minute = 1; minute <= 90; minute++) {
        this.simulateMinute(minute);
      }

      // Rastgele top hakimiyeti
      const team1Possession = 20 + Math.random() * 60; // 20-40 arası
      this.team1Stats.possession = Math.round(team1Possession);
      this.team2Stats.possession = 100 - this.team1Stats.possession;

      // Diğer istatistikler
      this.team1Stats.shots += Math.floor(Math.random() * 15) + 5;
      this.team2Stats.shots += Math.floor(Math.random() * 15) + 5;
      this.team1Stats.corners = Math.floor(Math.random() * 8) + 2;
      this.team2Stats.corners = Math.floor(Math.random() * 8) + 2;

      return {
        score: `${this.team1.name} ${this.score.team1} - ${this.score.team2} ${this.team2.name}`,
        events: this.events
          .sort((a, b) => a.minute - b.minute)
          .map(e => `${e.minute}' ${e.description}`),
        teamStats: {
          [this.team1.name]: this.team1Stats,
          [this.team2.name]: this.team2Stats
        }
      };
    } catch (error) {
      console.error('Maç simülasyonu hatası:', error);
      throw error;
    }
  }

  private createDemoTeam(teamName: string): Team {
    const positions = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'];
    const players: Player[] = positions.map((pos, i) => ({
      id: i + 1,
      name: `${teamName} Oyuncu ${i + 1}`,
      position: pos as any,
      rating: 75 + Math.floor(Math.random() * 20), // 75-95 arası
      offense: 70 + Math.floor(Math.random() * 25),
      defense: 70 + Math.floor(Math.random() * 25),
      passing: 70 + Math.floor(Math.random() * 25),
      fitness: 70 + Math.floor(Math.random() * 25),
      speed: 70 + Math.floor(Math.random() * 25),
      age: 20 + Math.floor(Math.random() * 15)
    }));

    return {
      id: Math.floor(Math.random() * 1000),
      name: teamName,
      logo: '',
      players: players
    };
  }

  async quickMatch(team1Name: string, team2Name: string, season: number = 2022): Promise<MatchResult> {
    try {
      // API çağrıları tamamen devre dışı - sadece demo mode
      console.log('🎮 Demo modda maç simülasyonu başlıyor...');
      console.log('⚠️  API çağrıları devre dışı - demo takımlar kullanılıyor');
      
      // Demo takımlar oluştur
      this.team1 = this.createDemoTeam(team1Name);
      this.team2 = this.createDemoTeam(team2Name);
      
      // Maçı simüle et
      return await this.simulateDemoMatch();
      
      /* Gerçek API modu - şimdilik devre dışı
      if (!this.api.isDemoMode()) {
        // Gerçek API modunda takım arama
        const [team1Results, team2Results] = await Promise.all([
          this.searchAndSelectTeam(team1Name),
          this.searchAndSelectTeam(team2Name)
        ]);

        if (team1Results.length === 0) {
          throw new Error(`"${team1Name}" takımı bulunamadı`);
        }
        if (team2Results.length === 0) {
          throw new Error(`"${team2Name}" takımı bulunamadı`);
        }

        // İlk sonucu seç
        const team1Id = team1Results[0].id;
        const team2Id = team2Results[0].id;

        return await this.simulateMatch(team1Id, team2Id, season);
      }
      */
    } catch (error) {
      console.error('❌ Hızlı maç hatası:', error);
      throw error;
    }
  }

  private async simulateDemoMatch(): Promise<MatchResult> {
    console.log(`🎮 Demo maç: ${this.team1.name} vs ${this.team2.name}`);
    
    // Skorları sıfırla
    this.events = [];
    this.score = { team1: 0, team2: 0 };
    this.team1Stats = { shots: 0, possession: 50, passes: 0, corners: 0, fouls: 0 };
    this.team2Stats = { shots: 0, possession: 50, passes: 0, corners: 0, fouls: 0 };

    // Maç simülasyonu
    for (let minute = 1; minute <= 90; minute += Math.floor(Math.random() * 5) + 1) {
      // Gol ihtimali
      if (Math.random() < 0.03) { // %3 gol şansı her döngüde
        const scoringTeam = Math.random() < 0.5 ? 1 : 2;
        if (scoringTeam === 1) {
          this.score.team1++;
          this.events.push({
            minute,
            type: 'goal',
            team: this.team1.name,
            player: this.team1.players[Math.floor(Math.random() * 11)].name,
            description: `⚽ ${this.team1.name} gol attı!`
          });
        } else {
          this.score.team2++;
          this.events.push({
            minute,
            type: 'goal',
            team: this.team2.name,
            player: this.team2.players[Math.floor(Math.random() * 11)].name,
            description: `⚽ ${this.team2.name} gol attı!`
          });
        }
      }

      // Diğer olaylar
      if (Math.random() < 0.05) {
        const eventTeam = Math.random() < 0.5 ? this.team1.name : this.team2.name;
        const eventTypes = ['Sarı kart', 'Köşe vuruşu', 'Faul'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        this.events.push({
          minute,
          type: 'info',
          team: eventTeam,
          player: '',
          description: `${eventType} - ${eventTeam}`
        });
      }
    }

    // İstatistikler
    this.team1Stats.shots = Math.floor(Math.random() * 15) + 5;
    this.team2Stats.shots = Math.floor(Math.random() * 15) + 5;
    this.team1Stats.corners = Math.floor(Math.random() * 8) + 2;
    this.team2Stats.corners = Math.floor(Math.random() * 8) + 2;
    this.team1Stats.possession = Math.floor(Math.random() * 40) + 30;
    this.team2Stats.possession = 100 - this.team1Stats.possession;

    return {
      score: `${this.team1.name} ${this.score.team1} - ${this.score.team2} ${this.team2.name}`,
      events: this.events
        .sort((a, b) => a.minute - b.minute)
        .map(e => `${e.minute}' ${e.description}`),
      teamStats: {
        [this.team1.name]: this.team1Stats,
        [this.team2.name]: this.team2Stats
      }
    };
  }
}