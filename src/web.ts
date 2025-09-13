import { MatchSimulator } from './matchSimulator';
import { MatchEngine } from './matchEngine';
import { MatchEvent2D } from './canvasTypes';

class WebInterface {
  private simulator: MatchSimulator | null = null;
  private matchEngine: MatchEngine | null = null;
  private isApiMode: boolean = false;
  
  constructor() {
    console.log('🔧 WebInterface constructor başladı');
    this.initializeAPI();
    this.initializeEventListeners();
    this.initializeCanvas();
    this.testDOMElements();
  }

  private testDOMElements(): void {
    console.log('🔍 DOM elementleri kontrol ediliyor...');
    
    const elements = [
      'simulateBtn',
      'startCanvasBtn', 
      'pauseCanvasBtn',
      'randomBtn',
      'team1',
      'team2',
      'footballCanvas'
    ];

    elements.forEach(id => {
      const element = document.getElementById(id);
      console.log(`${id}: ${element ? '✅ Bulundu' : '❌ Bulunamadı'}`);
    });
  }

  private async initializeAPI(): Promise<void> {
    console.log('🔌 API başlatılıyor (demo mode)...');
    this.isApiMode = false;
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
    
    // Canvas'ı görünür yap
    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
      canvasContainer.style.display = 'block';
      console.log('✅ Canvas container görünür yapıldı');
    }
    
    // Test çizimi
    this.testCanvas();
  }

  private testCanvas(): void {
    const canvas = document.getElementById('footballCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Test çizimi
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 10, 100, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('Canvas Çalışıyor!', 20, 35);
    
    console.log('✅ Canvas test çizimi tamamlandı');
  }

  private initializeEventListeners(): void {
    console.log('🎧 Event listener\'lar ekleniyor...');
    
    // Simulate button
    const simulateBtn = document.getElementById('simulateBtn');
    if (simulateBtn) {
      simulateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🎮 Simulate button tıklandı!');
        this.simulateMatch();
      });
      console.log('✅ Simulate button listener eklendi');
    } else {
      console.error('❌ simulateBtn bulunamadı!');
    }

    // Canvas start button  
    const startCanvasBtn = document.getElementById('startCanvasBtn');
    if (startCanvasBtn) {
      startCanvasBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🎮 Canvas start button tıklandı!');
        this.startCanvasMatch();
      });
      console.log('✅ Canvas start button listener eklendi');
    } else {
      console.error('❌ startCanvasBtn bulunamadı!');
    }

    // Pause button
    const pauseCanvasBtn = document.getElementById('pauseCanvasBtn');
    if (pauseCanvasBtn) {
      pauseCanvasBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('⏸️ Canvas pause button tıklandı!');
        this.pauseCanvasMatch();
      });
      console.log('✅ Canvas pause button listener eklendi');
    }

    // Random button
    const randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
      randomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🎲 Random button tıklandı!');
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

    // Enter key listeners
    const team1Input = document.getElementById('team1') as HTMLInputElement;
    const team2Input = document.getElementById('team2') as HTMLInputElement;
    
    [team1Input, team2Input].forEach((input, index) => {
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            console.log(`⌨️ Enter tuşu basıldı (team${index + 1})`);
            this.simulateMatch();
          }
        });
        console.log(`✅ Team${index + 1} enter listener eklendi`);
      }
    });

    console.log('🎧 Tüm event listener\'lar eklendi');
  }

  private async simulateMatch(): Promise<void> {
    console.log('🚀 simulateMatch() çağrıldı');
    
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

    // Canvas'ı göster ve maçı başlat
    this.showCanvas();
    
    this.showLoading(true);
    this.hideError();
    this.clearResults();

    try {
      console.log('🔄 Maç simülasyonu başlatılıyor...');
      
      if (this.simulator) {
        const result = await this.simulator.quickMatch(team1, team2, 2022);
        console.log('✅ Maç simülasyonu tamamlandı:', result);
        this.displayResults(result);
      } else {
        throw new Error('Simulator başlatılamadı');
      }
    } catch (error) {
      console.error('❌ Maç simülasyonu hatası:', error);
      this.showError(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      this.showLoading(false);
    }
  }

  private startCanvasMatch(): void {
    console.log('🎮 startCanvasMatch() çağrıldı');
    
    const team1Input = document.getElementById('team1') as HTMLInputElement;
    const team2Input = document.getElementById('team2') as HTMLInputElement;
    
    if (!team1Input || !team2Input) {
      console.error('❌ Team input elementleri bulunamadı!');
      return;
    }

    const team1 = team1Input.value.trim();
    const team2 = team2Input.value.trim();

    if (!team1 || !team2) {
      this.showError('Önce takım isimlerini girin!');
      return;
    }

    console.log(`🎮 Canvas maçı başlatılıyor: ${team1} vs ${team2}`);
    
    this.matchEngine?.setupMatch(team1, team2);
    this.matchEngine?.startMatch();
    this.clearResults();
  }

  private pauseCanvasMatch(): void {
    console.log('⏸️ pauseCanvasMatch() çağrıldı');
    this.matchEngine?.pauseMatch();
  }

  private showCanvas(): void {
    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
      canvasContainer.style.display = 'block';
      canvasContainer.scrollIntoView({ behavior: 'smooth' });
      console.log('✅ Canvas gösterildi');
    }
  }

  private addEventToList(event: MatchEvent2D): void {
    const eventsList = document.getElementById('eventsList');
    if (eventsList) {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event-item';
      eventDiv.textContent = `${event.minute}' - ${event.description}`;
      eventsList.appendChild(eventDiv);
    }
  }

  private clearResults(): void {
    const eventsList = document.getElementById('eventsList');
    if (eventsList) {
      eventsList.innerHTML = '';
    }
  }

  private setRandomTeams(): void {
    console.log('🎲 setRandomTeams() çağrıldı');
    
    const teams = [
      'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 
      'Bayern Munich', 'Paris Saint-Germain', 'Chelsea', 'Arsenal',
      'Manchester United', 'Tottenham', 'AC Milan', 'Inter Milan'
    ];

    const shuffled = teams.sort(() => 0.5 - Math.random());
    
    const team1Input = document.getElementById('team1') as HTMLInputElement;
    const team2Input = document.getElementById('team2') as HTMLInputElement;
    
    if (team1Input && team2Input) {
      team1Input.value = shuffled[0];
      team2Input.value = shuffled[1];
      console.log(`🎲 Rastgele takımlar seçildi: ${shuffled[0]} vs ${shuffled[1]}`);
    }
  }

  private displayResults(result: any): void {
    console.log('📊 displayResults() çağrıldı:', result);
    
    const finalScore = document.getElementById('finalScore');
    if (finalScore) {
      finalScore.textContent = result.score;
    }

    const eventsList = document.getElementById('eventsList');
    if (eventsList && result.events) {
      eventsList.innerHTML = result.events.map((event: string) => 
        `<div class="event-item">${event}</div>`
      ).join('');
    }

    this.showResults();
  }

  private showLoading(show: boolean): void {
    const loading = document.getElementById('loading');
    const btn = document.getElementById('simulateBtn') as HTMLButtonElement;
    
    if (loading) {
      loading.style.display = show ? 'block' : 'none';
    }
    
    if (btn) {
      btn.disabled = show;
      btn.textContent = show ? '⏳ Simüle Ediliyor...' : '🎮 Maçı Simüle Et';
    }
  }

  private showResults(): void {
    const results = document.getElementById('results');
    if (results) {
      results.style.display = 'block';
      results.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private showError(message: string): void {
    const errorDiv = document.getElementById('errorMsg');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
    console.error('🚨 Hata gösterildi:', message);
  }

  private hideError(): void {
    const errorDiv = document.getElementById('errorMsg');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
}

// DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM yüklendi, WebInterface başlatılıyor...');
  new WebInterface();
});

// Global scope'a export et
(window as any).WebInterface = WebInterface;