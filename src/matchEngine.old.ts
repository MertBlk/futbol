import { Player2D, Ball, Goal, MatchEvent2D, GameState, PlayerType } from './canvasTypes.js';

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
  
  private assignPlayerType(position: 'GK' | 'DEF' | 'MID' | 'FWD', index: number): import('./canvasTypes.js').PlayerType {
    // Pozisyona göre rastgele ama dengeli tip atama
    if (position === 'GK') {
      return Math.random() < 0.7 ? 'traditional-gk' : 'sweeper-keeper';
    }
    
    if (position === 'DEF') {
      const rand = Math.random();
      if (rand < 0.35) return 'ball-playing-def';
      if (rand < 0.65) return 'stopper';
      return 'covering-def';
    }
    
    if (position === 'MID') {
      const rand = Math.random();
      if (rand < 0.3) return 'box-to-box';
      if (rand < 0.5) return 'playmaker';
      if (rand < 0.75) return 'defensive-mid';
      return 'attacking-mid';
    }
    
    if (position === 'FWD') {
      const rand = Math.random();
      if (rand < 0.3) return 'target-man';
      if (rand < 0.6) return 'poacher';
      if (rand < 0.8) return 'false-nine';
      return 'winger';
    }
    
    return 'traditional-gk';
  }
  
  private getPlayerAttributes(playerType: import('./canvasTypes.js').PlayerType) {
    const base = {
      speed: 1.5 + Math.random() * 0.5,
      maxSpeed: 2.5 + Math.random() * 1,
      skill: 65 + Math.random() * 20,
      aggression: 50 + Math.random() * 30,
      passing: 60 + Math.random() * 25,
      shooting: 55 + Math.random() * 25,
      positioning: 60 + Math.random() * 25,
      workRate: 60 + Math.random() * 25
    };
    
    // Tip bazlı özelleştirmeler
    switch (playerType) {
      case 'sweeper-keeper':
        return { ...base, speed: 1.3, maxSpeed: 2.2, passing: 75 + Math.random() * 15, positioning: 80 + Math.random() * 15 };
      
      case 'traditional-gk':
        return { ...base, speed: 1.0, maxSpeed: 1.8, positioning: 85 + Math.random() * 10, aggression: 40 + Math.random() * 20 };
      
      case 'ball-playing-def':
        return { ...base, passing: 75 + Math.random() * 20, skill: 70 + Math.random() * 20, aggression: 45 + Math.random() * 25 };
      
      case 'stopper':
        return { ...base, aggression: 75 + Math.random() * 20, speed: 1.7 + Math.random() * 0.6, workRate: 75 + Math.random() * 20 };
      
      case 'covering-def':
        return { ...base, positioning: 80 + Math.random() * 15, aggression: 40 + Math.random() * 20, speed: 1.4 + Math.random() * 0.4 };
      
      case 'box-to-box':
        return { ...base, workRate: 85 + Math.random() * 12, speed: 1.8 + Math.random() * 0.7, stamina: 90 };
      
      case 'playmaker':
        return { ...base, passing: 85 + Math.random() * 12, skill: 80 + Math.random() * 15, speed: 1.4 + Math.random() * 0.4 };
      
      case 'defensive-mid':
        return { ...base, positioning: 75 + Math.random() * 20, aggression: 70 + Math.random() * 20, passing: 70 + Math.random() * 20 };
      
      case 'attacking-mid':
        return { ...base, shooting: 75 + Math.random() * 20, passing: 75 + Math.random() * 20, skill: 75 + Math.random() * 20 };
      
      case 'target-man':
        return { ...base, shooting: 80 + Math.random() * 15, positioning: 80 + Math.random() * 15, speed: 1.3 + Math.random() * 0.4 };
      
      case 'poacher':
        return { ...base, shooting: 85 + Math.random() * 12, positioning: 90 + Math.random() * 8, speed: 1.6 + Math.random() * 0.6 };
      
      case 'false-nine':
        return { ...base, passing: 80 + Math.random() * 15, skill: 80 + Math.random() * 15, shooting: 70 + Math.random() * 20 };
      
      case 'winger':
        return { ...base, speed: 2.0 + Math.random() * 0.8, maxSpeed: 3.5 + Math.random() * 1, skill: 75 + Math.random() * 20 };
      
      default:
        return base;
    }
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
      const playerType = this.assignPlayerType(pos.pos as any, index);
      const attributes = this.getPlayerAttributes(playerType);
      
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
        playerType: playerType,
        targetX: pos.x,
        targetY: pos.y,
        vx: 0,
        vy: 0,
        speed: attributes.speed,
        maxSpeed: attributes.maxSpeed,
        acceleration: 0.3,
        deceleration: 0.8,
        color: '#2196F3',
        hasBall: false,
        stamina: 100,
        skill: attributes.skill,
        aggression: attributes.aggression,
        passing: attributes.passing,
        shooting: attributes.shooting,
        positioning: attributes.positioning,
        workRate: attributes.workRate,
        lastAction: 0
      });
    });

    awayPositions.forEach((pos, index) => {
      const playerType = this.assignPlayerType(pos.pos as any, index);
      const attributes = this.getPlayerAttributes(playerType);
      
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
        playerType: playerType,
        targetX: pos.x,
        targetY: pos.y,
        vx: 0,
        vy: 0,
        speed: attributes.speed,
        maxSpeed: attributes.maxSpeed,
        acceleration: 0.3,
        deceleration: 0.8,
        color: '#F44336',
        hasBall: false,
        stamina: 100,
        skill: attributes.skill,
        aggression: attributes.aggression,
        passing: attributes.passing,
        shooting: attributes.shooting,
        positioning: attributes.positioning,
        workRate: attributes.workRate,
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
    // En yakın oyuncuyu bul - ama birden fazla oyuncu aynı mesafedeyse en becerikli alır
    let closestPlayer: Player2D | null = null;
    let closestDist = Infinity;
    
    // Yakın oyuncuları topla
    const nearbyPlayers = this.players
      .map(p => ({ player: p, dist: this.getDistance(p, this.ball) }))
      .filter(p => p.dist < 30)
      .sort((a, b) => a.dist - b.dist);
    
    if (nearbyPlayers.length > 0) {
      // En yakın 3 oyuncu varsa, beceri de hesaba kat
      if (nearbyPlayers.length >= 2 && nearbyPlayers[0].dist - nearbyPlayers[1].dist < 10) {
        // Çok yakınlar - beceri önemli
        closestPlayer = nearbyPlayers
          .slice(0, 3)
          .reduce((best, curr) => {
            const score = (30 - curr.dist) + curr.player.skill * 0.15;
            const bestScore = (30 - this.getDistance(best, this.ball)) + best.skill * 0.15;
            return score > bestScore ? curr.player : best;
          }, nearbyPlayers[0].player);
        closestDist = this.getDistance(closestPlayer, this.ball);
      } else {
        // Net en yakın var
        closestPlayer = nearbyPlayers[0].player;
        closestDist = nearbyPlayers[0].dist;
      }
    }
    
    // Top kontrolü - oyuncu topun 25 piksel yakınındaysa
    if (closestPlayer && closestDist < 25) {
      const player = closestPlayer as Player2D;
      
      // KALECI ÖZEL KONTROL: Rakip kalecinin önündeyse topu ona verme
      if (player.position === 'GK') {
        const opponentGoal = this.goals.find(g => g.team !== player.team);
        if (opponentGoal) {
          const distToOpponentGoal = Math.abs(this.ball.x - opponentGoal.x);
          // Rakip kaleye çok yakınsa kaleci topu kapmasın
          if (distToOpponentGoal < 150) {
            return; // Top serbest kalsın
          }
        }
      }
      
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
    } else if (closestDist > 40 || !closestPlayer) {
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
      
      if (dist > 3) { // Daha hassas hareket kontrolü
        let moveSpeed = player.speed;
        
        // ÇAKIŞMA KONTROLÜ: Yakında başka oyuncu varsa yavaşla
        const veryCloseTeammates = this.players.filter(p => 
          p.team === player.team && 
          p !== player && 
          this.getDistance(player, p) < 25
        );
        
        if (veryCloseTeammates.length > 0) {
          moveSpeed *= 0.6; // Yakında biri var, yavaşla
        }
        
        // Topa sahip oyuncu
        if (player === this.playerWithBall) {
          moveSpeed *= 0.85; // Topla biraz yavaş
        }
        // Pozisyonunu korurken
        else if (!this.shouldPlayerChaseBall(player, this.getDistance(player, this.ball), this.possession)) {
          moveSpeed *= 0.8; // Pozisyonsal hareket - biraz hızlı
        }
        // Topa koşarken
        else {
          moveSpeed *= 1.15; // Tam hız - daha hızlı
        }
        
        player.x += (dx / dist) * moveSpeed;
        player.y += (dy / dist) * moveSpeed;
      }
      
      // Esnek hat sınırları - sadece çok uzaklaşmayı önle
      let minX = 25, maxX = this.fieldWidth - 25;
      if (player.position === 'GK') {
        minX = player.team === 'home' ? 25 : this.fieldWidth - 200;
        maxX = player.team === 'home' ? 200 : this.fieldWidth - 25;
      } else if (player.position === 'DEF') {
        minX = player.team === 'home' ? 50 : this.fieldWidth - 450;
        maxX = player.team === 'home' ? 450 : this.fieldWidth - 50;
      } else if (player.position === 'MID') {
        minX = player.team === 'home' ? 150 : this.fieldWidth - 700;
        maxX = player.team === 'home' ? 700 : this.fieldWidth - 150;
      } else if (player.position === 'FWD') {
        minX = player.team === 'home' ? 250 : 50;
        maxX = player.team === 'home' ? this.fieldWidth - 50 : this.fieldWidth - 250;
      }
      
      // Sınırları uygula
      player.x = Math.max(minX, Math.min(maxX, player.x));
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

  private clearBall(player: Player2D): void {
    // Kaleci için uzun top - ileri atış
    const direction = player.team === 'home' ? 1 : -1;
    const power = 15 + Math.random() * 5; // Güçlü vuruş
    
    // İleriye doğru, hafif yukarı açı
    const targetX = player.x + direction * 300;
    const targetY = this.fieldHeight / 2 + (Math.random() - 0.5) * 200;
    
    const dx = targetX - this.ball.x;
    const dy = targetY - this.ball.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len > 0) {
      this.ball.vx = (dx / len) * power;
      this.ball.vy = (dy / len) * power;
    }
    
    this.playerWithBall = null;
    
    this.emitEvent({
      type: 'info',
      minute: Math.floor(this.gameState.minute),
      description: `🦶 ${player.name} uzun top attı`,
      team: player.team
    });
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
      
      // TAKIMSAL PAS SKORU
      let score = 100;
      
      // 1. Uzaklık maliyeti - orta mesafe tercih
      if (distance < 50) {
        score -= distance * 0.3; // Kısa pas iyi
      } else if (distance < 150) {
        score -= distance * 0.4; // Orta pas en iyi
      } else {
        score -= distance * 0.8; // Uzun pas riskli
      }
      
      // 2. Rakip engeli
      score -= opponentsInPath.length * 35;
      
      // 3. Oyuncu kalitesi
      score += teammate.skill * 0.4;
      
      // 4. POZİSYONEL BONUS
      if (passer.position === 'DEF') {
        // Defanstan orta sahaya pas tercih
        if (teammate.position === 'MID') score += 25;
        if (teammate.position === 'FWD') score += 15;
      } else if (passer.position === 'MID') {
        // Orta sahadan forvete veya açık kanata
        if (teammate.position === 'FWD') score += 30;
        if (teammate.position === 'MID') score += 10;
      } else if (passer.position === 'FWD') {
        // Forvetten diğer forvete veya orta sahaya geri
        if (teammate.position === 'FWD') score += 25;
        if (teammate.position === 'MID') score += 15;
      }
      
      // 5. İleri pozisyon bonusu
      const direction = passer.team === 'home' ? 1 : -1;
      const forwardProgress = (teammate.x - passer.x) * direction;
      if (forwardProgress > 0) {
        score += forwardProgress * 0.15; // İleriye pas bonusu
      }
      
      // 6. Kaleye yakınlık bonusu
      const goalDistance = this.getDistanceToGoal(teammate);
      if (goalDistance < 200) {
        score += (200 - goalDistance) * 0.2;
      }
      
      // 7. Açık alan bonusu
      const nearbyOpponents = this.getNearbyOpponents(teammate, 40);
      if (nearbyOpponents.length === 0) {
        score += 20; // Açık alanda
      } else {
        score -= nearbyOpponents.length * 8;
      }
      
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
    
    // 1. Kale açısını kontrol et
    const goalTop = { x: targetGoal.x + targetGoal.width/2, y: targetGoal.y };
    const goalBottom = { x: targetGoal.x + targetGoal.width/2, y: targetGoal.y + targetGoal.height };
    const goalCenterX = targetGoal.x + targetGoal.width/2;
    const goalCenterY = targetGoal.y + targetGoal.height/2;
    
    // Oyuncunun kaleye bakış açısı
    const angleToTop = Math.atan2(goalTop.y - player.y, goalTop.x - player.x);
    const angleToBottom = Math.atan2(goalBottom.y - player.y, goalBottom.x - player.x);
    const viewAngle = Math.abs(angleToTop - angleToBottom);
    
    // Açı çok dardaysa (yan taraftaysa) şut atma
    if (viewAngle < 0.3) return false;
    
    // 2. Şut yolunda rakip kontrolü
    const opponentsInPath = this.players.filter(opp => {
      if (opp.team === player.team) return false;
      
      // Oyuncuyla kale arasındaki mesafe
      const A = opp.x - player.x;
      const B = opp.y - player.y;
      const C = goalCenterX - player.x;
      const D = goalCenterY - player.y;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return false;
      
      const param = Math.max(0, Math.min(1, dot / lenSq));
      const xx = player.x + param * C;
      const yy = player.y + param * D;
      
      const distToLine = Math.sqrt((opp.x - xx) ** 2 + (opp.y - yy) ** 2);
      const distToPlayer = this.getDistance(player, opp);
      const distToGoal = this.getDistance(player, { x: goalCenterX, y: goalCenterY });
      
      // Oyuncuyla kale arasında ve yakınsa
      return distToLine < 30 && distToPlayer < distToGoal;
    });
    
    // Şut yolunda 2'den fazla rakip varsa atma
    if (opponentsInPath.length >= 2) return false;
    
    // 3. Çok yakın rakip kontrolü - bloke edebilir
    const veryCloseOpponents = this.getNearbyOpponents(player, 25);
    if (veryCloseOpponents.length >= 1) return false;
    
    return true;
  }

  private dribbleBall(player: Player2D, nearbyOpponents: Player2D[]): void {
    const targetGoal = this.goals.find(g => g.team !== player.team)!;
    const goalDirection = player.team === 'home' ? 1 : -1;
    
    // KİTLENME KONTROLÜ: Rakip kaleciye çok yakınsa pas yap veya şut çek
    const opponentGoal = this.goals.find(g => g.team !== player.team);
    if (opponentGoal) {
      const distToGoal = this.getDistance(player, { 
        x: opponentGoal.x + opponentGoal.width / 2, 
        y: opponentGoal.y + opponentGoal.height / 2 
      });
      
      // Çok yakınsa ve açı varsa ŞUT
      if (distToGoal < 80 && this.hasShootingAngle(player)) {
        this.attemptShot(player);
        return;
      }
      
      // Yakınsa ve takım arkadaşı varsa PAS
      if (distToGoal < 100) {
        const nearbyTeammates = this.getNearbyTeammates(player, 100);
        if (nearbyTeammates.length > 0) {
          this.attemptPass(player);
          return;
        }
      }
    }
    
    // TAKIMSAL TOP SÜRME: Takım arkadaşlarına doğru açılar aç
    const nearbyTeammates = this.getNearbyTeammates(player, 120);
    
    if (nearbyOpponents.length > 0) {
      // Rakip varsa: Kaç ama pas seçeneği bırak
      const avgOpponentX = nearbyOpponents.reduce((sum, opp) => sum + opp.x, 0) / nearbyOpponents.length;
      const avgOpponentY = nearbyOpponents.reduce((sum, opp) => sum + opp.y, 0) / nearbyOpponents.length;
      
      // Rakip kaleciye çok yakınsa (özellikle kaleci) - yana aç
      const opponentGK = nearbyOpponents.find(opp => opp.position === 'GK');
      if (opponentGK && this.getDistance(player, opponentGK) < 40) {
        // Kaleciden kaçış - yana doğru
        const sideMove = player.y < this.fieldHeight / 2 ? -1 : 1;
        player.targetX = player.x + goalDirection * 10;
        player.targetY = player.y + sideMove * 35;
        
        // Saha sınırları
        player.targetX = Math.max(30, Math.min(this.fieldWidth - 30, player.targetX));
        player.targetY = Math.max(30, Math.min(this.fieldHeight - 30, player.targetY));
        return;
      }
      
      // Rakiplerden uzaklaş
      const avoidX = player.x - avgOpponentX;
      const avoidY = player.y - avgOpponentY;
      
      // Kaleye doğru
      const goalX = (targetGoal.x + targetGoal.width/2) - player.x;
      const goalY = (targetGoal.y + targetGoal.height/2) - player.y;
      
      // Takım arkadaşlarına açı aç
      let teammateInfluence = 0;
      if (nearbyTeammates.length > 0) {
        const avgTeammateX = nearbyTeammates.reduce((sum, t) => sum + t.x, 0) / nearbyTeammates.length;
        teammateInfluence = (avgTeammateX - player.x) * 0.15;
      }
      
      player.targetX = player.x + (avoidX * 0.4 + goalX * 0.5) * 0.12 + teammateInfluence;
      player.targetY = player.y + (avoidY * 0.4 + goalY * 0.6) * 0.12;
    } else {
      // Serbest hareket: Kontrollü ilerleme
      
      // Kaleciye çok yakınsa yan taraftan git veya geri dön
      const opponentGoal = this.goals.find(g => g.team !== player.team);
      if (opponentGoal) {
        const distToGoal = Math.abs(player.x - (opponentGoal.x + opponentGoal.width / 2));
        
        // Kalecinin hemen yanındaysa (50 piksel) - yan taraftan kaç
        if (distToGoal < 50) {
          const sideMove = player.y < this.fieldHeight / 2 ? -1 : 1;
          player.targetX = player.x - goalDirection * 20; // Geri git
          player.targetY = player.y + sideMove * 40; // Yana aç
          
          // Saha sınırları
          player.targetX = Math.max(30, Math.min(this.fieldWidth - 30, player.targetX));
          player.targetY = Math.max(30, Math.min(this.fieldHeight - 30, player.targetY));
          return;
        }
      }
      
      // Takım arkadaşlarına yakınsa yan taraftan git
      if (nearbyTeammates.length > 0) {
        const closestTeammate = nearbyTeammates.reduce((prev, curr) => 
          this.getDistance(player, curr) < this.getDistance(player, prev) ? curr : prev
        );
        
        const teammateDistance = this.getDistance(player, closestTeammate);
        
        if (teammateDistance < 60) {
          // Takım arkadaşıyla kombinasyon - yan açılma
          const sideMove = closestTeammate.y > player.y ? -1 : 1;
          player.targetX = player.x + goalDirection * 15;
          player.targetY = player.y + sideMove * 30;
        } else {
          // Normal ilerleme - merkeze doğru
          const centerY = this.fieldHeight / 2;
          const toCenter = (centerY - player.y) * 0.2;
          player.targetX = player.x + goalDirection * 20;
          player.targetY = player.y + toCenter + (Math.random() - 0.5) * 15;
        }
      } else {
        // Takım arkadaşı yok - güvenli ilerleme
        player.targetX = player.x + goalDirection * (15 + Math.random() * 10);
        player.targetY = player.y + (Math.random() - 0.5) * 25;
      }
    }
    
    // Saha sınırları
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
    const closeOpponents = nearbyOpponents.filter(o => this.getDistance(player, o) < 35).length;
    
    // OYUNCU TİPİ FAKTÖRÜ
    const passTendency = (player.passing || 60) / 100;
    const shootingTendency = (player.shooting || 60) / 100;
    
    // ACİL PAS: Çok fazla rakip varsa (2+) veya yüksek baskı
    if (closeOpponents >= 2 || pressureLevel > 0.7) {
      if (nearbyTeammates.length > 0) {
        this.attemptPass(player);
        return;
      }
    }
    
    // KALECI ÖZEL: Her zaman pas yap, sürme
    if (player.position === 'GK') {
      if (nearbyTeammates.length > 0) {
        this.attemptPass(player);
        return;
      } else {
        // Takım arkadaşı yok - uzağa tekme at
        this.clearBall(player);
        return;
      }
    }
    
    // SAVUNMA: Güvenli pas oyunu
    if (player.position === 'DEF') {
      // Ball-playing defender daha çok pas yapar
      const passChance = player.playerType === 'ball-playing-def' ? 0.85 : 0.75;
      
      if (nearbyTeammates.length > 0 && (pressureLevel > 0.25 || Math.random() < passChance)) {
        this.attemptPass(player);
        return;
      }
      // Baskı yoksa kısa sürme
      if (pressureLevel < 0.2 && player.playerType === 'ball-playing-def') {
        this.dribbleBall(player, nearbyOpponents);
        return;
      }
    }
    
    // ŞUT FIRSATI: Kaleye yakın, açı var, baskı az - TİPE GÖRE
    if (distanceToGoal < 140 && this.hasShootingAngle(player) && pressureLevel < 0.5) {
      let shootChance = (player.skill / 100) * (1 - pressureLevel) * 0.35;
      
      // Tip bazlı şut eğilimi
      if (player.playerType === 'poacher' || player.playerType === 'target-man') {
        shootChance *= 1.5; // Golcüler daha çok şut atar
      } else if (player.playerType === 'playmaker' || player.playerType === 'false-nine') {
        shootChance *= 0.7; // Oyun kuranlar daha az şut atar
      }
      
      shootChance *= shootingTendency; // Shooting özelliği etkili
      
      if (Math.random() < shootChance) {
        this.attemptShot(player);
        return;
      }
    }
    
    // ORTA SAHA ve FORVET: Dinamik oyun - TİPE GÖRE
    if (player.position === 'MID' || player.position === 'FWD') {
      // Tip bazlı karar verme
      if (player.playerType === 'playmaker') {
        // Playmaker: Her zaman pas seçeneği arar
        if (nearbyTeammates.length > 0 && Math.random() < 0.75) {
          this.attemptPass(player);
          return;
        }
      } else if (player.playerType === 'winger') {
        // Winger: Dribblingi sever
        if (pressureLevel < 0.4 && Math.random() < 0.65) {
          this.dribbleBall(player, nearbyOpponents);
          return;
        }
      } else if (player.playerType === 'box-to-box') {
        // Box-to-box: Her şeyi yapar, dengeli
        if (pressureLevel > 0.4 && nearbyTeammates.length > 0) {
          this.attemptPass(player);
          return;
        }
        if (pressureLevel < 0.3 && Math.random() < 0.6) {
          this.dribbleBall(player, nearbyOpponents);
          return;
        }
      }
      
      // Genel karar - pas eğilimine göre
      if (Math.random() < passTendency * 0.7 && nearbyTeammates.length > 0) {
        this.attemptPass(player);
      } else {
        this.dribbleBall(player, nearbyOpponents);
      }
    } else {
      // Varsayılan: Güvenli pas
      if (nearbyTeammates.length > 0) {
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
    
    // TAKIMSAL HAREKET: Topla birlikte takım da hareket etsin
    if (ballPossession === player.team) {
      // HÜCUM ORGANİZASYONU
      this.attackingOrganization(player, ballDist);
    } else if (ballPossession !== player.team && ballPossession !== null) {
      // SAVUNMA ORGANİZASYONU
      this.defendingOrganization(player, ballDist);
    } else {
      // TOP SERBEST: En yakın koşsun
      const teammates = this.players.filter(p => p.team === player.team && p !== this.playerWithBall);
      const sortedByDistance = teammates
        .map(p => ({ player: p, distance: this.getDistance(p, this.ball) }))
        .sort((a, b) => a.distance - b.distance);
      
      const isClosestToBall = sortedByDistance[0]?.player === player;
      
      if (isClosestToBall && ballDist < 150) {
        this.moveTowardsBall(player);
      } else {
        this.maintainPosition(player, distanceFromBase);
      }
    }
  }
  
  private attackingOrganization(player: Player2D, ballDist: number): void {
    // Takım hücumda: Pozisyona ve OYUNCU TİPİNE göre destek hareketleri
    
    if (player.position === 'GK') {
      // Kaleci tipi özel davranışlar
      if (player.playerType === 'sweeper-keeper' && this.ball.x < this.fieldWidth * 0.3) {
        // Sweeper-Keeper: İleri çıkıp pas seçeneği ol
        const direction = player.team === 'home' ? 1 : -1;
        player.targetX = player.baseX + direction * 40;
        player.targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.4;
      } else {
        // Traditional GK: Gol çizgisinde kal
        player.targetX = player.baseX;
        player.targetY = player.baseY;
      }
      return;
    }
    
    if (player.position === 'DEF') {
      // Defans: TİPE GÖRE farklı davranışlar
      const ballX = this.ball.x;
      const direction = player.team === 'home' ? 1 : -1;
      
      if (player.playerType === 'ball-playing-def') {
        // Ball-playing defender: İleri çık, pas seçeneği ol
        const targetX = player.team === 'home' 
          ? Math.min(player.baseX + 100, ballX - 40)
          : Math.max(player.baseX - 100, ballX + 40);
        const targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.5;
        player.targetX = targetX;
        player.targetY = Math.max(60, Math.min(this.fieldHeight - 60, targetY));
      } else if (player.playerType === 'stopper') {
        // Stopper: Agresif, ileri çık
        const targetX = player.team === 'home' 
          ? Math.min(player.baseX + 80, ballX - 50)
          : Math.max(player.baseX - 80, ballX + 50);
        const targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.4;
        player.targetX = targetX;
        player.targetY = Math.max(60, Math.min(this.fieldHeight - 60, targetY));
      } else {
        // Covering defender: Pozisyonel, güvenlik sağla
        const targetX = player.team === 'home' 
          ? Math.min(player.baseX + 40, ballX - 100)
          : Math.max(player.baseX - 40, ballX + 100);
        const targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.2;
        player.targetX = targetX;
        player.targetY = Math.max(60, Math.min(this.fieldHeight - 60, targetY));
      }
      return;
    }
    
    if (player.position === 'MID') {
      // Orta saha: TİPE GÖRE farklı davranışlar
      const direction = player.team === 'home' ? 1 : -1;
      
      if (player.playerType === 'box-to-box') {
        // Box-to-box: Her yere koş, dinamik
        if (ballDist < 80) {
          player.targetX = this.ball.x + direction * 60;
          player.targetY = this.ball.y + (Math.random() - 0.5) * 70;
        } else {
          player.targetX = player.baseX + direction * 60 + (Math.random() - 0.5) * 50;
          player.targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.6;
        }
      } else if (player.playerType === 'playmaker') {
        // Playmaker: Merkezi tut, pas yolları aç
        player.targetX = this.ball.x + direction * 40 + (Math.random() - 0.5) * 30;
        player.targetY = this.fieldHeight / 2 + (this.ball.y - this.fieldHeight / 2) * 0.3;
      } else if (player.playerType === 'defensive-mid') {
        // Defensive midfielder: Defansın önünde kal
        player.targetX = player.baseX + direction * 25;
        player.targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.3;
      } else {
        // Attacking midfielder: İleri çık, hücuma katıl
        player.targetX = this.ball.x + direction * 70 + (Math.random() - 0.5) * 50;
        player.targetY = this.ball.y + (Math.random() - 0.5) * 80;
      }
      return;
    }
    
    if (player.position === 'FWD') {
      // Forvet: TİPE GÖRE farklı davranışlar
      const direction = player.team === 'home' ? 1 : -1;
      
      if (player.playerType === 'target-man') {
        // Target man: Ceza alanında bekle, fiziksel oyun
        player.targetX = player.baseX + direction * 30;
        player.targetY = this.fieldHeight / 2 + (Math.random() - 0.5) * 60;
      } else if (player.playerType === 'poacher') {
        // Poacher: Ofsayt sınırında, gol arıyor
        player.targetX = this.ball.x + direction * 80 + (Math.random() - 0.5) * 40;
        player.targetY = this.ball.y + (Math.random() - 0.5) * 70;
      } else if (player.playerType === 'false-nine') {
        // False nine: Geriye düşüp oyun kur
        if (ballDist < 100) {
          player.targetX = this.ball.x + direction * 40;
          player.targetY = this.ball.y + (Math.random() - 0.5) * 60;
        } else {
          player.targetX = player.baseX - direction * 30;
          player.targetY = player.baseY;
        }
      } else {
        // Winger: Kanat koridorunda hızlı
        const isTopWinger = player.baseY < this.fieldHeight / 2;
        player.targetX = this.ball.x + direction * 70;
        player.targetY = isTopWinger ? 60 + Math.random() * 100 : this.fieldHeight - 160 + Math.random() * 100;
      }
      return;
    }
  }
  
  private defendingOrganization(player: Player2D, ballDist: number): void {
    // Takım savunmada: Kompakt savunma
    
    if (player.position === 'GK') {
      // Kaleci: Gol çizgisinde pozisyon al
      const goalCenter = this.fieldHeight / 2;
      player.targetX = player.baseX;
      player.targetY = goalCenter + (this.ball.y - goalCenter) * 0.6;
      return;
    }
    
    // Tüm oyuncular kendi kaleye doğru geriye çekilsin
    const ownGoalX = player.team === 'home' ? 100 : this.fieldWidth - 100;
    const ballToGoalDirection = (ownGoalX - this.ball.x) / Math.abs(ownGoalX - this.ball.x);
    
    if (player.position === 'DEF') {
      // Defans: Top ile kale arasında dur
      if (ballDist < 120) {
        // Yakınsa pressing
        player.targetX = this.ball.x + ballToGoalDirection * 40;
        player.targetY = this.ball.y + (player.baseY - this.fieldHeight / 2) * 0.3;
      } else {
        // Uzaktaysa kompakt savunma
        player.targetX = player.baseX + ballToGoalDirection * 20;
        player.targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.4;
      }
      return;
    }
    
    if (player.position === 'MID') {
      // Orta saha: Orta alanda tıka
      if (ballDist < 100) {
        // En yakın oyuncu baskı yapsın
        const teammates = this.players.filter(p => 
          p.team === player.team && 
          p.position === 'MID' &&
          p !== player
        );
        const isClosest = teammates.every(t => 
          this.getDistance(player, this.ball) < this.getDistance(t, this.ball)
        );
        
        if (isClosest) {
          // Baskı yap
          player.targetX = this.ball.x;
          player.targetY = this.ball.y;
        } else {
          // Pas yollarını kapat
          player.targetX = player.baseX + ballToGoalDirection * 30;
          player.targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.5;
        }
      } else {
        // Merkezi kapat
        const centerX = this.fieldWidth / 2;
        player.targetX = centerX + (player.baseX - centerX) * 0.5;
        player.targetY = player.baseY + (this.ball.y - this.fieldHeight / 2) * 0.3;
      }
      return;
    }
    
    if (player.position === 'FWD') {
      // Forvet: Rakip defansa hafif baskı
      if (ballDist < 150) {
        // Pas yollarını daralt
        player.targetX = this.ball.x + ballToGoalDirection * 60;
        player.targetY = this.ball.y + (Math.random() - 0.5) * 40;
      } else {
        // Orta sahada bekle
        const centerX = this.fieldWidth / 2;
        player.targetX = centerX + (player.baseX - centerX) * 0.6;
        player.targetY = player.baseY;
      }
      return;
    }
  }



  private shouldPlayerChaseBall(player: Player2D, ballDistance: number, possession: 'home' | 'away' | null): boolean {
    // KALECI: Sadece ceza alanında ve tehlike varsa
    if (player.position === 'GK') {
      // Kendi ceza alanı sınırları
      const penaltyAreaLimit = player.team === 'home' ? 160 : this.fieldWidth - 160;
      const inOwnPenaltyArea = player.team === 'home' ? this.ball.x < penaltyAreaLimit : this.ball.x > penaltyAreaLimit;
      
      // Rakip ceza alanında mı kontrol et - ASLA gitme
      const opponentGoal = this.goals.find(g => g.team !== player.team);
      if (opponentGoal) {
        const distToOpponentGoal = Math.abs(this.ball.x - (opponentGoal.x + opponentGoal.width / 2));
        if (distToOpponentGoal < 200) {
          return false; // Rakip kalede kaleci ASLA topa gitmesin
        }
      }
      
      const ballSpeed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
      
      // Kendi ceza alanında, top yavaş ve yakınsa
      return ballDistance < 50 && inOwnPenaltyArea && ballSpeed < 2;
    }
    
    // SAVUNMA: Seçici baskı
    if (player.position === 'DEF') {
      if (possession === player.team) {
        // Kendi topsa sadece çok yakınsa destek
        return ballDistance < 70;
      } else {
        // Rakip topsa: Kendi yarı sahada aktif, değilse pasif
        const ownHalf = player.team === 'home' ? this.ball.x < this.fieldWidth / 2 : this.ball.x > this.fieldWidth / 2;
        if (ownHalf) {
          return ballDistance < 180; // Kendi alanda aktif
        } else {
          return ballDistance < 100; // Rakip alanda pasif
        }
      }
    }
    
    // ORTA SAHA: Orta mesafe baskısı
    if (player.position === 'MID') {
      if (possession === player.team) {
        return ballDistance < 100; // Destek mesafesi
      } else {
        return ballDistance < 150; // Baskı mesafesi
      }
    }
    
    // FORVET: Hücum ve pressing
    if (player.position === 'FWD') {
      if (possession === player.team) {
        return ballDistance < 130; // Hücum desteği
      } else {
        // Rakip yarı sahada aktif pressing
        const opponentHalf = player.team === 'home' ? this.ball.x > this.fieldWidth / 2 : this.ball.x < this.fieldWidth / 2;
        return opponentHalf && ballDistance < 180;
      }
    }
    
    return false;
  }

  private moveTowardsBall(player: Player2D): void {
    // Topa doğru daha akıllı hareket et - ama çakışmadan
    
    // ÖNCE: Takım arkadaşlarını kontrol et
    const nearbyTeammates = this.players.filter(p => 
      p.team === player.team && 
      p !== player && 
      this.getDistance(player, p) < 35
    );
    
    // Top hareket halindeyse öngörülü pozisyon al
    let predictedBallX = this.ball.x + this.ball.vx * 8;
    let predictedBallY = this.ball.y + this.ball.vy * 8;
    
    // Eğer top duruyorsa direkt git
    if (Math.abs(this.ball.vx) < 0.5 && Math.abs(this.ball.vy) < 0.5) {
      predictedBallX = this.ball.x;
      predictedBallY = this.ball.y;
    }
    
    // Eğer yakın takım arkadaşı varsa, açı değiştirerek git
    if (nearbyTeammates.length > 0) {
      const closest = nearbyTeammates.reduce((prev, curr) => 
        this.getDistance(player, curr) < this.getDistance(player, prev) ? curr : prev
      );
      
      const distToTeammate = this.getDistance(player, closest);
      
      // Çok yakınsa alternatif açıdan git
      if (distToTeammate < 35) {
        const avoidX = player.x - closest.x;
        const avoidY = player.y - closest.y;
        const avoidLen = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
        
        if (avoidLen > 0) {
          // Kaçınma yönünü topa gitmeyle birleştir
          const toBallX = predictedBallX - player.x;
          const toBallY = predictedBallY - player.y;
          const toBallLen = Math.sqrt(toBallX * toBallX + toBallY * toBallY);
          
          if (toBallLen > 0) {
            // %70 topa git, %30 takım arkadaşından kaçın
            player.targetX = player.x + (toBallX / toBallLen) * 0.7 + (avoidX / avoidLen) * 0.3;
            player.targetY = player.y + (toBallY / toBallLen) * 0.7 + (avoidY / avoidLen) * 0.3;
            return;
          }
        }
      }
    }
    
    // Normal topa git
    player.targetX = predictedBallX;
    player.targetY = predictedBallY;
  }

  private maintainPosition(player: Player2D, distanceFromBase: number): void {
    // ÖNCELİKLE: Takım arkadaşlarıyla çakışmayı MUTLAKA önle
    const nearbyTeammates = this.players.filter(p => 
      p.team === player.team && 
      p !== player && 
      this.getDistance(player, p) < 50 // Daha geniş mesafe kontrolü
    );
    
    if (nearbyTeammates.length > 0) {
      // Tüm yakın oyunculardan uzaklaşma vektörü hesapla
      let totalAvoidX = 0;
      let totalAvoidY = 0;
      
      nearbyTeammates.forEach(teammate => {
        const dist = this.getDistance(player, teammate);
        if (dist < 50) {
          const strength = (50 - dist) / 50; // Yakınlık oranı
          const dx = player.x - teammate.x;
          const dy = player.y - teammate.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          
          if (len > 0) {
            totalAvoidX += (dx / len) * strength * 40;
            totalAvoidY += (dy / len) * strength * 40;
          }
        }
      });
      
      if (Math.abs(totalAvoidX) > 5 || Math.abs(totalAvoidY) > 5) {
        player.targetX = player.x + totalAvoidX;
        player.targetY = player.y + totalAvoidY;
        return; // Çakışma önleme prioritesi en yüksek
      }
    }
    
    // Eğer pozisyonundan çok uzaksa, geri dön
    if (distanceFromBase > 180) {
      player.targetX = player.baseX + (Math.random() - 0.5) * 40;
      player.targetY = player.baseY + (Math.random() - 0.5) * 40;
    } else {
      // Taktiksel pozisyon alma
      this.makePositionalMovement(player);
    }
  }

  private makePositionalMovement(player: Player2D): void {
    const ballPosition = this.ball;
    const shouldMove = Math.random() < 0.35; // %35 şans - daha çok hareket
    
    if (!shouldMove) return;
    
    // Pozisyona göre gerçekçi ama mesafeli hareketler
    if (player.position === 'DEF') {
      // SAVUNMA: Kompakt kal
      if (this.possession !== player.team) {
        const ballSide = ballPosition.y < this.fieldHeight / 2 ? -0.4 : 0.4;
        player.targetX = player.baseX + (Math.random() - 0.8) * 30; // Az ileri git
        player.targetY = player.baseY + ballSide * 25; // Top tarafına hafif kay
      } else {
        // Hücum desteği: Ama çok ileri gitme
        player.targetX = player.baseX + (Math.random() - 0.4) * 40;
        player.targetY = player.baseY + (Math.random() - 0.5) * 50;
      }
    }
    
    else if (player.position === 'MID') {
      // ORTA SAHA: Dengeli pozisyon
      if (this.possession === player.team) {
        // Pas yolları aç ama mesafeli
        player.targetX = player.baseX + (Math.random() - 0.3) * 50;
        player.targetY = player.baseY + (Math.random() - 0.5) * 70;
      } else {
        // Merkezi kapat
        const toCenter = (this.fieldWidth / 2) - player.x;
        player.targetX = player.x + toCenter * 0.2;
        player.targetY = player.baseY + (Math.random() - 0.5) * 40;
      }
    }
    
    else if (player.position === 'FWD') {
      // FORVET: İleri pozisyon ama tek başına gitme
      if (this.possession === player.team) {
        const toGoal = player.team === 'home' ? 1 : -1;
        player.targetX = player.baseX + toGoal * 40 + (Math.random() - 0.5) * 50;
        player.targetY = player.baseY + (Math.random() - 0.5) * 80;
      } else {
        // Az pressing - bekleme pozisyonu
        player.targetX = player.baseX + (Math.random() - 0.5) * 40;
        player.targetY = player.baseY + (Math.random() - 0.5) * 50;
      }
    }
    
    // Saha sınırları
    player.targetX = Math.max(30, Math.min(this.fieldWidth - 30, player.targetX));
    player.targetY = Math.max(30, Math.min(this.fieldHeight - 30, player.targetY));
  }


}