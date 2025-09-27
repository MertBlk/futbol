import { Player2D, Ball, Goal, MatchEvent2D, GameState } from './canvasTypes.js';

export class MatchEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private players: Player2D[] = [];
  private ball: Ball;
  private goals: Goal[] = [];
  private gameState: GameState;
  private animationFrame: number = 0;
  private lastTime: number = 0;
  
  // Event handlers
  private eventHandlers: {
    onMatchEvent?: (event: MatchEvent2D) => void;
    onScoreUpdate?: (homeScore: number, awayScore: number) => void;
    onTimeUpdate?: (minute: number) => void;
    onMatchEnd?: (result: any) => void;
  } = {};
  
  // Saha boyutları
  private fieldWidth: number;
  private fieldHeight: number;
  
  // Takım isimleri
  private homeTeamName: string = 'Ev Sahibi';
  private awayTeamName: string = 'Deplasman';
  
  // İstatistikler
  private matchStats = {
    homeShots: 0,
    awayShots: 0,
    homePossession: 50,
    awayPossession: 50,
    homeCards: 0,
    awayCards: 0,
    homeCorners: 0,
    awayCorners: 0
  };

  // Canvas boyutlarını büyüt
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Daha büyük canvas boyutları
    this.fieldWidth = 1000;
    this.fieldHeight = 600;
    
    // Canvas boyutlarını ayarla
    this.canvas.width = this.fieldWidth;
    this.canvas.height = this.fieldHeight;
    
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
    
    // Ev sahibi takım (mavi) - 4-2-3-1 formasyonu
    const homePositions = [
      { x: 50, y: this.fieldHeight / 2, pos: 'GK' }, // Kaleci
      
      // 4 Defans (arka çizgi)
      { x: 140, y: this.fieldHeight * 0.15, pos: 'DEF' }, // Sağ bek
      { x: 140, y: this.fieldHeight * 0.38, pos: 'DEF' }, // Sağ stoper
      { x: 140, y: this.fieldHeight * 0.62, pos: 'DEF' }, // Sol stoper
      { x: 140, y: this.fieldHeight * 0.85, pos: 'DEF' }, // Sol bek
      
      // 2 Orta saha (defansif)
      { x: 250, y: this.fieldHeight * 0.35, pos: 'MID' }, // Defansif orta saha (sağ)
      { x: 250, y: this.fieldHeight * 0.65, pos: 'MID' }, // Defansif orta saha (sol)
      
      // 3 Hücum orta sahası
      { x: 350, y: this.fieldHeight * 0.2, pos: 'MID' },  // Sağ kanat
      { x: 350, y: this.fieldHeight * 0.5, pos: 'MID' },  // Hücum orta sahası (10 numara)
      { x: 350, y: this.fieldHeight * 0.8, pos: 'MID' },  // Sol kanat
      
      // 1 Forvet (santrafor)
      { x: 450, y: this.fieldHeight / 2, pos: 'FWD' } // Santrafor
    ];

    // Deplasman takımı (kırmızı) - 4-2-3-1 formasyonu (simetrik)
    const awayPositions = [
      { x: this.fieldWidth - 50, y: this.fieldHeight / 2, pos: 'GK' }, // Kaleci
      
      // 4 Defans (arka çizgi)
      { x: this.fieldWidth - 140, y: this.fieldHeight * 0.15, pos: 'DEF' }, // Sol bek
      { x: this.fieldWidth - 140, y: this.fieldHeight * 0.38, pos: 'DEF' }, // Sol stoper
      { x: this.fieldWidth - 140, y: this.fieldHeight * 0.62, pos: 'DEF' }, // Sağ stoper
      { x: this.fieldWidth - 140, y: this.fieldHeight * 0.85, pos: 'DEF' }, // Sağ bek
      
      // 2 Orta saha (defansif)
      { x: this.fieldWidth - 250, y: this.fieldHeight * 0.35, pos: 'MID' }, // Defansif orta saha (sol)
      { x: this.fieldWidth - 250, y: this.fieldHeight * 0.65, pos: 'MID' }, // Defansif orta saha (sağ)
      
      // 3 Hücum orta sahası
      { x: this.fieldWidth - 350, y: this.fieldHeight * 0.2, pos: 'MID' },  // Sol kanat
      { x: this.fieldWidth - 350, y: this.fieldHeight * 0.5, pos: 'MID' },  // Hücum orta sahası (10 numara)
      { x: this.fieldWidth - 350, y: this.fieldHeight * 0.8, pos: 'MID' },  // Sağ kanat
      
      // 1 Forvet (santrafor)
      { x: this.fieldWidth - 450, y: this.fieldHeight / 2, pos: 'FWD' } // Santrafor
    ];

    // Ev sahibi oyuncular
    homePositions.forEach((pos, index) => {
      this.players.push({
        id: index,
        name: `Oyuncu ${index + 1}`,
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
        team: 'home',
        position: pos.pos as any,
        role: 'player',
        targetX: pos.x,
        targetY: pos.y,
        vx: 0,
        vy: 0,
        speed: 1 + Math.random() * 0.5,
        maxSpeed: 2 + Math.random() * 1,
        acceleration: 0.3,
        deceleration: 0.8,
        color: '#2196F3',
        hasBall: false,
        stamina: 100,
        skill: 70 + Math.random() * 30,
        aggression: 50 + Math.random() * 50,
        lastAction: 0
      });
    });

    // Deplasman oyuncuları
    awayPositions.forEach((pos, index) => {
      this.players.push({
        id: index + 11,
        name: `Oyuncu ${index + 12}`,
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
        team: 'away',
        position: pos.pos as any,
        role: 'player',
        targetX: pos.x,
        targetY: pos.y,
        vx: 0,
        vy: 0,
        speed: 1 + Math.random() * 0.5,
        maxSpeed: 2 + Math.random() * 1,
        acceleration: 0.3,
        deceleration: 0.8,
        color: '#F44336',
        hasBall: false,
        stamina: 100,
        skill: 70 + Math.random() * 30,
        aggression: 50 + Math.random() * 50,
        lastAction: 0
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

  // Event handler metotları
  public onMatchEvent(handler: (event: MatchEvent2D) => void): void {
    this.eventHandlers.onMatchEvent = handler;
  }

  public onScoreUpdate(handler: (homeScore: number, awayScore: number) => void): void {
    this.eventHandlers.onScoreUpdate = handler;
  }

  public onTimeUpdate(handler: (minute: number) => void): void {
    this.eventHandlers.onTimeUpdate = handler;
  }

  public onMatchEnd(handler: (result: any) => void): void {
    this.eventHandlers.onMatchEnd = handler;
  }

  private emitEvent(event: MatchEvent2D): void {
    this.gameState.events.push(event);
    if (this.eventHandlers.onMatchEvent) {
      this.eventHandlers.onMatchEvent(event);
    }
  }

  private emitScoreUpdate(): void {
    if (this.eventHandlers.onScoreUpdate) {
      this.eventHandlers.onScoreUpdate(this.gameState.score.home, this.gameState.score.away);
    }
  }

  private emitTimeUpdate(): void {
    if (this.eventHandlers.onTimeUpdate) {
      this.eventHandlers.onTimeUpdate(Math.floor(this.gameState.minute));
    }
  }

  private emitMatchEnd(): void {
    if (this.eventHandlers.onMatchEnd) {
      this.eventHandlers.onMatchEnd({
        score: this.gameState.score,
        events: this.gameState.events,
        stats: {
          homeShots: this.matchStats.homeShots,
          awayShots: this.matchStats.awayShots,
          homePossession: this.matchStats.homePossession,
          awayPossession: this.matchStats.awayPossession,
          homeCards: this.matchStats.homeCards,
          awayCards: this.matchStats.awayCards,
          homeCorners: this.matchStats.homeCorners,
          awayCorners: this.matchStats.awayCorners
        }
      });
    }
  }
  
  private updateStats(): void {
    // Hakimiyet hesapla (topun hangi yarıda daha çok durduğuna göre)
    if (this.ball.x < this.fieldWidth / 2) {
      this.matchStats.homePossession = Math.min(70, this.matchStats.homePossession + 0.1);
      this.matchStats.awayPossession = Math.max(30, this.matchStats.awayPossession - 0.1);
    } else {
      this.matchStats.awayPossession = Math.min(70, this.matchStats.awayPossession + 0.1);
      this.matchStats.homePossession = Math.max(30, this.matchStats.homePossession - 0.1);
    }
    
    // İstatistikleri normalize et
    const total = this.matchStats.homePossession + this.matchStats.awayPossession;
    this.matchStats.homePossession = Math.round((this.matchStats.homePossession / total) * 100);
    this.matchStats.awayPossession = 100 - this.matchStats.homePossession;
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
    const previousMinute = Math.floor(this.gameState.minute);
    
    // Dakika güncelle (hızlı simülasyon için)
    this.gameState.minute += 0.1 * this.gameState.speed;
    
    // Dakika değiştiğinde time update emit et
    const currentMinute = Math.floor(this.gameState.minute);
    if (currentMinute !== previousMinute) {
      this.emitTimeUpdate();
      
      // Devre arası kontrolü
      if (currentMinute === 45) {
        this.emitEvent({
          type: 'info',
          minute: 45,
          description: '⏱️ İlk yarı sona erdi - Devre arası',
          team: 'home'
        });
      } else if (currentMinute === 46) {
        this.emitEvent({
          type: 'info',
          minute: 46,
          description: '⚽ İkinci yarı başladı',
          team: 'home'
        });
      }
    }
    
    // 90 dakika sonunda bitir
    if (this.gameState.minute >= 90) {
      this.gameState.isPlaying = false;
      this.emitMatchEnd();
      return;
    }
    
    // Oyuncu hareketi
    this.updatePlayers();
    
    // Top hareketi
    this.updateBall();
    
    // Gol kontrolü
    this.checkGoals();
    
    // İstatistikleri güncelle
    this.updateStats();
    
    // Rastgele olaylar (her 50 frame'de bir kontrol et)
    if (Math.random() < 0.02) {
      this.generateRandomEvent();
    }
    
    // Otomatik gol simülasyonu (dakika başına yüksek şans)
    if (Math.random() < 0.005 * this.gameState.speed) {
      this.simulateGoal();
    }
  }

  private generateRandomEvent(): void {
    const minute = Math.floor(this.gameState.minute);
    
    // Topun pozisyonuna göre event türü belirle
    const ballInHomeHalf = this.ball.x < this.fieldWidth / 2;
    const possessingTeam = ballInHomeHalf ? 'home' : 'away';
    const defendingTeam = ballInHomeHalf ? 'away' : 'home';
    
    const events = [
      { desc: '🟨 Faul yapıldı', team: defendingTeam, type: 'card', stat: 'card' },
      { desc: '🚫 Ofsayt', team: possessingTeam, type: 'info', stat: null },
      { desc: '⚽ Şut kaçtı', team: possessingTeam, type: 'info', stat: 'shot' },
      { desc: '🥅 Kaleci kurtardı', team: defendingTeam, type: 'info', stat: 'shot' },
      { desc: '🦵 Müdahale', team: defendingTeam, type: 'info', stat: null },
      { desc: '🚩 Köşe vuruşu', team: possessingTeam, type: 'info', stat: 'corner' }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    // İstatistikleri güncelle
    if (randomEvent.stat === 'shot') {
      if (randomEvent.team === 'home') {
        this.matchStats.homeShots++;
      } else {
        this.matchStats.awayShots++;
      }
    } else if (randomEvent.stat === 'card') {
      if (randomEvent.team === 'home') {
        this.matchStats.homeCards++;
      } else {
        this.matchStats.awayCards++;
      }
    } else if (randomEvent.stat === 'corner') {
      if (randomEvent.team === 'home') {
        this.matchStats.homeCorners++;
      } else {
        this.matchStats.awayCorners++;
      }
    }
    
    this.emitEvent({
      type: randomEvent.type as any,
      minute: minute,
      description: randomEvent.desc,
      team: randomEvent.team as 'home' | 'away'
    });
  }

  private simulateGoal(): void {
    const minute = Math.floor(this.gameState.minute);
    const isHomeGoal = Math.random() < 0.5;
    
    console.log(`🥅 Gol simülasyonu! Dakika: ${minute}`);
    
    if (isHomeGoal) {
      this.gameState.score.home++;
      this.emitEvent({
        type: 'goal',
        minute: minute,
        description: `⚽ ${this.homeTeamName} gol attı!`,
        team: 'home'
      });
    } else {
      this.gameState.score.away++;
      this.emitEvent({
        type: 'goal',
        minute: minute,
        description: `⚽ ${this.awayTeamName} gol attı!`,
        team: 'away'
      });
    }
    
    // Score update'i emit et
    this.emitScoreUpdate();
    
    // Topu ortaya koy ve hareket ver
    this.ball.x = this.fieldWidth / 2;
    this.ball.y = this.fieldHeight / 2;
    this.ball.vx = (Math.random() - 0.5) * 3;
    this.ball.vy = (Math.random() - 0.5) * 3;
    
    // Oyuncuları hareket ettir
    this.animatePlayersAfterGoal();
  }

  private animatePlayersAfterGoal(): void {
    this.players.forEach(player => {
      // Gol sonrası rastgele hareket
      player.targetX += (Math.random() - 0.5) * 100;
      player.targetY += (Math.random() - 0.5) * 100;
      
      // Saha sınırları içinde tut
      player.targetX = Math.max(30, Math.min(this.fieldWidth - 30, player.targetX));
      player.targetY = Math.max(30, Math.min(this.fieldHeight - 30, player.targetY));
    });
  }

  private updatePlayers(): void {
    this.players.forEach(player => {
      // Daha aktif hareket için rastgele hedef değişimi
      if (Math.random() < 0.05) {
        if (player.team === 'home') {
          player.targetX = Math.min(player.targetX + (Math.random() - 0.5) * 120, this.fieldWidth * 0.8);
          player.targetY = player.targetY + (Math.random() - 0.5) * 80;
        } else {
          player.targetX = Math.max(player.targetX + (Math.random() - 0.5) * 120, this.fieldWidth * 0.2);
          player.targetY = player.targetY + (Math.random() - 0.5) * 80;
        }
      }
      
      // Topa yakın oyuncular daha hızlı hareket etsin
      const ballDist = Math.sqrt(
        Math.pow(this.ball.x - player.x, 2) + 
        Math.pow(this.ball.y - player.y, 2)
      );
      
      let moveSpeed = player.speed;
      
      if (ballDist < 80) {
        // Topa doğru hareket et
        player.targetX = this.ball.x + (Math.random() - 0.5) * 50;
        player.targetY = this.ball.y + (Math.random() - 0.5) * 50;
        moveSpeed = player.speed * 1.8; // Daha hızlı hareket
        
        // Topa çok yakınsa top'u it
        if (ballDist < 20 && Math.random() < 0.15) {
          const pushX = (this.ball.x - player.x) / ballDist * 4;
          const pushY = (this.ball.y - player.y) / ballDist * 4;
          this.ball.vx += pushX;
          this.ball.vy += pushY;
          
          // Top itme event'i oluştur
          const kickStrength = Math.sqrt(pushX * pushX + pushY * pushY);
          if (kickStrength > 3) {
            this.emitEvent({
              type: 'info',
              minute: Math.floor(this.gameState.minute),
              description: `⚽ ${player.name} topu sürdü`,
              team: player.team
            });
          }
          
          console.log(`🦵 Oyuncu topu itti! Hız: ${pushX.toFixed(1)}, ${pushY.toFixed(1)}`);
        }
      }
      
      // Hedefe doğru hareket
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        player.x += (dx / dist) * moveSpeed;
        player.y += (dy / dist) * moveSpeed;
      }
      
      // Saha sınırları
      player.x = Math.max(15, Math.min(this.fieldWidth - 15, player.x));
      player.y = Math.max(15, Math.min(this.fieldHeight - 15, player.y));
      
      // Sınırları aşan hedefleri düzelt
      player.targetX = Math.max(20, Math.min(this.fieldWidth - 20, player.targetX));
      player.targetY = Math.max(20, Math.min(this.fieldHeight - 20, player.targetY));
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
      
      // Kenar çizgisi event'i
      if (Math.random() < 0.3) {
        const team = this.ball.x < this.fieldWidth / 2 ? 'away' : 'home';
        this.emitEvent({
          type: 'info',
          minute: Math.floor(this.gameState.minute),
          description: '🚩 Top kenar çizgisinden çıktı',
          team: team
        });
      }
    }
    
    if (this.ball.y < 10 || this.ball.y > this.fieldHeight - 10) {
      this.ball.vy = -this.ball.vy * 0.5;
      
      // Köşe vuruşu event'i
      if (Math.random() < 0.4) {
        const team = Math.random() < 0.5 ? 'home' : 'away';
        this.emitEvent({
          type: 'info',
          minute: Math.floor(this.gameState.minute),
          description: '🚩 Köşe vuruşu',
          team: team
        });
      }
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
          this.emitEvent({
            type: 'goal',
            minute: Math.floor(this.gameState.minute),
            description: `${this.awayTeamName} gol attı!`,
            team: 'away'
          });
        } else {
          this.gameState.score.home++;
          this.emitEvent({
            type: 'goal',
            minute: Math.floor(this.gameState.minute),
            description: `${this.homeTeamName} gol attı!`,
            team: 'home'
          });
        }
        
        // Score update'i emit et
        this.emitScoreUpdate();
        
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
        this.emitEvent({
          type: 'card',
          minute: Math.floor(this.gameState.minute),
          description: 'Sarı kart!',
          team: randomTeam
        });
      } else {
        this.emitEvent({
          type: 'substitution',
          minute: Math.floor(this.gameState.minute),
          description: 'Oyuncu değişikliği',
          team: randomTeam
        });
      }
    }
    
    // Rastgele top hareketi
    if (Math.random() < 0.005 * this.gameState.speed) {
      this.ball.vx = (Math.random() - 0.5) * 4;
      this.ball.vy = (Math.random() - 0.5) * 4;
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
  
  public getCurrentStats() {
    return { ...this.matchStats };
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}