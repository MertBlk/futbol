import { Player2D, Ball, Goal, MatchEvent2D, GameState } from './canvasTypes';

export class MatchEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private players: Player2D[] = [];
  private ball: Ball;
  private goals: Goal[] = [];
  private gameState: GameState;
  private animationFrame: number = 0;
  private lastTime: number = 0;
  
  // Saha boyutları
  private fieldWidth: number;
  private fieldHeight: number;
  
  // Takım isimleri
  private homeTeamName: string = 'Ev Sahibi';
  private awayTeamName: string = 'Deplasman';

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.fieldWidth = this.canvas.width;
    this.fieldHeight = this.canvas.height;
    
    // Top başlangıç pozisyonu (saha ortası)
    this.ball = {
      x: this.fieldWidth / 2,
      y: this.fieldHeight / 2,
      vx: 0,
      vy: 0,
      speed: 0
    };
    
    // Oyun durumu
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      minute: 0,
      score: { home: 0, away: 0 },
      events: [],
      speed: 2
    };
    
    this.setupField();
    this.setupGoals();
  }

  private setupField(): void {
    // Canvas boyutlarını ayarla
    this.canvas.style.background = 'linear-gradient(45deg, #2e8b57, #3cb371)';
  }

  private setupGoals(): void {
    const goalWidth = 20;
    const goalHeight = 120;
    
    // Sol kale (ev sahibi)
    this.goals.push({
      x: 0,
      y: (this.fieldHeight - goalHeight) / 2,
      width: goalWidth,
      height: goalHeight,
      team: 'home'
    });
    
    // Sağ kale (deplasman)
    this.goals.push({
      x: this.fieldWidth - goalWidth,
      y: (this.fieldHeight - goalHeight) / 2,
      width: goalWidth,
      height: goalHeight,
      team: 'away'
    });
  }

  public setupMatch(homeTeam: string, awayTeam: string): void {
    this.homeTeamName = homeTeam;
    this.awayTeamName = awayTeam;
    this.createPlayers();
    this.resetMatch();
  }

  private createPlayers(): void {
    this.players = [];
    
    // Ev sahibi takım (mavi) - 4-4-2 formasyonu
    const homePositions = [
      { x: 50, y: this.fieldHeight / 2, pos: 'GK' }, // Kaleci
      { x: 150, y: this.fieldHeight * 0.25, pos: 'DEF' }, // Defans
      { x: 150, y: this.fieldHeight * 0.4, pos: 'DEF' },
      { x: 150, y: this.fieldHeight * 0.6, pos: 'DEF' },
      { x: 150, y: this.fieldHeight * 0.75, pos: 'DEF' },
      { x: 300, y: this.fieldHeight * 0.3, pos: 'MID' }, // Orta saha
      { x: 300, y: this.fieldHeight * 0.45, pos: 'MID' },
      { x: 300, y: this.fieldHeight * 0.55, pos: 'MID' },
      { x: 300, y: this.fieldHeight * 0.7, pos: 'MID' },
      { x: 450, y: this.fieldHeight * 0.4, pos: 'FWD' }, // Forvet
      { x: 450, y: this.fieldHeight * 0.6, pos: 'FWD' }
    ];

    // Deplasman takımı (kırmızı) - 4-4-2 formasyonu
    const awayPositions = [
      { x: this.fieldWidth - 50, y: this.fieldHeight / 2, pos: 'GK' }, // Kaleci
      { x: this.fieldWidth - 150, y: this.fieldHeight * 0.25, pos: 'DEF' }, // Defans
      { x: this.fieldWidth - 150, y: this.fieldHeight * 0.4, pos: 'DEF' },
      { x: this.fieldWidth - 150, y: this.fieldHeight * 0.6, pos: 'DEF' },
      { x: this.fieldWidth - 150, y: this.fieldHeight * 0.75, pos: 'DEF' },
      { x: this.fieldWidth - 300, y: this.fieldHeight * 0.3, pos: 'MID' }, // Orta saha
      { x: this.fieldWidth - 300, y: this.fieldHeight * 0.45, pos: 'MID' },
      { x: this.fieldWidth - 300, y: this.fieldHeight * 0.55, pos: 'MID' },
      { x: this.fieldWidth - 300, y: this.fieldHeight * 0.7, pos: 'MID' },
      { x: this.fieldWidth - 450, y: this.fieldHeight * 0.4, pos: 'FWD' }, // Forvet
      { x: this.fieldWidth - 450, y: this.fieldHeight * 0.6, pos: 'FWD' }
    ];

    // Ev sahibi oyuncular
    homePositions.forEach((pos, index) => {
      this.players.push({
        id: index,
        name: `Oyuncu ${index + 1}`,
        x: pos.x,
        y: pos.y,
        team: 'home',
        position: pos.pos as any,
        targetX: pos.x,
        targetY: pos.y,
        speed: 1 + Math.random() * 0.5,
        color: '#2196F3',
        hasBall: false
      });
    });

    // Deplasman oyuncuları
    awayPositions.forEach((pos, index) => {
      this.players.push({
        id: index + 11,
        name: `Oyuncu ${index + 12}`,
        x: pos.x,
        y: pos.y,
        team: 'away',
        position: pos.pos as any,
        targetX: pos.x,
        targetY: pos.y,
        speed: 1 + Math.random() * 0.5,
        color: '#F44336',
        hasBall: false
      });
    });
  }

  private resetMatch(): void {
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      minute: 0,
      score: { home: 0, away: 0 },
      events: [],
      speed: this.gameState.speed
    };
    
    // Topu ortaya koy
    this.ball = {
      x: this.fieldWidth / 2,
      y: this.fieldHeight / 2,
      vx: 0,
      vy: 0,
      speed: 0
    };
    
    // Oyuncuları başlangıç pozisyonlarına koy
    this.players.forEach(player => {
      player.hasBall = false;
    });
  }

  public startMatch(): void {
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.animate();
  }

  public pauseMatch(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  public setSpeed(speed: number): void {
    this.gameState.speed = speed;
  }

  private animate = (currentTime: number = 0): void => {
    if (!this.gameState.isPlaying) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.gameState.isPaused && deltaTime > 16) { // ~60 FPS
      this.update();
    }
    
    this.render();
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private update(): void {
    // Dakika güncelle (hızlı simülasyon için)
    this.gameState.minute += 0.1 * this.gameState.speed;
    
    // 90 dakika sonunda bitir
    if (this.gameState.minute >= 90) {
      this.gameState.isPlaying = false;
      return;
    }
    
    // Oyuncu hareketi
    this.updatePlayers();
    
    // Top hareketi
    this.updateBall();
    
    // Gol kontrolü
    this.checkGoals();
    
    // Rastgele olaylar
    this.generateRandomEvents();
  }

  private updatePlayers(): void {
    this.players.forEach(player => {
      // Basit AI: Topa doğru hareket et
      const ballDist = Math.sqrt(
        Math.pow(this.ball.x - player.x, 2) + 
        Math.pow(this.ball.y - player.y, 2)
      );
      
      if (ballDist < 100) {
        player.targetX = this.ball.x;
        player.targetY = this.ball.y;
      } else {
        // Pozisyonuna dön
        if (player.team === 'home') {
          player.targetX = Math.min(player.targetX, this.fieldWidth * 0.7);
        } else {
          player.targetX = Math.max(player.targetX, this.fieldWidth * 0.3);
        }
      }
      
      // Hedefe doğru hareket
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        player.x += (dx / dist) * player.speed;
        player.y += (dy / dist) * player.speed;
      }
      
      // Saha sınırları
      player.x = Math.max(15, Math.min(this.fieldWidth - 15, player.x));
      player.y = Math.max(15, Math.min(this.fieldHeight - 15, player.y));
    });
  }

  private updateBall(): void {
    // Top sürtünmesi
    this.ball.vx *= 0.98;
    this.ball.vy *= 0.98;
    
    // Top hareketi
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    
    // Saha sınırları (kenar çizgisi)
    if (this.ball.x < 10 || this.ball.x > this.fieldWidth - 10) {
      this.ball.vx = -this.ball.vx * 0.5;
    }
    if (this.ball.y < 10 || this.ball.y > this.fieldHeight - 10) {
      this.ball.vy = -this.ball.vy * 0.5;
    }
    
    // Sınırları zorla
    this.ball.x = Math.max(10, Math.min(this.fieldWidth - 10, this.ball.x));
    this.ball.y = Math.max(10, Math.min(this.fieldHeight - 10, this.ball.y));
  }

  private checkGoals(): void {
    this.goals.forEach(goal => {
      if (this.ball.x >= goal.x && this.ball.x <= goal.x + goal.width &&
          this.ball.y >= goal.y && this.ball.y <= goal.y + goal.height) {
        
        // Gol!
        if (goal.team === 'home') {
          this.gameState.score.away++;
          this.addEvent('goal', 'away', `${this.awayTeamName} gol attı!`);
        } else {
          this.gameState.score.home++;
          this.addEvent('goal', 'home', `${this.homeTeamName} gol attı!`);
        }
        
        // Topu ortaya koy
        this.ball.x = this.fieldWidth / 2;
        this.ball.y = this.fieldHeight / 2;
        this.ball.vx = 0;
        this.ball.vy = 0;
      }
    });
  }

  private generateRandomEvents(): void {
    // Her saniyede düşük ihtimalle rastgele olaylar
    if (Math.random() < 0.001 * this.gameState.speed) {
      const eventTypes = ['card', 'substitution'];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const randomTeam = Math.random() < 0.5 ? 'home' : 'away';
      
      if (randomEvent === 'card') {
        this.addEvent('card', randomTeam, 'Sarı kart!');
      } else {
        this.addEvent('substitution', randomTeam, 'Oyuncu değişikliği');
      }
    }
    
    // Rastgele top hareketi
    if (Math.random() < 0.005 * this.gameState.speed) {
      this.ball.vx = (Math.random() - 0.5) * 4;
      this.ball.vy = (Math.random() - 0.5) * 4;
    }
  }

  private addEvent(type: 'goal' | 'card' | 'substitution', team: 'home' | 'away', description: string): void {
    const event = {
      minute: Math.floor(this.gameState.minute),
      type,
      team,
      description
    };
    
    this.gameState.events.push(event);
    
    // Event callback
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }

  private render(): void {
    // Temizle
    this.ctx.clearRect(0, 0, this.fieldWidth, this.fieldHeight);
    
    // Saha çizgileri
    this.drawField();
    
    // Kaleler
    this.drawGoals();
    
    // Oyuncular
    this.drawPlayers();
    
    // Top
    this.drawBall();
    
    // UI
    this.drawUI();
  }

  private drawField(): void {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    
    // Saha sınırları
    this.ctx.strokeRect(10, 10, this.fieldWidth - 20, this.fieldHeight - 20);
    
    // Orta çizgi
    this.ctx.beginPath();
    this.ctx.moveTo(this.fieldWidth / 2, 10);
    this.ctx.lineTo(this.fieldWidth / 2, this.fieldHeight - 10);
    this.ctx.stroke();
    
    // Orta daire
    this.ctx.beginPath();
    this.ctx.arc(this.fieldWidth / 2, this.fieldHeight / 2, 50, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawGoals(): void {
    this.ctx.fillStyle = '#ffffff';
    this.goals.forEach(goal => {
      this.ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    });
  }

  private drawPlayers(): void {
    this.players.forEach(player => {
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Oyuncu numarası
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText((player.id % 11 + 1).toString(), player.x, player.y + 3);
    });
  }

  private drawBall(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawUI(): void {
    // Skor
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${this.homeTeamName} ${this.gameState.score.home} - ${this.gameState.score.away} ${this.awayTeamName}`,
      this.fieldWidth / 2,
      35
    );
    
    // Dakika
    this.ctx.font = '16px Arial';
    this.ctx.fillText(
      `${Math.floor(this.gameState.minute)}'`,
      this.fieldWidth / 2,
      this.fieldHeight - 20
    );
  }

  // Callback fonksiyonları
  public onEventCallback?: (event: MatchEvent2D) => void;
  
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}