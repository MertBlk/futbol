import { MatchSimulator } from './matchSimulator.js';
import { MatchEngine } from './matchEngine.js';
import { MatchEvent2D } from './canvasTypes.js';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  events: string[];
  stats: { [key: string]: any };
}

interface SquadSelection {
  teamA: { [position: string]: string };
  teamB: { [position: string]: string };
}

class WebInterface {
  private simulator: MatchSimulator | null = null;
  private matchEngine: MatchEngine | null = null;
  private isMatchRunning: boolean = false;
  private userPrediction: 'teamA' | 'teamB' | 'draw' | null = null;
  private squadSelection: SquadSelection = {
    teamA: {},
    teamB: {}
  };
  
  constructor() {
    console.log('🔧 WebInterface başlatılıyor...');
    this.initializeAPI();
    this.initializeEventListeners();
    this.initializeCanvas();
    this.initializePredictionPanel();
    this.initializeSquadPanel();
  }

  private async initializeAPI(): Promise<void> {
    console.log('🔌 API başlatılıyor (demo mode)...');
    this.simulator = new MatchSimulator('demo');
    console.log('✅ MatchSimulator oluşturuldu');
  }

  private initializeCanvas(): void {
    console.log('🎨 Canvas başlatılıyor...');
    const canvas = document.getElementById('matchCanvas') as HTMLCanvasElement;
    
    if (!canvas) {
      console.error('❌ Canvas element bulunamadı!');
      return;
    }

    this.matchEngine = new MatchEngine('matchCanvas');
    console.log('✅ MatchEngine oluşturuldu');
    
    // Canvas event handler'ları ayarla
    this.setupCanvasEventHandlers();
  }

  private setupCanvasEventHandlers(): void {
    if (!this.matchEngine) return;
    
    // Match engine'den gelen event'leri dinle
    this.matchEngine.onMatchEvent((event: MatchEvent2D) => {
      this.addEventToList(event);
    });
    
    this.matchEngine.onScoreUpdate((homeScore: number, awayScore: number) => {
      this.updateScore(homeScore, awayScore);
    });
    
    this.matchEngine.onTimeUpdate((minute: number) => {
      this.updateTime(minute);
    });
    
    this.matchEngine.onMatchEnd((result: any) => {
      this.onMatchEnd(result);
    });
    
    // İstatistikleri periyodik olarak güncelle
    setInterval(() => {
      if (this.isMatchRunning && this.matchEngine) {
        this.updateLiveStats();
      }
    }, 2000); // Her 2 saniyede bir güncelle
  }

  private initializeEventListeners(): void {
    console.log('🎧 Event listener\'lar ekleniyor...');
    
    // Main Start Match button
    const startMatchBtn = document.getElementById('startMatchBtn');
    if (startMatchBtn) {
      startMatchBtn.addEventListener('click', () => {
        this.startUnifiedMatch();
      });
      console.log('✅ Start Match button listener eklendi');
    }

    // Pause button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.pauseMatch();
      });
      console.log('✅ Pause button listener eklendi');
    }

    // Random teams button
    const randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        this.setRandomTeams();
      });
      console.log('✅ Random button listener eklendi');
    }

    // Speed select
    const speedSelect = document.getElementById('speedSelect') as HTMLSelectElement;
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        const speed = parseInt((e.target as HTMLSelectElement).value);
        console.log(`⚡ Hız değişti: ${speed}`);
        this.matchEngine?.setSpeed(speed);
      });
      console.log('✅ Speed select listener eklendi');
    }

    // Enter key listeners for team inputs
    const team1Input = document.getElementById('team1') as HTMLInputElement;
    const team2Input = document.getElementById('team2') as HTMLInputElement;
    
    [team1Input, team2Input].forEach((input, index) => {
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            console.log(`⌨️ Enter tuşu basıldı (team${index + 1})`);
            this.startUnifiedMatch();
          }
        });
        console.log(`✅ Team${index + 1} enter listener eklendi`);
      }
    });

    console.log('🎧 Tüm event listener\'lar eklendi');
  }

  private initializePredictionPanel(): void {
    console.log('🎯 Tahmin paneli başlatılıyor...');
    
    const predictTeamA = document.getElementById('predictTeamA');
    const predictDraw = document.getElementById('predictDraw');
    const predictTeamB = document.getElementById('predictTeamB');
    
    if (predictTeamA) {
      predictTeamA.addEventListener('click', () => this.selectPrediction('teamA'));
    }
    
    if (predictDraw) {
      predictDraw.addEventListener('click', () => this.selectPrediction('draw'));
    }
    
    if (predictTeamB) {
      predictTeamB.addEventListener('click', () => this.selectPrediction('teamB'));
    }
    
    console.log('✅ Tahmin paneli hazır');
  }

  private selectPrediction(prediction: 'teamA' | 'teamB' | 'draw'): void {
    this.userPrediction = prediction;
    console.log(`🎯 Kullanıcı tahmini: ${prediction}`);
    
    // Buton görsellerini güncelle
    document.querySelectorAll('.prediction-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    const selectedBtn = prediction === 'teamA' ? 'predictTeamA' 
                      : prediction === 'teamB' ? 'predictTeamB' 
                      : 'predictDraw';
    
    document.getElementById(selectedBtn)?.classList.add('selected');
    
    // Sonuç mesajını göster
    const resultDiv = document.getElementById('predictionResult');
    if (resultDiv) {
      const predictionText = prediction === 'teamA' ? 'A Takımı Kazanır' 
                           : prediction === 'teamB' ? 'B Takımı Kazanır' 
                           : 'Berabere';
      
      resultDiv.textContent = `✅ Tahmininiz: ${predictionText}`;
      resultDiv.classList.add('show');
    }
    
    // Kadro panelini göster
    const squadPanel = document.getElementById('squadPanel');
    if (squadPanel) {
      squadPanel.style.display = 'block';
      squadPanel.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private initializeSquadPanel(): void {
    console.log('⚽ Kadro paneli başlatılıyor...');
    
    // 11 oyuncu pozisyonu
    const positions = [
      { num: 1, pos: 'Kaleci', default: 'Goalkeeper' },
      { num: 2, pos: 'Sağ Bek', default: 'Full Back' },
      { num: 3, pos: 'Stoper', default: 'Centre Back' },
      { num: 4, pos: 'Stoper', default: 'Centre Back' },
      { num: 5, pos: 'Sol Bek', default: 'Full Back' },
      { num: 6, pos: 'Defansif Orta Saha', default: 'Defensive Midfielder' },
      { num: 7, pos: 'Orta Saha', default: 'Box-to-Box' },
      { num: 8, pos: 'Orta Saha', default: 'Playmaker' },
      { num: 9, pos: 'Kanat', default: 'Winger' },
      { num: 10, pos: 'Forvet', default: 'Striker' },
      { num: 11, pos: 'Kanat', default: 'Winger' }
    ];
    
    // Oyuncu tipleri
    const playerTypes = [
      'Goalkeeper', 'Centre Back', 'Full Back', 'Wing Back',
      'Defensive Midfielder', 'Box-to-Box', 'Playmaker',
      'Winger', 'Inside Forward', 'Striker', 'Poacher',
      'Target Man', 'False Nine'
    ];
    
    // Her iki takım için kadro oluştur
    ['teamASquad', 'teamBSquad'].forEach((squadId, teamIndex) => {
      const squadContainer = document.getElementById(squadId);
      if (!squadContainer) return;
      
      const teamKey = teamIndex === 0 ? 'teamA' : 'teamB';
      
      squadContainer.innerHTML = '';
      
      positions.forEach(({ num, pos, default: defaultType }) => {
        const playerSlot = document.createElement('div');
        playerSlot.className = 'player-slot';
        
        const playerNumber = document.createElement('div');
        playerNumber.className = 'player-number';
        playerNumber.textContent = num.toString();
        
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const playerPosition = document.createElement('div');
        playerPosition.className = 'player-position';
        playerPosition.textContent = pos;
        
        const playerTypeSelect = document.createElement('select');
        playerTypeSelect.className = 'player-type-select';
        playerTypeSelect.dataset.team = teamKey;
        playerTypeSelect.dataset.position = num.toString();
        
        playerTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          if (type === defaultType) {
            option.selected = true;
            this.squadSelection[teamKey][num.toString()] = type;
          }
          playerTypeSelect.appendChild(option);
        });
        
        playerTypeSelect.addEventListener('change', (e) => {
          const select = e.target as HTMLSelectElement;
          const team = select.dataset.team as 'teamA' | 'teamB';
          const position = select.dataset.position!;
          this.squadSelection[team][position] = select.value;
          console.log(`⚽ ${team} - Pozisyon ${position}: ${select.value}`);
        });
        
        playerInfo.appendChild(playerPosition);
        playerInfo.appendChild(playerTypeSelect);
        
        playerSlot.appendChild(playerNumber);
        playerSlot.appendChild(playerInfo);
        
        squadContainer.appendChild(playerSlot);
      });
    });
    
    // Maç başlatma butonunu bağla
    const startMatchWithSquad = document.getElementById('startMatchWithSquad');
    if (startMatchWithSquad) {
      startMatchWithSquad.addEventListener('click', () => this.startMatchWithCustomSquad());
    }
    
    console.log('✅ Kadro paneli hazır');
  }

  private async startMatchWithCustomSquad(): Promise<void> {
    console.log('🚀 Özel kadro ile maç başlatılıyor...');
    console.log('📋 A Takımı Kadrosu:', this.squadSelection.teamA);
    console.log('📋 B Takımı Kadrosu:', this.squadSelection.teamB);
    console.log('🎯 Kullanıcı Tahmini:', this.userPrediction);
    
    // Match container'ı göster
    const matchContainer = document.getElementById('matchContainer');
    if (matchContainer) {
      matchContainer.style.display = 'block';
      matchContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Tahmin ve kadro panellerini gizle
    const predictionPanel = document.getElementById('predictionPanel');
    const squadPanel = document.getElementById('squadPanel');
    
    if (predictionPanel) predictionPanel.style.display = 'none';
    if (squadPanel) squadPanel.style.display = 'none';
    
    // Match state'i güncelle
    this.isMatchRunning = true;
    
    // UI'ı temizle
    this.clearResults();
    this.updateScore(0, 0);
    this.updateTime(0);

    try {
      // Canvas match'i başlat ve kadro bilgisini gönder
      console.log('🎮 Canvas maçı başlatılıyor...');
      this.matchEngine?.setupMatchWithSquad('A Takımı', 'B Takımı', this.squadSelection);
      this.matchEngine?.startMatch();
      
      console.log('✅ Canvas maçı özel kadro ile başlatıldı');
      
    } catch (error) {
      console.error('❌ Maç başlatma hatası:', error);
      this.showError(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      this.isMatchRunning = false;
    }
  }

  private async startUnifiedMatch(): Promise<void> {
    console.log('🚀 Unified match başlatılıyor...');
    
    const team1Input = document.getElementById('team1') as HTMLInputElement;
    const team2Input = document.getElementById('team2') as HTMLInputElement;
    
    if (!team1Input || !team2Input) {
      console.error('❌ Team input elementleri bulunamadı!');
      return;
    }

    const team1 = team1Input.value.trim();
    const team2 = team2Input.value.trim();
    
    console.log(`📝 Takımlar: "${team1}" vs "${team2}"`);

    if (!team1 || !team2) {
      this.showError('Lütfen her iki takım adını da girin!');
      return;
    }

    if (team1.toLowerCase() === team2.toLowerCase()) {
      this.showError('Takımlar farklı olmalıdır!');
      return;
    }

    // Match state'i güncelle
    this.isMatchRunning = true;
    this.updateButtonStates();
    
    // UI'ı temizle
    this.clearResults();
    this.updateScore(0, 0);
    this.updateTime(0);

    try {
      // Canvas match'i başlat
      console.log('🎮 Canvas maçı başlatılıyor...');
      this.matchEngine?.setupMatch(team1, team2);
      this.matchEngine?.startMatch();
      
      // SINIR: Simulator'ı arka planda ÇALIŞTIRMA - sadece canvas kullan
      // Canvas'tan gelen event'ler zaten senkronize olacak
      console.log('✅ Canvas maçı başlatıldı - simulator devre dışı bırakıldı');
      
    } catch (error) {
      console.error('❌ Maç başlatma hatası:', error);
      this.showError(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      this.isMatchRunning = false;
      this.updateButtonStates();
    }
  }

  private pauseMatch(): void {
    console.log('⏸️ Maç duraklatılıyor...');
    this.matchEngine?.pauseMatch();
    this.isMatchRunning = !this.isMatchRunning;
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    const startBtn = document.getElementById('startMatchBtn') as HTMLButtonElement;
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
    
    if (startBtn) {
      startBtn.disabled = this.isMatchRunning;
      startBtn.textContent = this.isMatchRunning ? '🎮 Maç Devam Ediyor...' : '🎮 Maçı Başlat';
    }
    
    if (pauseBtn) {
      pauseBtn.disabled = !this.isMatchRunning;
    }
  }

  private updateScore(homeScore: number, awayScore: number): void {
    const scoreElement = document.getElementById('canvasScore');
    if (scoreElement) {
      scoreElement.textContent = `${homeScore} - ${awayScore}`;
    }
    
    // Ana başlıktaki skoru da güncelle  
    // (scoreElement zaten kontrol edilmiş yukarıda)
  }

  private updateTime(minute: number): void {
    const timeElement = document.getElementById('canvasTime');
    if (timeElement) {
      timeElement.textContent = `${minute}'`;
    }
    
    // Match status'u da güncelle
    const matchStatus = document.getElementById('matchStatus');
    if (matchStatus) {
      if (minute === 0) {
        matchStatus.textContent = 'Maç Başlıyor...';
      } else if (minute === 45) {
        matchStatus.textContent = 'Devre Arası';
      } else if (minute === 46) {
        matchStatus.textContent = 'İkinci Yarı';
      } else if (minute >= 90) {
        matchStatus.textContent = 'Maç Bitti';
      } else {
        matchStatus.textContent = 'Oynanıyor';
      }
    }
  }

  private addEventToList(event: MatchEvent2D): void {
    const eventsContainer = document.getElementById('eventsList');
    if (eventsContainer) {
        const eventDiv = document.createElement('div');
        eventDiv.className = `event-item ${event.type}`;
        eventDiv.textContent = `${event.minute}' - ${event.description}`;
        
        // En üste ekle (yeni event'ler üstte görünsün)
        eventsContainer.insertBefore(eventDiv, eventsContainer.firstChild);
        
        // Maksimum 15 event göster
        const events = eventsContainer.children;
        if (events.length > 15) {
            eventsContainer.removeChild(events[events.length - 1]);
        }
    }
  }

  private onMatchEnd(result: any): void {
    console.log('� Maç bitti:', result);
    this.isMatchRunning = false;
    this.updateButtonStates();
    
    // Stats'i göster
    this.displayStats(result);
  }

  private displayStats(matchResult: any): void {
    if (matchResult.stats) {
      this.updateStatsDisplay(matchResult.stats);
    }
  }
  
  private updateLiveStats(): void {
    if (!this.matchEngine) return;
    
    const stats = this.matchEngine.getCurrentStats();
    this.updateStatsDisplay(stats);
  }
  
  private updateStatsDisplay(stats: any): void {
    const homeShots = document.getElementById('homeShots');
    const awayShots = document.getElementById('awayShots');
    const homePossession = document.getElementById('homePossession');
    const awayPossession = document.getElementById('awayPossession');
    const homeCards = document.getElementById('homeCards');
    const awayCards = document.getElementById('awayCards');
    const homeCorners = document.getElementById('homeCorners');
    const awayCorners = document.getElementById('awayCorners');
    
    if (homeShots) homeShots.textContent = stats.homeShots || '0';
    if (awayShots) awayShots.textContent = stats.awayShots || '0';
    if (homePossession) homePossession.textContent = stats.homePossession || '50';
    if (awayPossession) awayPossession.textContent = stats.awayPossession || '50';
    if (homeCards) homeCards.textContent = stats.homeCards || '0';
    if (awayCards) awayCards.textContent = stats.awayCards || '0';
    if (homeCorners) homeCorners.textContent = stats.homeCorners || '0';
    if (awayCorners) awayCorners.textContent = stats.awayCorners || '0';
  }

  private clearResults(): void {
    const eventsList = document.getElementById('eventsList');
    const statsList = document.getElementById('statsList');
    
    if (eventsList) {
      eventsList.innerHTML = '';
    }
    
    if (statsList) {
      statsList.innerHTML = '';
    }
    
    // Results section'ı gizle
    const results = document.getElementById('results');
    if (results) {
      results.style.display = 'none';
    }
  }

  private showResults(): void {
    const results = document.getElementById('results');
    if (results) {
      results.style.display = 'block';
    }
  }

  private setRandomTeams(): void {
    console.log('🎲 Rastgele takımlar seçiliyor...');
    
    const teams = [
      'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 
      'Bayern Munich', 'Paris Saint-Germain', 'Chelsea', 'Arsenal',
      'Manchester United', 'Tottenham', 'AC Milan', 'Inter Milan',
      'Atletico Madrid', 'Borussia Dortmund', 'AS Roma', 'Napoli'
    ];

    const shuffled = teams.sort(() => 0.5 - Math.random());
    
    const team1Input = document.getElementById('team1') as HTMLInputElement;
    const team2Input = document.getElementById('team2') as HTMLInputElement;
    
    if (team1Input && team2Input) {
      team1Input.value = shuffled[0];
      team2Input.value = shuffled[1];
      console.log(`🎲 Rastgele takımlar: ${shuffled[0]} vs ${shuffled[1]}`);
    }
  }

  private showError(message: string): void {
    // Console'da hata mesajını göster
    console.error('🚨 Hata:', message);
    
    // Geçici olarak alert ile göster, sonra daha güzel bir error UI ekleyebiliriz
    alert(message);
  }
}

// DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM yüklendi, WebInterface başlatılıyor...');
  new WebInterface();
});

// Global scope'a export et
(window as any).WebInterface = WebInterface;