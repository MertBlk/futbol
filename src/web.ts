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

class WebInterface {
  private simulator: MatchSimulator | null = null;
  private matchEngine: MatchEngine | null = null;
  private isMatchRunning: boolean = false;
  
  constructor() {
    console.log('🔧 WebInterface başlatılıyor...');
    this.initializeAPI();
    this.initializeEventListeners();
    this.initializeCanvas();
  }

  private async initializeAPI(): Promise<void> {
    console.log('🔌 API başlatılıyor (demo mode)...');
    this.simulator = new MatchSimulator('demo');
    console.log('✅ MatchSimulator oluşturuldu');
  }

  private initializeCanvas(): void {
    console.log('🎨 Canvas başlatılıyor...');
    const canvas = document.getElementById('footballCanvas') as HTMLCanvasElement;
    
    if (!canvas) {
      console.error('❌ Canvas element bulunamadı!');
      return;
    }

    this.matchEngine = new MatchEngine('footballCanvas');
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