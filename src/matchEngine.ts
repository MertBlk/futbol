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
  
  // Oyun durumu
  private possession: 'home' | 'away' | null = null;
  private playerWithBall: Player2D | null = null;
  private isGoalCelebration: boolean = false;
  
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
    awayCorners: 0,
    homePasses: 0,
    awayPasses: 0
  };

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.fieldWidth = 1000;
    this.fieldHeight = 600;
    
    this.canvas.width = this.fieldWidth;
    this.canvas.height = this.fieldHeight;
    
    this.ball = {
      x: this.fieldWidth / 2,
      y: this.fieldHeight / 2,
      vx: 0,
      vy: 0,
      speed: 0
    };
    
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
    this.canvas.style.background = 'linear-gradient(45deg, #2e8b57, #3cb371)';
  }

  private setupGoals(): void {
    const goalWidth = 20;
    const goalHeight = 120;
    
    this.goals.push({
      x: 0,
      y: (this.fieldHeight - goalHeight) / 2,
      width: goalWidth,
      height: goalHeight,
      team: 'home'
    });
    
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
      { x: 80, y: this.fieldHeight / 2, pos: 'GK' },
      { x: 180, y: this.fieldHeight * 0.2, pos: 'DEF' },
      { x: 180, y: this.fieldHeight * 0.4, pos: 'DEF' },
      { x: 180, y: this.fieldHeight * 0.6, pos: 'DEF' },
      { x: 180, y: this.fieldHeight * 0.8, pos: 'DEF' },
      { x: 320, y: this.fieldHeight * 0.25, pos: 'MID' },
      { x: 320, y: this.fieldHeight * 0.45, pos: 'MID' },
      { x: 320, y: this.fieldHeight * 0.55, pos: 'MID' },
      { x: 320, y: this.fieldHeight * 0.75, pos: 'MID' },
      { x: 450, y: this.fieldHeight * 0.4, pos: 'FWD' },
      { x: 450, y: this.fieldHeight * 0.6, pos: 'FWD' }
    ];

    // Deplasman takımı (kırmızı)
    const awayPositions = [
      { x: this.fieldWidth - 80, y: this.fieldHeight / 2, pos: 'GK' },
      { x: this.fieldWidth - 180, y: this.fieldHeight * 0.2, pos: 'DEF' },
      { x: this.fieldWidth - 180, y: this.fieldHeight * 0.4, pos: 'DEF' },
      { x: this.fieldWidth - 180, y: this.fieldHeight * 0.6, pos: 'DEF' },
      { x: this.fieldWidth - 180, y: this.fieldHeight * 0.8, pos: 'DEF' },
      { x: this.fieldWidth - 320, y: this.fieldHeight * 0.25, pos: 'MID' },
      { x: this.fieldWidth - 320, y: this.fieldHeight * 0.45, pos: 'MID' },
      { x: this.fieldWidth - 320, y: this.fieldHeight * 0.55, pos: 'MID' },
      { x: this.fieldWidth - 320, y: this.fieldHeight * 0.75, pos: 'MID' },
      { x: this.fieldWidth - 450, y: this.fieldHeight * 0.4, pos: 'FWD' },
      { x: this.fieldWidth - 450, y: this.fieldHeight * 0.6, pos: 'FWD' }
    ];

    homePositions.forEach((pos, index) => {
      this.players.push({
        id: index,
        name: `${this.homeTeamName} ${index + 1}`,
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
        speed: pos.pos === 'GK' ? 1.2 : (1.5 + Math.random() * 0.8),
        maxSpeed: pos.pos === 'GK' ? 2 : (2.5 + Math.random() * 1.5),
        acceleration: 0.3,
        deceleration: 0.8,
        color: '#2196F3',
        hasBall: false,
        stamina: 100,
        skill: 65 + Math.random() * 30,
        aggression: 40 + Math.random() * 40,
        lastAction: 0
      });
    });

    awayPositions.forEach((pos, index) => {
      this.players.push({
        id: index + 11,
        name: `${this.awayTeamName} ${index + 1}`,
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
        speed: pos.pos === 'GK' ? 1.2 : (1.5 + Math.random() * 0.8),
        maxSpeed: pos.pos === 'GK' ? 2 : (2.5 + Math.random() * 1.5),
        acceleration: 0.3,
        deceleration: 0.8,
        color: '#F44336',
        hasBall: false,
        stamina: 100,
        skill: 65 + Math.random() * 30,
        aggression: 40 + Math.random() * 40,
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
    
    this.resetBallToCenter();
    this.possession = null;
    this.playerWithBall = null;
  }

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
        stats: this.matchStats
      });
    }
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
    
    if (!this.gameState.isPaused && deltaTime > 16) {
      this.update();
    }
    
    this.render();
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private update(): void {
    if (this.isGoalCelebration) return;
    
    const previousMinute = Math.floor(this.gameState.minute);
    this.gameState.minute += 0.05 * this.gameState.speed;
    
    const currentMinute = Math.floor(this.gameState.minute);
    if (currentMinute !== previousMinute) {
      this.emitTimeUpdate();
      
      if (currentMinute === 45) {
        this.emitEvent({
          type: 'info',
          minute: 45,
          description: '⏱️ İlk yarı sona erdi',
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
    
    if (this.gameState.minute >= 90) {
      this.gameState.isPlaying = false;
      this.emitMatchEnd();
      return;
    }
    
    this.updatePossession();
    this.updatePlayers();
    this.updateBall();
    this.checkGoals();
    this.updateStats();
    
    // Rastgele olaylar
    if (Math.random() < 0.008) {
      this.generateRandomEvent();
    }
  }

  private updatePossession(): void {
    // En yakın oyuncuyu bul
    let closestPlayer: Player2D | null = null;
    let closestDist = Infinity;
    
    this.players.forEach(player => {
      const dist = this.getDistance(player, this.ball);
      if (dist < closestDist) {
        closestDist = dist;
        closestPlayer = player;
      }
    });
    
    // Top kontrolü - oyuncu topun 25 piksel yakınındaysa
    if (closestPlayer && closestDist < 25) {
      const player = closestPlayer as Player2D; // Type assertion
      
      if (this.playerWithBall !== player) {
        // Top el değiştirdi
        if (this.playerWithBall && this.playerWithBall.team !== player.team) {
          // Top çalındı
          if (Math.random() < 0.15) {
            this.emitEvent({
              type: 'info',
              minute: Math.floor(this.gameState.minute),
              description: `🦵 ${player.name} topu çaldı!`,
              team: player.team
            });
          }
        }
        
        this.playerWithBall = player;
        this.possession = player.team;
        
        // Topu oyuncuya yapıştır
        this.ball.x = player.x;
        this.ball.y = player.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
      }
    } else if (closestDist > 40) {
      // Top serbest
      this.playerWithBall = null;
    }
  }

  private updatePlayers(): void {
    this.players.forEach(player => {
      // Topla oynayan oyuncu
      if (this.playerWithBall === player) {
        // Karar verme süreci - daha gerçekçi
        const distanceToGoal = this.getDistanceToGoal(player);
        const nearbyOpponents = this.getNearbyOpponents(player, 50);
        const nearbyTeammates = this.getNearbyTeammates(player, 80);
        
        // Şut mesafesinde mi?
        // Daha akıllı oyuncu davranışı
        this.updatePlayerWithBall(player, nearbyOpponents, nearbyTeammates, distanceToGoal);
      } else {
        // Diğer oyuncular - pozisyona göre akıllı hareket
        this.updatePlayerMovement(player);
      }
      
      // Hareket - pozisyona göre hız ayarlaması
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        let moveSpeed = player.speed;
        
        // Topa sahip oyuncu daha yavaş hareket eder
        if (player === this.playerWithBall) {
          moveSpeed *= 0.8;
        }
        // Pozisyonunu korurken de aktif hareket et
        else if (!this.shouldPlayerChaseBall(player, this.getDistance(player, this.ball), this.possession)) {
          moveSpeed *= 0.6; // Pozisyonsal hareket daha hızlı
        }
        // Topa koşarken en hızlı
        else {
          moveSpeed *= 1.0; // Tam hız
        }
        
        player.x += (dx / dist) * moveSpeed;
        player.y += (dy / dist) * moveSpeed;
      }
      
      // Sınırlar
      player.x = Math.max(25, Math.min(this.fieldWidth - 25, player.x));
      player.y = Math.max(25, Math.min(this.fieldHeight - 25, player.y));
    });
  }

  private updateBall(): void {
    if (this.playerWithBall) {
      // Top oyuncuda - daha gerçekçi top kontrolü
      const offsetX = Math.cos(this.gameState.minute * 0.1) * 2;
      const offsetY = Math.sin(this.gameState.minute * 0.1) * 2;
      
      this.ball.x = this.playerWithBall.x + offsetX;
      this.ball.y = this.playerWithBall.y + offsetY;
      this.ball.vx = 0;
      this.ball.vy = 0;
    } else {
      // Serbest top - gelişmiş fizik
      const friction = 0.94; // Çim sürtünmesi
      this.ball.vx *= friction;
      this.ball.vy *= friction;
      
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      
      // Saha sınırları - daha gerçekçi sekme
      const bounceReduction = 0.6;
      
      if (this.ball.x < 15 || this.ball.x > this.fieldWidth - 15) {
        this.ball.vx *= -bounceReduction;
        this.ball.x = Math.max(15, Math.min(this.fieldWidth - 15, this.ball.x));
        
        // Taç atışı olayı
        if (Math.random() < 0.05 && Math.abs(this.ball.vx) > 1) {
          this.emitEvent({
            type: 'info',
            minute: Math.floor(this.gameState.minute),
            description: '🚩 Taç atışı',
            team: Math.random() < 0.5 ? 'home' : 'away'
          });
        }
      }
      
      if (this.ball.y < 15 || this.ball.y > this.fieldHeight - 15) {
        this.ball.vy *= -bounceReduction;
        this.ball.y = Math.max(15, Math.min(this.fieldHeight - 15, this.ball.y));
        
        // Köşe/Kale vuruşu olayı
        if (Math.random() < 0.04 && Math.abs(this.ball.vy) > 1) {
          const event = Math.random() < 0.6 ? 'Köşe vuruşu' : 'Kale vuruşu';
          this.emitEvent({
            type: 'info',
            minute: Math.floor(this.gameState.minute),
            description: `🚩 ${event}`,
            team: Math.random() < 0.5 ? 'home' : 'away'
          });
        }
      }
      
      // Top durma kontrolü
      const minSpeed = 0.2;
      if (Math.abs(this.ball.vx) < minSpeed && Math.abs(this.ball.vy) < minSpeed) {
        this.ball.vx = 0;
        this.ball.vy = 0;
      }
      
      // Maksimum hız limiti
      const maxSpeed = 18;
      const currentSpeed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
      if (currentSpeed > maxSpeed) {
        this.ball.vx = (this.ball.vx / currentSpeed) * maxSpeed;
        this.ball.vy = (this.ball.vy / currentSpeed) * maxSpeed;
      }
    }
  }

  private attemptPass(passer: Player2D): void {
    const teammates = this.players.filter(p => 
      p.team === passer.team && p !== passer
    );
    
    if (teammates.length === 0) return;
    
    // En iyi pas hedefini bul - daha akıllı seçim
    const bestTarget = this.findBestPassTarget(passer, teammates);
    if (!bestTarget) return;
    
    const dist = this.getDistance(passer, bestTarget);
    const power = Math.max(3, Math.min(dist / 15, 12)); // Daha gerçekçi pas gücü
    
    // Pas hassasiyeti ekle
    const accuracy = passer.skill / 100;
    const errorFactor = (1 - accuracy) * 20;
    
    const dx = bestTarget.x - this.ball.x + (Math.random() - 0.5) * errorFactor;
    const dy = bestTarget.y - this.ball.y + (Math.random() - 0.5) * errorFactor;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len > 0) {
      this.ball.vx = (dx / len) * power;
      this.ball.vy = (dy / len) * power;
      this.playerWithBall = null;
      
      // İstatistikleri güncelle
      if (passer.team === 'home') {
        this.matchStats.homePasses++;
      } else {
        this.matchStats.awayPasses++;
      }
      
      // Pas olayını kaydet
      if (Math.random() < 0.3) {
        this.emitEvent({
          type: 'info',
          minute: Math.floor(this.gameState.minute),
          description: `⚽ ${passer.name} pas attı`,
          team: passer.team
        });
      }
    }
  }

  private findBestPassTarget(passer: Player2D, teammates: Player2D[]): Player2D | null {
    let bestTarget: Player2D | null = null;
    let bestScore = -1;
    
    teammates.forEach(teammate => {
      const distance = this.getDistance(passer, teammate);
      const opponentsInPath = this.getOpponentsInPassPath(passer, teammate);
      
      // Pas skorunu hesapla
      let score = 100;
      score -= distance * 0.5; // Uzaklık maliyeti
      score -= opponentsInPath.length * 30; // Rakip maliyeti
      score += teammate.skill * 0.3; // Oyuncu kalitesi
      
      // Kaleye yakın oyuncular daha değerli
      const goalDistance = this.getDistanceToGoal(teammate);
      score += (400 - goalDistance) * 0.1;
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = teammate;
      }
    });
    
    return bestTarget;
  }

  private getOpponentsInPassPath(passer: Player2D, target: Player2D): Player2D[] {
    const opponents = this.players.filter(p => p.team !== passer.team);
    const passPath = opponents.filter(opponent => {
      const distToLine = this.getDistanceToLine(passer, target, opponent);
      return distToLine < 25; // Pas yolunda 25 piksel yakınındaki rakipler
    });
    
    return passPath;
  }

  private getDistanceToLine(point1: Player2D, point2: Player2D, point: Player2D): number {
    const A = point.x - point1.x;
    const B = point.y - point1.y;
    const C = point2.x - point1.x;
    const D = point2.y - point1.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return this.getDistance(point, point1);
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));
    
    const xx = point1.x + param * C;
    const yy = point1.y + param * D;
    
    return this.getDistance(point, { x: xx, y: yy });
  }

  private attemptShot(shooter: Player2D): void {
    const targetGoal = this.goals.find(g => g.team !== shooter.team)!;
    const distance = this.getDistanceToGoal(shooter);
    
    // Şut hassasiyeti - mesafe ve oyuncu becerisine bağlı
    const accuracy = (shooter.skill / 100) * (1 - Math.min(distance / 300, 0.8));
    const pressure = this.calculatePressure(shooter, this.getNearbyOpponents(shooter, 40));
    
    // Hedef nokta hesaplaması
    const goalCenterX = targetGoal.x + targetGoal.width / 2;
    const goalCenterY = targetGoal.y + targetGoal.height / 2;
    
    // Hassasiyet hatası
    const maxError = (1 - accuracy + pressure) * 60;
    const errorX = (Math.random() - 0.5) * maxError;
    const errorY = (Math.random() - 0.5) * maxError;
    
    const targetX = goalCenterX + errorX;
    const targetY = goalCenterY + errorY;
    
    const dx = targetX - this.ball.x;
    const dy = targetY - this.ball.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    // Şut gücü - mesafeye ve oyuncu becerisine bağlı
    const basePower = Math.min(12 + distance / 30, 20);
    const powerVariation = shooter.skill / 100 * 4;
    const power = basePower + (Math.random() - 0.5) * powerVariation;
    
    if (len > 0) {
      this.ball.vx = (dx / len) * power;
      this.ball.vy = (dy / len) * power;
    }
    
    this.playerWithBall = null;
    
    // İstatistikler
    if (shooter.team === 'home') {
      this.matchStats.homeShots++;
    } else {
      this.matchStats.awayShots++;
    }
    
    // Şut kalitesine göre farklı mesajlar
    const shotQuality = accuracy > 0.7 ? 'güçlü' : accuracy > 0.4 ? 'orta' : 'zayıf';
    
    this.emitEvent({
      type: 'info',
      minute: Math.floor(this.gameState.minute),
      description: `⚽ ${shooter.name} ${shotQuality} bir şut çekti! (${Math.round(distance)}m)`,
      team: shooter.team
    });
  }

  private checkGoals(): void {
    this.goals.forEach(goal => {
      // Top kale alanında mı kontrol et (Y ekseninde)
      const ballInGoalHeight = this.ball.y >= goal.y && this.ball.y <= goal.y + goal.height;
      if (!ballInGoalHeight) return;
      
      // Topun minimum hızla hareket etmesi gerekiyor (gerçekçi gol için)
      const ballSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
      if (ballSpeed < 2.0) return;
      
      let goalScored = false;
      let scoringTeam: 'home' | 'away' = 'home';
      
      if (goal.team === 'home') {
        // Sol kale - top tamamen kale çizgisini geçmeli ve sola doğru hareket etmeli
        if (this.ball.x <= goal.x + goal.width && this.ball.vx < -1.0) {
          goalScored = true;
          scoringTeam = 'away';
        }
      } else {
        // Sağ kale - top tamamen kale çizgisini geçmeli ve sağa doğru hareket etmeli  
        if (this.ball.x >= goal.x && this.ball.vx > 1.0) {
          goalScored = true;
          scoringTeam = 'home';
        }
      }
      
      if (goalScored) {
        console.log(`🥅 GOL! Top pozisyonu: (${this.ball.x.toFixed(1)}, ${this.ball.y.toFixed(1)}), Hız: (${this.ball.vx.toFixed(1)}, ${this.ball.vy.toFixed(1)})`);
        
        if (scoringTeam === 'home') {
          this.gameState.score.home++;
        } else {
          this.gameState.score.away++;
        }
        
        const teamName = scoringTeam === 'home' ? this.homeTeamName : this.awayTeamName;
        this.emitEvent({
          type: 'goal',
          minute: Math.floor(this.gameState.minute),
          description: `⚽ GOOOL! ${teamName} gol attı!`,
          team: scoringTeam
        });
        
        this.emitScoreUpdate();
        this.celebrateGoalAndKickoff();
      }
    });
  }

  private celebrateGoalAndKickoff(): void {
    this.isGoalCelebration = true;
    this.playerWithBall = null;
    
    // Oyunu durdur ve gol kutlaması yap
    this.gameState.isPaused = true;
    
    this.emitEvent({
      type: 'info',
      minute: Math.floor(this.gameState.minute),
      description: '🎉 Gol kutlaması! Santra için hazırlanılıyor...',
      team: 'home'
    });
    
    // 3 saniye sonra santra yap
    setTimeout(() => {
      this.prepareKickoff();
      this.isGoalCelebration = false;
      this.gameState.isPaused = false;
      
      this.emitEvent({
        type: 'info',
        minute: Math.floor(this.gameState.minute),
        description: '⚽ Santra! Oyun devam ediyor...',
        team: 'home'
      });
    }, 3000);
  }

  private prepareKickoff(): void {
    // Topu saha ortasına koy
    this.ball.x = this.fieldWidth / 2;
    this.ball.y = this.fieldHeight / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    
    // Oyuncuları başlangıç pozisyonlarına döndür
    this.players.forEach(player => {
      // Ana pozisyonlara dön ama biraz varyasyon ekle
      const variation = 15;
      player.x = player.baseX + (Math.random() - 0.5) * variation;
      player.y = player.baseY + (Math.random() - 0.5) * variation;
      player.targetX = player.x;
      player.targetY = player.y;
      player.hasBall = false;
    });
    
    this.playerWithBall = null;
    this.possession = null;
  }

  private resetBallToCenter(): void {
    this.ball.x = this.fieldWidth / 2;
    this.ball.y = this.fieldHeight / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    
    this.players.forEach(player => {
      player.x = player.baseX;
      player.y = player.baseY;
      player.targetX = player.baseX;
      player.targetY = player.baseY;
      player.hasBall = false;
    });
    
    this.playerWithBall = null;
    this.possession = null;
  }

  private generateRandomEvent(): void {
    const minute = Math.floor(this.gameState.minute);
    const team = Math.random() < 0.5 ? 'home' : 'away';
    
    const events = [
      { desc: '🟨 Sarı kart!', type: 'card' },
      { desc: '🚫 Ofsayt', type: 'info' },
      { desc: '🚩 Korner', type: 'info' }
    ];
    
    const evt = events[Math.floor(Math.random() * events.length)];
    
    this.emitEvent({
      type: evt.type as any,
      minute: minute,
      description: evt.desc,
      team: team
    });
  }

  private updateStats(): void {
    if (this.ball.x < this.fieldWidth / 2) {
      this.matchStats.homePossession = Math.min(75, this.matchStats.homePossession + 0.05);
      this.matchStats.awayPossession = Math.max(25, 100 - this.matchStats.homePossession);
    } else {
      this.matchStats.awayPossession = Math.min(75, this.matchStats.awayPossession + 0.05);
      this.matchStats.homePossession = 100 - this.matchStats.awayPossession;
    }
    
    this.matchStats.homePossession = Math.round(this.matchStats.homePossession);
    this.matchStats.awayPossession = Math.round(this.matchStats.awayPossession);
  }

  private getDistance(obj1: { x: number; y: number }, obj2: { x: number; y: number }): number {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getDistanceToGoal(player: Player2D): number {
    const targetGoal = this.goals.find(g => g.team !== player.team)!;
    const goalCenterX = targetGoal.x + (targetGoal.width / 2);
    const goalCenterY = targetGoal.y + (targetGoal.height / 2);
    return this.getDistance(player, { x: goalCenterX, y: goalCenterY });
  }

  private getNearbyOpponents(player: Player2D, radius: number): Player2D[] {
    return this.players.filter(p => 
      p.team !== player.team && 
      this.getDistance(player, p) < radius
    );
  }

  private getNearbyTeammates(player: Player2D, radius: number): Player2D[] {
    return this.players.filter(p => 
      p.team === player.team && 
      p !== player && 
      this.getDistance(player, p) < radius
    );
  }

  private hasShootingAngle(player: Player2D): boolean {
    const targetGoal = this.goals.find(g => g.team !== player.team)!;
    const goalTop = { x: targetGoal.x + targetGoal.width/2, y: targetGoal.y };
    const goalBottom = { x: targetGoal.x + targetGoal.width/2, y: targetGoal.y + targetGoal.height };
    
    // Basit açı kontrolü - rakip oyuncular şut çizgisini kesiyor mu?
    const opponents = this.getNearbyOpponents(player, 100);
    return opponents.length < 2; // Çok basit açı kontrolü
  }

  private dribbleBall(player: Player2D, nearbyOpponents: Player2D[]): void {
    const targetGoal = this.goals.find(g => g.team !== player.team)!;
    
    if (nearbyOpponents.length > 0) {
      // Rakiplerden kaçınarak hareket et
      const avgOpponentX = nearbyOpponents.reduce((sum, opp) => sum + opp.x, 0) / nearbyOpponents.length;
      const avgOpponentY = nearbyOpponents.reduce((sum, opp) => sum + opp.y, 0) / nearbyOpponents.length;
      
      // Rakiplerden uzaklaş ama kaleye doğru git
      const avoidX = player.x - avgOpponentX;
      const avoidY = player.y - avgOpponentY;
      const goalX = (targetGoal.x + targetGoal.width/2) - player.x;
      const goalY = (targetGoal.y + targetGoal.height/2) - player.y;
      
      player.targetX = player.x + (avoidX * 0.3 + goalX * 0.7) * 0.1;
      player.targetY = player.y + (avoidY * 0.3 + goalY * 0.7) * 0.1;
    } else {
      // Serbest hareket - kaleye doğru sür
      const goalDirection = player.team === 'home' ? 1 : -1;
      player.targetX = player.x + goalDirection * (15 + Math.random() * 10);
      player.targetY = player.y + (Math.random() - 0.5) * 30;
    }
    
    // Sınırları kontrol et
    player.targetX = Math.max(30, Math.min(this.fieldWidth - 30, player.targetX));
    player.targetY = Math.max(30, Math.min(this.fieldHeight - 30, player.targetY));
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.fieldWidth, this.fieldHeight);
    
    this.drawField();
    this.drawGoals();
    this.drawPlayers();
    this.drawBall();
    this.drawUI();
  }

  private drawField(): void {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    
    this.ctx.strokeRect(10, 10, this.fieldWidth - 20, this.fieldHeight - 20);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.fieldWidth / 2, 10);
    this.ctx.lineTo(this.fieldWidth / 2, this.fieldHeight - 10);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(this.fieldWidth / 2, this.fieldHeight / 2, 50, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawGoals(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    
    this.goals.forEach(goal => {
      this.ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
      this.ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);
    });
  }

  private drawPlayers(): void {
    this.players.forEach(player => {
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (player === this.playerWithBall) {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText((player.id % 11 + 1).toString(), player.x, player.y + 4);
    });
  }

  private drawBall(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawUI(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${this.homeTeamName} ${this.gameState.score.home} - ${this.gameState.score.away} ${this.awayTeamName}`,
      this.fieldWidth / 2,
      35
    );
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText(
      `${Math.floor(this.gameState.minute)}'`,
      this.fieldWidth / 2,
      this.fieldHeight - 20
    );
  }

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

  private updatePlayerWithBall(player: Player2D, nearbyOpponents: Player2D[], nearbyTeammates: Player2D[], distanceToGoal: number): void {
    // Baskı seviyesini hesapla
    const pressureLevel = this.calculatePressure(player, nearbyOpponents);
    
    // Karar verme süreci - daha akıllı
    if (distanceToGoal < 100 && this.hasShootingAngle(player) && pressureLevel < 0.7) {
      // Şut atma şansı
      const shootChance = (player.skill / 100) * (1 - pressureLevel) * 0.6;
      if (Math.random() < shootChance) {
        this.attemptShot(player);
        return;
      }
    }
    
    // Pas atma koşulları
    if (pressureLevel > 0.5 || (nearbyTeammates.length > 0 && Math.random() < 0.4)) {
      this.attemptPass(player);
    } else if (pressureLevel < 0.3 && distanceToGoal > 80) {
      // Güvenli şekilde top sür
      this.dribbleBall(player, nearbyOpponents);
    } else {
      // Kısa pas veya top sürme
      if (Math.random() < 0.6) {
        this.attemptPass(player);
      } else {
        this.dribbleBall(player, nearbyOpponents);
      }
    }
  }

  private calculatePressure(player: Player2D, opponents: Player2D[]): number {
    if (opponents.length === 0) return 0;
    
    let pressure = 0;
    opponents.forEach(opponent => {
      const distance = this.getDistance(player, opponent);
      const opponentSkill = opponent.skill / 100;
      
      // Yakın rakipler daha fazla baskı yapar
      if (distance < 30) {
        pressure += (1 - distance / 30) * opponentSkill;
      }
    });
    
    return Math.min(1, pressure);
  }

  private getGoalDirection(player: Player2D): { x: number, y: number } {
    const targetGoal = this.goals.find(g => g.team !== player.team)!;
    const goalCenterX = targetGoal.x + (targetGoal.width / 2);
    const goalCenterY = targetGoal.y + (targetGoal.height / 2);
    
    const dx = goalCenterX - player.x;
    const dy = goalCenterY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 };
  }

  private updatePlayerMovement(player: Player2D): void {
    const ballDist = this.getDistance(player, this.ball);
    const ballPossession = this.possession;
    const distanceFromBase = this.getDistance(player, { x: player.baseX, y: player.baseY });
    
    // Pozisyona göre davranış belirle
    const shouldChaseBall = this.shouldPlayerChaseBall(player, ballDist, ballPossession);
    
    if (shouldChaseBall) {
      // Akıllı şekilde topa yaklaş
      this.moveTowardsBall(player);
    } else {
      // Pozisyonunu koru veya taktiksel hareket et
      this.maintainPosition(player, distanceFromBase);
    }
  }

  private shouldPlayerChaseBall(player: Player2D, ballDistance: number, possession: 'home' | 'away' | null): boolean {
    // Kaleci sadece penalty alanında aktif
    if (player.position === 'GK') {
      const penaltyAreaLimit = player.team === 'home' ? 150 : this.fieldWidth - 150;
      const inPenaltyArea = player.team === 'home' ? this.ball.x < penaltyAreaLimit : this.ball.x > penaltyAreaLimit;
      return ballDistance < 120 && inPenaltyArea;
    }
    
    // Savunma oyuncuları - daha aktif
    if (player.position === 'DEF') {
      // Kendi takımının topsa destek ol, rakipse savun
      if (possession === player.team) {
        return ballDistance < 80; // Daha az mesafede destek
      } else {
        // Rakip topa sahipse daha agresif
        const ownHalf = player.team === 'home' ? this.ball.x < this.fieldWidth * 0.7 : this.ball.x > this.fieldWidth * 0.3;
        return ballDistance < 150 && ownHalf;
      }
    }
    
    // Orta saha oyuncuları - çok daha aktif
    if (player.position === 'MID') {
      if (possession === player.team) {
        // Kendi takımının topsa pas seçeneği sun
        return ballDistance < 200;
      } else {
        // Rakip topa sahipse basınç yap
        return ballDistance < 180;
      }
    }
    
    // Forvet oyuncuları - en aktif ve dinamik
    if (player.position === 'FWD') {
      if (possession === player.team) {
        // Kendi takımının topsa pozisyon al
        return ballDistance < 250;
      } else {
        // Rakip topa sahipse üst pressing
        const pressZone = player.team === 'home' ? this.ball.x > this.fieldWidth * 0.3 : this.ball.x < this.fieldWidth * 0.7;
        return ballDistance < 200 && pressZone;
      }
    }
    
    return false;
  }

  private moveTowardsBall(player: Player2D): void {
    // Topa doğru daha akıllı hareket et
    const dx = this.ball.x - player.x;
    const dy = this.ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      // Top hareket halindeyse öngörülü pozisyon al
      let predictedBallX = this.ball.x + this.ball.vx * 8;
      let predictedBallY = this.ball.y + this.ball.vy * 8;
      
      // Eğer top duruyorsa direkt git
      if (Math.abs(this.ball.vx) < 0.5 && Math.abs(this.ball.vy) < 0.5) {
        predictedBallX = this.ball.x;
        predictedBallY = this.ball.y;
      }
      
      // Pozisyona göre farklı yaklaşım açıları
      if (player.position === 'DEF') {
        // Defans oyuncuları daha dikkatli yaklaşır  
        player.targetX = predictedBallX + (player.x - predictedBallX) * 0.3;
        player.targetY = predictedBallY + (player.y - predictedBallY) * 0.3;
      } else {
        // Diğer oyuncular daha agresif
        player.targetX = predictedBallX;
        player.targetY = predictedBallY;
      }
    }
  }

  private maintainPosition(player: Player2D, distanceFromBase: number): void {
    // Taktiksel pozisyon alma
    this.makePositionalMovement(player);
    
    // Eğer pozisyonundan çok uzaksa, geri dön
    if (distanceFromBase > 120) {
      player.targetX = player.baseX + (Math.random() - 0.5) * 60;
      player.targetY = player.baseY + (Math.random() - 0.5) * 40;
    } else {
      // Takım arkadaşlarıyla çakışmayı önle
      this.avoidTeammateCollision(player);
    }
  }

  private makePositionalMovement(player: Player2D): void {
    const ballPosition = this.ball;
    const variation = 40;
    const shouldMove = Math.random() < 0.25; // %25 şans ile hareket et
    
    if (!shouldMove) return;
    
    // Pozisyona göre farklı hareketler
    if (player.position === 'DEF') {
      // Defans: Topa göre yan hareket
      if (this.possession === player.team) {
        // Kendi takımın topsa, destek pozisyonu al
        player.targetX = player.baseX + (ballPosition.x - this.fieldWidth/2) * 0.3;
        player.targetY = player.baseY + (Math.random() - 0.5) * variation;
      } else {
        // Rakip topsa, kapama pozisyonu
        const goalDirection = player.team === 'home' ? -20 : 20;
        player.targetX = player.baseX + goalDirection;
        player.targetY = player.baseY + (ballPosition.y - this.fieldHeight/2) * 0.2;
      }
    }
    
    else if (player.position === 'MID') {
      // Orta saha: Çok dinamik hareket
      if (this.possession === player.team) {
        // Pas seçeneği sun
        const supportDirection = Math.random() < 0.5 ? 1 : -1;
        player.targetX = player.baseX + supportDirection * 30;
        player.targetY = player.baseY + (Math.random() - 0.5) * 50;
      } else {
        // Rakip topsa, baskı yap
        player.targetX = player.baseX + (ballPosition.x - player.x) * 0.1;
        player.targetY = player.baseY + (ballPosition.y - player.y) * 0.1;
      }
    }
    
    else if (player.position === 'FWD') {
      // Forvet: En dinamik hareket
      if (this.possession === player.team) {
        // Boş alan ara
        const runDirection = Math.random() < 0.5 ? 1 : -1;
        const goalDirection = player.team === 'home' ? 30 : -30;
        player.targetX = player.baseX + goalDirection + runDirection * 40;
        player.targetY = player.baseY + (Math.random() - 0.5) * 60;
      } else {
        // Pressing yap
        const goalDirection = player.team === 'home' ? -15 : 15;
        player.targetX = player.baseX + goalDirection;
        player.targetY = player.baseY + (Math.random() - 0.5) * 30;
      }
    }
    
    // Saha sınırları kontrolü
    player.targetX = Math.max(30, Math.min(this.fieldWidth - 30, player.targetX));
    player.targetY = Math.max(30, Math.min(this.fieldHeight - 30, player.targetY));
  }

  private avoidTeammateCollision(player: Player2D): void {
    const nearbyTeammates = this.players.filter(p => 
      p.team === player.team && 
      p !== player && 
      this.getDistance(player, p) < 25
    );
    
    if (nearbyTeammates.length > 0) {
      // En yakın takım arkadaşından kaç
      const closest = nearbyTeammates.reduce((prev, curr) => 
        this.getDistance(player, curr) < this.getDistance(player, prev) ? curr : prev
      );
      
      const dx = player.x - closest.x;
      const dy = player.y - closest.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        player.targetX = player.x + (dx / distance) * 15;
        player.targetY = player.y + (dy / distance) * 15;
      }
    }
  }
}