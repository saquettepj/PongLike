// Brick Rogue: O Desafio dos Efeitos
// Engine principal do jogo

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Estado do jogo
        this.currentScreen = 'mainMenu';
        this.currentPhase = 1;
        this.highScore = parseInt(localStorage.getItem('brickRogueHighScore')) || 1;
        this.money = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameTime = 0; // Tempo de jogo em segundos
        this.lastMultiBallTime = 0; // Último tempo que uma bola foi adicionada
        
        // Objetos do jogo
        this.paddle = null;
        this.balls = [];
        this.bricks = [];
        this.particles = [];
        this.powerUps = [];
        
        // Efeitos ativos
        this.activeUpgrades = [];
        this.ballEffects = {
            speedMultiplier: 1,
            inverted: false,
            zigzag: false,
            invisible: false,
            invisibleTimer: 0,
            invisibleCycle: 0, // 0 = visível, 1 = invisível
            zigzagTimer: 0
        };
        
        // Timers para upgrades especiais
        this.upgradeTimers = {
            explosiveBall: 0,
            ballEcho: { active: false, echoBall: null }
        };
        
        // Controles
        this.keys = {};
        this.mouseX = 0;
        this.mousePressed = false;
        
        // Upgrades com ativação manual
        this.activeUpgradeEffects = {
            superMagnet: { active: false, timer: 0, duration: 120 }, // 2 segundos
            paddleDash: { active: false, timer: 0, cooldown: 300 }, // 5 segundos
            chargedShot: { charging: false, chargeLevel: 0, maxCharge: 60 },
            safetyNet: { active: false, timer: 0, duration: 900 }, // 15 segundos
            effectActivator: { active: false, timer: 0, duration: 600 } // 10 segundos
        };
        
        // Configurações
        this.config = {
            paddleSpeed: 2.4,
            ballSpeed: 1.7,
            brickWidth: 60,
            brickHeight: 20,
            brickSpacing: 5,
            paddleWidth: 100,
            paddleHeight: 15,
            ballRadius: 8
        };
        
        this.init();
        this.initAudio();
    }
    
    initAudio() {
        // Criar contexto de áudio
        this.audioContext = null;
        this.sounds = {};
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API não suportada');
        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // Som de batida na plataforma
        this.sounds.paddleHit = this.createTone(200, 0.1, 'sine');
        
        // Som de batida no tijolo
        this.sounds.brickHit = this.createTone(400, 0.15, 'square');
    }
    
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    init() {
        this.setupEventListeners();
        this.showScreen('mainMenu');
        this.updateUI();
    }
    
    setupEventListeners() {
        // Controles do teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Pausar/Despausar com tecla P
            if (e.code === 'KeyP' && this.gameRunning) {
                e.preventDefault();
                this.togglePause();
            }
            
            // Ativar upgrades com barra de espaço ou soltar bolinha presa
            if (e.code === 'Space' && this.gameRunning && !this.gamePaused) {
                e.preventDefault();
                
                // Verificar se há bolinhas presas para soltar
                const attachedBalls = this.balls.filter(ball => ball.attached);
                if (attachedBalls.length > 0) {
                    // Soltar todas as bolinhas presas
                    attachedBalls.forEach(ball => {
                        ball.attached = false;
                        ball.vx = (Math.random() - 0.5) * 4;
                        ball.vy = -this.config.ballSpeed;
                    });
                } else {
                    // Se não há bolinhas presas, ativar upgrades
                    this.activateUpgrade();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Parar carregamento do tiro carregado
            if (e.code === 'Space' && this.activeUpgradeEffects.chargedShot.charging) {
                this.fireChargedShot();
            }
        });
        
        // Controles do mouse (removidos - apenas teclado)
        
        // Botões da interface
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('continueButton').addEventListener('click', () => {
            this.continueToNextPhase();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });
    }
    
    showScreen(screenName) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar tela selecionada
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;
    }
    
    startGame() {
        // Ativar contexto de áudio se necessário
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.currentPhase = 1;
        this.money = 0;
        this.lives = 3;
        this.activeUpgrades = [];
        this.resetBallEffects();
        
        // Limpar estado da bolinha eco
        this.upgradeTimers.ballEcho.active = false;
        this.upgradeTimers.ballEcho.echoBall = null;
        
        this.initGameObjects();
        this.generateBricks();
        this.gameRunning = true;
        this.showScreen('gameScreen');
        this.updateUI();
        this.gameLoop();
    }
    
    restartGame() {
        this.startGame();
    }
    
    togglePause() {
        if (this.gamePaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    pauseGame() {
        this.gamePaused = true;
        this.showScreen('pauseScreen');
    }
    
    resumeGame() {
        this.gamePaused = false;
        this.showScreen('gameScreen');
    }
    
    initGameObjects() {
        // Criar paddle
        this.paddle = {
            x: this.width / 2 - this.config.paddleWidth / 2,
            y: this.height - 50,
            width: this.config.paddleWidth,
            height: this.config.paddleHeight,
            speed: this.config.paddleSpeed
        };
        
        // Criar bolinha inicial (presa à plataforma)
        this.balls = [{
            x: this.width / 2,
            y: this.height - 100,
            vx: 0,
            vy: 0,
            radius: this.config.ballRadius,
            visible: true,
            trail: [],
            attached: true // Bolinha presa à plataforma
        }];
        
        // Limpar arrays
        this.particles = [];
        this.powerUps = [];
    }
    
    generateBricks() {
        this.bricks = [];
        const rows = 6 + Math.floor(this.currentPhase / 3);
        const cols = Math.floor(this.width / (this.config.brickWidth + this.config.brickSpacing));
        const totalWidth = cols * (this.config.brickWidth + this.config.brickSpacing) - this.config.brickSpacing;
        const startX = (this.width - totalWidth) / 2; // Centralizar a formação
        const startY = 80;
        
        // Gerar tijolos comuns
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (this.config.brickWidth + this.config.brickSpacing);
                const y = startY + row * (this.config.brickHeight + this.config.brickSpacing);
                
                // Determinar cor baseada na posição e fase
                let color = this.getBrickColor(row, col, rows, cols);
                
                this.bricks.push({
                    x: x,
                    y: y,
                    width: this.config.brickWidth,
                    height: this.config.brickHeight,
                    color: color,
                    destroyed: false,
                    hits: color === 'red' ? 6 : 1,
                    maxHits: color === 'red' ? 6 : 1
                });
            }
        }
    }
    
    getBrickColor(row, col, rows, cols) {
        // Tijolo núcleo vermelho sempre no centro
        if (row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) {
            return 'red';
        }
        
        // Distribuição de cores baseada na fase
        const colors = ['blue', 'yellow', 'green', 'purple', 'gray'];
        const weights = [0.4, 0.2, 0.15, 0.15, 0.1]; // Probabilidades
        
        // Aumentar dificuldade com a fase
        const difficulty = Math.min(this.currentPhase / 10, 1);
        const adjustedWeights = weights.map((w, i) => {
            if (i === 0) return w * (1 - difficulty * 0.5); // Menos azuis
            return w * (1 + difficulty * 0.3); // Mais coloridos
        });
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < colors.length; i++) {
            cumulative += adjustedWeights[i];
            if (random <= cumulative) {
                return colors[i];
            }
        }
        
        return 'blue';
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Não atualizar se o jogo estiver pausado
        if (this.gamePaused) {
            return;
        }
        
        // Atualizar tempo de jogo (60 FPS = 1/60 segundos por frame)
        this.gameTime += 1/60;
        
        this.updatePaddle();
        this.updateBalls();
        this.updateParticles();
        this.updatePowerUps();
        this.updateUpgradeEffects();
        this.checkCollisions();
        this.updateBallEffects();
        this.updateMultiBall();
    }
    
    updateMultiBall() {
        // Verificar se tem o upgrade multi_ball e se passou 1 minuto desde a última bola
        if (this.hasUpgrade('multi_ball') && this.gameTime - this.lastMultiBallTime >= 60) {
            // Adicionar nova bola (presa à plataforma)
            this.balls.push({
                x: this.width / 2 + (Math.random() - 0.5) * 40,
                y: this.height - 100,
                vx: 0,
                vy: 0,
                radius: this.config.ballRadius,
                explosive: false,
                attached: true // Nova bolinha presa à plataforma
            });
            
            this.lastMultiBallTime = this.gameTime;
            this.updateUI();
        }
    }
    
    updatePaddle() {
        // Não atualizar paddle se o jogo estiver pausado
        if (this.gamePaused) {
            return;
        }
        
        let speed = this.paddle.speed;
        
        // Dash de Plataforma
        if (this.hasUpgrade('paddle_dash') && this.activeUpgradeEffects.paddleDash.active) {
            speed *= 3; // Velocidade triplicada durante o dash
        }
        
        // Controle apenas por teclado (A/D ou setas)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.paddle.x -= speed;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.paddle.x += speed;
        }
        
        // Manter paddle dentro da tela
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
    }
    
    updateUpgradeEffects() {
        // Atualizar timers dos efeitos
        Object.keys(this.activeUpgradeEffects).forEach(key => {
            const effect = this.activeUpgradeEffects[key];
            if (effect.timer > 0) {
                effect.timer--;
            }
            
            // Desativar efeitos quando o timer chegar a zero
            if (effect.timer <= 0 && effect.active) {
                effect.active = false;
            }
        });
        
        // Atualizar carregamento do tiro carregado
        if (this.activeUpgradeEffects.chargedShot.charging) {
            this.activeUpgradeEffects.chargedShot.chargeLevel++;
            if (this.activeUpgradeEffects.chargedShot.chargeLevel >= this.activeUpgradeEffects.chargedShot.maxCharge) {
                this.activeUpgradeEffects.chargedShot.chargeLevel = this.activeUpgradeEffects.chargedShot.maxCharge;
            }
        }
        
        // Aplicar efeito do Super Ímã
        if (this.activeUpgradeEffects.superMagnet.active) {
            this.balls.forEach(ball => {
                const dx = (this.paddle.x + this.paddle.width / 2) - ball.x;
                const dy = (this.paddle.y - 20) - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const attraction = 0.3; // Força de atração
                    ball.vx += (dx / distance) * attraction;
                    ball.vy += (dy / distance) * attraction;
                }
            });
        }
        
        // Atualizar timer da Bolinha Explosiva
        if (this.hasUpgrade('explosive_ball')) {
            this.upgradeTimers.explosiveBall++;
            if (this.upgradeTimers.explosiveBall >= 600) { // 10 segundos
                this.upgradeTimers.explosiveBall = 0;
                // Marcar bolinha para explosão
                this.balls.forEach(ball => {
                    ball.explosive = true;
                });
            }
        }
        
        // Atualizar Eco da Bolinha
        if (this.hasUpgrade('ball_echo') && this.balls.length > 0) {
            const mainBall = this.balls[0];
            
            if (!this.upgradeTimers.ballEcho.active) {
                // Criar bolinha eco
                this.upgradeTimers.ballEcho.echoBall = {
                    x: mainBall.x,
                    y: mainBall.y,
                    vx: mainBall.vx,
                    vy: mainBall.vy,
                    radius: mainBall.radius,
                    trail: [],
                    delay: 0
                };
                this.upgradeTimers.ballEcho.active = true;
            } else {
                // Atualizar posição da bolinha eco com delay de 10ms (aproximadamente 1 frame a 60fps)
                this.upgradeTimers.ballEcho.echoBall.delay++;
                if (this.upgradeTimers.ballEcho.echoBall.delay >= 1) { // Delay de 1 frame (10ms)
                    this.upgradeTimers.ballEcho.echoBall.x = mainBall.x;
                    this.upgradeTimers.ballEcho.echoBall.y = mainBall.y;
                    this.upgradeTimers.ballEcho.echoBall.vx = mainBall.vx;
                    this.upgradeTimers.ballEcho.echoBall.vy = mainBall.vy;
                    this.upgradeTimers.ballEcho.echoBall.delay = 0;
                }
            }
        }
    }
    
    updateBalls() {
        this.balls.forEach((ball, index) => {
            // Se a bolinha está presa à plataforma, seguir o paddle
            if (ball.attached) {
                ball.x = this.paddle.x + this.paddle.width / 2;
                ball.y = this.paddle.y - ball.radius - 5;
                return; // Não aplicar física se estiver presa
            }
            
            // Aplicar efeitos
            let vx = ball.vx * this.ballEffects.speedMultiplier;
            let vy = ball.vy * this.ballEffects.speedMultiplier;
            
            // Efeito de inversão
            if (this.ballEffects.inverted) {
                vx = -vx;
            }
            
            // Efeito de zigue-zague (amplitude ainda menor)
            if (this.ballEffects.zigzag) {
                this.ballEffects.zigzagTimer += 0.05;
                // Movimento horizontal com amplitude muito menor
                vx += Math.sin(this.ballEffects.zigzagTimer * 0.4) * 2; // Reduzido de 5px para 3px
                // Movimento vertical mais sutil
                vy += Math.cos(this.ballEffects.zigzagTimer * 0.3) * 0.3; // Reduzido de 1 para 0.5
            }
            
            // Atrator de Núcleo - atração magnética para o tijolo núcleo
            if (this.hasUpgrade('core_attractor')) {
                const coreBrick = this.bricks.find(brick => brick.color === 'red' && !brick.destroyed);
                if (coreBrick) {
                    const coreX = coreBrick.x + coreBrick.width / 2;
                    const coreY = coreBrick.y + coreBrick.height / 2;
                    const dx = coreX - ball.x;
                    const dy = coreY - ball.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const attraction = 0.1; // Força de atração
                        vx += (dx / distance) * attraction;
                        vy += (dy / distance) * attraction;
                    }
                }
            }
            
            // Atualizar posição
            ball.x += vx;
            ball.y += vy;
            
            // Adicionar ao trail
            ball.trail.push({x: ball.x, y: ball.y});
            if (ball.trail.length > 10) {
                ball.trail.shift();
            }
            
            // Verificar se a bolinha caiu
            if (ball.y > this.height) {
                // Rede de Segurança - barreira temporária
                if (this.activeUpgradeEffects.safetyNet.active && ball.y > this.height - 20) {
                    ball.y = this.height - 20;
                    ball.vy = -Math.abs(ball.vy);
                    this.createParticles(ball.x, ball.y, '#2ecc71');
                }
                // Bolinha Fantasma - primeira queda passa pela parte de baixo
                else if (this.hasUpgrade('ghost_ball') && !ball.ghostUsed) {
                    ball.ghostUsed = true;
                    ball.y = 50; // Reaparecer no topo
                    ball.vy = Math.abs(ball.vy); // Manter direção para baixo
                } else {
                    this.balls.splice(index, 1);
                    if (this.balls.length === 0) {
                        this.loseLife();
                    }
                }
            }
        });
    }
    
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    updatePowerUps() {
        this.powerUps.forEach((powerUp, index) => {
            // Atualizar posição baseada no tipo
            if (powerUp.type === 'charged_shot') {
                powerUp.y += powerUp.vy;
                powerUp.life--;
                
                // Verificar colisão com tijolos
                this.bricks.forEach(brick => {
                    if (!brick.destroyed && 
                        powerUp.x + powerUp.radius > brick.x &&
                        powerUp.x - powerUp.radius < brick.x + brick.width &&
                        powerUp.y + powerUp.radius > brick.y &&
                        powerUp.y - powerUp.radius < brick.y + brick.height) {
                        
                        // Quebrar tijolo
                        brick.destroyed = true;
                        this.money += this.getBrickReward(brick.color);
                        this.updateUI(); // Atualizar UI em tempo real
                        this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, this.getBrickColorValue(brick.color));
                        
                        // Reduzir poder do projétil
                        powerUp.power -= 0.33;
                        if (powerUp.power <= 0) {
                            this.powerUps.splice(index, 1);
                            return;
                        }
                    }
                });
                
                // Remover se sair da tela ou vida acabar
                if (powerUp.y < 0 || powerUp.life <= 0) {
                    this.powerUps.splice(index, 1);
                }
            } else if (powerUp.type === 'cannon_shot') {
                powerUp.y += powerUp.vy;
                powerUp.life--;
                
                // Verificar colisão com tijolos
                this.bricks.forEach(brick => {
                    if (!brick.destroyed && brick.color !== 'red' && // Não pode quebrar o núcleo
                        powerUp.x + powerUp.radius > brick.x &&
                        powerUp.x - powerUp.radius < brick.x + brick.width &&
                        powerUp.y + powerUp.radius > brick.y &&
                        powerUp.y - powerUp.radius < brick.y + brick.height) {
                        
                        // Quebrar tijolo
                        brick.destroyed = true;
                        this.money += this.getBrickReward(brick.color);
                        this.updateUI(); // Atualizar UI em tempo real
                        this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, this.getBrickColorValue(brick.color));
                        
                        // Remover projétil
                        this.powerUps.splice(index, 1);
                        return;
                    }
                });
                
                // Remover se sair da tela ou vida acabar
                if (powerUp.y < 0 || powerUp.life <= 0) {
                    this.powerUps.splice(index, 1);
                }
            } else {
                // Power-ups normais
                powerUp.y += powerUp.speed;
                if (powerUp.y > this.height) {
                    this.powerUps.splice(index, 1);
                }
            }
        });
    }
    
    checkCollisions() {
        this.balls.forEach(ball => {
            // Colisão com paredes
            if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= this.width) {
                ball.vx = -ball.vx;
                ball.x = Math.max(ball.radius, Math.min(this.width - ball.radius, ball.x));
            }
            
            if (ball.y - ball.radius <= 0) {
                ball.vy = -ball.vy;
                ball.y = ball.radius;
            }
            
            // Colisão com paddle
            if (this.checkBallPaddleCollision(ball)) {
                this.handlePaddleCollision(ball);
            }
            
            // Colisão com tijolos
            this.bricks.forEach(brick => {
                if (!brick.destroyed && this.checkBallBrickCollision(ball, brick)) {
                    this.handleBrickCollision(ball, brick);
                }
            });
        });
    }
    
    checkBallPaddleCollision(ball) {
        return ball.x + ball.radius > this.paddle.x &&
               ball.x - ball.radius < this.paddle.x + this.paddle.width &&
               ball.y + ball.radius > this.paddle.y &&
               ball.y - ball.radius < this.paddle.y + this.paddle.height &&
               ball.vy > 0;
    }
    
    checkBallBrickCollision(ball, brick) {
        return ball.x + ball.radius > brick.x &&
               ball.x - ball.radius < brick.x + brick.width &&
               ball.y + ball.radius > brick.y &&
               ball.y - ball.radius < brick.y + brick.height;
    }
    
    handlePaddleCollision(ball) {
        // Resetar efeitos ao tocar no paddle
        this.resetBallEffects();
        
        // Calcular ângulo baseado na posição de impacto
        const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        const angle = hitPos * Math.PI / 3; // Ângulo máximo de 60 graus
        
        let ballSpeed = this.config.ballSpeed;
        
        // Plataforma de Aceleração - verificar se o espaço está apertado
        if (this.hasUpgrade('cushion_paddle')) {
            const spaceApertado = this.isSpaceApertado();
            if (spaceApertado) {
                ballSpeed *= 1.3; // Acelerar 30%
            }
        }
        
        ball.vx = Math.sin(angle) * ballSpeed;
        ball.vy = -Math.abs(Math.cos(angle) * ballSpeed);
        
        // Canhões Acoplados - atirar projéteis
        if (this.hasUpgrade('attached_cannons')) {
            this.powerUps.push({
                x: this.paddle.x + this.paddle.width * 0.25,
                y: this.paddle.y,
                vx: 0,
                vy: -1.0, // Reduzido para manter proporção com nova velocidade da bolinha
                radius: 3,
                type: 'cannon_shot',
                life: 120
            });
            this.powerUps.push({
                x: this.paddle.x + this.paddle.width * 0.75,
                y: this.paddle.y,
                vx: 0,
                vy: -1.0, // Reduzido para manter proporção com nova velocidade da bolinha
                radius: 3,
                type: 'cannon_shot',
                life: 120
            });
        }
        
        // Criar partículas
        this.createParticles(ball.x, ball.y, '#ff6b35');
        
        // Tocar som de batida na plataforma
        this.playSound('paddleHit');
    }
    
    handleBrickCollision(ball, brick) {
        // Verificar upgrades especiais
        let shouldDestroy = true;
        let extraDamage = 0;
        
        // Dano Estrutural - primeira batida no núcleo conta como duas
        if (brick.color === 'red' && this.hasUpgrade('structural_damage') && brick.hits === brick.maxHits) {
            extraDamage = 1;
        }
        
        // Bolinha Perfurante - quebra tijolos azuis sem mudar direção
        if (this.hasUpgrade('piercing_ball') && brick.color === 'blue') {
            brick.destroyed = true;
            this.money += this.getBrickReward(brick.color);
            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, this.getBrickColorValue(brick.color));
            return; // Não muda direção da bolinha
        }
        
        // Aplicar efeito do tijolo (com reversão controlada)
        if (brick.color === 'green' && this.hasUpgrade('controlled_reversal')) {
            if (Math.random() < 0.5) {
                this.applyBrickEffect(brick.color);
            }
        } else {
            this.applyBrickEffect(brick.color);
        }
        
        // Quebrar tijolo
        brick.hits -= (1 + extraDamage);
        if (brick.hits <= 0) {
            brick.destroyed = true;
            let reward = this.getBrickReward(brick.color);
            
            // Aplicar modificadores de dinheiro
            if (this.hasUpgrade('lucky_amulet') && Math.random() < 0.25) {
                reward = Math.floor(reward * 1.25);
            }
            
            // Conversor de Risco - mais dinheiro com efeitos negativos
            if (this.hasUpgrade('risk_converter')) {
                const negativeEffects = (this.ballEffects.inverted ? 1 : 0) + 
                                      (this.ballEffects.zigzag ? 1 : 0) + 
                                      (this.ballEffects.invisible ? 1 : 0);
                reward += negativeEffects;
            }
            
            this.money += reward;
            this.updateUI(); // Atualizar UI em tempo real
            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, this.getBrickColorValue(brick.color));
            
            // Reciclagem - chance de recriar tijolo azul
            if (brick.color === 'blue' && this.hasUpgrade('recycling') && Math.random() < 0.1) {
                setTimeout(() => {
                    brick.destroyed = false;
                    brick.hits = 1;
                }, 1000);
            }
            
            // Verificar se é o tijolo núcleo
            if (brick.color === 'red') {
                this.completePhase();
                return;
            }
        }
        
        // Reverter direção da bolinha
        ball.vy = -ball.vy;
        
        // Bolinha Explosiva - explodir ao atingir tijolo
        if (ball.explosive) {
            this.explodeBall(ball);
            ball.explosive = false;
        }
        
        // Criar partículas
        this.createParticles(ball.x, ball.y, this.getBrickColorValue(brick.color));
        
        // Eco da Bolinha - destruir bloco aleatório adicional
        if (this.hasUpgrade('ball_echo')) {
            const availableBricks = this.bricks.filter(b => !b.destroyed && b.color !== 'red');
            if (availableBricks.length > 0) {
                const randomBrick = availableBricks[Math.floor(Math.random() * availableBricks.length)];
                randomBrick.destroyed = true;
                this.money += this.getBrickReward(randomBrick.color);
                this.createParticles(randomBrick.x + randomBrick.width / 2, randomBrick.y + randomBrick.height / 2, this.getBrickColorValue(randomBrick.color));
            }
        }
        
        // Bolinha Espelhada - destruir bloco simétrico
        if (this.hasUpgrade('mirror_ball')) {
            const centerX = this.width / 2;
            const mirrorX = centerX - (brick.x + brick.width / 2 - centerX);
            
            // Encontrar bloco simétrico
            const mirrorBrick = this.bricks.find(b => 
                !b.destroyed && 
                b.color !== 'red' &&
                Math.abs((b.x + b.width / 2) - mirrorX) < 5 && // Tolerância de 5 pixels
                Math.abs(b.y - brick.y) < 5 // Mesma linha
            );
            
            if (mirrorBrick) {
                mirrorBrick.destroyed = true;
                this.money += this.getBrickReward(mirrorBrick.color);
                this.createParticles(mirrorBrick.x + mirrorBrick.width / 2, mirrorBrick.y + mirrorBrick.height / 2, this.getBrickColorValue(mirrorBrick.color));
            }
        }
        
        // Bolinha da Fortuna - +1 moeda extra
        if (this.hasUpgrade('lucky_ball')) {
            this.money += 1;
        }
        
        // Reforço - destruir bloco de trás
        if (this.hasUpgrade('repulsor_shield')) {
            // Calcular direção da bolinha para determinar qual é o "bloco de trás"
            const ballDirection = ball.vx > 0 ? 1 : -1; // 1 = direita, -1 = esquerda
            const behindX = brick.x + (ballDirection > 0 ? -this.config.brickWidth - this.config.brickSpacing : this.config.brickWidth + this.config.brickSpacing);
            
            // Encontrar bloco de trás
            const behindBrick = this.bricks.find(b => 
                !b.destroyed && 
                b.color !== 'red' &&
                Math.abs(b.x - behindX) < 5 && // Tolerância de 5 pixels
                Math.abs(b.y - brick.y) < 5 // Mesma linha
            );
            
            if (behindBrick) {
                behindBrick.destroyed = true;
                this.money += this.getBrickReward(behindBrick.color);
                this.createParticles(behindBrick.x + behindBrick.width / 2, behindBrick.y + behindBrick.height / 2, this.getBrickColorValue(behindBrick.color));
            }
        }
        
        // Tocar som de batida no tijolo
        this.playSound('brickHit');
    }
    
    hasUpgrade(upgradeId) {
        return this.activeUpgrades.some(upgrade => upgrade.id === upgradeId);
    }
    
    isSpaceApertado() {
        // Verificar se há muitos blocos próximos à plataforma
        const paddleY = this.paddle.y;
        const threshold = 100; // Distância em pixels para considerar "apertado"
        
        // Contar blocos próximos à plataforma
        let blocosProximos = 0;
        this.bricks.forEach(brick => {
            if (!brick.destroyed) {
                const distancia = Math.abs(brick.y + brick.height - paddleY);
                if (distancia < threshold) {
                    blocosProximos++;
                }
            }
        });
        
        // Considerar "apertado" se há mais de 3 blocos próximos
        return blocosProximos > 3;
    }
    
    explodeBall(ball) {
        const explosionRadius = 80;
        
        // Quebrar tijolos próximos
        this.bricks.forEach(brick => {
            if (!brick.destroyed) {
                const dx = (brick.x + brick.width / 2) - ball.x;
                const dy = (brick.y + brick.height / 2) - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= explosionRadius) {
                    brick.destroyed = true;
                    this.money += this.getBrickReward(brick.color);
                    this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, this.getBrickColorValue(brick.color));
                }
            }
        });
        
        // Criar explosão de partículas
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 5 + Math.random() * 5;
            this.particles.push({
                x: ball.x,
                y: ball.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#e74c3c',
                life: 30,
                maxLife: 30,
                alpha: 1,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    activateUpgrade() {
        // Super Ímã
        if (this.hasUpgrade('super_magnet') && !this.activeUpgradeEffects.superMagnet.active) {
            this.activeUpgradeEffects.superMagnet.active = true;
            this.activeUpgradeEffects.superMagnet.timer = this.activeUpgradeEffects.superMagnet.duration;
            this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#3498db');
        }
        
        // Dash de Plataforma
        if (this.hasUpgrade('paddle_dash') && this.activeUpgradeEffects.paddleDash.timer <= 0) {
            this.activeUpgradeEffects.paddleDash.active = true;
            this.activeUpgradeEffects.paddleDash.timer = this.activeUpgradeEffects.paddleDash.cooldown;
            this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#f1c40f');
        }
        
        // Tiro Carregado
        if (this.hasUpgrade('charged_shot') && !this.activeUpgradeEffects.chargedShot.charging) {
            this.activeUpgradeEffects.chargedShot.charging = true;
            this.activeUpgradeEffects.chargedShot.chargeLevel = 0;
        }
        
        // Rede de Segurança
        if (this.hasUpgrade('safety_net') && !this.activeUpgradeEffects.safetyNet.active) {
            this.activeUpgradeEffects.safetyNet.active = true;
            this.activeUpgradeEffects.safetyNet.timer = this.activeUpgradeEffects.safetyNet.duration;
            this.createParticles(this.width / 2, this.height - 20, '#2ecc71');
        }
        
        // Ativador de Efeito
        if (this.hasUpgrade('effect_activator') && !this.activeUpgradeEffects.effectActivator.active) {
            this.activeUpgradeEffects.effectActivator.active = true;
            this.activeUpgradeEffects.effectActivator.timer = this.activeUpgradeEffects.effectActivator.duration;
            // Ativar efeito aleatório
            const effects = ['yellow', 'green', 'purple', 'gray'];
            const randomEffect = effects[Math.floor(Math.random() * effects.length)];
            this.applyBrickEffect(randomEffect);
        }
    }
    
    fireChargedShot() {
        if (this.hasUpgrade('charged_shot') && this.activeUpgradeEffects.chargedShot.charging) {
            const chargeLevel = this.activeUpgradeEffects.chargedShot.chargeLevel;
            const power = Math.min(chargeLevel / this.activeUpgradeEffects.chargedShot.maxCharge, 1);
            
            // Criar projétil carregado
            this.powerUps.push({
                x: this.paddle.x + this.paddle.width / 2,
                y: this.paddle.y,
                vx: 0,
                vy: -1.0, // Reduzido para manter proporção com nova velocidade da bolinha
                radius: 4 + power * 4,
                power: power,
                type: 'charged_shot',
                life: 300
            });
            
            this.activeUpgradeEffects.chargedShot.charging = false;
            this.activeUpgradeEffects.chargedShot.chargeLevel = 0;
        }
    }
    
    getUpgradeIcon(upgradeId) {
        const icons = {
            // Upgrades de Plataforma
            'wide_paddle': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
            </svg>`,
            
            'attached_cannons': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="8" y="20" width="3" height="8" fill="#95a5a6" stroke="#7f8c8d" stroke-width="1"/>
                <rect x="21" y="20" width="3" height="8" fill="#95a5a6" stroke="#7f8c8d" stroke-width="1"/>
                <circle cx="9.5" cy="18" r="2" fill="#e74c3c"/>
                <circle cx="22.5" cy="18" r="2" fill="#e74c3c"/>
            </svg>`,
            
            'super_magnet': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="12" y="18" width="8" height="8" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <circle cx="16" cy="22" r="2" fill="#ffffff"/>
                <path d="M8 12 Q16 8 24 12" stroke="#3498db" stroke-width="2" fill="none"/>
                <path d="M8 20 Q16 16 24 20" stroke="#3498db" stroke-width="2" fill="none"/>
            </svg>`,
            
            'paddle_dash': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <path d="M16 20 L20 16 L16 12 L20 8" stroke="#f1c40f" stroke-width="2" fill="none"/>
                <circle cx="20" cy="8" r="2" fill="#f1c40f"/>
            </svg>`,
            
            'cushion_paddle': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Plataforma -->
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                
                <!-- Blocos próximos (espaço apertado) -->
                <rect x="4" y="20" width="6" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <rect x="12" y="18" width="6" height="4" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <rect x="20" y="20" width="6" height="4" fill="#2ecc71" stroke="#27ae60" stroke-width="1"/>
                
                <!-- Bolinha acelerada -->
                <circle cx="16" cy="14" r="3" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
                
                <!-- Linhas de velocidade -->
                <path d="M13 14 L10 12" stroke="#f1c40f" stroke-width="2" fill="none"/>
                <path d="M19 14 L22 12" stroke="#f1c40f" stroke-width="2" fill="none"/>
                <path d="M16 11 L16 8" stroke="#f1c40f" stroke-width="2" fill="none"/>
                
                <!-- Indicador de aceleração -->
                <text x="16" y="6" text-anchor="middle" font-family="Arial" font-size="4" fill="#f1c40f">+30%</text>
            </svg>`,
            
            'repulsor_shield': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Plataforma reforçada (2x mais alta) -->
                <rect x="2" y="20" width="28" height="8" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="2" y="16" width="28" height="4" fill="#e17055" stroke="#d63031" stroke-width="1"/>
                <rect x="2" y="12" width="28" height="4" fill="#d63031" stroke="#d63031" stroke-width="1"/>
                
                <!-- Blocos sendo destruídos -->
                <rect x="4" y="6" width="6" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <rect x="12" y="6" width="6" height="4" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <rect x="20" y="6" width="6" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                
                <!-- Seta indicando destruição em cadeia -->
                <path d="M10 8 L14 8" stroke="#ffffff" stroke-width="2" fill="none"/>
                <path d="M18 8 L22 8" stroke="#ffffff" stroke-width="2" fill="none"/>
                <path d="M12 6 L12 4" stroke="#ffffff" stroke-width="1" fill="none"/>
                <path d="M20 6 L20 4" stroke="#ffffff" stroke-width="1" fill="none"/>
            </svg>`,
            
            'charged_shot': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="14" y="12" width="4" height="12" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <circle cx="16" cy="10" r="3" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
                <path d="M16 7 L18 5 L14 5 Z" fill="#e67e22"/>
            </svg>`,
            
            // Upgrades de Bolinha
            'piercing_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <rect x="4" y="14" width="24" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <rect x="4" y="15" width="24" height="2" fill="#5dade2"/>
            </svg>`,
            
            'friction_field': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <path d="M8 8 Q16 12 24 8" stroke="#95a5a6" stroke-width="2" fill="none"/>
                <path d="M8 12 Q16 16 24 12" stroke="#95a5a6" stroke-width="2" fill="none"/>
                <path d="M8 16 Q16 20 24 16" stroke="#95a5a6" stroke-width="2" fill="none"/>
                <path d="M8 20 Q16 24 24 20" stroke="#95a5a6" stroke-width="2" fill="none"/>
            </svg>`,
            
            'ghost_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <path d="M10 16 Q16 12 22 16" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5"/>
                <path d="M10 20 Q16 16 22 20" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5"/>
                <path d="M10 24 Q16 20 22 24" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5"/>
            </svg>`,
            
            'multi_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="12" cy="16" r="4" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1"/>
                <circle cx="20" cy="16" r="4" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1"/>
                <path d="M12 12 Q16 8 20 12" stroke="#ff6b35" stroke-width="1" fill="none"/>
                <path d="M12 20 Q16 24 20 20" stroke="#ff6b35" stroke-width="1" fill="none"/>
            </svg>`,
            
            'explosive_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <path d="M16 4 L18 6 L16 8 L14 6 Z" fill="#e74c3c"/>
                <path d="M28 16 L26 18 L24 16 L26 14 Z" fill="#e74c3c"/>
                <path d="M16 28 L14 26 L16 24 L18 26 Z" fill="#e74c3c"/>
                <path d="M4 16 L6 14 L8 16 L6 18 Z" fill="#e74c3c"/>
                <path d="M22 6 L24 8 L22 10 L20 8 Z" fill="#f39c12"/>
                <path d="M26 22 L24 20 L26 18 L28 20 Z" fill="#f39c12"/>
                <path d="M10 26 L8 24 L10 22 L12 24 Z" fill="#f39c12"/>
                <path d="M6 10 L4 8 L6 6 L8 8 Z" fill="#f39c12"/>
            </svg>`,
            
            'ball_echo': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <circle cx="16" cy="16" r="4" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1" opacity="0.5"/>
                <circle cx="16" cy="16" r="2" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1" opacity="0.3"/>
            </svg>`,
            
            'effect_activator': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <rect x="14" y="8" width="4" height="2" fill="#9b59b6"/>
                <rect x="14" y="22" width="4" height="2" fill="#2ecc71"/>
                <rect x="8" y="14" width="2" height="4" fill="#f1c40f"/>
                <rect x="22" y="14" width="2" height="4" fill="#95a5a6"/>
            </svg>`,
            
            'mirror_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <rect x="4" y="8" width="6" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <rect x="22" y="8" width="6" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <rect x="4" y="20" width="6" height="4" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <rect x="22" y="20" width="6" height="4" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <path d="M16 4 L16 28" stroke="#ffffff" stroke-width="2"/>
            </svg>`,
            
            'lucky_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
                <path d="M16 6 C12 6, 8 10, 8 16 C8 22, 16 28, 16 28 C16 28, 24 22, 24 16 C24 10, 20 6, 16 6 Z" fill="#e67e22" stroke="#d35400" stroke-width="1"/>
                <circle cx="16" cy="16" r="2" fill="#ffffff"/>
                <text x="16" y="19" text-anchor="middle" font-family="Arial" font-size="6" fill="#2c3e50">$</text>
            </svg>`,
            
            // Upgrades de Utilidade
            'extra_life': `<svg width="32" height="32" viewBox="0 0 32 32">
                <path d="M16 6 C12 6, 8 10, 8 16 C8 22, 16 28, 16 28 C16 28, 24 22, 24 16 C24 10, 20 6, 16 6 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <path d="M16 8 C13 8, 10 11, 10 16 C10 21, 16 26, 16 26 C16 26, 22 21, 22 16 C22 11, 19 8, 16 8 Z" fill="#ff6b35"/>
            </svg>`,
            
            'safety_net': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <path d="M4 24 L28 24" stroke="#2ecc71" stroke-width="2"/>
                <path d="M6 22 L26 22" stroke="#2ecc71" stroke-width="2"/>
                <path d="M8 20 L24 20" stroke="#2ecc71" stroke-width="2"/>
                <path d="M10 18 L22 18" stroke="#2ecc71" stroke-width="2"/>
                <path d="M12 16 L20 16" stroke="#2ecc71" stroke-width="2"/>
            </svg>`,
            
            'lucky_amulet': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="8" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
                <path d="M16 8 L18 12 L22 12 L19 15 L20 19 L16 17 L12 19 L13 15 L10 12 L14 12 Z" fill="#e67e22"/>
                <circle cx="16" cy="16" r="2" fill="#ffffff"/>
            </svg>`,
            
            'life_insurance': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="8" y="12" width="16" height="12" fill="#3498db" stroke="#2980b9" stroke-width="2"/>
                <rect x="10" y="14" width="12" height="8" fill="#5dade2"/>
                <path d="M16 6 L18 8 L16 10 L14 8 Z" fill="#f1c40f"/>
                <rect x="14" y="18" width="4" height="2" fill="#ffffff"/>
                <rect x="14" y="20" width="4" height="2" fill="#ffffff"/>
            </svg>`,
            
            'recycling': `<svg width="32" height="32" viewBox="0 0 32 32">
                <path d="M8 12 L12 8 L16 12 L20 8 L24 12 L20 16 L16 12 L12 16 Z" fill="#2ecc71" stroke="#27ae60" stroke-width="1"/>
                <path d="M8 20 L12 16 L16 20 L20 16 L24 20 L20 24 L16 20 L12 24 Z" fill="#2ecc71" stroke="#27ae60" stroke-width="1" opacity="0.5"/>
            </svg>`,
            
            'risk_converter': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="8" fill="#9b59b6" stroke="#8e44ad" stroke-width="2"/>
                <path d="M12 12 L20 20 M20 12 L12 20" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="16" r="2" fill="#ffffff"/>
            </svg>`,
            
            // Upgrades "Quebra-Regras"
            'structural_damage': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="8" y="8" width="16" height="16" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
                <path d="M10 10 L22 22 M22 10 L10 22" stroke="#ffffff" stroke-width="2"/>
                <rect x="12" y="12" width="8" height="8" fill="#c0392b"/>
            </svg>`,
            
            'heat_vision': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <path d="M10 16 Q16 12 22 16" stroke="#ff0000" stroke-width="2" fill="none"/>
                <path d="M10 18 Q16 14 22 18" stroke="#ff4400" stroke-width="2" fill="none"/>
                <path d="M10 20 Q16 16 22 20" stroke="#ff8800" stroke-width="2" fill="none"/>
                <path d="M10 22 Q16 18 22 22" stroke="#ffaa00" stroke-width="2" fill="none"/>
            </svg>`,
            
            'controlled_reversal': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <path d="M10 16 L22 16" stroke="#2ecc71" stroke-width="2"/>
                <path d="M16 10 L16 22" stroke="#2ecc71" stroke-width="2"/>
                <circle cx="16" cy="16" r="2" fill="#2ecc71"/>
            </svg>`,
            
            'core_attractor': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="6" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <rect x="14" y="6" width="4" height="2" fill="#e74c3c"/>
                <rect x="14" y="24" width="4" height="2" fill="#e74c3c"/>
                <rect x="6" y="14" width="2" height="4" fill="#e74c3c"/>
                <rect x="24" y="14" width="2" height="4" fill="#e74c3c"/>
                <path d="M16 8 L16 6 M16 24 L16 26 M8 16 L6 16 M24 16 L26 16" stroke="#e74c3c" stroke-width="1"/>
            </svg>`,
            
            'investor': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="8" y="12" width="16" height="12" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
                <rect x="10" y="14" width="12" height="8" fill="#ffffff"/>
                <rect x="12" y="16" width="8" height="2" fill="#f1c40f"/>
                <rect x="12" y="18" width="8" height="2" fill="#f1c40f"/>
                <rect x="12" y="20" width="8" height="2" fill="#f1c40f"/>
                <path d="M16 6 L18 8 L16 10 L14 8 Z" fill="#e74c3c"/>
            </svg>`,
            'money_saver': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="6" y="8" width="20" height="16" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/>
                <rect x="8" y="10" width="16" height="12" fill="#ffffff"/>
                <circle cx="16" cy="16" r="4" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
                <text x="16" y="19" text-anchor="middle" font-family="Arial" font-size="8" fill="#2c3e50">$</text>
                <rect x="14" y="4" width="4" height="2" fill="#95a5a6"/>
            </svg>`
        };
        
        return icons[upgradeId] || `<svg width="32" height="32" viewBox="0 0 32 32">
            <rect x="8" y="8" width="16" height="16" fill="#95a5a6" stroke="#7f8c8d" stroke-width="2"/>
        </svg>`;
    }
    
    applyBrickEffect(color) {
        switch (color) {
            case 'blue':
                // Efeito padrão - nenhum
                break;
            case 'yellow':
                // Só aplica se não estiver já ativo
                if (this.ballEffects.speedMultiplier <= 1) {
                    this.ballEffects.speedMultiplier *= 1.4;
                }
                break;
            case 'green':
                // Inverter direção horizontal (sempre alterna)
                this.ballEffects.inverted = !this.ballEffects.inverted;
                break;
            case 'purple':
                // Zigue-zague - só aplica se não estiver já ativo
                if (!this.ballEffects.zigzag) {
                    this.ballEffects.zigzag = true;
                    this.ballEffects.zigzagTimer = 0;
                }
                break;
            case 'gray':
                // Invisibilidade - só aplica se não estiver já ativo
                if (!this.ballEffects.invisible) {
                    this.ballEffects.invisible = true;
                    this.ballEffects.invisibleTimer = 120; // 2 segundos a 60fps
                    this.ballEffects.invisibleCycle = 1; // Começar invisível
                }
                break;
        }
    }
    
    getBrickReward(color) {
        const rewards = {
            'blue': 1,
            'yellow': 3,
            'green': 1,
            'purple': 3, // Aumentado de 1 para 3 moedas
            'gray': 3,
            'red': 10
        };
        return rewards[color] || 1;
    }
    
    getBrickColorValue(color) {
        const colors = {
            'blue': '#3498db',
            'yellow': '#f1c40f',
            'green': '#2ecc71',
            'purple': '#9b59b6',
            'gray': '#95a5a6',
            'red': '#e74c3c'
        };
        return colors[color] || '#ffffff';
    }
    
    resetBallEffects() {
        this.ballEffects = {
            speedMultiplier: 1,
            inverted: false,
            zigzag: false,
            invisible: false,
            invisibleTimer: 0,
            invisibleCycle: 0,
            zigzagTimer: 0
        };
    }
    
    updateBallEffects() {
        // Atualizar timer de invisibilidade com ciclo
        if (this.ballEffects.invisibleTimer > 0) {
            this.ballEffects.invisibleTimer--;
            
            if (this.ballEffects.invisibleCycle === 1) {
                // Fase invisível (2 segundos)
                if (this.ballEffects.invisibleTimer <= 0) {
                    this.ballEffects.invisibleCycle = 0; // Mudar para visível
                    this.ballEffects.invisibleTimer = 120; // 2 segundos visível
                }
            } else {
                // Fase visível (2 segundos)
                if (this.ballEffects.invisibleTimer <= 0) {
                    this.ballEffects.invisibleCycle = 1; // Mudar para invisível
                    this.ballEffects.invisibleTimer = 120; // 2 segundos invisível
                }
            }
            
            // A bolinha está invisível apenas quando está no ciclo 1
            this.ballEffects.invisible = this.ballEffects.invisibleCycle === 1;
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: color,
                life: 30,
                maxLife: 30,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    loseLife() {
        this.lives--;
        
        // Perder 10 moedas ao perder vida
        this.money = Math.max(0, this.money - 10);
        
        // Seguro de Vida - ganhar 20 moedas ao invés de perder
        if (this.hasUpgrade('life_insurance')) {
            this.money += 20;
        }
        
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Recriar bolinha (presa à plataforma)
            this.balls = [{
                x: this.width / 2,
                y: this.height - 100,
                vx: 0,
                vy: 0,
                radius: this.config.ballRadius,
                visible: true,
                trail: [],
                attached: true // Nova bolinha presa à plataforma
            }];
            this.resetBallEffects();
        }
    }
    
    completePhase() {
        this.gameRunning = false;
        this.showUpgradeScreen();
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Limpar estado da bolinha eco
        this.upgradeTimers.ballEcho.active = false;
        this.upgradeTimers.ballEcho.echoBall = null;
        
        // Atualizar recorde
        if (this.currentPhase > this.highScore) {
            this.highScore = this.currentPhase;
            localStorage.setItem('brickRogueHighScore', this.highScore.toString());
        }
        
        document.getElementById('finalPhase').textContent = this.currentPhase;
        document.getElementById('finalRecord').textContent = this.highScore;
        this.showScreen('gameOverScreen');
    }
    
    showUpgradeScreen() {
        this.generateUpgradeOptions();
        this.updateUI(); // Atualizar UI para mostrar dinheiro atual
        this.showScreen('upgradeScreen');
    }
    
    generateUpgradeOptions() {
        const upgradesGrid = document.getElementById('upgradesGrid');
        upgradesGrid.innerHTML = '';
        
        const availableUpgrades = this.getAvailableUpgrades();
        const selectedUpgrades = [];
        
        // Gerar 3 upgrades aleatórios
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            const upgrade = availableUpgrades[randomIndex];
            selectedUpgrades.push(upgrade);
            availableUpgrades.splice(randomIndex, 1);
        }
        
        selectedUpgrades.forEach(upgrade => {
            const upgradeCard = document.createElement('div');
            upgradeCard.className = 'upgrade-card';
            upgradeCard.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.description}</div>
                <div class="upgrade-price">${upgrade.price} 🪙</div>
            `;
            
            upgradeCard.addEventListener('click', () => {
                this.selectUpgrade(upgrade, upgradeCard);
            });
            
            upgradesGrid.appendChild(upgradeCard);
        });
    }
    
    getAvailableUpgrades() {
        // Lista completa de todos os 25 upgrades
        return [
            // Upgrades de Plataforma (1-7)
            {
                id: 'wide_paddle',
                name: 'Plataforma Larga',
                description: 'Aumenta o tamanho da plataforma em 50%',
                price: 120,
                type: 'paddle',
                icon: this.getUpgradeIcon('wide_paddle')
            },
            {
                id: 'attached_cannons',
                name: 'Canhões Acoplados',
                description: 'A plataforma atira 2 projéteis para frente quando a bolinha bate nela',
                price: 100,
                type: 'paddle',
                icon: this.getUpgradeIcon('attached_cannons')
            },
            {
                id: 'super_magnet',
                name: 'Super Ímã',
                description: 'Pressione um botão para criar um campo magnético que puxa a bolinha por 2 segundos',
                price: 120,
                type: 'paddle',
                icon: this.getUpgradeIcon('super_magnet')
            },
            {
                id: 'paddle_dash',
                name: 'Dash de Plataforma',
                description: 'Permite um movimento rápido (dash) para a esquerda ou direita uma vez a cada 5 segundos',
                price: 80,
                type: 'paddle',
                icon: this.getUpgradeIcon('paddle_dash')
            },
            {
                id: 'cushion_paddle',
                name: 'Plataforma de Aceleração',
                description: 'Quando o espaço estiver apertado, a bolinha acelera 30% ao bater na plataforma',
                price: 70,
                type: 'paddle',
                icon: this.getUpgradeIcon('cushion_paddle')
            },
            {
                id: 'repulsor_shield',
                name: 'Reforço',
                description: 'A plataforma fica 2x mais alta e a bolinha destrói o bloco atingido e o bloco de trás',
                price: 80,
                type: 'paddle',
                icon: this.getUpgradeIcon('repulsor_shield')
            },
            {
                id: 'charged_shot',
                name: 'Tiro Carregado',
                description: 'Segure um botão para carregar um projétil maior e mais poderoso que perfura até 3 tijolos',
                price: 90,
                type: 'paddle',
                icon: this.getUpgradeIcon('charged_shot')
            },
            
            // Upgrades de Bolinha (8-14)
            {
                id: 'piercing_ball',
                name: 'Bolinha Perfurante',
                description: 'A bolinha quebra 1 tijolo comum (azul) sem mudar de direção',
                price: 80,
                type: 'ball',
                icon: this.getUpgradeIcon('piercing_ball')
            },
            {
                id: 'friction_field',
                name: 'Campo de Fricção',
                description: 'Deixa a bolinha 10% mais lenta',
                price: 120,
                type: 'ball',
                icon: this.getUpgradeIcon('friction_field')
            },
            {
                id: 'ghost_ball',
                name: 'Bolinha Fantasma',
                description: 'A primeira vez que a bolinha for cair, ela passa pela parte de baixo e reaparece no topo',
                price: 100,
                type: 'ball',
                icon: this.getUpgradeIcon('ghost_ball')
            },
            {
                id: 'multi_ball',
                name: 'Multi-bola',
                description: 'Adiciona uma nova bolinha a cada 1 minuto de jogo',
                price: 120,
                type: 'ball',
                icon: this.getUpgradeIcon('multi_ball')
            },
            {
                id: 'explosive_ball',
                name: 'Bolinha Explosiva',
                description: 'A bolinha explode ao atingir um tijolo, destruindo tijolos adjacentes em uma pequena área',
                price: 80,
                type: 'ball',
                icon: this.getUpgradeIcon('explosive_ball')
            },
            {
                id: 'ball_echo',
                name: 'Eco da Bolinha',
                description: 'Uma segunda bolinha "eco" segue a trajetória da principal com um pequeno atraso',
                price: 70,
                type: 'ball',
                icon: this.getUpgradeIcon('ball_echo')
            },
            {
                id: 'effect_activator',
                name: 'Ativador de Efeito',
                description: 'Permite que o jogador escolha e ative um dos efeitos dos tijolos na bolinha por 10 segundos',
                price: 110,
                type: 'ball',
                icon: this.getUpgradeIcon('effect_activator')
            },
            {
                id: 'mirror_ball',
                name: 'Bolinha Espelhada',
                description: 'Quando a bolinha destrói um bloco, também destrói o bloco simetricamente posicionado do outro lado da tela',
                price: 90,
                type: 'ball',
                icon: this.getUpgradeIcon('mirror_ball')
            },
            {
                id: 'lucky_ball',
                name: 'Bolinha da Fortuna',
                description: 'A bolinha fica dourada e ganha +1 moeda extra por cada bloco quebrado',
                price: 85,
                type: 'ball',
                icon: this.getUpgradeIcon('lucky_ball')
            },
            
            // Upgrades de Utilidade e Defesa (15-20)
            {
                id: 'extra_life',
                name: 'Coração Extra',
                description: 'Permite ter uma vida a mais',
                price: 100,
                type: 'utility',
                icon: this.getUpgradeIcon('extra_life')
            },
            {
                id: 'safety_net',
                name: 'Rede de Segurança',
                description: 'Uma barreira de energia temporária aparece na parte inferior da tela por 15 segundos',
                price: 120,
                type: 'utility',
                icon: this.getUpgradeIcon('safety_net')
            },
            {
                id: 'lucky_amulet',
                name: 'Amuleto da Sorte',
                description: 'Aumenta a chance de obter mais dinheiro por tijolo quebrado (+25%)',
                price: 80,
                type: 'utility',
                icon: this.getUpgradeIcon('lucky_amulet')
            },
            {
                id: 'life_insurance',
                name: 'Seguro de Vida',
                description: 'Ao perder uma vida, ganha 20 moedas ao invés de perder 10',
                price: 70,
                type: 'utility',
                icon: this.getUpgradeIcon('life_insurance')
            },
            {
                id: 'recycling',
                name: 'Reciclagem',
                description: 'Tijolos azuis (comuns) têm 10% de chance de reaparecer após serem quebrados',
                price: 100,
                type: 'utility',
                icon: this.getUpgradeIcon('recycling')
            },
            {
                id: 'risk_converter',
                name: 'Conversor de Risco',
                description: 'Cada efeito negativo ativo na bolinha aumenta o dinheiro ganho por tijolo em +1',
                price: 120,
                type: 'utility',
                icon: this.getUpgradeIcon('risk_converter')
            },
            
            // Upgrades "Quebra-Regras" (21-25)
            {
                id: 'structural_damage',
                name: 'Dano Estrutural',
                description: 'A primeira batida no Tijolo Núcleo conta como duas',
                price: 80,
                type: 'special',
                icon: this.getUpgradeIcon('structural_damage')
            },
            {
                id: 'heat_vision',
                name: 'Visão de Calor',
                description: 'A bolinha invisível deixa um rastro térmico muito mais visível',
                price: 80,
                type: 'special',
                icon: this.getUpgradeIcon('heat_vision')
            },
            {
                id: 'controlled_reversal',
                name: 'Reversão Controlada',
                description: 'O efeito de Inversão do tijolo verde só acontece 50% das vezes',
                price: 100,
                type: 'special',
                icon: this.getUpgradeIcon('controlled_reversal')
            },
            {
                id: 'core_attractor',
                name: 'Atrator de Núcleo',
                description: 'A bolinha é levemente atraída magneticamente em direção ao Tijolo Núcleo',
                price: 70,
                type: 'special',
                icon: this.getUpgradeIcon('core_attractor')
            },
            {
                id: 'investor',
                name: 'Investidor',
                description: 'Sacrifique uma vida no início da fase para começar com 50 moedas',
                price: 0,
                type: 'special',
                icon: this.getUpgradeIcon('investor')
            },
            {
                id: 'money_saver',
                name: 'Poupança',
                description: 'Mantém até 50 moedas para a próxima fase',
                price: 80,
                type: 'passive',
                icon: this.getUpgradeIcon('money_saver')
            }
        ];
    }
    
    selectUpgrade(upgrade, cardElement) {
        if (this.money >= upgrade.price) {
            this.money -= upgrade.price;
            this.updateUI(); // Atualizar UI em tempo real
            this.activeUpgrades.push(upgrade);
            cardElement.classList.add('selected');
            this.updateUI();
            
            // Aplicar upgrade imediatamente se for do tipo especial
            if (upgrade.id === 'investor') {
                this.lives--;
                this.money += 50;
                this.updateUI();
            }
        }
    }
    
    applyUpgrades() {
        this.activeUpgrades.forEach(upgrade => {
            switch (upgrade.id) {
                case 'wide_paddle':
                    this.paddle.width = this.config.paddleWidth * 1.5;
                    break;
                case 'repulsor_shield':
                    // Reforço - plataforma 2x mais alta
                    this.paddle.height = this.config.paddleHeight * 2;
                    break;
                case 'multi_ball':
                    // Multi-bola agora é gerenciado pelo updateMultiBall()
                    // Inicializar timer para primeira bola extra
                    this.lastMultiBallTime = this.gameTime;
                    break;
                case 'extra_life':
                    this.lives++;
                    break;
                case 'friction_field':
                    this.ballEffects.speedMultiplier *= 0.9;
                    break;
                case 'heat_vision':
                    // Implementar rastro térmico mais visível
                    break;
                case 'controlled_reversal':
                    // Implementar reversão controlada
                    break;
                case 'core_attractor':
                    // Implementar atração magnética
                    break;
            }
        });
    }
    
    checkUpgradeEffects() {
        this.activeUpgrades.forEach(upgrade => {
            switch (upgrade.id) {
                case 'lucky_amulet':
                    // Aumentar chance de mais dinheiro
                    break;
                case 'recycling':
                    // Chance de reciclar tijolos azuis
                    break;
                case 'risk_converter':
                    // Aumentar dinheiro baseado em efeitos negativos
                    break;
                case 'life_insurance':
                    // Proteger dinheiro ao perder vida
                    break;
            }
        });
    }
    
    continueToNextPhase() {
        this.currentPhase++;
        this.resetBallEffects();
        
        // Zerar dinheiro após comprar upgrades (não cumulativo)
        // Exceto se tiver o upgrade "Poupança"
        if (!this.hasUpgrade('money_saver')) {
            this.money = 0;
        } else {
            // Manter apenas 50 moedas se tiver o upgrade
            this.money = Math.min(this.money, 50);
        }
        
        this.initGameObjects();
        this.applyUpgrades(); // Aplicar upgrades antes de iniciar a fase
        this.generateBricks();
        this.gameRunning = true;
        this.showScreen('gameScreen');
        this.updateUI();
        this.gameLoop();
    }
    
    updateUI() {
        document.getElementById('currentPhase').textContent = this.currentPhase;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('money').textContent = this.money;
        
        // Atualizar dinheiro na loja
        const shopMoneyElement = document.getElementById('shopMoney');
        if (shopMoneyElement) {
            shopMoneyElement.textContent = this.money;
        }
        
        // Atualizar vidas
        const livesElement = document.getElementById('lives');
        livesElement.innerHTML = '♥️'.repeat(this.lives);
    }
    
    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Desenhar tijolos
        this.bricks.forEach(brick => {
            if (!brick.destroyed) {
                this.drawBrick(brick);
            }
        });
        
        // Desenhar paddle
        this.drawPaddle();
        
        // Desenhar bolinhas
        this.balls.forEach(ball => {
            this.drawBall(ball);
        });
        
        // Desenhar bolinha eco
        if (this.upgradeTimers.ballEcho.active && this.upgradeTimers.ballEcho.echoBall) {
            this.drawEchoBall(this.upgradeTimers.ballEcho.echoBall);
        }
        
        // Desenhar partículas
        this.particles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        // Desenhar power-ups
        this.powerUps.forEach(powerUp => {
            this.drawPowerUp(powerUp);
        });
        
        // Desenhar efeitos visuais dos upgrades
        this.drawUpgradeEffects();
    }
    
    drawBrick(brick) {
        const color = this.getBrickColorValue(brick.color);
        
        // Desenhar tijolo com efeito 2.5D
        this.ctx.fillStyle = color;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Borda superior e esquerda (mais clara)
        this.ctx.fillStyle = this.lightenColor(color, 0.3);
        this.ctx.fillRect(brick.x, brick.y, brick.width, 2);
        this.ctx.fillRect(brick.x, brick.y, 2, brick.height);
        
        // Borda inferior e direita (mais escura)
        this.ctx.fillStyle = this.darkenColor(color, 0.3);
        this.ctx.fillRect(brick.x, brick.y + brick.height - 2, brick.width, 2);
        this.ctx.fillRect(brick.x + brick.width - 2, brick.y, 2, brick.height);
        
        // Mostrar rachaduras se for o tijolo núcleo
        if (brick.color === 'red' && brick.hits < brick.maxHits) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            const crackCount = brick.maxHits - brick.hits;
            for (let i = 0; i < crackCount; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(brick.x + (i + 1) * brick.width / (crackCount + 1), brick.y);
                this.ctx.lineTo(brick.x + (i + 1) * brick.width / (crackCount + 1), brick.y + brick.height);
                this.ctx.stroke();
            }
        }
    }
    
    drawPaddle() {
        const color = '#ff6b35';
        
        // Desenhar paddle com efeito 2.5D
        this.ctx.fillStyle = color;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Borda superior (mais clara)
        this.ctx.fillStyle = this.lightenColor(color, 0.3);
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, 2);
        
        // Borda inferior (mais escura)
        this.ctx.fillStyle = this.darkenColor(color, 0.3);
        this.ctx.fillRect(this.paddle.x, this.paddle.y + this.paddle.height - 2, this.paddle.width, 2);
    }
    
    drawBall(ball) {
        // Se a bolinha está presa, mostrar indicador visual
        if (ball.attached) {
            // Desenhar linha conectando a bolinha ao paddle
            this.ctx.strokeStyle = '#ff6b35';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(ball.x, ball.y);
            this.ctx.lineTo(this.paddle.x + this.paddle.width / 2, this.paddle.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Desenhar texto "ESPAÇO" acima da bolinha
            this.ctx.fillStyle = '#ff6b35';
            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ESPAÇO', ball.x, ball.y - 20);
        }
        
        // Verificar invisibilidade - bolinha 100% invisível
        if (this.ballEffects.invisible) {
            // Visão de Calor - rastro térmico mais visível
            if (this.hasUpgrade('heat_vision')) {
                // Desenhar rastro térmico intenso
                ball.trail.forEach((point, index) => {
                    const alpha = (index / ball.trail.length) * 0.8;
                    const heatGradient = this.ctx.createRadialGradient(
                        point.x, point.y, 0,
                        point.x, point.y, ball.radius * 2
                    );
                    heatGradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
                    heatGradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.7})`);
                    heatGradient.addColorStop(1, `rgba(255, 200, 0, ${alpha * 0.3})`);
                    
                    this.ctx.fillStyle = heatGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, ball.radius * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                
                // Desenhar contorno da bolinha invisível
                this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            // Se não tem visão de calor, bolinha fica 100% invisível (não desenha nada)
            return;
        }
        
        // Desenhar bolinha com efeito 2.5D
        const gradient = this.ctx.createRadialGradient(
            ball.x - ball.radius / 3, ball.y - ball.radius / 3, 0,
            ball.x, ball.y, ball.radius
        );
        
        // Bolinha da Fortuna - cor dourada
        if (this.hasUpgrade('lucky_ball')) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#f1c40f');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#fdcb6e');
            gradient.addColorStop(1, '#ff6b35');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borda
        if (this.hasUpgrade('lucky_ball')) {
            this.ctx.strokeStyle = '#d35400';
        } else {
            this.ctx.strokeStyle = '#d63031';
        }
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Desenhar trail
        ball.trail.forEach((point, index) => {
            const alpha = index / ball.trail.length;
            if (this.hasUpgrade('lucky_ball')) {
                this.ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.5})`;
            } else {
                this.ctx.fillStyle = `rgba(255, 107, 53, ${alpha * 0.5})`;
            }
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, ball.radius * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawPowerUp(powerUp) {
        if (powerUp.type === 'charged_shot') {
            // Desenhar projétil carregado
            const gradient = this.ctx.createRadialGradient(
                powerUp.x, powerUp.y, 0,
                powerUp.x, powerUp.y, powerUp.radius
            );
            gradient.addColorStop(0, '#f1c40f');
            gradient.addColorStop(0.7, '#e67e22');
            gradient.addColorStop(1, '#d35400');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borda
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (powerUp.type === 'cannon_shot') {
            // Desenhar projétil de canhão
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borda
            this.ctx.strokeStyle = '#c0392b';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    drawUpgradeEffects() {
        // Rede de Segurança
        if (this.activeUpgradeEffects.safetyNet.active) {
            this.ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height - 20);
            this.ctx.lineTo(this.width, this.height - 20);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Super Ímã - campo magnético
        if (this.activeUpgradeEffects.superMagnet.active) {
            const centerX = this.paddle.x + this.paddle.width / 2;
            const centerY = this.paddle.y - 20;
            
            // Desenhar linhas de campo magnético
            this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const startX = centerX + Math.cos(angle) * 30;
                const startY = centerY + Math.sin(angle) * 30;
                const endX = centerX + Math.cos(angle) * 60;
                const endY = centerY + Math.sin(angle) * 60;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        }
        
        // Tiro Carregado - indicador de carregamento
        if (this.activeUpgradeEffects.chargedShot.charging) {
            const chargeLevel = this.activeUpgradeEffects.chargedShot.chargeLevel / this.activeUpgradeEffects.chargedShot.maxCharge;
            const barWidth = 100;
            const barHeight = 10;
            const barX = this.width - barWidth - 20;
            const barY = 20;
            
            // Fundo da barra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Barra de carregamento
            this.ctx.fillStyle = `hsl(${chargeLevel * 120}, 100%, 50%)`;
            this.ctx.fillRect(barX, barY, barWidth * chargeLevel, barHeight);
            
            // Borda
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Dash de Plataforma - efeito de velocidade
        if (this.activeUpgradeEffects.paddleDash.active) {
            // Desenhar rastros de velocidade
            for (let i = 0; i < 5; i++) {
                this.ctx.fillStyle = `rgba(241, 196, 15, ${0.3 - i * 0.05})`;
                this.ctx.fillRect(
                    this.paddle.x - i * 10,
                    this.paddle.y + this.paddle.height / 2 - 2,
                    this.paddle.width + i * 5,
                    4
                );
            }
        }
    }
    
    drawEchoBall(echoBall) {
        // Desenhar bolinha eco com transparência
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        
        const gradient = this.ctx.createRadialGradient(
            echoBall.x - echoBall.radius / 3, echoBall.y - echoBall.radius / 3, 0,
            echoBall.x, echoBall.y, echoBall.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#fdcb6e');
        gradient.addColorStop(1, '#ff6b35');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(echoBall.x, echoBall.y, echoBall.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borda
        this.ctx.strokeStyle = '#d63031';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
}

// Inicializar jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
