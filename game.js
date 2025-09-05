// Brick Rogue: O Desafio dos Efeitos
// Engine principal do jogo

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Otimizações do contexto 2D
        this.ctx.imageSmoothingEnabled = false; // Desabilitar suavização para melhor performance
        this.ctx.textBaseline = 'top';
        
        // Sistema de delta time para FPS independente
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS; // Tempo por frame em ms
        this.accumulator = 0;
        this.maxFPS = 120; // FPS máximo para evitar consumo excessivo
        this.minFrameTime = 1000 / this.maxFPS;
        
        // Otimizações de renderização
        this.needsRedraw = true;
        this.lastRenderTime = 0;
        
        // Sistema de monitoramento de FPS (opcional)
        this.fps = 0;
        this.frameCount = 0;
        this.fpsLastTime = 0;
        
        // Estado do jogo
        this.currentScreen = 'mainMenu';
        this.currentPhase = 1;
        this.highScore = parseInt(localStorage.getItem('brickRogueHighScore')) || 1;
        this.money = 0;
        this.lives = 3;
        this.maxLives = 4;
        this.shopPurchases = []; // Rastrear compras na loja atual

        // Funções auxiliares para limite de vidas
        this.getMaxLivesCap = () => {
            // Regra: sem Investidor => 4; com Investidor => 2; com Investidor + Coração Extra => 3
            if (this.hasUpgrade && this.hasUpgrade('investor')) {
                return this.hasUpgrade('extra_life') ? 3 : 2;
            }
            return 4;
        };
        this.updateMaxLivesAndClamp = () => {
            this.maxLives = this.getMaxLivesCap();
            if (this.lives > this.maxLives) {
                this.lives = this.maxLives;
            }
        };
        
        // Controle da Bolinha Fantasma
        this.ghostBallUsedThisPhase = false;
        
        // Contador de tijolos atual
        this.currentBrickCount = {
            blue: 0,
            yellow: 0,
            green: 0,
            purple: 0,
            gray: 0,
            white: 0,
            red: 0
        };
        
        // Sistema de promoção da loja
        this.shopPromotion = {
            active: false,
            discountPercent: 0
        };
        
        // Sistema de dificuldades progressivas
        this.difficultySettings = {
            ballSpeedMultiplier: 1.0,
            paddleSizeMultiplier: 1.0,
            purpleBrickChance: 0.15,
            whiteBrickChance: 0.05,

            glassCoatingChance: 0.0,
            movingBricksChance: 0.0,

            activeModifier: null,
            modifierStartPhase: 0
        };
        
        // Modificadores de fase
        this.phaseModifiers = {
            chaoticMovement: false,
            inflatedMarket: false,

            redPanic: false,
            weakBattery: false,
            noGoodEffects: false,
            countdown: false
        };
        
        // Timer para contagem regressiva
        this.countdownTimer = 0;
        this.countdownActive = false;
        
        // Timer para mudança de direção do Pânico Vermelho
        this.redPanicDirectionTimer = 0;
        // Contagem de retomada (overlay 3-2-1)
        this.resumeCountdownActive = false;
        
        // Sistema de movimento caótico
        this.chaoticMovementTimer = 0; // Timer para mudança de direção (10 segundos)
        
        // Poderes desativados pelo modificador "Sem Efeitos Bons"
        this.disabledPowers = [];
        
        // ========================================
        // MODO DESENVOLVEDOR - CONFIGURAÇÃO
        // ========================================
        // Para ativar o modo desenvolvedor, altere a linha abaixo para:
        // this.developerMode = true;
        // 
        // O modo desenvolvedor inclui:
        // - Painel de informações do jogo (velocidade da bolinha, etc.)
        // - Contador de tijolos em tempo real
        // - Botões para pular fase e adicionar dinheiro
        // - Ferramentas de debug
        // ========================================
        this.developerMode = false;
        this.gameRunning = false;
        this.gamePaused = false;
        this.ballHitCount = 0; // Contador de batidas da bolinha para Bolinha Prima
        this.gameTime = 0; // Tempo de jogo em segundos
        this.phaseTime = 0; // Tempo da fase atual em segundos
        this.lastMultiBallTime = 0; // Último tempo que uma bola foi adicionada
        this.lastUpgradesCount = 0; // Contador para controlar quando recriar interface de poderes
        this.lastActivatablePowersCount = 0; // Contador para controlar quando recriar interface de seleção de poderes
        this.selectedPowerIndex = 0; // Índice do poder selecionado
        this.activatablePowers = []; // Lista de poderes que podem ser ativados
        this.powerUIUpdateTimer = 0; // Timer para atualizar UI de poderes a cada segundo
        
        // Sistema de Combo
        this.currentPhaseCombo = 0; // Combo atual da fase
        this.maxPhaseCombo = 0; // Maior combo da fase atual
        this.lastBrickHitTime = 0; // Tempo da última colisão com bloco
        this.comboTexts = []; // Array de textos de combo ativos
        
        // Objetos do jogo
        this.paddle = null;
        this.balls = [];
        this.bricks = [];
        this.particles = [];
        this.powerUps = [];
        this.fragments = [];
        
        // Efeitos ativos
        this.activeUpgrades = [];
        this.ballEffects = {
            speedMultiplier: 1,
            inverted: false,
            zigzag: false,
            invisible: false,
            invisibleTimer: 0,
            invisibleCycle: 0, // 0 = visível, 1 = invisível
            zigzagTimer: 0,
            zigzagPattern: 0, // 0 = padrão normal, 1 = padrão invertido
            zigzagInverted: false // Inversão horizontal específica do zigzag
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
        
        // Upgrades com ativação manual (agora usando tempo real)
        this.activeUpgradeEffects = {
            superMagnet: { active: false, startTime: 0, duration: 500, cooldown: 10000 }, 
            paddleDash: { active: false, startTime: 0, duration: 2000, cooldown: 8000 },
            chargedShot: { active: false, startTime: 0, duration: 500, cooldown: 5000 },
            safetyNet: { active: false, startTime: 0, duration: 5000, cooldown: 15000 },
            effectActivator: { active: false, startTime: 0, duration: 500, cooldown: 5000 },
            cushionPaddle: { active: false, startTime: 0, duration: 3000, cooldown: 10000 },
            multiBall: { active: false, startTime: 0, duration: 500, cooldown: 20000 },
            timeBall: { active: false, startTime: 0, duration: 500, cooldown: 15000 },
            dimensionalBall: { active: false, startTime: 0, duration: 3000, cooldown: 15000 }
        };
        
        // Configurações
        this.config = {
            paddleSpeed: 5.76, // +20% de 4.8 para 5.76
            ballSpeed: 4.44312, // -10% de 4.9368 para 4.44312
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

        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // Som de batida na plataforma
        this.sounds.paddleHit = this.createTone(200, 0.1, 'sine');
        
        // Som de batida no tijolo
        this.sounds.brickHit = this.createTone(400, 0.15, 'square');
        
        // Som de perda de vida
        this.sounds.loseLife = this.createTone(150, 0.4, 'sawtooth');
        
        // Som de compra na loja
        this.sounds.purchase = this.createTone(600, 0.2, 'triangle');
        
        // Sons para poderes ativáveis
        this.sounds.superMagnet = this.createTone(500, 0.3, 'sine');
        this.sounds.paddleDash = this.createTone(800, 0.2, 'square');
        this.sounds.chargedShot = this.createTone(400, 0.4, 'sawtooth');
        this.sounds.safetyNet = this.createTone(300, 0.3, 'triangle');
        this.sounds.effectActivator = this.createTone(700, 0.25, 'square');
        
        // Som explosivo para bolinha explosiva - som mais realista de explosão
        this.sounds.explosiveHit = this.createExplosionSound();
        
        // Som para plataforma de desaceleração
        this.sounds.cushionPaddle = this.createTone(250, 0.4, 'triangle');
        
        // Som de tiro laser para canhões acoplados
        this.sounds.laserShot = this.createTone(800, 0.15, 'square');
        
        // Som para multi-bola - som de "pop" ou "sploosh" para criação de bola
        this.sounds.multiBall = this.createTone(400, 0.2, 'triangle');
        
        // Som místico para movimento caótico
        this.sounds.chaoticMovement = this.createMysticalSound();
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
    
    createExplosionSound() {
        return () => {
            if (!this.audioContext) return;
            
            // Simular uma explosão real com múltiplas camadas de som
            const startTime = this.audioContext.currentTime;
            
            // 1. Som inicial agudo (crack/boom inicial) - mais grave
            const crackOsc = this.audioContext.createOscillator();
            const crackGain = this.audioContext.createGain();
            crackOsc.connect(crackGain);
            crackGain.connect(this.audioContext.destination);
            
            crackOsc.type = 'square';
            crackOsc.frequency.setValueAtTime(400, startTime);
            crackOsc.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);
            
            crackGain.gain.setValueAtTime(0.15, startTime);
            crackGain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.15);
            
            crackOsc.start(startTime);
            crackOsc.stop(startTime + 0.15);
            
            // 2. Som grave de explosão (boom profundo) - mais grave e volume menor
            const boomOsc = this.audioContext.createOscillator();
            const boomGain = this.audioContext.createGain();
            boomOsc.connect(boomGain);
            boomGain.connect(this.audioContext.destination);
            
            boomOsc.type = 'sawtooth';
            boomOsc.frequency.setValueAtTime(40, startTime + 0.05);
            boomOsc.frequency.exponentialRampToValueAtTime(20, startTime + 0.6);
            
            boomGain.gain.setValueAtTime(0.1, startTime + 0.05);
            boomGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
            
            boomOsc.start(startTime + 0.05);
            boomOsc.stop(startTime + 0.8);
            
            // 3. Ruído branco para simular o "whoosh" da explosão
            const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = (Math.random() * 2 - 1) * 0.1;
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            const noiseGain = this.audioContext.createGain();
            const noiseFilter = this.audioContext.createBiquadFilter();
            
            noiseSource.buffer = noiseBuffer;
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.audioContext.destination);
            
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(100, startTime + 0.1);
            noiseFilter.frequency.exponentialRampToValueAtTime(30, startTime + 0.3);
            
            noiseGain.gain.setValueAtTime(0.08, startTime + 0.1);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            noiseSource.start(startTime + 0.1);
            noiseSource.stop(startTime + 0.3);
        };
    }
    
    createMysticalSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Som simples e místico
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.8);
        };
    }
    

    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            // Reativar contexto de áudio se estiver suspenso
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.sounds[soundName]();
        }
    }
    
    isPrime(num) {
        if (num < 2) return false;
        if (num === 2) return true;
        if (num % 2 === 0) return false;
        
        for (let i = 3; i <= Math.sqrt(num); i += 2) {
            if (num % i === 0) return false;
        }
        return true;
    }
    
    init() {
        this.setupEventListeners();
        this.initializeDeveloperMode();
        this.showScreen('mainMenu');
        this.updateUI();
    }
    
    setupEventListeners() {
        // Controles do teclado
        document.addEventListener('keydown', (e) => {
            // Bloquear Enter quando a notificação de modificador estiver visível (evita atualizar a loja)
            const modifierNotification = document.getElementById('modifierNotification');
            if (e.code === 'Enter' && modifierNotification) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
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
                        
                        // Escolher um ângulo inicial suave, similar ao cálculo de colisão com a plataforma
                        // Ângulo entre -45° e 45°
                        const angle = (Math.random() * (Math.PI / 2)) - (Math.PI / 4);
                        const baseSpeed = this.config.ballSpeed; // velocidade base; multiplicadores são aplicados no passo de movimento
                        ball.vx = Math.sin(angle) * baseSpeed;
                        ball.vy = -Math.abs(Math.cos(angle) * baseSpeed);
                    });
                } else {
                    // Se não há bolinhas presas, ativar upgrade selecionado
                    this.activateSelectedUpgrade();
                }
            }
            
            // Seleção de poderes com W/S ou setas
            if (this.gameRunning && !this.gamePaused) {
                if (e.code === 'KeyW' || e.code === 'ArrowUp') {
                    e.preventDefault();
                    this.selectPreviousPower();
                } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
                    e.preventDefault();
                    this.selectNextPower();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Resetar dash quando soltar a tecla
            if (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                if (this.hasUpgrade('paddle_dash') && this.activeUpgradeEffects.paddleDash.active) {
                    this.activeUpgradeEffects.paddleDash.active = false;
                    // Iniciar cooldown quando o dash é desativado manualmente
                    this.activeUpgradeEffects.paddleDash.timer = this.activeUpgradeEffects.paddleDash.cooldown;
                }
            }
            
            // Desativar Bolinha Dimensional quando soltar espaço
            if (e.code === 'Space' && this.gameRunning && !this.gamePaused) {
                if (this.hasUpgrade('dimensional_ball') && this.activeUpgradeEffects.dimensionalBall.active) {
                    this.activeUpgradeEffects.dimensionalBall.active = false;
                    this.activeUpgradeEffects.dimensionalBall.startTime = Date.now();
                }
            }
            
        });
        
        // Event listeners para modo desenvolvedor

        document.getElementById('skipPhaseBtn').addEventListener('click', () => this.skipPhase());
        document.getElementById('addMoneyBtn').addEventListener('click', () => this.addDeveloperMoney());
        
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
        
        // Event listeners para seleção de poderes inicial
        document.getElementById('confirmPowerButton').addEventListener('click', () => {
            this.confirmInitialPower();
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
    
    showInitialPowerSelection() {
        this.generateInitialPowerOptions();
        this.showScreen('powerSelectionScreen');
    }
    
    generateInitialPowerOptions() {
        const powerSelectionGrid = document.getElementById('powerSelectionGrid');
        powerSelectionGrid.innerHTML = '';
        
        // Selecionar 2 poderes aleatórios da lista de upgrades
        const allUpgrades = this.getAllUpgrades();
        const shuffledUpgrades = [...allUpgrades].sort(() => Math.random() - 0.5);
        const selectedPowers = shuffledUpgrades.slice(0, 2);
        
        selectedPowers.forEach((power, index) => {
            const powerCard = document.createElement('div');
            powerCard.className = 'power-selection-card';
            powerCard.dataset.powerId = power.id;
            
            powerCard.innerHTML = `
                <div class="initial-power-selection-icon">
                    ${power.icon}
                </div>
                <div class="initial-power-selection-name">${power.name}</div>
                <div class="initial-power-selection-description">${power.description}</div>
            `;
            
            powerCard.addEventListener('click', () => {
                this.selectInitialPower(power.id, powerCard);
            });
            
            powerSelectionGrid.appendChild(powerCard);
        });
    }
    
    selectInitialPower(powerId, powerCard) {
        // Remover seleção anterior
        document.querySelectorAll('.power-selection-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Selecionar novo poder
        powerCard.classList.add('selected');
        this.selectedInitialPower = powerId;
        
        // Habilitar botão de confirmação
        document.getElementById('confirmPowerButton').disabled = false;
    }
    
    confirmInitialPower() {
        if (!this.selectedInitialPower) return;
        
        // Adicionar o poder inicial aos upgrades ativos
        const allUpgrades = this.getAllUpgrades();
        const selectedUpgrade = allUpgrades.find(upgrade => upgrade.id === this.selectedInitialPower);
        
        if (selectedUpgrade) {
            this.activeUpgrades.push(selectedUpgrade);
            this.initialPower = selectedUpgrade;
            this.initialPowerSelected = true;
        }
        
        // Iniciar o jogo
        this.initGameObjects();
        this.generateBricks();
        this.applyUpgrades(); // Aplicar upgrades após inicializar objetos e gerar tijolos
        this.gameRunning = true;
        this.showScreen('gameScreen');
        this.updateUI();
        this.gameLoop(performance.now());
    }
    
    getAllUpgrades() {
        // Lista completa de todos os upgrades (copiada do método getAvailableUpgrades)
        return [
            // Upgrades de Plataforma (1-7)
            {
                id: 'wide_paddle',
                name: 'Plataforma Larga',
                description: 'Aumenta o tamanho da plataforma em 50%',
                price: 150,
                type: 'paddle',
                icon: this.getUpgradeIcon('wide_paddle')
            },
            {
                id: 'attached_cannons',
                name: 'Canhões Acoplados',
                description: 'Atira projéteis apenas em batidas ímpares',
                price: 170,
                type: 'paddle',
                icon: this.getUpgradeIcon('attached_cannons')
            },
            {
                id: 'super_magnet',
                name: 'Super Ímã',
                description: 'Campo magnético para puxar bolinha por 1s (cooldown 10s)',
                price: 180,
                type: 'paddle',
                icon: this.getUpgradeIcon('super_magnet')
            },
            {
                id: 'paddle_dash',
                name: 'Dash de Plataforma',
                description: 'Movimento rápido lateral por 2s (cooldown 8s)',
                price: 140,
                type: 'paddle',
                icon: this.getUpgradeIcon('paddle_dash')
            },
            {
                id: 'cushion_paddle',
                name: 'Plataforma de Desaceleração',
                description: 'Diminui em 50% a velocidade de todas as bolinhas por 3s (cooldown 10s)',
                price: 80,
                type: 'paddle',
                icon: this.getUpgradeIcon('cushion_paddle')
            },
            {
                id: 'reinforced_paddle',
                name: 'Reforço',
                description: 'Plataforma 2x mais alta e destrói bloco da linha de cima',
                price: 220,
                type: 'paddle',
                icon: this.getUpgradeIcon('reinforced_paddle')
            },
            {
                id: 'speed_boost',
                name: 'Impulso de Velocidade',
                description: 'Aumenta a velocidade da plataforma em 25%',
                price: 120,
                type: 'paddle',
                icon: this.getUpgradeIcon('speed_boost')
            },
            {
                id: 'charged_shot',
                name: 'Tiro Carregado',
                description: 'Atira projétil perfurante imediatamente',
                price: 190,
                type: 'paddle',
                icon: this.getUpgradeIcon('charged_shot')
            },
            // Upgrades de Bolinha (8-20)
            {
                id: 'piercing_ball',
                name: 'Bolinha Perfurante',
                description: 'Quebra tijolos azuis sem mudar direção',
                price: 220,
                type: 'ball',
                icon: this.getUpgradeIcon('piercing_ball')
            },
            {
                id: 'friction_field',
                name: 'Campo de Fricção',
                description: 'Reduz velocidade em 10%',
                price: 160,
                type: 'ball',
                icon: this.getUpgradeIcon('friction_field')
            },
            {
                id: 'multi_ball',
                name: 'Multi-bola',
                description: 'Cria uma nova bolinha grudada na plataforma. Liberada automaticamente em 2 segundos (cooldown 20s)',
                price: 200,
                type: 'ball',
                icon: this.getUpgradeIcon('multi_ball')
            },
            {
                id: 'combo_ball',
                name: 'Bolinha Combo',
                description: 'A cada 5 combos consecutivos, duplica a bolinha atual uma vez',
                price: 150,
                type: 'ball',
                icon: this.getUpgradeIcon('combo_ball')
            },
            {
                id: 'explosive_ball',
                name: 'Bolinha Explosiva',
                description: 'Explode se atingir bloco vermelho ou amarelo',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('explosive_ball')
            },
            {
                id: 'ball_echo',
                name: 'Eco da Bolinha',
                description: 'Destrói um bloco aleatório adicional a cada batida (apenas em fases ímpares)',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('ball_echo')
            },
            {
                id: 'effect_activator',
                name: 'Ativador de Efeito',
                description: 'Ativa efeito aleatório dos blocos na bolinha e ganha moedas baseadas na cor do bloco do efeito ativado (cooldown 5s)',
                price: 60,
                type: 'ball',
                icon: this.getUpgradeIcon('effect_activator')
            },
            {
                id: 'mirror_ball',
                name: 'Bolinha Espelhada',
                description: 'Destrói bloco simétrico ao quebrar um (apenas nos primeiros 2 minutos de cada fase)',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('mirror_ball')
            },
            {
                id: 'lucky_ball',
                name: 'Bolinha da Fortuna',
                description: 'Bolinha dourada que dá +1 moeda por bloco',
                price: 150,
                type: 'ball',
                icon: this.getUpgradeIcon('lucky_ball')
            },
            {
                id: 'time_ball',
                name: 'Bolinha do Tempo',
                description: 'Para a bolinha por 3 segundos (cooldown 15s)',
                price: 180,
                type: 'ball',
                icon: this.getUpgradeIcon('time_ball')
            },
            {
                id: 'prime_ball',
                name: 'Bolinha Prima',
                description: 'Destrói bloco aleatório a cada número primo de batidas',
                price: 120,
                type: 'ball',
                icon: this.getUpgradeIcon('prime_ball')
            },
            {
                id: 'wombo_combo_ball',
                name: 'Bolinha Wombo Combo',
                description: 'Cada bloco em combo dá +2 moedas (ao invés de +1) e a recompensa do combo máximo na loja é dobrada',
                price: 120,
                type: 'ball',
                icon: this.getUpgradeIcon('wombo_combo_ball')
            },
            {
                id: 'ghost_ball',
                name: 'Bolinha Fantasma',
                description: 'Quando a bolinha cai pela primeira vez em cada fase, ela reaparece no topo do campo',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('ghost_ball')
            },
            {
                id: 'dimensional_ball',
                name: 'Bolinha Dimensional',
                description: 'Pode atravessar tijolos sem quebrá-los (Mantenha espaço pressionado) (até 3s, cooldown 15s)',
                price: 140,
                type: 'ball',
                icon: this.getUpgradeIcon('dimensional_ball')
            },
            // Upgrades de Utilidade (21-26)
            {
                id: 'extra_life',
                name: 'Coração Extra',
                description: 'Ganha uma vida a cada fase',
                price: 180,
                type: 'utility',
                icon: this.getUpgradeIcon('extra_life')
            },
            {
                id: 'safety_net',
                name: 'Rede de Segurança',
                description: 'Barreira temporária por 5s (cooldown 15s)',
                price: 300,
                type: 'utility',
                icon: this.getUpgradeIcon('safety_net')
            },
            {
                id: 'lucky_amulet',
                name: 'Amuleto da Sorte',
                description: '25% de chance de dobrar dinheiro ao destruir blocos',
                price: 30,
                type: 'utility',
                icon: this.getUpgradeIcon('lucky_amulet')
            },
            {
                id: 'life_insurance',
                name: 'Seguro de Vida',
                description: 'Ganha 100 moedas ao perder vida',
                price: 150,
                type: 'utility',
                icon: this.getUpgradeIcon('life_insurance')
            },
            {
                id: 'recycling',
                name: 'Reciclagem',
                description: 'Tijolos azuis podem reaparecer',
                price: 30,
                type: 'utility',
                icon: this.getUpgradeIcon('recycling')
            },
            {
                id: 'risk_converter',
                name: 'Conversor de Risco',
                description: 'Diminui vida do bloco vermelho para 2, muda velocidade da bolinha entre 80%-140% a cada 5s e desativa a troca de posição do bloco vermelho',
                price: 100,
                type: 'utility',
                icon: this.getUpgradeIcon('risk_converter')
            },
            {
                id: 'accelerated_vision',
                name: 'Visão Acelerada',
                description: 'Reduz velocidade dos fragmentos brancos em 40%',
                price: 120,
                type: 'utility',
                icon: this.getUpgradeIcon('accelerated_vision')
            },
            {
                id: 'zigzag_stabilizer',
                name: 'Estabilizador de Zigue-zague',
                description: 'Reduz a curva do efeito de zigue-zague em 20%',
                price: 110,
                type: 'utility',
                icon: this.getUpgradeIcon('zigzag_stabilizer')
            },
            
            // Upgrades "Especiais" (21-25)
            {
                id: 'structural_damage',
                name: 'Dano Estrutural',
                description: 'A primeira batida no bloco vermelho dá 3 de dano',
                price: 180,
                type: 'special',
                icon: this.getUpgradeIcon('structural_damage')
            },
            {
                id: 'heat_vision',
                name: 'Visão de Calor',
                description: 'A bolinha invisível deixa um rastro térmico muito mais visível',
                price: 100,
                type: 'special',
                icon: this.getUpgradeIcon('heat_vision')
            },
            {
                id: 'controlled_reversal',
                name: 'Reversão Controlada',
                description: 'Desativa completamente o efeito de Inversão do tijolo verde',
                price: 120,
                type: 'special',
                icon: this.getUpgradeIcon('controlled_reversal')
            },
            {
                id: 'investor',
                name: 'Investidor',
                description: 'Menos 1 vida máxima, mas toda fase começa com +100 moedas',
                price: 50,
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
            },
        ];
    }
    
    removeInitialPower() {
        if (!this.initialPower) return;
        
        // Remover o poder inicial dos upgrades ativos
        this.activeUpgrades = this.activeUpgrades.filter(upgrade => upgrade.id !== this.initialPower.id);
        
        // Armazenar o poder removido para disponibilizar na loja
        this.removedInitialPower = this.initialPower;
        
        // Limpar referência do poder inicial
        this.initialPower = null;
        
        // Atualizar interface de poderes
        this.createPowersInterface();
        this.updateActivatablePowers();
        
        // Mostrar notificação
        this.showPowerRemovalNotification();
    }
    
    showPowerRemovalNotification() {
        if (!this.removedInitialPower) return;
        
        // Criar notificação visual
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ff6b35;
            padding: 1rem 2rem;
            border: 2px solid #ff6b35;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
        `;
        notification.innerHTML = `
            <div>Poder "${this.removedInitialPower.name}" removido!</div>
            <div style="font-size: 0.9rem; color: #fdcb6e; margin-top: 0.5rem;">
                Você pode comprá-lo novamente na loja
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover notificação após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
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
        this.ghostBallUsedThisPhase = false; // Resetar uso da Bolinha Fantasma
        this.resetBallEffects();
        this.initialPowerSelected = false; // Flag para controlar se o poder inicial foi selecionado
        this.initialPower = null; // Armazenar o poder inicial selecionado
        
        // Atualizar teto de vidas e clamp inicial
        if (typeof this.updateMaxLivesAndClamp === 'function') {
            this.updateMaxLivesAndClamp();
        }
        // Atualizar configurações de dificuldade para a fase 1
        this.updateDifficultySettings();
        
        // Mostrar tela de seleção de poderes inicial
        this.showInitialPowerSelection();
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
        this.updatePurchasedPowersUI();
        this.showScreen('pauseScreen');
    }
    
    resumeGame() {
        // Em vez de despausar imediatamente, iniciar contagem regressiva
        this.startResumeCountdown();
    }

    startResumeCountdown() {
        const overlay = document.getElementById('countdownOverlay');
        const numberEl = document.getElementById('countdownNumber');
        if (!overlay || !numberEl) {
            // Fallback: se overlay não existir, despausa direto
            this.gamePaused = false;
            this.showScreen('gameScreen');
            this.resumeCountdownActive = false;
            return;
        }

        this.showScreen('gameScreen');
        overlay.style.display = 'flex';
        this.resumeCountdownActive = true;

        const sequence = ['3', '2', '1'];
        let idx = 0;

        const tick = () => {
            numberEl.textContent = sequence[idx];
            // Reinicia animação pop
            numberEl.style.animation = 'none';
            // Force reflow
            void numberEl.offsetWidth;
            numberEl.style.animation = 'titleGlow 2s ease-in-out infinite alternate, countdownPop 0.6s ease forwards';

            idx++;
            if (idx < sequence.length) {
                this._countdownTimer = setTimeout(tick, 800);
            } else {
                this._countdownTimer = setTimeout(() => {
                    overlay.style.display = 'none';
                    this.resumeCountdownActive = false;
                    this.gamePaused = false;
                }, 800);
            }
        };

        // Cancela contagem anterior, se houver
        if (this._countdownTimer) {
            clearTimeout(this._countdownTimer);
        }
        tick();
    }
    
    updatePurchasedPowersUI() {
        const container = document.getElementById('purchasedPowersContainer');
        if (!container) return;
        
        // Limpar container
        container.innerHTML = '';
        
        // Se não há upgrades comprados, mostrar mensagem
        if (this.activeUpgrades.length === 0) {
            container.innerHTML = '<div style="color: #888; font-style: italic;">Nenhum poder comprado ainda</div>';
            return;
        }
        
        // Criar itens para cada upgrade comprado
        this.activeUpgrades.forEach(upgrade => {
            const powerItem = document.createElement('div');
            powerItem.className = 'purchased-power-item';
            
            // Ícone
            const icon = document.createElement('div');
            icon.className = 'purchased-power-icon';
            icon.innerHTML = this.getUpgradeIcon(upgrade.id);
            powerItem.appendChild(icon);
            
            // Nome
            const name = document.createElement('div');
            name.className = 'purchased-power-name';
            name.textContent = upgrade.name;
            powerItem.appendChild(name);
            
            // Adicionar evento de clique para mostrar modal
            powerItem.addEventListener('click', () => {
                this.showPowerModal(upgrade);
            });
            
            container.appendChild(powerItem);
        });
    }
    
    initGameObjects() {
        // Criar paddle
        const paddleWidth = this.config.paddleWidth * this.difficultySettings.paddleSizeMultiplier;
        this.paddle = {
            x: this.width / 2 - paddleWidth / 2,
            y: this.height - 50,
            width: paddleWidth,
            height: this.config.paddleHeight,
            speed: this.config.paddleSpeed,
            hitCount: 0 // Contador de batidas para Canhões Acoplados
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
            attached: true, // Bolinha presa à plataforma
            attachedTimer: 0, // Timer para liberação automática (2 segundos)
            explosive: false,

        }];
        
        // Limpar arrays
        this.particles = [];
        this.powerUps = [];
        this.fragments = [];
    }
    
    generateBricks() {
        this.bricks = [];
        // Sistema de fases: começa com 5 linhas na fase 1 e aumenta gradativamente até 15 linhas
        const rows = Math.min(15, 5 + Math.floor((this.currentPhase - 1) / 2));
        const cols = Math.min(15, Math.floor(this.width / (this.config.brickWidth + this.config.brickSpacing)));
        const totalWidth = cols * (this.config.brickWidth + this.config.brickSpacing) - this.config.brickSpacing;
        const startX = (this.width - totalWidth) / 2; // Centralizar a formação
        const startY = 80;
        
        // Contador de tijolos por cor
        const brickCount = {
            blue: 0,
            yellow: 0,
            green: 0,
            purple: 0,
            gray: 0,
            white: 0,

            red: 0
        };
        
        // Gerar tijolos comuns
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (this.config.brickWidth + this.config.brickSpacing);
                const y = startY + row * (this.config.brickHeight + this.config.brickSpacing);
                
                // Determinar cor baseada na posição e fase
                let color = this.getBrickColor(row, col, rows, cols);
                
                // Determinar vida máxima do bloco vermelho
                let redMaxHits = 4; // Reduzido de 6 para 4
                if (color === 'red' && this.hasUpgrade('risk_converter')) {
                    redMaxHits = 2; // Conversor de Risco diminui vida para 2 (50% da vida base)
                }
                
                // Verificar se deve ter película de vidro
                const hasGlassCoating = Math.random() < this.difficultySettings.glassCoatingChance;
                const extraHits = hasGlassCoating ? 1 : 0;
                

                
                this.bricks.push({
                    x: x,
                    y: y,
                    width: this.config.brickWidth,
                    height: this.config.brickHeight,
                    color: color,
                    destroyed: false,
                    hits: (color === 'red' ? redMaxHits : 1) + extraHits,
                    maxHits: (color === 'red' ? redMaxHits : 1) + extraHits,
                    lastHitTime: null, // Para cooldown do bloco vermelho
                    hasGlassCoating: hasGlassCoating,
                    isMoving: Math.random() < this.difficultySettings.movingBricksChance,
                    moveDirection: Math.random() < 0.5 ? 1 : -1, // 1 = direita, -1 = esquerda
                    moveSpeed: 0.5 // Velocidade de movimento
                });
                
                // Contar tijolo criado
                brickCount[color]++;
            }
        }
        
        // Atualizar contador atual de tijolos
        this.currentBrickCount = { ...brickCount };
    }
    
    getBrickColor(row, col, rows, cols) {
        // Tijolo núcleo vermelho sempre no centro
        if (row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) {
            return 'red';
        }
        
        // Distribuição de cores baseada na fase
        const colors = ['blue', 'yellow', 'green', 'purple', 'gray', 'white'];
        const weights = [
            0.35, 
            0.2, 
            0.15, 
            this.difficultySettings.purpleBrickChance, 
            0.1, 
            this.difficultySettings.whiteBrickChance
        ]; // Probabilidades
        
        // Aumentar dificuldade com a fase
        const difficulty = Math.min(this.currentPhase / 10, 1);
        const adjustedWeights = weights.map((w, i) => {
            if (i === 0) return w * (1 - difficulty * 0.5); // Menos azuis
            if (w === 0) return w; // Não multiplicar se a chance for 0
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
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        // Calcular delta time
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000; // Converter para segundos
        this.lastTime = currentTime;
        
        // Limitar delta time para evitar saltos grandes (máximo 60 FPS)
        const clampedDeltaTime = Math.min(deltaTime, 1/60);
        
        // Atualizar lógica do jogo
        this.update(clampedDeltaTime);
        
        // Renderizar sempre
        this.render();
        
        // Calcular FPS para debug (opcional)
        this.calculateFPS(currentTime);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    calculateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.fpsLastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsLastTime));
            this.frameCount = 0;
            this.fpsLastTime = currentTime;
        }
    }
    
    update(deltaTime = 1/60) {
        // Não atualizar se o jogo estiver pausado
        if (this.gamePaused) {
            return;
        }
        
        // Atualizar tempo de jogo usando delta time
        this.gameTime += deltaTime;
        this.phaseTime += deltaTime;
        
        // Marcar que precisa redesenhar
        this.needsRedraw = true;
        
        this.updatePaddle(deltaTime);
        this.updateBalls(deltaTime);
        this.updateParticles(deltaTime);
        this.updateComboTexts();
        this.updateFragments();
        this.updatePowerUps();
        this.updateUpgradeEffects();
        this.updateMovingBricks(deltaTime);
        this.updateCountdown(deltaTime);
        this.updateChaoticMovementTimer(deltaTime);
        this.checkCollisions();
        this.updateBallEffects();
        
        // Atualizar UI a cada frame para manter cooldowns em tempo real
        this.updateUI();
        
        // Atualizar interface de velocidade
        this.updateSpeedDisplay();
    }
    

    
    updatePaddle(deltaTime = 1/60) {
        // Não atualizar paddle se o jogo estiver pausado
        if (this.gamePaused) {
            return;
        }
        
        let speed = this.paddle.speed;
        
        // Modificador "Bateria Fraca" - plataforma 20% mais devagar
        if (this.phaseModifiers.weakBattery) {
            speed *= 0.8;
        }
        
        // Dash de Plataforma
        if (this.hasUpgrade('paddle_dash') && this.activeUpgradeEffects.paddleDash.active) {
            speed *= 2; // Velocidade aumentada durante o dash
        }
        
        // Impulso de Velocidade - upgrade passivo
        if (this.hasUpgrade('speed_boost')) {
            speed *= 1.25; // Aumenta velocidade em 25%
        }
        
        // Controle apenas por teclado (A/D ou setas)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.paddle.x -= speed * deltaTime * 60; // Ajustar para manter velocidade original
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.paddle.x += speed * deltaTime * 60; // Ajustar para manter velocidade original
        }
        
        // Manter paddle dentro da tela
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
    }
    
    updateUpgradeEffects() {
        // Atualizar timers dos efeitos usando tempo real para todos
        Object.keys(this.activeUpgradeEffects).forEach(key => {
            const effect = this.activeUpgradeEffects[key];
            
            if (effect.startTime > 0) {
                const currentTime = Date.now();
                const elapsedTime = currentTime - effect.startTime;
                
                // Verificar se o efeito deve ser desativado
                if (effect.active && effect.duration > 0 && elapsedTime >= effect.duration) {
                    effect.active = false;
                    // Iniciar cooldown
                    effect.startTime = currentTime; // Resetar para cooldown
                }
                // Verificar se o cooldown terminou
                else if (!effect.active && effect.cooldown > 0 && elapsedTime >= effect.cooldown) {
                    effect.startTime = 0; // Cooldown terminou, pode ser ativado novamente
                }
            }
        });
        
        // Sistema de tempo real para tiro carregado e ativador de efeito
        const currentTime = Date.now();
        
        // Tiro carregado
        if (this.activeUpgradeEffects.chargedShot.startTime > 0) {
            const elapsedTime = currentTime - this.activeUpgradeEffects.chargedShot.startTime;
            if (elapsedTime >= this.activeUpgradeEffects.chargedShot.cooldown) {
                this.activeUpgradeEffects.chargedShot.startTime = 0;
            }
        }
        
        // Ativador de efeito
        if (this.activeUpgradeEffects.effectActivator.startTime > 0) {
            const elapsedTime = currentTime - this.activeUpgradeEffects.effectActivator.startTime;
            if (elapsedTime >= this.activeUpgradeEffects.effectActivator.cooldown) {
                this.activeUpgradeEffects.effectActivator.startTime = 0;
            }
        }
        
        
        // Efeito sonoro contínuo da Bolinha Dimensional ativa + auto-desativação após 5s
        if (this.hasUpgrade('dimensional_ball') && this.activeUpgradeEffects.dimensionalBall.active) {
            // Tocar som a cada 30 frames (0.5 segundos) para efeito contínuo
            if (this.gameTime % 30 === 0) {
                this.playSound('cushionPaddle');
            }
            
            // Desativar automaticamente após 5 segundos (300 frames)
            if (this.activeUpgradeEffects.dimensionalBall.timer <= 0) {
                this.activeUpgradeEffects.dimensionalBall.active = false;
                this.activeUpgradeEffects.dimensionalBall.timer = this.activeUpgradeEffects.dimensionalBall.cooldown;
            }
        }
        
        // Conversor de Risco - mudar velocidade da bolinha aleatoriamente a cada 5 segundos
        if (this.hasUpgrade('risk_converter')) {
            if (!this.riskConverterTimer) {
                this.riskConverterTimer = 300; // 5 segundos
                this.riskConverterSpeedMultiplier = 1; // Velocidade base
            }
            
            this.riskConverterTimer--;
            if (this.riskConverterTimer <= 0) {
                this.riskConverterTimer = 300; // Reset para 5 segundos
                // Mudar velocidade entre 80% e 140% do valor atual
                const speedChange = 0.8 + Math.random() * 0.6; // 0.8 a 1.4
                this.riskConverterSpeedMultiplier = speedChange;
            }
        } else {
            this.riskConverterTimer = null;
            this.riskConverterSpeedMultiplier = 1;
        }
        
        if (this.activeUpgradeEffects.chargedShot.chargeLevel >= this.activeUpgradeEffects.chargedShot.maxCharge) {
            this.activeUpgradeEffects.chargedShot.chargeLevel = this.activeUpgradeEffects.chargedShot.maxCharge;
        }
        
        // Aplicar efeito do Super Ímã
        if (this.activeUpgradeEffects.superMagnet.active) {
            this.balls.forEach(ball => {
                const dx = (this.paddle.x + this.paddle.width / 2) - ball.x;
                const dy = (this.paddle.y - 20) - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // Calcular velocidade atual da bolinha
                    let currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    
                    // Garantir velocidade mínima
                    const minSpeed = this.config.ballSpeed;
                    if (currentSpeed < minSpeed) {
                        currentSpeed = minSpeed;
                    }
                    
                    // Calcular direção para a plataforma
                    const targetVx = (dx / distance) * currentSpeed;
                    const targetVy = (dy / distance) * currentSpeed;
                    
                    // Aplicar atração gradual mantendo a velocidade mínima
                    const attraction = 0.08; // Força de atração reduzida
                    ball.vx += (targetVx - ball.vx) * attraction;
                    ball.vy += (targetVy - ball.vy) * attraction;
                    
                    // Garantir que a velocidade final não seja menor que a mínima
                    const finalSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    if (finalSpeed < minSpeed) {
                        const speedMultiplier = minSpeed / finalSpeed;
                        ball.vx *= speedMultiplier;
                        ball.vy *= speedMultiplier;
                    }
                }
            });
        }
        
        // Aplicar efeito da Bolinha do Tempo
        this.balls.forEach(ball => {
            if (ball.timePaused && ball.timePauseCountdown > 0) {
                ball.timePauseCountdown--;
                if (ball.timePauseCountdown <= 0) {
                    // Restaurar velocidades salvas
                    ball.vx = ball.savedVx;
                    ball.vy = ball.savedVy;
                    ball.timePaused = false;
                    
                    // Restaurar efeito zig-zag se estava ativo antes da pausa
                    if (ball.savedZigzagState) {
                        this.ballEffects.zigzag = true;
                        this.ballEffects.zigzagTimer = 0;
                        this.ballEffects.zigzagPattern = ball.savedZigzagPattern || 0;
                        this.ballEffects.zigzagInverted = ball.savedZigzagInverted || false;
                    }
                    
                    delete ball.savedVx;
                    delete ball.savedVy;
                    delete ball.savedZigzagState;
                    delete ball.savedZigzagPattern;
                    delete ball.savedZigzagInverted;
                }
            }
        });
        
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
        
        // Eco da Bolinha - apenas efeito de destruir bloco aleatório (sem segunda bolinha)
    }
    
    updateMovingBricks(deltaTime = 1/60) {
        this.bricks.forEach(brick => {
            if (!brick.destroyed) {
                // Tijolos móveis normais
                if (brick.isMoving) {
                    // Mover tijolo horizontalmente
                    brick.x += brick.moveDirection * brick.moveSpeed;
                    
                    // Verificar limites da tela e inverter direção
                    if (brick.x <= 0 || brick.x + brick.width >= this.width) {
                        brick.moveDirection *= -1;
                        brick.x = Math.max(0, Math.min(brick.x, this.width - brick.width));
                    }
                }
                
                // Modificador "Pânico Vermelho" - tijolo vermelho se move
                if (brick.color === 'red' && this.phaseModifiers.redPanic) {
                    // Inicializar direção de movimento se não existir
                    if (brick.redPanicDirection === undefined) {
                        brick.redPanicDirection = Math.random() < 0.5 ? 1 : -1; // Direção aleatória inicial
                    }
                    
                    // Incrementar timer de mudança de direção
                    this.redPanicDirectionTimer += deltaTime; // Usar tempo real baseado em deltaTime
                    
                    // Mudar direção aleatoriamente a cada 3 segundos
                    if (this.redPanicDirectionTimer >= 3) {
                        brick.redPanicDirection = Math.random() < 0.5 ? 1 : -1; // Nova direção aleatória
                        this.redPanicDirectionTimer = 0; // Resetar timer
                    }
                    
                    brick.x += brick.redPanicDirection * 0.3; // Movimento lento
                    
                    // Verificar limites e inverter direção
                    if (brick.x <= 0 || brick.x + brick.width >= this.width) {
                        brick.redPanicDirection *= -1; // Inverter direção
                        brick.x = Math.max(0, Math.min(brick.x, this.width - brick.width));
                    }
                }
                
                // Proteção adicional para bloco vermelho - garantir que sempre fique dentro dos limites
                if (brick.color === 'red') {
                    // Verificar limites horizontais
                    if (brick.x < 0) {
                        brick.x = 0;
                    } else if (brick.x + brick.width > this.width) {
                        brick.x = this.width - brick.width;
                    }
                    
                    // Verificar limites verticais (manter na área superior da tela)
                    if (brick.y < 0) {
                        brick.y = 0;
                    } else if (brick.y + brick.height > this.height * 0.8) {
                        brick.y = this.height * 0.8 - brick.height;
                    }
                }
            }
        });
    }
    
    updateCountdown(deltaTime = 1/60) {
        if (this.countdownActive && this.countdownTimer > 0) {
            this.countdownTimer -= deltaTime; // Usar tempo real baseado em deltaTime
            
            if (this.countdownTimer <= 0) {
                // Tempo esgotado - perder vida
                this.loseLife();
                this.countdownTimer = 60; // Resetar timer para 60 segundos
                
                // Se Pânico Vermelho estiver ativo, resetar também seu timer
                if (this.phaseModifiers.redPanic) {
                    this.redPanicDirectionTimer = 0;
                }
            }
        }
    }
    
    updateChaoticMovementTimer(deltaTime = 1/60) {
        if (this.phaseModifiers.chaoticMovement) {
            this.chaoticMovementTimer += deltaTime; // Usar tempo real baseado em deltaTime
            
            // Mudar direção a cada 10 segundos
            if (this.chaoticMovementTimer >= 10) {
                this.chaoticMovementTimer = 0; // Resetar timer
                this.changeBallDirection();
            }
        }
    }
    
    changeBallDirection() {
        // Mudar completamente o sentido de todas as bolinhas
        this.balls.forEach(ball => {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            
            // Gerar ângulo evitando direções muito horizontais
            let angle;
            do {
                angle = Math.random() * Math.PI * 2;
                // Calcular o ângulo em relação ao eixo horizontal
                const horizontalAngle = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));
                // Evitar ângulos muito próximos de 0° e 180° (muito horizontais)
                // Permitir apenas ângulos entre 8° e 172°, e entre 188° e 352°
                const isTooHorizontal = (horizontalAngle < Math.PI / 22.5) || // < 8°
                                       (horizontalAngle > Math.PI - Math.PI / 22.5); // > 172°
                if (!isTooHorizontal) break;
            } while (true);
            
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
        });
        
        // Tocar som místico
        this.playSound('chaoticMovement');
        
        // Aplicar efeito do bloco roxo (zigue-zague) - alternar padrão se já estiver ativo
        if (this.ballEffects.zigzag) {
            this.ballEffects.zigzagPattern = this.ballEffects.zigzagPattern === 0 ? 1 : 0; // Alternar entre 0 e 1
            this.ballEffects.zigzagTimer = 0; // Resetar timer para mudança imediata
            this.ballEffects.zigzagInverted = !this.ballEffects.zigzagInverted; // Alternar inversão: uma sim, uma não
        } else {
            setTimeout(() => {
                if (!this.ballEffects.zigzag) {
                    this.ballEffects.zigzag = true;
                    this.ballEffects.zigzagTimer = 0;
                    this.ballEffects.zigzagPattern = 0;
                    this.ballEffects.zigzagInverted = false; // Começar sem inversão
                }
            }, 1000); // 1 segundo depois
        }
    }
    
    generateNewBricksOnRedHit() {
        // Gerar 2 a 5 novos tijolos em locais aleatórios
        const numNewBricks = Math.floor(Math.random() * 4) + 2; // 2-5 tijolos
        
        for (let i = 0; i < numNewBricks; i++) {
            // Encontrar posição aleatória vazia
            let attempts = 0;
            let newX, newY;
            let positionFound = false;
            
            while (attempts < 50 && !positionFound) {
                newX = Math.random() * (this.width - this.config.brickWidth);
                newY = Math.random() * (this.height * 0.6); // Apenas na parte superior
                
                // Verificar se não colide com tijolos existentes
                positionFound = !this.bricks.some(brick => 
                    !brick.destroyed && 
                    Math.abs(brick.x - newX) < this.config.brickWidth + 10 &&
                    Math.abs(brick.y - newY) < this.config.brickHeight + 10
                );
                
                attempts++;
            }
            
            if (positionFound) {
                // Escolher cor aleatória (exceto vermelho)
                const colors = ['blue', 'yellow', 'green', 'purple', 'gray', 'white'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Verificar se deve ter película de vidro (mesmo para novos tijolos)
                const hasGlassCoating = Math.random() < this.difficultySettings.glassCoatingChance;
                const extraHits = hasGlassCoating ? 1 : 0;
                
                this.bricks.push({
                    x: newX,
                    y: newY,
                    width: this.config.brickWidth,
                    height: this.config.brickHeight,
                    color: randomColor,
                    destroyed: false,
                    hits: 1 + extraHits,
                    maxHits: 1 + extraHits,
                    lastHitTime: null,
                    hasGlassCoating: hasGlassCoating,
                    isMoving: false,
                    moveDirection: 1,
                    moveSpeed: 0.5
                });
            }
        }
    }
    
    restoreBricksOnRedPanic() {
        try {
            // Restaurar sempre 25 blocos destruídos quando o bloco vermelho troca de posição
            const numToRestore = 25;
            
            // Encontrar blocos destruídos para restaurar
            const destroyedBricks = this.bricks.filter(brick => brick && brick.destroyed);
            
            if (destroyedBricks.length === 0) return; // Não há blocos para restaurar
            
            // Restaurar blocos aleatórios
            const bricksToRestore = Math.min(numToRestore, destroyedBricks.length);
            
            for (let i = 0; i < bricksToRestore; i++) {
                if (destroyedBricks.length === 0) break; // Verificar se ainda há blocos
                
                const randomIndex = Math.floor(Math.random() * destroyedBricks.length);
                const brickToRestore = destroyedBricks.splice(randomIndex, 1)[0];
                
                if (brickToRestore) {
                    // Restaurar o bloco
                    brickToRestore.destroyed = false;
                    brickToRestore.hits = brickToRestore.maxHits || 1;
                    brickToRestore.lastHitTime = null;
                    
                    // Criar efeito visual de restauração
                    this.createParticles(brickToRestore.x + brickToRestore.width / 2, brickToRestore.y + brickToRestore.height / 2, this.getBrickColorValue(brickToRestore.color));
                    
                    // Se Pânico Vermelho estiver ativo SOZINHO e o bloco restaurado for azul, 
                    // 1/2 de chance de atirar fragmento
                    if (this.phaseModifiers.redPanic && !this.phaseModifiers.countdown && 
                        brickToRestore.color === 'blue' && Math.random() < 0.5) {
                        this.createFragment(
                            brickToRestore.x + brickToRestore.width / 2, 
                            brickToRestore.y + brickToRestore.height
                        );
                        
                        // Criar efeito visual para indicar que o bloco azul atirou um fragmento
                        this.createParticles(
                            brickToRestore.x + brickToRestore.width / 2, 
                            brickToRestore.y + brickToRestore.height / 2, 
                            '#ffffff'
                        );
                    }
                }
            }
            
            // Atualizar contador de tijolos
            this.updateBrickCount();
        } catch (error) {
            // silencioso
        }
    }
    
    
    updateBalls(deltaTime = 1/60) {
        this.balls.forEach((ball, index) => {
            // Se a bolinha está presa à plataforma, seguir o paddle
            if (ball.attached) {
                ball.x = this.paddle.x + this.paddle.width / 2;
                ball.y = this.paddle.y - ball.radius - 5;
                
                // Só aplicar timer de liberação automática se o Multi-bola estiver ativo
                if (this.hasUpgrade('multi_ball')) {
                    // Incrementar timer de liberação automática
                    ball.attachedTimer += deltaTime; // Usar tempo real baseado em deltaTime
                    
                    // Liberar automaticamente após 2 segundos
                    if (ball.attachedTimer >= 2) {
                        ball.attached = false;
                        ball.attachedTimer = 0;
                        
                        // Escolher um ângulo inicial suave
                        const angle = (Math.random() - 0.5) * Math.PI / 2; // -45° a 45°
                        const baseSpeed = this.config.ballSpeed;
                        ball.vx = Math.sin(angle) * baseSpeed;
                        ball.vy = -Math.abs(Math.cos(angle) * baseSpeed);
                    }
                }
                
                return; // Não aplicar física se estiver presa
            }
            
            // Aplicar efeitos
            let speedMultiplier = this.ballEffects.speedMultiplier;
            // Aplicar multiplicador do Conversor de Risco
            if (this.hasUpgrade('risk_converter') && this.riskConverterSpeedMultiplier) {
                speedMultiplier *= this.riskConverterSpeedMultiplier;
            }
            // Aplicar efeito de desaceleração da Plataforma de Desaceleração
            if (this.activeUpgradeEffects.cushionPaddle.active) {
                speedMultiplier *= 0.5; // Reduz velocidade em 50%
            }
            // Aplicar multiplicador de dificuldade progressiva
            speedMultiplier *= this.difficultySettings.ballSpeedMultiplier;
            
            let vx = ball.vx * speedMultiplier;
            let vy = ball.vy * speedMultiplier;
            
            // Modificador "Movimento Caótico" - direção muda a cada 10 segundos
            // (a mudança de direção é feita em updateChaoticMovementTimer)
            
            // Efeito de inversão
            if (this.ballEffects.inverted) {
                vx = -vx;
            }
            
            // Efeito de zigue-zague simplificado
            if (this.ballEffects.zigzag) {
                this.ballEffects.zigzagTimer += 0.05; // Timer mais lento para movimento mais suave
                
                // Aplicar redução de 20% se tiver o upgrade Estabilizador de Zigue-zague
                const zigzagReduction = this.hasUpgrade('zigzag_stabilizer') ? 0.8 : 1.0;
                
                
                // Aplicar inversão horizontal específica do zigzag
                if (this.ballEffects.zigzagInverted) {
                    vx = -vx; // Inverter direção horizontal da bolinha
                }
                
                // Aplicar padrão de zigzag baseado no zigzagPattern
                if (this.ballEffects.zigzagPattern === 0) {
                    // Padrão normal: movimento em S para a direita (mais suave)
                    vx += Math.sin(this.ballEffects.zigzagTimer * 0.3) * 2.5 * zigzagReduction;
                    vy += Math.cos(this.ballEffects.zigzagTimer * 0.2) * 0.8 * zigzagReduction;
                } else {
                    // Padrão invertido: movimento em S para a esquerda (simétrico)
                    vx += -Math.sin(this.ballEffects.zigzagTimer * 0.3) * 2.5 * zigzagReduction;
                    vy += -Math.cos(this.ballEffects.zigzagTimer * 0.2) * 0.8 * zigzagReduction;
                }
            }
            

            
            // Atualizar posição usando delta time
            ball.x += vx * deltaTime * 60; // Ajustar para manter velocidade original
            ball.y += vy * deltaTime * 60;
            
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
                } else {
                    // Verificar Bolinha Fantasma antes de remover a bolinha
                    if (this.hasUpgrade('ghost_ball') && !this.ghostBallUsedThisPhase) {
                        this.ghostBallUsedThisPhase = true;
                        
                        // Salvar a velocidade da bolinha que caiu
                        const savedVx = ball.vx;
                        const savedVy = Math.abs(ball.vy); // Garantir que seja para baixo
                        
                        // Tocar som de efeito fantasma
                        this.playSound('cushionPaddle');
                        
                        // Reposicionar bolinha no topo mantendo a trajetória
                        ball.x = this.width / 2;
                        ball.y = 50; // Topo do campo
                        ball.vx = savedVx; // Manter velocidade horizontal
                        ball.vy = savedVy; // Manter velocidade vertical (para baixo)
                        ball.trail = []; // Limpar trail
                        
                        // Não remover a bolinha - ela continua no jogo
                        return;
                    }
                    
                    this.balls.splice(index, 1);
                    // Só perder vida quando não há mais bolas no jogo
                    if (this.balls.length === 0) {
                        this.loseLife();
                    }
                }
            }
        });
    }
    
    updateParticles(deltaTime = 1/60) {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx * deltaTime * 60;
            particle.y += particle.vy * deltaTime * 60;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    updateComboTexts() {
        this.comboTexts.forEach((comboText, index) => {
            comboText.x += comboText.vx;
            comboText.y += comboText.vy;
            comboText.life--;
            comboText.alpha = comboText.life / comboText.maxLife;
            
            // Efeito de escala (cresce e depois diminui)
            const progress = 1 - (comboText.life / comboText.maxLife);
            if (progress < 0.3) {
                comboText.scale = 1 + progress * 2; // Cresce até 1.6
            } else {
                comboText.scale = 1.6 - (progress - 0.3) * 0.6; // Diminui até 1
            }
            
            if (comboText.life <= 0) {
                this.comboTexts.splice(index, 1);
            }
        });
    }
    
    updateFragments() {
        this.fragments.forEach((fragment, index) => {
            // Aplicar efeito do upgrade Visão Acelerada (reduz velocidade em 40%)
            let speedMultiplier = 1;
            if (this.hasUpgrade('accelerated_vision')) {
                speedMultiplier = 0.6; // Reduz 40% da velocidade
            }
            
            fragment.x += fragment.vx * speedMultiplier;
            fragment.y += fragment.vy * speedMultiplier;
            fragment.life--;
            
            // Verificar colisão com a plataforma
            if (fragment.y + fragment.size > this.paddle.y && 
                fragment.y < this.paddle.y + this.paddle.height &&
                fragment.x + fragment.size > this.paddle.x && 
                fragment.x < this.paddle.x + this.paddle.width) {
                
                // Fragmento atingiu a plataforma - perder vida sem resetar bolinha
                // Só aplicar se ainda há bolinhas no jogo
                if (this.balls.length > 0) {
                    this.loseLifeFromFragment();
                }
                this.fragments.splice(index, 1);
                return;
            }
            
            // Remover se sair da tela ou vida acabar
            if (fragment.y > this.height || fragment.life <= 0) {
                this.fragments.splice(index, 1);
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
                    if (!brick.destroyed && brick.color !== 'red' && // Não pode quebrar o núcleo
                        powerUp.x + powerUp.radius > brick.x &&
                        powerUp.x - powerUp.radius < brick.x + brick.width &&
                        powerUp.y + powerUp.radius > brick.y &&
                        powerUp.y - powerUp.radius < brick.y + brick.height) {
                        
                        // Quebrar tijolo
                        brick.destroyed = true;
                        // Atualizar contador de tijolos
                        if (this.currentBrickCount[brick.color] > 0) {
                            this.currentBrickCount[brick.color]--;
                        }
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
                        // Atualizar contador de tijolos
                        if (this.currentBrickCount[brick.color] > 0) {
                            this.currentBrickCount[brick.color]--;
                        }
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
        // Verificar colisão básica
        const isColliding = ball.x + ball.radius > brick.x &&
                           ball.x - ball.radius < brick.x + brick.width &&
                           ball.y + ball.radius > brick.y &&
                           ball.y - ball.radius < brick.y + brick.height;
        
        if (!isColliding) return false;
        
        // Verificar se a bolinha está se aproximando do tijolo
        // Calcular a distância anterior da bolinha ao tijolo
        const prevBallX = ball.x - ball.vx;
        const prevBallY = ball.y - ball.vy;
        
        const prevDistance = Math.min(
            Math.abs(prevBallX - brick.x),
            Math.abs(prevBallX - (brick.x + brick.width)),
            Math.abs(prevBallY - brick.y),
            Math.abs(prevBallY - (brick.y + brick.height))
        );
        
        const currentDistance = Math.min(
            Math.abs(ball.x - brick.x),
            Math.abs(ball.x - (brick.x + brick.width)),
            Math.abs(ball.y - brick.y),
            Math.abs(ball.y - (brick.y + brick.height))
        );
        
        // A bolinha está se aproximando se a distância atual é menor que a anterior
        return currentDistance < prevDistance;
    }
    
    handlePaddleCollision(ball) {
        // Resetar efeitos ao tocar no paddle (exceto speedMultiplier do bloco vermelho)
        this.resetBallEffects();
        
        // Resetar combo atual da fase quando a bolinha toca na plataforma
        this.currentPhaseCombo = 0;
        
        // Se o Super Ímã estava ativo, resetar a velocidade da bola para a velocidade base
        if (this.activeUpgradeEffects.superMagnet.active) {
            const baseSpeed = this.config.ballSpeed;
            const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            const angle = hitPos * (Math.PI / 3); // Ângulo máximo de 60 graus
            ball.vx = Math.sin(angle) * baseSpeed;
            ball.vy = -Math.abs(Math.cos(angle) * baseSpeed);
        } else {
            // Calcular novo ângulo baseado na posição de impacto
            const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            const angle = hitPos * (Math.PI / 3); // Ângulo máximo de 60 graus
            const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.sin(angle) * ballSpeed;
            ball.vy = -Math.abs(Math.cos(angle) * ballSpeed);
        }
        
        // Canhões Acoplados - atirar projéteis apenas em batidas ímpares
        if (this.hasUpgrade('attached_cannons')) {
            this.paddle.hitCount++;
            
            // Só atira em batidas ímpares (1ª, 3ª, 5ª, etc.)
            if (this.paddle.hitCount % 2 === 1) {
                // Criar 2 projéteis
                this.powerUps.push({
                    x: this.paddle.x + this.paddle.width * 0.25, // Canhão esquerdo
                    y: this.paddle.y,
                    vx: 0,
                    vy: -3.6, // +20% de -3.0 para -3.6
                    radius: 3,
                    type: 'cannon_shot',
                    life: 250
                });
                
                this.powerUps.push({
                    x: this.paddle.x + this.paddle.width * 0.75, // Canhão direito
                    y: this.paddle.y,
                    vx: 0,
                    vy: -3.6, // +20% de -3.0 para -3.6
                    radius: 3,
                    type: 'cannon_shot',
                    life: 250
                });
                
                this.playSound('laserShot');
            }
        }
        
        this.playSound('paddleHit');
    }
    
    handleBrickCollision(ball, brick) {
        // Bolinha Dimensional - atravessa tijolos: ignora colisão completamente
        if (this.hasUpgrade('dimensional_ball') && this.activeUpgradeEffects.dimensionalBall.active) {
            return; // não interage com o tijolo
        }
        
        // Movimento Caótico não precisa de lógica especial na colisão
        
        // Incrementar contador de batidas para Bolinha Prima
        this.ballHitCount++;
        
        // Atualizar UI se Bolinha Prima estiver ativa
        if (this.hasUpgrade('prime_ball')) {
            this.updateUI();
        }
        
        // Verificar upgrades especiais
        let shouldDestroy = true;
        let extraDamage = 0;
        
        // Bolinha Explosiva - explodir apenas ao atingir bloco vermelho ou amarelo
        // Verificar ANTES do cooldown para garantir que funcione mesmo com vidro
        if (ball.explosive && (brick.color === 'red' || brick.color === 'yellow')) {
            this.explodeBall(ball);
            ball.explosive = false;
        }
        
        // Cooldown para bloco vermelho - evitar múltiplos danos em sequência
        if (brick.color === 'red') {
            const currentTime = Date.now();
            if (brick.lastHitTime && (currentTime - brick.lastHitTime) < 1000) {
                return; // Ignorar colisão se foi há menos de 1 segundo
            }
            brick.lastHitTime = currentTime;
        }
        
        // Dano Estrutural - primeira batida em bloco vermelho dá 3 de dano
        if (brick.color === 'red' && this.hasUpgrade('structural_damage') && brick.hits === brick.maxHits) {
            extraDamage = 2; // +2 para totalizar 3 de dano (1 base + 2 extra)
        }
        
        // Bolinha Perfurante - quebra tijolos azuis sem mudar direção
        if (this.hasUpgrade('piercing_ball') && brick.color === 'blue') {
            brick.destroyed = true;
            // Atualizar contador de tijolos
            if (this.currentBrickCount[brick.color] > 0) {
                this.currentBrickCount[brick.color]--;
            }
            this.money += this.getBrickReward(brick.color);
            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, this.getBrickColorValue(brick.color));
            return; // Não muda direção da bolinha
        }
        
        // Aplicar efeito do tijolo (com reversão controlada)
        if (brick.color === 'green' && this.hasUpgrade('controlled_reversal')) {
            // Reversão Controlada desativa completamente a reversão do bloco verde
            // Não aplicar o efeito de reversão
        } else {
            this.applyBrickEffect(brick.color);
        }
        
        // Bolinha Prima - destruir bloco aleatório quando contador é primo
        if (this.hasUpgrade('prime_ball') && this.isPrime(this.ballHitCount)) {
            const availableBricks = this.bricks.filter(b => !b.destroyed && b.color !== 'red');
            if (availableBricks.length > 0) {
                const randomBrick = availableBricks[Math.floor(Math.random() * availableBricks.length)];
                randomBrick.destroyed = true;
                // Atualizar contador de tijolos
                if (this.currentBrickCount[randomBrick.color] > 0) {
                    this.currentBrickCount[randomBrick.color]--;
                }
                this.money += this.getBrickReward(randomBrick.color);
                this.createParticles(randomBrick.x + randomBrick.width / 2, randomBrick.y + randomBrick.height / 2, this.getBrickColorValue(randomBrick.color));
            }
        }
        
        // Quebrar tijolo
        brick.hits -= (1 + extraDamage);
        

        
        // Efeito especial do bloco vermelho - trocar posição com outro bloco
        if (brick.color === 'red') {
            // Conversor de Risco desativa a troca de posição do bloco vermelho
            if (!this.hasUpgrade('risk_converter')) {
                // Encontrar blocos disponíveis para troca (não destruídos e não vermelhos)
                const availableBricks = this.bricks.filter(b => !b.destroyed && b.color !== 'red' && b !== brick);
                
                if (availableBricks.length > 0) {
                    // Escolher um bloco aleatório para trocar
                    const randomBrick = availableBricks[Math.floor(Math.random() * availableBricks.length)];
                    
                    // Trocar posições
                    const tempX = brick.x;
                    const tempY = brick.y;
                    brick.x = randomBrick.x;
                    brick.y = randomBrick.y;
                    randomBrick.x = tempX;
                    randomBrick.y = tempY;
                    
                    // Garantir que o bloco vermelho fique dentro dos limites da tela
                    // Se o bloco vermelho estiver se movendo, ajustar sua posição para ficar dentro da tela
                    if (brick.isMoving) {
                        // Verificar limites horizontais
                        if (brick.x < 0) {
                            brick.x = 0;
                        } else if (brick.x + brick.width > this.width) {
                            brick.x = this.width - brick.width;
                        }
                        
                        // Verificar limites verticais (se necessário)
                        if (brick.y < 0) {
                            brick.y = 0;
                        } else if (brick.y + brick.height > this.height * 0.8) { // Limitar à área superior da tela
                            brick.y = this.height * 0.8 - brick.height;
                        }
                    }
                    
                    // Criar efeito visual da troca
                    this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff0000');
                    this.createParticles(randomBrick.x + randomBrick.width / 2, randomBrick.y + randomBrick.height / 2, this.getBrickColorValue(randomBrick.color));
                    
                    // Resetar contador de contagem regressiva se ativo quando o bloco vermelho troca de posição
                    if (this.phaseModifiers.countdown && this.countdownActive) {
                        this.countdownTimer = 60; // Resetar para 60 segundos
                    }
                    
                    // Pânico Vermelho - restaurar blocos quando troca de posição
                    if (this.phaseModifiers.redPanic && this.phaseModifiers.redPanic === true) {
                        this.restoreBricksOnRedPanic();
                        
                        // Se Pânico Vermelho estiver ativo SOZINHO, bloco vermelho também atira fragmento
                        if (!this.phaseModifiers.countdown) {
                            this.createFragment(
                                brick.x + brick.width / 2, 
                                brick.y + brick.height
                            );
                            
                            // Criar efeito visual para indicar que o bloco vermelho atirou um fragmento
                            this.createParticles(
                                brick.x + brick.width / 2, 
                                brick.y + brick.height / 2, 
                                '#ffffff'
                            );
                        }
                    }
                }
            }
        }
        
        // Efeito especial do bloco vermelho - aumentar velocidade da bolinha
        if (brick.color === 'red') {
            this.ballEffects.speedMultiplier += 0.04; // Aumentar velocidade em 4%
            // Criar partículas especiais para indicar o efeito
            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff0000');
            
            // Criar partículas de velocidade para indicar o aumento
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: brick.x + brick.width / 2,
                    y: brick.y + brick.height / 2,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    color: '#f1c40f',
                    life: 60,
                    maxLife: 60,
                    alpha: 1,
                    size: Math.random() * 3 + 2
                });
            }
        }
        
        if (brick.hits <= 0) {
            brick.destroyed = true;

            // Sistema de Combo
            const currentTime = Date.now();
            const timeSinceLastHit = currentTime - this.lastBrickHitTime;
            
            // Se passou mais de 2 segundos desde a última colisão, resetar combo
            if (timeSinceLastHit > 2000) {
                this.currentPhaseCombo = 0;
            }
            
            // Incrementar combo atual da fase
            this.currentPhaseCombo++;
            this.lastBrickHitTime = currentTime;
            
            // Atualizar combo máximo da fase
            if (this.currentPhaseCombo > this.maxPhaseCombo) {
                this.maxPhaseCombo = this.currentPhaseCombo;
            }
            
            // Se é um combo (mais de 1 bloco consecutivo), criar texto COMBO!
            if (this.currentPhaseCombo > 1) {
                this.createComboText(brick.x + brick.width / 2, brick.y + brick.height / 2);
                
                // Bolinha Combo - duplicar a cada 5 combos consecutivos
                if (this.hasUpgrade('combo_ball') && this.currentPhaseCombo % 5 === 0) {
                    // Verificar se pode duplicar baseado no número de bolinhas
                    const canDuplicate = this.canDuplicateBall();
                    if (canDuplicate) {
                        this.duplicateBall(ball);
                    }
                }
            }

            // Atualizar contador de tijolos
            if (this.currentBrickCount[brick.color] > 0) {
                this.currentBrickCount[brick.color]--;
            }
            let reward = this.getBrickReward(brick.color);
            
            // Bônus de combo: +1 moeda por bloco em combo
            if (this.currentPhaseCombo > 1) {
                reward += 1;
                
                // Bolinha Wombo Combo: +1 moeda extra por bloco em combo
                if (this.hasUpgrade('wombo_combo_ball')) {
                    reward += 1;
                }
            }
            
            // Efeito especial do bloco branco - criar fragmento perigoso
            if (brick.color === 'white') {
                this.createFragment(brick.x + brick.width / 2, brick.y + brick.height);
            }
            
            // Aplicar modificadores de dinheiro
            if (this.hasUpgrade('lucky_amulet') && Math.random() < 0.25) {
                reward = reward * 2; // Dobrar o dinheiro
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
                // Resetar contador de contagem regressiva se ativo
                if (this.phaseModifiers.countdown && this.countdownActive) {
                    this.countdownTimer = 120; // Resetar para 120 segundos
                }
                
                // Novos tijolos removidos - agora é parte do modificador Pânico Vermelho
                this.completePhase();
                return;
            }
        }
        
        // Determinar de qual lado a bolinha bateu e reverter direção apropriada
        const ballPrevX = ball.x - ball.vx;
        const ballPrevY = ball.y - ball.vy;
        
        // Calcular qual lado do tijolo foi atingido baseado na posição anterior
        const hitLeft = ballPrevX + ball.radius <= brick.x && ball.x + ball.radius > brick.x;
        const hitRight = ballPrevX - ball.radius >= brick.x + brick.width && ball.x - ball.radius < brick.x + brick.width;
        const hitTop = ballPrevY + ball.radius <= brick.y && ball.y + ball.radius > brick.y;
        const hitBottom = ballPrevY - ball.radius >= brick.y + brick.height && ball.y - ball.radius < brick.y + brick.height;
        
        // Reverter direção baseado no lado atingido
        if (hitLeft || hitRight) {
            ball.vx = -ball.vx; // Inverter direção horizontal
        }
        if (hitTop || hitBottom) {
            ball.vy = -ball.vy; // Inverter direção vertical
        }
        
        
        // Criar partículas
        this.createParticles(ball.x, ball.y, this.getBrickColorValue(brick.color));
        
        // Eco da Bolinha - destruir bloco aleatório adicional (apenas em fases ímpares)
        if (this.hasUpgrade('ball_echo') && this.currentPhase % 2 === 1) {
            const availableBricks = this.bricks.filter(b => !b.destroyed && b.color !== 'red');
            if (availableBricks.length > 0) {
                const randomBrick = availableBricks[Math.floor(Math.random() * availableBricks.length)];
                randomBrick.destroyed = true;
                // Atualizar contador de tijolos
                if (this.currentBrickCount[randomBrick.color] > 0) {
                    this.currentBrickCount[randomBrick.color]--;
                }
                this.money += this.getBrickReward(randomBrick.color);
                this.createParticles(randomBrick.x + randomBrick.width / 2, randomBrick.y + randomBrick.height / 2, this.getBrickColorValue(randomBrick.color));
            }
        }
        
        // Bolinha Espelhada - destruir bloco simétrico (apenas nos primeiros 2 minutos da fase)
        if (this.hasUpgrade('mirror_ball') && this.phaseTime <= 120) {
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
                // Atualizar contador de tijolos
                if (this.currentBrickCount[mirrorBrick.color] > 0) {
                    this.currentBrickCount[mirrorBrick.color]--;
                }
                this.money += this.getBrickReward(mirrorBrick.color);
                this.createParticles(mirrorBrick.x + mirrorBrick.width / 2, mirrorBrick.y + mirrorBrick.height / 2, this.getBrickColorValue(mirrorBrick.color));
            }
        }
        
        // Bolinha da Fortuna - +1 moeda extra
        if (this.hasUpgrade('lucky_ball')) {
            this.money += 1;
        }
        
        // Reforço - destruir bloco de trás (linha de cima)
        if (this.hasUpgrade('reinforced_paddle') || this.hasUpgrade('repulsor_shield')) {
            // Verificar se o bloco atingido está se movendo
            const hitBrickIsMoving = brick.isMoving;
            
            // Calcular posição do bloco de trás (linha de cima)
            // O bloco de trás é o bloco que está na linha superior, mesma coluna
            const behindY = brick.y - this.config.brickHeight - this.config.brickSpacing;
            
            // Encontrar bloco de trás (linha de cima, mesma coluna)
            const behindBrick = this.bricks.find(b => 
                !b.destroyed && 
                b.color !== 'red' &&
                Math.abs(b.x - brick.x) < 5 && // Mesma coluna (tolerância de 5 pixels)
                Math.abs(b.y - behindY) < 5 // Linha de cima
            );
            
            // Só destruir o bloco de trás se:
            // 1. Existe um bloco na linha de cima
            // 2. Nem o bloco atingido nem o bloco de cima estiverem se movendo
            // Se não houver bloco na linha de cima, simplesmente ignora (não faz nada extra)
            if (behindBrick && !hitBrickIsMoving && !behindBrick.isMoving) {
                behindBrick.destroyed = true;
                // Atualizar contador de tijolos
                if (this.currentBrickCount[behindBrick.color] > 0) {
                    this.currentBrickCount[behindBrick.color]--;
                }
                this.money += this.getBrickReward(behindBrick.color);
                this.createParticles(behindBrick.x + behindBrick.width / 2, behindBrick.y + behindBrick.height / 2, this.getBrickColorValue(behindBrick.color));
            }
            // Se não houver bloco na linha de cima, o upgrade não faz nada adicional
        }
        
        // Tocar som de batida no tijolo
        this.playSound('brickHit');
    }
    
    hasUpgrade(upgradeId) {
        // Verificar se o poder não está desativado pelo modificador "Sem Efeitos Bons"
        if (this.disabledPowers.includes(upgradeId)) {
            return false;
        }
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
        // Tocar som de explosão
        this.playSound('explosiveHit');
        
        const explosionRadius = 80;
        
        // Quebrar tijolos próximos (exceto o bloco vermelho)
        this.bricks.forEach(brick => {
            if (!brick.destroyed && brick.color !== 'red') {
                const dx = (brick.x + brick.width / 2) - ball.x;
                const dy = (brick.y + brick.height / 2) - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= explosionRadius) {
                    brick.destroyed = true;
                    // Atualizar contador de tijolos
                    if (this.currentBrickCount[brick.color] > 0) {
                        this.currentBrickCount[brick.color]--;
                    }
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
    
    updateActivatablePowers() {
        this.activatablePowers = [];
        
        // Lista de poderes que podem ser ativados
        const powerIds = ['super_magnet', 'paddle_dash', 'charged_shot', 'safety_net', 'effect_activator', 'cushion_paddle', 'multi_ball', 'time_ball', 'dimensional_ball'];
        
        powerIds.forEach(powerId => {
            if (this.hasUpgrade(powerId)) {
                // Verificar se o poder não está desativado pelo modificador "Sem Efeitos Bons"
                if (!this.disabledPowers.includes(powerId)) {
                    this.activatablePowers.push(powerId);
                }
            }
        });
        
        // Ajustar índice selecionado se necessário
        if (this.selectedPowerIndex >= this.activatablePowers.length) {
            this.selectedPowerIndex = Math.max(0, this.activatablePowers.length - 1);
        }
    }
    
    selectNextPower() {
        if (this.activatablePowers.length > 0) {
            this.selectedPowerIndex = (this.selectedPowerIndex + 1) % this.activatablePowers.length;
            this.updatePowerSelectionUI();
        }
    }
    
    selectPreviousPower() {
        if (this.activatablePowers.length > 0) {
            this.selectedPowerIndex = this.selectedPowerIndex === 0 
                ? this.activatablePowers.length - 1 
                : this.selectedPowerIndex - 1;
            this.updatePowerSelectionUI();
        }
    }
    
    activateSelectedUpgrade() {
        if (this.activatablePowers.length > 0) {
            const selectedPower = this.activatablePowers[this.selectedPowerIndex];
            this.activateSpecificUpgrade(selectedPower);
        }
    }
    
    activateSpecificUpgrade(powerId) {
        switch (powerId) {
            case 'super_magnet':
                if (!this.activeUpgradeEffects.superMagnet.active && this.activeUpgradeEffects.superMagnet.startTime === 0) {
                    this.activeUpgradeEffects.superMagnet.active = true;
                    this.activeUpgradeEffects.superMagnet.startTime = Date.now();
                    this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#3498db');
                    this.playSound('superMagnet');
                }
                break;
                
            case 'paddle_dash':
                if (!this.activeUpgradeEffects.paddleDash.active && this.activeUpgradeEffects.paddleDash.startTime === 0) {
                    this.activeUpgradeEffects.paddleDash.active = true;
                    this.activeUpgradeEffects.paddleDash.startTime = Date.now();
                    this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#f1c40f');
                    this.playSound('paddleDash');
                }
                break;
                
            case 'charged_shot':
                if (this.activeUpgradeEffects.chargedShot.startTime === 0) {
                    // Atirar imediatamente sem carregamento
                    this.fireChargedShot();
                }
                break;
                
            case 'safety_net':
                if (!this.activeUpgradeEffects.safetyNet.active && this.activeUpgradeEffects.safetyNet.startTime === 0) {
                    this.activeUpgradeEffects.safetyNet.active = true;
                    this.activeUpgradeEffects.safetyNet.startTime = Date.now();
                    this.createParticles(this.width / 2, this.height - 20, '#2ecc71');
                    this.playSound('safetyNet');
                }
                break;
                
            case 'effect_activator':
                if (this.activeUpgradeEffects.effectActivator.startTime === 0) {
                    this.activeUpgradeEffects.effectActivator.startTime = Date.now();
                    // Ativar efeito aleatório
                    const effects = ['yellow', 'green', 'purple', 'gray'];
                    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                    this.applyBrickEffectForActivator(randomEffect);
                    
                    // Ganhar moedas baseadas na cor do efeito ativado
                    const coinsEarned = this.getBrickReward(randomEffect);
                    this.money += coinsEarned;
                    
                    this.playSound('effectActivator');
                }
                break;
                
            case 'cushion_paddle':
                if (!this.activeUpgradeEffects.cushionPaddle.active && this.activeUpgradeEffects.cushionPaddle.startTime === 0) {
                    this.activeUpgradeEffects.cushionPaddle.active = true;
                    this.activeUpgradeEffects.cushionPaddle.startTime = Date.now();
                    this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#e67e22');
                    this.playSound('cushionPaddle');
                }
                break;
                
            case 'multi_ball':
                if (this.activeUpgradeEffects.multiBall.startTime === 0) {
                    // Criar nova bola grudada na plataforma
                    this.balls.push({
                        x: this.paddle.x + this.paddle.width / 2,
                        y: this.paddle.y - this.config.ballRadius - 5,
                        vx: 0,
                        vy: 0,
                        radius: this.config.ballRadius,
                        explosive: false,
                        attached: true,
                        attachedTimer: 0, // Timer para liberação automática (2 segundos)
                        visible: true,
                        trail: []
                    });
                    
                    // Iniciar cooldown usando tempo real
                    this.activeUpgradeEffects.multiBall.startTime = Date.now();
                    
                    // Efeitos visuais e sonoros
                    this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#fdcb6e');
                    this.playSound('multiBall');
                }
                break;
                
            case 'time_ball':
                if (this.activeUpgradeEffects.timeBall.startTime === 0) {
                    // Salvar estado do efeito zig-zag
                    const wasZigzagActive = this.ballEffects.zigzag;
                    
                    // Desativar efeito zig-zag durante a pausa
                    if (wasZigzagActive) {
                        this.ballEffects.zigzag = false;
                    }
                    
                    // Salvar velocidades atuais das bolinhas
                    this.balls.forEach(ball => {
                        ball.savedVx = ball.vx;
                        ball.savedVy = ball.vy;
                        ball.vx = 0;
                        ball.vy = 0;
                        ball.timePaused = true;
                        ball.timePauseCountdown = 180; // 3 segundos (60 FPS * 3)
                        ball.savedZigzagState = wasZigzagActive; // Salvar estado do zig-zag
                        ball.savedZigzagPattern = this.ballEffects.zigzagPattern; // Salvar estado do padrão
                        ball.savedZigzagInverted = this.ballEffects.zigzagInverted; // Salvar estado da inversão
                    });
                    
                    // Iniciar cooldown usando tempo real
                    this.activeUpgradeEffects.timeBall.startTime = Date.now();
                    
                    // Efeitos visuais e sonoros
                    this.createParticles(this.width / 2, this.height / 2, '#3498db');
                    this.playSound('chaoticMovement'); // Reutilizar som místico
                }
                break;
                
            case 'dimensional_ball':
                // Ativar apenas se não estiver ativa e não estiver em cooldown
                if (!this.activeUpgradeEffects.dimensionalBall.active && this.activeUpgradeEffects.dimensionalBall.startTime === 0) {
                    // Ativar e iniciar contador de 3 segundos
                    this.activeUpgradeEffects.dimensionalBall.active = true;
                    this.activeUpgradeEffects.dimensionalBall.startTime = Date.now();
                    this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#8e44ad');
                    this.playSound('superMagnet');
                }
                break;
        }
    }
    
    activateUpgrade() {
        // Super Ímã
        if (this.hasUpgrade('super_magnet') && !this.activeUpgradeEffects.superMagnet.active && this.activeUpgradeEffects.superMagnet.timer <= 0) {
            this.activeUpgradeEffects.superMagnet.active = true;
            this.activeUpgradeEffects.superMagnet.timer = this.activeUpgradeEffects.superMagnet.duration;
            this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#3498db');
        }
        
        // Tiro Carregado
        if (this.hasUpgrade('charged_shot') && !this.activeUpgradeEffects.chargedShot.charging) {
            this.activeUpgradeEffects.chargedShot.charging = true;
            this.activeUpgradeEffects.chargedShot.chargeLevel = 0;
        }
        
        // Rede de Segurança
        if (this.hasUpgrade('safety_net') && !this.activeUpgradeEffects.safetyNet.active && this.activeUpgradeEffects.safetyNet.timer <= 0) {
            this.activeUpgradeEffects.safetyNet.active = true;
            this.activeUpgradeEffects.safetyNet.timer = this.activeUpgradeEffects.safetyNet.duration;
            this.createParticles(this.width / 2, this.height - 20, '#2ecc71');
        }
        
    }
    
    fireChargedShot() {
        if (this.hasUpgrade('charged_shot')) {
            // Criar projétil imediatamente
            this.powerUps.push({
                x: this.paddle.x + this.paddle.width / 2,
                y: this.paddle.y,
                vx: 0,
                vy: -2.4, // +20% de -2.0 para -2.4
                radius: 4,
                power: 1,
                type: 'charged_shot',
                life: 350
            });
            
            // Tocar som
            this.playSound('chargedShot');
            
            // Iniciar cooldown usando tempo real
            this.activeUpgradeEffects.chargedShot.startTime = Date.now();
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
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                
                <!-- Canhão esquerdo -->
                <rect x="7" y="18" width="4" height="6" fill="#95a5a6" stroke="#7f8c8d" stroke-width="1"/>
                <rect x="6" y="17" width="6" height="2" fill="#7f8c8d" stroke="#6c7b7d" stroke-width="1"/>
                <circle cx="9" cy="16" r="1.5" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <circle cx="9" cy="13" r="1.5" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                
                <!-- Canhão direito -->
                <rect x="21" y="18" width="4" height="6" fill="#95a5a6" stroke="#7f8c8d" stroke-width="1"/>
                <rect x="20" y="17" width="6" height="2" fill="#7f8c8d" stroke="#6c7b7d" stroke-width="1"/>
                <circle cx="23" cy="16" r="1.5" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <circle cx="23" cy="13" r="1.5" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                
                <!-- Efeito de energia dos canhões -->
                <path d="M6 10 Q9 8 12 10" stroke="#e74c3c" stroke-width="1" fill="none" opacity="0.7"/>
                <path d="M20 10 Q23 8 26 10" stroke="#e74c3c" stroke-width="1" fill="none" opacity="0.7"/>
            </svg>`,
            
            'super_magnet': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                <rect x="12" y="18" width="8" height="8" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <circle cx="16" cy="22" r="2" fill="#ffffff"/>
                <path d="M8 12 Q16 8 24 12" stroke="#3498db" stroke-width="2" fill="none"/>
                <path d="M8 20 Q16 16 24 20" stroke="#3498db" stroke-width="2" fill="none"/>
            </svg>`,
            
            'paddle_dash': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                <path d="M16 20 L20 16 L16 12 L20 8" stroke="#f1c40f" stroke-width="2" fill="none"/>
                <circle cx="20" cy="8" r="2" fill="#f1c40f"/>
            </svg>`,
            
            'cushion_paddle': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Plataforma base (similar à Plataforma Larga) -->
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                
                <!-- Camada de gelo sobre a plataforma -->
                <rect x="1" y="24" width="30" height="3" fill="#87ceeb" opacity="0.7"/>
                <rect x="1" y="25" width="30" height="1" fill="#b0e0e6" opacity="0.8"/>
                
                <!-- Cristais de gelo na plataforma -->
                <path d="M6 25 L8 23 L10 25 L8 27 Z" fill="#ffffff" opacity="0.9"/>
                <path d="M14 25 L16 23 L18 25 L16 27 Z" fill="#ffffff" opacity="0.9"/>
                <path d="M22 25 L24 23 L26 25 L24 27 Z" fill="#ffffff" opacity="0.9"/>
                
                <!-- Bolinha congelada (com cristais de gelo) -->
                <circle cx="16" cy="16" r="3" fill="#87ceeb" stroke="#4682b4" stroke-width="1"/>
                <circle cx="16" cy="16" r="2" fill="#b0e0e6" opacity="0.8"/>
                
                <!-- Cristais de gelo ao redor da bolinha -->
                <path d="M16 10 L18 12 L16 14 L14 12 Z" fill="#ffffff" opacity="0.8"/>
                <path d="M22 16 L20 18 L18 16 L20 14 Z" fill="#ffffff" opacity="0.8"/>
                <path d="M16 22 L14 20 L16 18 L18 20 Z" fill="#ffffff" opacity="0.8"/>
                <path d="M10 16 L12 14 L14 16 L12 18 Z" fill="#ffffff" opacity="0.8"/>
            </svg>`,
            
            'reinforced_paddle': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Plataforma reforçada (2x mais alta) -->
                <rect x="2" y="20" width="28" height="8" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="2" y="16" width="28" height="4" fill="#e17055" stroke="#d63031" stroke-width="1"/>
                <rect x="2" y="12" width="28" height="4" fill="#d63031" stroke="#d63031" stroke-width="1"/>
                
                <!-- Dois blocos empilhados representando "linha de cima" -->
                <rect x="12" y="8" width="8" height="4" fill="#3498db" stroke="#2980b9" stroke-width="1"/>
                <rect x="12" y="4" width="8" height="4" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                
                <!-- Efeito de destruição (rachaduras) -->
                <path d="M14 6 L16 8" stroke="#ffffff" stroke-width="1" fill="none"/>
                <path d="M18 6 L20 8" stroke="#ffffff" stroke-width="1" fill="none"/>
                
                <!-- Seta indicando poder de destruição -->
                <path d="M16 10 L16 8" stroke="#f1c40f" stroke-width="2" fill="none"/>
                <path d="M14 8 L16 6 L18 8" fill="#f1c40f"/>
            </svg>`,
            
            'speed_boost': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Plataforma base -->
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                
                <!-- Símbolo de velocidade aumentada -->
                <!-- Ondas de velocidade (de ponta cabeça) -->
                <path d="M8 20 Q16 16 24 20" stroke="white" stroke-width="1.5" fill="none" opacity="0.7"/>
                <path d="M8 16 Q16 12 24 16" stroke="white" stroke-width="1.5" fill="none" opacity="0.7"/>
                <path d="M8 12 Q16 8 24 12" stroke="white" stroke-width="1.5" fill="none" opacity="0.7"/>
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
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                
                <!-- Canhão curto e elegante -->
                <rect x="13" y="18" width="6" height="6" fill="#95a5a6" stroke="#7f8c8d" stroke-width="1"/>
                <rect x="12" y="17" width="8" height="2" fill="#7f8c8d" stroke="#6c7b7d" stroke-width="1"/>
                
                <!-- Boca do canhão -->
                <circle cx="16" cy="16" r="2" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                
                <!-- Projétil carregado -->
                <circle cx="16" cy="12" r="2.5" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
                <circle cx="16" cy="12" r="1.5" fill="#f7dc6f"/>
                
                <!-- Efeito de energia -->
                <path d="M12 8 Q16 6 20 8" stroke="#f1c40f" stroke-width="1.5" fill="none" opacity="0.8"/>
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
            
            'accelerated_vision': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="4" fill="#ffffff" stroke="#2980b9" stroke-width="1"/>
                <path d="M8 8 Q16 12 24 8" stroke="#95a5a6" stroke-width="1.5" fill="none" opacity="0.6"/>
                <path d="M8 12 Q16 16 24 12" stroke="#95a5a6" stroke-width="1.5" fill="none" opacity="0.6"/>
                <path d="M8 16 Q16 20 24 16" stroke="#95a5a6" stroke-width="1.5" fill="none" opacity="0.6"/>
                <path d="M8 20 Q16 24 24 20" stroke="#95a5a6" stroke-width="1.5" fill="none" opacity="0.6"/>
            </svg>`,
            

            
            'multi_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="12" cy="16" r="4" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1"/>
                <circle cx="20" cy="16" r="4" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1"/>
                <path d="M12 12 Q16 8 20 12" stroke="#ff6b35" stroke-width="1" fill="none"/>
                <path d="M12 20 Q16 24 20 20" stroke="#ff6b35" stroke-width="1" fill="none"/>
            </svg>`,
            
            'combo_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Bolinha original -->
                <circle cx="16" cy="16" r="5" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1.5"/>
                <!-- Bolinha duplicada (com ângulo de 10°) -->
                <circle cx="18" cy="14" r="5" fill="#9b59b6" stroke="#8e44ad" stroke-width="1.5" opacity="0.8"/>
                <!-- Efeito de duplicação (linhas de energia) -->
                <path d="M16 11 Q18 13 20 15" stroke="#f39c12" stroke-width="1" opacity="0.7" fill="none"/>
                <path d="M16 21 Q18 19 20 17" stroke="#f39c12" stroke-width="1" opacity="0.7" fill="none"/>
                <!-- Partículas de energia -->
                <circle cx="14" cy="12" r="1" fill="#f39c12" opacity="0.8"/>
                <circle cx="20" cy="18" r="1" fill="#f39c12" opacity="0.8"/>
                <circle cx="15" cy="19" r="0.8" fill="#e67e22" opacity="0.7"/>
                <circle cx="19" cy="13" r="0.8" fill="#e67e22" opacity="0.7"/>
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
                <!-- Bolinha amarela -->
                <circle cx="16" cy="16" r="6" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
                <!-- Símbolo $ verde escuro no centro -->
                <text x="16" y="19" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#1e7e34">$</text>
            </svg>`,
            
            'wombo_combo_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="7" fill="#9b59b6" stroke="#8e44ad" stroke-width="2"/>
                <circle cx="16" cy="16" r="4" fill="#ffffff" stroke="#8e44ad" stroke-width="1"/>
                <text x="16" y="19" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#8e44ad">W</text>
                <circle cx="8" cy="8" r="2" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <circle cx="24" cy="8" r="2" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <circle cx="8" cy="24" r="2" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <circle cx="24" cy="24" r="2" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                <path d="M16 4 L16 12 M16 20 L16 28 M4 16 L12 16 M20 16 L28 16" stroke="#e74c3c" stroke-width="1.5"/>
            </svg>`,
            
            // Upgrades de Utilidade
            'extra_life': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Coração vermelho realista -->
                <path d="M16 8 C12 4, 6 6, 6 12 C6 18, 16 26, 16 26 C16 26, 26 18, 26 12 C26 6, 20 4, 16 8 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                
                <!-- Símbolo + branco no centro -->
                <path d="M16 12 L16 20 M12 16 L20 16" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>`,
            
            'safety_net': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="2" y="26" width="28" height="4" fill="#ff6b35" stroke="#d63031" stroke-width="1"/>
                <rect x="1" y="25" width="30" height="2" fill="#fdcb6e"/>
                <rect x="1" y="29" width="30" height="2" fill="#e17055"/>
                <path d="M4 24 L28 24" stroke="#2ecc71" stroke-width="2"/>
                <path d="M6 22 L26 22" stroke="#2ecc71" stroke-width="2"/>
                <path d="M8 20 L24 20" stroke="#2ecc71" stroke-width="2"/>
                <path d="M10 18 L22 18" stroke="#2ecc71" stroke-width="2"/>
                <path d="M12 16 L20 16" stroke="#2ecc71" stroke-width="2"/>
            </svg>`,
            
            'lucky_amulet': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="8" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
                <path d="M16 8 L18 12 L22 12 L19 15 L20 19 L16 17 L12 19 L13 15 L10 12 L14 12 Z" fill="#e67e22"/>
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
                <!-- Mira externa (círculo grande) -->
                <circle cx="16" cy="16" r="10" fill="none" stroke="#e74c3c" stroke-width="2" opacity="0.8"/>
                <!-- Mira interna (círculo médio) -->
                <circle cx="16" cy="16" r="6" fill="none" stroke="#c0392b" stroke-width="1.5" opacity="0.9"/>
                <!-- Cruz central -->
                <path d="M16 6 L16 26" stroke="#e74c3c" stroke-width="1.5"/>
                <path d="M6 16 L26 16" stroke="#e74c3c" stroke-width="1.5"/>
                <!-- Cruz diagonal -->
                <path d="M10 10 L22 22" stroke="#c0392b" stroke-width="1" opacity="0.7"/>
                <path d="M22 10 L10 22" stroke="#c0392b" stroke-width="1" opacity="0.7"/>
                <!-- Efeito de foco (linhas convergentes) -->
                <path d="M4 4 L8 8" stroke="#f39c12" stroke-width="0.8" opacity="0.6"/>
                <path d="M28 4 L24 8" stroke="#f39c12" stroke-width="0.8" opacity="0.6"/>
                <path d="M4 28 L8 24" stroke="#f39c12" stroke-width="0.8" opacity="0.6"/>
                <path d="M28 28 L24 24" stroke="#f39c12" stroke-width="0.8" opacity="0.6"/>
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
            
            'prime_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="8" fill="#fdcb6e" stroke="#ff6b35" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#e74c3c">P</text>
                <circle cx="12" cy="12" r="1.5" fill="#2ecc71"/>
                <circle cx="20" cy="12" r="1.5" fill="#2ecc71"/>
                <circle cx="12" cy="20" r="1.5" fill="#2ecc71"/>
                <circle cx="20" cy="20" r="1.5" fill="#2ecc71"/>
                <circle cx="16" cy="8" r="1" fill="#e74c3c"/>
                <circle cx="16" cy="24" r="1" fill="#e74c3c"/>
                <circle cx="8" cy="16" r="1" fill="#e74c3c"/>
                <circle cx="24" cy="16" r="1" fill="#e74c3c"/>
            </svg>`,
            
            'investor': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Coração amarelo -->
                <path d="M16 26 C 12 22, 6 18, 6 12 C 6 9 8 7 11 7 C 13 7 15 8 16 10 C 17 8 19 7 21 7 C 24 7 26 9 26 12 C 26 18 20 22 16 26 Z" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
                <!-- Símbolo $$ verde no centro -->
                <text x="16" y="20" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#1e7e34">$$</text>
            </svg>`,
            
            'dimensional_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Portal dimensional (círculo externo) -->
                <circle cx="16" cy="16" r="8" fill="#8e44ad" stroke="#9b59b6" stroke-width="1.5" opacity="0.8"/>
                <circle cx="16" cy="16" r="6" fill="#9b59b6" stroke="#8e44ad" stroke-width="0.8" opacity="0.6"/>
                <!-- Bolinha no centro -->
                <circle cx="16" cy="16" r="3" fill="#ffffff" stroke="#bdc3c7" stroke-width="0.6"/>
                <!-- Efeitos dimensionais (energia) -->
                <path d="M8 16 Q16 10 24 16" stroke="#f39c12" stroke-width="1" opacity="0.7" fill="none"/>
                <path d="M8 16 Q16 22 24 16" stroke="#f39c12" stroke-width="1" opacity="0.7" fill="none"/>
                <path d="M16 8 Q10 16 16 24" stroke="#f39c12" stroke-width="1" opacity="0.7" fill="none"/>
                <path d="M16 8 Q22 16 16 24" stroke="#f39c12" stroke-width="1" opacity="0.7" fill="none"/>
                <!-- Partículas de energia -->
                <circle cx="10" cy="10" r="0.6" fill="#f39c12" opacity="0.8"/>
                <circle cx="22" cy="10" r="0.6" fill="#f39c12" opacity="0.8"/>
                <circle cx="10" cy="22" r="0.6" fill="#f39c12" opacity="0.8"/>
                <circle cx="22" cy="22" r="0.6" fill="#f39c12" opacity="0.8"/>
                <!-- Símbolo dimensional (infinito) -->
                <path d="M13 14 Q12 13 13 12 Q14 11 16 12 Q18 11 19 12 Q20 13 19 14 Q18 15 16 14 Q14 15 13 14" stroke="#ffffff" stroke-width="0.6" fill="none" opacity="0.8"/>
            </svg>`,
            'money_saver': `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="6" y="8" width="20" height="16" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/>
                <rect x="8" y="10" width="16" height="12" fill="#ffffff"/>
                <circle cx="16" cy="16" r="4" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
                <text x="16" y="19" text-anchor="middle" font-family="Arial" font-size="8" fill="#2c3e50">$</text>
                <rect x="14" y="4" width="4" height="2" fill="#95a5a6"/>
            </svg>`,
            
            'time_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Bolinha azul (50% menor) -->
                <circle cx="12" cy="12" r="6" fill="#3498db" stroke="#2980b9" stroke-width="2"/>
                <!-- Ampulheta amarela em pé, na diagonal da bolinha -->
                <rect x="20" y="4" width="4" height="8" fill="#f1c40f" stroke="#f39c12" stroke-width="0.5"/>
                <path d="M20 4 L22 8 L24 4 Z" fill="#e67e22"/>
                <path d="M20 12 L22 8 L24 12 Z" fill="#d35400"/>
                <!-- Areia caindo -->
                <circle cx="22" cy="10" r="0.6" fill="#f39c12"/>
                <circle cx="22" cy="11" r="0.3" fill="#f39c12"/>
            </svg>`,
            
            'ghost_ball': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Bolinha fantasma (semi-transparente) -->
                <circle cx="16" cy="16" r="4" fill="#9b59b6" stroke="#8e44ad" stroke-width="1" opacity="0.7"/>
                <circle cx="16" cy="16" r="3" fill="#bb8fce" opacity="0.5"/>
                
                <!-- Efeito fantasma (ondas) -->
                <circle cx="16" cy="16" r="7" fill="none" stroke="#9b59b6" stroke-width="1" opacity="0.4"/>
                <circle cx="16" cy="16" r="10" fill="none" stroke="#9b59b6" stroke-width="1" stroke-dasharray="2,2" opacity="0.3"/>
                
                <!-- Símbolo de reaparecimento (seta para cima) -->
                <path d="M16 6 L14 8 L16 10 L18 8 Z" fill="#9b59b6" opacity="0.8"/>
                <path d="M16 10 L16 14" stroke="#9b59b6" stroke-width="2" opacity="0.8"/>
            </svg>`,
            
            'zigzag_stabilizer': `<svg width="32" height="32" viewBox="0 0 32 32">
                <!-- Bolinha central -->
                <circle cx="16" cy="16" r="4" fill="#fdcb6e" stroke="#ff6b35" stroke-width="1"/>
                
                <!-- Ondas de zigue-zague (amplitude reduzida) -->
                <path d="M4 8 Q8 6 12 8 Q16 10 20 8 Q24 6 28 8" stroke="#9b59b6" stroke-width="1.5" fill="none" opacity="0.8"/>
                <path d="M4 12 Q8 10 12 12 Q16 14 20 12 Q24 10 28 12" stroke="#9b59b6" stroke-width="1.5" fill="none" opacity="0.6"/>
                <path d="M4 16 Q8 14 12 16 Q16 18 20 16 Q24 14 28 16" stroke="#9b59b6" stroke-width="1.5" fill="none" opacity="0.4"/>
                <path d="M4 20 Q8 18 12 20 Q16 22 20 20 Q24 18 28 20" stroke="#9b59b6" stroke-width="1.5" fill="none" opacity="0.6"/>
                <path d="M4 24 Q8 22 12 24 Q16 26 20 24 Q24 22 28 24" stroke="#9b59b6" stroke-width="1.5" fill="none" opacity="0.8"/>
                
                <!-- Símbolo de estabilização (círculo com setas) -->
                <circle cx="16" cy="16" r="6" fill="none" stroke="#2ecc71" stroke-width="1" opacity="0.7"/>
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
                // Zigue-zague + Inversão horizontal específica do zigzag (alternada)
                
                // Ativar zigzag se não estiver ativo
                if (!this.ballEffects.zigzag) {
                    this.ballEffects.zigzag = true;
                    this.ballEffects.zigzagPattern = 0; // Começar com padrão 0
                    this.ballEffects.zigzagTimer = 0;
                    this.ballEffects.zigzagInverted = false; // Começar sem inversão
                } else {
                    // Alternar padrão: 0 -> 1 ou 1 -> 0
                    this.ballEffects.zigzagPattern = 1 - this.ballEffects.zigzagPattern;
                    this.ballEffects.zigzagTimer = 0; // Resetar para mudança imediata
                }
                
                // Alternar inversão horizontal: uma sim, uma não
                this.ballEffects.zigzagInverted = !this.ballEffects.zigzagInverted;
                break;
            case 'gray':
                // Invisibilidade - só aplica se não estiver já ativo
                if (!this.ballEffects.invisible) {
                    this.ballEffects.invisible = true;
                    this.ballEffects.invisibleTimer = 60; // Começar com 1s invisível
                    this.ballEffects.invisibleCycle = 1; // Começar invisível
                }
                break;
        }
    }
    
    applyBrickEffectForActivator(color) {
        // Versão do applyBrickEffect para o Ativador de Efeito
        // Não inclui inversão horizontal para o efeito roxo
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
                // Zigue-zague SEM inversão horizontal (apenas para Ativador de Efeito)
                
                // Ativar zigzag se não estiver ativo
                if (!this.ballEffects.zigzag) {
                    this.ballEffects.zigzag = true;
                    this.ballEffects.zigzagPattern = 0; // Começar com padrão 0
                    this.ballEffects.zigzagTimer = 0;
                } else {
                    // Alternar padrão: 0 -> 1 ou 1 -> 0
                    this.ballEffects.zigzagPattern = 1 - this.ballEffects.zigzagPattern;
                    this.ballEffects.zigzagTimer = 0; // Resetar para mudança imediata
                }
                // NÃO alterar zigzagInverted - sem inversão horizontal
                break;
            case 'gray':
                // Invisibilidade - só aplica se não estiver já ativo
                if (!this.ballEffects.invisible) {
                    this.ballEffects.invisible = true;
                    this.ballEffects.invisibleTimer = 60; // Começar com 1s invisível
                    this.ballEffects.invisibleCycle = 1; // Começar invisível
                }
                break;
        }
    }
    
    getBrickReward(color) {
        const rewards = {
            'blue': 1,
            'yellow': 3,
            'green': 2,
            'purple': 7,
            'gray': 3,
            'white': 5,
            'red': 10,

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
            'white': '#ffffff',
            'red': '#e74c3c',

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
            zigzagTimer: 0,
            zigzagPattern: 0,
            zigzagInverted: false
        };
    }
    
    updateBallEffects() {
        // Atualizar timer de invisibilidade com ciclo
        if (this.ballEffects.invisibleTimer > 0) {
            this.ballEffects.invisibleTimer--;
            
            if (this.ballEffects.invisibleCycle === 1) {
                // Fase invisível (1 segundo = 60 frames)
                if (this.ballEffects.invisibleTimer <= 0) {
                    this.ballEffects.invisibleCycle = 0; // Mudar para visível
                    this.ballEffects.invisibleTimer = 60; // 1 segundo visível
                }
            } else {
                // Fase visível (1 segundo = 60 frames)
                if (this.ballEffects.invisibleTimer <= 0) {
                    this.ballEffects.invisibleCycle = 1; // Mudar para invisível
                    this.ballEffects.invisibleTimer = 60; // 1 segundo invisível
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
                vx: (Math.random() - 0.5) * 19.2, // +20% de 16 para 19.2
                vy: (Math.random() - 0.5) * 19.2, // +20% de 16 para 19.2
                color: color,
                life: 30,
                maxLife: 30,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createComboText(x, y) {
        this.comboTexts.push({
            x: x,
            y: y,
            text: 'COMBO!',
            life: 120, // 2 segundos a 60 FPS
            maxLife: 120,
            alpha: 1,
            scale: 1,
            vx: (Math.random() - 0.5) * 2, // Movimento aleatório leve
            vy: -1 // Movimento para cima
        });
    }
    
    canDuplicateBall() {
        // Contar quantas bolinhas roxas (duplicadas) já existem
        const purpleBalls = this.balls.filter(ball => ball.color === 'purple').length;
        
        // Só pode duplicar se não tiver nenhuma bolinha roxa ainda
        return purpleBalls === 0;
    }
    
    duplicateBall(originalBall) {
        // Calcular ângulo atual da velocidade
        const currentAngle = Math.atan2(originalBall.vy, originalBall.vx);
        
        // Adicionar 10 graus (convertido para radianos)
        const newAngle = currentAngle + (10 * Math.PI / 180);
        
        // Calcular velocidade com ângulo modificado
        const speed = Math.sqrt(originalBall.vx * originalBall.vx + originalBall.vy * originalBall.vy);
        const newVx = Math.cos(newAngle) * speed;
        const newVy = Math.sin(newAngle) * speed;
        
        // Criar nova bolinha idêntica à original com estrutura completa
        const newBall = {
            x: originalBall.x,
            y: originalBall.y,
            vx: newVx,
            vy: newVy,
            radius: originalBall.radius,
            visible: originalBall.visible,
            trail: [],
            attached: false,
            attachedTimer: 0,
            explosive: originalBall.explosive || false,
            color: 'purple' // Cor especial para bolinha duplicada
        };
        
        // Adicionar à lista de bolinhas
        this.balls.push(newBall);
        
        // Criar efeito visual de duplicação
        this.createEffectText(originalBall.x, originalBall.y, 'DUPLICADA!', '#9b59b6');
        
        // Tocar som de duplicação
        this.playSound('paddleHit');
    }
    
    createEffectText(x, y, text, color) {
        this.comboTexts.push({
            x: x,
            y: y,
            text: text,
            life: 120, // 2 segundos a 60 FPS
            maxLife: 120,
            alpha: 1,
            scale: 1,
            vx: (Math.random() - 0.5) * 2, // Movimento aleatório leve
            vy: -1, // Movimento para cima
            color: color || '#ffffff' // Cor personalizada
        });
    }
    
    createFragment(x, y) {
        // Calcular velocidade base
        let baseVx = (Math.random() - 0.5) * 1.92; // -60% de 4.8 para 1.92
        let baseVy = 1.92 + Math.random() * 1.92; // -60% de 4.8+4.8 para 1.92+1.92
        
        // Reduzir velocidade em 20% se Pânico Vermelho estiver ativo
        if (this.phaseModifiers.redPanic) {
            baseVx *= 0.8; // Reduzir 20%
            baseVy *= 0.8; // Reduzir 20%
        }
        
        this.fragments.push({
            x: x,
            y: y,
            vx: baseVx,
            vy: baseVy,
            size: 8,
            color: '#ffffff',
            life: 300 // 5 segundos a 60fps
        });
    }
    
    loseLife() {
        // Verificar se tem Bolinha Fantasma e ainda não foi usada nesta fase
        if (this.hasUpgrade('ghost_ball') && !this.ghostBallUsedThisPhase) {
            this.ghostBallUsedThisPhase = true;
            
            // Salvar a velocidade da bolinha que caiu (se houver)
            let savedVx = 0;
            let savedVy = 2; // Velocidade padrão para baixo
            if (this.balls.length > 0) {
                savedVx = this.balls[0].vx;
                savedVy = Math.abs(this.balls[0].vy); // Garantir que seja para baixo
            }
            
            // Tocar som de efeito fantasma
            this.playSound('cushionPaddle'); // Usar som existente
            
            // Recriar bolinha no topo do campo mantendo a trajetória
            this.balls = [{
                x: this.width / 2,
                y: 50, // Topo do campo
                vx: savedVx, // Manter velocidade horizontal
                vy: savedVy, // Manter velocidade vertical (para baixo)
                radius: this.config.ballRadius,
                visible: true,
                trail: [],
                attached: false, // Não presa à plataforma
                attachedTimer: 0,
                explosive: false,
            }];
            
            return; // Não perder vida nem moedas
        }
        
        this.lives--;
        
        // Tocar som de perda de vida
        this.playSound('loseLife');
        
        // Perder 10 moedas ao perder vida
        this.money = Math.max(0, this.money - 10);
        
        // Seguro de Vida - ganhar 100 moedas ao invés de perder
        if (this.hasUpgrade('life_insurance')) {
            this.money += 100;
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
                attached: true, // Nova bolinha presa à plataforma
                attachedTimer: 0, // Timer para liberação automática (2 segundos)
                explosive: false,
    
            }];
            // Resetar efeitos ao perder vida (exceto speedMultiplier do bloco vermelho)
            const currentSpeedMultiplier = this.ballEffects.speedMultiplier;
            this.resetBallEffects();
            this.ballEffects.speedMultiplier = currentSpeedMultiplier;
        }
    }
    
    loseLifeFromFragment() {
        this.lives--;
        
        // Tocar som de perda de vida
        this.playSound('loseLife');
        
        // Perder 10 moedas ao perder vida
        this.money = Math.max(0, this.money - 10);
        
        // Seguro de Vida - ganhar 100 moedas ao invés de perder
        if (this.hasUpgrade('life_insurance')) {
            this.money += 100;
        }
        
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
        // Não recriar bolinha nem resetar efeitos - o jogo continua normalmente
    }
    
    completePhase() {
        this.gameRunning = false;
        this.showUpgradeScreen();
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Salvar a fase atual antes de resetar
        const finalPhase = this.currentPhase;
        
        // Atualizar recorde
        if (this.currentPhase > this.highScore) {
            this.highScore = this.currentPhase;
            localStorage.setItem('brickRogueHighScore', this.highScore.toString());
        }
        
        // Resetar completamente o estado do jogo
        this.resetGameState();
        
        // Usar a fase salva para exibir na tela de game over
        document.getElementById('finalPhase').textContent = finalPhase;
        document.getElementById('finalRecord').textContent = this.highScore;
        this.showScreen('gameOverScreen');
    }
    
    checkShopPromotion() {
        // Regra especial: Primeira loja (fase 1) sempre vem com desconto
        if (this.currentPhase === 1) {
            this.shopPromotion.active = true;
            // Desconto para primeira loja: 20-40%
            this.shopPromotion.discountPercent = Math.floor(Math.random() * 21) + 20; // 20-40%
        }
        // Ativar promoção a cada 3 fases (fases 3, 6, 9, 12, etc.)
        else if (this.currentPhase % 3 === 0) {
            this.shopPromotion.active = true;
            // Desconto aleatório entre 20% e 40%
            this.shopPromotion.discountPercent = Math.floor(Math.random() * 21) + 20; // 20-40%
        } else {
            this.shopPromotion.active = false;
            this.shopPromotion.discountPercent = 0;
        }
    }
    
    updateDifficultySettings() {
        // Aumento da Velocidade Base da Bolinha: A cada fase, aumente em 2% (máximo 20%)
        const speedIncrease = Math.min((this.currentPhase - 1) * 0.02, 0.20);
        this.difficultySettings.ballSpeedMultiplier = 1.0 + speedIncrease;
        
        // Redução Sutil da Plataforma: A cada 2 fases, reduza em 3%
        const paddleReduction = Math.floor((this.currentPhase - 1) / 2) * 0.03;
        this.difficultySettings.paddleSizeMultiplier = Math.max(0.5, 1.0 - paddleReduction);
        
        // Aumento da Densidade de Tijolos: A cada 2 fases, aumente chances
        const densityIncrease = Math.floor((this.currentPhase - 1) / 2);
        this.difficultySettings.purpleBrickChance = Math.min(0.35, 0.15 + densityIncrease * 0.01); // Máximo 20% acima do base
        this.difficultySettings.whiteBrickChance = Math.min(0.25, 0.05 + densityIncrease * 0.02); // Máximo 20% acima do base
        

        
        // Película de vidro: A partir da fase 4, 15% de chance
        this.difficultySettings.glassCoatingChance = this.currentPhase >= 4 ? 0.15 : 0.0;
        
        // Tijolos Móveis: A partir da fase 5, 10% de chance por fileira
        this.difficultySettings.movingBricksChance = this.currentPhase >= 5 ? 0.10 : 0.0;
        
        // Novos blocos removidos - agora é parte do modificador Pânico Vermelho
        
        // Modificadores aleatórios: A partir da fase 4
        if (this.currentPhase >= 4 && this.difficultySettings.activeModifier === null) {
            this.selectRandomModifier();
        }
    }
    
    selectRandomModifier() {
        const modifiers = [
            'chaoticMovement', 'inflatedMarket', 'redPanic', 
            'weakBattery', 'noGoodEffects', 'countdown'
        ];
        
        const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        this.difficultySettings.activeModifier = randomModifier;
        this.difficultySettings.modifierStartPhase = this.currentPhase;
        
        // Ativar o modificador
        this.phaseModifiers[randomModifier] = true;
        
        // Configurações específicas do modificador
        if (randomModifier === 'countdown') {
            this.countdownTimer = 60; // 60 segundos
            this.countdownActive = true;
        } else if (randomModifier === 'noGoodEffects') {
            // Desativar metade dos poderes aleatoriamente
            this.disableRandomPowers();
        }
        
        // Se Contagem Regressiva foi selecionada, sempre ativar Pânico Vermelho também
        if (randomModifier === 'countdown') {
            this.phaseModifiers.redPanic = true;
            this.showModifierNotification('countdown'); // Mostrar apenas "Contagem Regressiva"
        } else {
            // Mostrar notificação do modificador normal
            this.showModifierNotification(randomModifier);
        }
    }
    
    showModifierNotification(modifier) {
        const modifierNames = {
            'chaoticMovement': 'Movimento Caótico',
            'inflatedMarket': 'Mercado Inflacionado',
            'redPanic': 'Pânico Vermelho',
            'weakBattery': 'Bateria Fraca',
            'noGoodEffects': 'Sem Efeitos Bons',
            'countdown': 'Contagem Regressiva'
        };
        
        // Criar notificação visual
        const notification = document.createElement('div');
        notification.id = 'modifierNotification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ff6b35;
            padding: 20px;
            border: 3px solid #ff6b35;
            border-radius: 15px;
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 0 30px rgba(255, 107, 53, 0.5);
        `;
        notification.innerHTML = `
            <div>Modificador Ativo:</div>
            <div style="color: #fdcb6e; margin-top: 10px;">${modifierNames[modifier]}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Efeito de fade out suave após 2.5 segundos
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s ease-out';
            notification.style.opacity = '0';
        }, 2500);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    showComboRewardNotification(comboCount) {
        // Criar notificação visual para recompensa de combo
        const notification = document.createElement('div');
        
        // Verificar se a Bolinha Wombo Combo está ativa
        const isWomboComboActive = this.hasUpgrade('wombo_combo_ball');
        const baseCombo = isWomboComboActive ? comboCount / 2 : comboCount;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${isWomboComboActive ? '#9b59b6' : '#ff6b35'};
            padding: 20px;
            border: 3px solid ${isWomboComboActive ? '#9b59b6' : '#ff6b35'};
            border-radius: 15px;
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 0 30px ${isWomboComboActive ? 'rgba(155, 89, 182, 0.5)' : 'rgba(255, 107, 53, 0.5)'};
        `;
        
        let notificationText = `
            <div>Recompensa de Combo:</div>
            <div style="color: #fdcb6e; margin-top: 10px;">+${comboCount} moedas 🪙 ganhas pelo combo máximo</div>
        `;
        
        if (isWomboComboActive) {
            notificationText = `
                <div>Recompensa de Combo (Wombo Combo!):</div>
                <div style="color: #fdcb6e; margin-top: 10px;">+${baseCombo} × 2 = +${comboCount} moedas 🪙</div>
                <div style="color: #9b59b6; margin-top: 5px; font-size: 1rem;">Bolinha Wombo Combo dobrou a recompensa!</div>
            `;
        }
        
        notification.innerHTML = notificationText;
        
        document.body.appendChild(notification);
        
        // Efeito de fade out suave após 2.5 segundos
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s ease-out';
            notification.style.opacity = '0';
        }, 2500);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    disableRandomPowers() {
        // Obter TODOS os upgrades que o jogador possui
        const allPlayerUpgrades = this.activeUpgrades.map(upgrade => upgrade.id);
        
        // Desativar exatamente 50% dos upgrades do jogador
        const halfCount = Math.floor(allPlayerUpgrades.length / 2);
        const disabledPowers = [];
        
        // Criar uma cópia da lista para não modificar a original
        const availableUpgrades = [...allPlayerUpgrades];
        
        for (let i = 0; i < halfCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            const upgradeToDisable = availableUpgrades.splice(randomIndex, 1)[0];
            disabledPowers.push(upgradeToDisable);
        }
        
        // Armazenar upgrades desativados
        this.disabledPowers = disabledPowers;
        
        // Recriar interface de poderes para mostrar visualmente os desativados
        this.createPowersInterface();
        
        // Atualizar lista de poderes ativáveis
        this.updateActivatablePowers();
        this.updatePowerSelectionUI();
    }
    
    resetPhaseModifiers() {
        // Resetar todos os modificadores
        this.phaseModifiers = {
            chaoticMovement: false,
            inflatedMarket: false,
            redPanic: false,
            weakBattery: false,
            noGoodEffects: false,
            countdown: false
        };
        
        // Desativar estados relacionados a modificadores
        this.countdownActive = false;
        this.countdownTimer = 0;
        this.redPanicDirectionTimer = 0;
        
        // Resetar estado do movimento caótico
        this.chaoticMovementTimer = 0;
        
        // Resetar poderes desativados
        this.disabledPowers = [];

        // Permitir novo sorteio de modificador na próxima fase (fases 6+)
        this.difficultySettings.activeModifier = null;
        this.difficultySettings.modifierStartPhase = 0;
    }
    
    updateSpeedDisplay() {
        if (!this.developerMode) return;
        
        // Calcular velocidade total da bolinha
        const baseSpeed = this.difficultySettings.ballSpeedMultiplier;
        const effectsSpeed = this.ballEffects.speedMultiplier;
        const totalSpeed = baseSpeed * effectsSpeed;
        
        // Atualizar displays
        document.getElementById('ballSpeedDisplay').textContent = Math.round(totalSpeed * 100) + '%';
        document.getElementById('baseSpeedDisplay').textContent = Math.round(baseSpeed * 100) + '%';
        document.getElementById('effectsSpeedDisplay').textContent = Math.round(effectsSpeed * 100) + '%';
    }
    

    
    skipPhase() {
        if (!this.developerMode) return;
        
        // Completar fase atual
        this.completePhase();
    }
    
    addDeveloperMoney() {
        if (!this.developerMode) return;
        
        this.money += 200;
        this.updateUI();
        
        // Feedback visual
        this.showDeveloperNotification('+200 Moedas!');
    }
    
    showDeveloperNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(39, 174, 96, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(39, 174, 96, 0.4);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    initializeDevUpgrades() {
        // Inicializar upgrades comprados do desenvolvedor
        if (!this.devUpgrades) {
            this.devUpgrades = {};
        }
        
        // Gerar todos os upgrades do jogo
        this.generateDevUpgrades();
        
        // Atualizar visual dos upgrades
        this.updateDevUpgradesVisual();
    }
    
    generateDevUpgrades() {
        const devUpgradesGrid = document.getElementById('devUpgradesGrid');
        if (!devUpgradesGrid) return;
        
        // Limpar grid existente
        devUpgradesGrid.innerHTML = '';
        
        // Obter todos os upgrades do jogo
        const allUpgrades = this.getAllUpgrades();
        
        // Gerar itens de upgrade
        allUpgrades.forEach(upgrade => {
            const upgradeItem = document.createElement('div');
            upgradeItem.className = 'dev-upgrade-item';
            upgradeItem.setAttribute('data-upgrade', upgrade.id);
            
            upgradeItem.innerHTML = `
                <div class="dev-upgrade-icon">
                    ${upgrade.icon}
                </div>
                <div class="dev-upgrade-name">${upgrade.name}</div>
            `;
            
            // Adicionar event listener
            upgradeItem.addEventListener('click', (e) => {
                this.purchaseDevUpgrade(upgrade.id, upgradeItem);
            });
            
            devUpgradesGrid.appendChild(upgradeItem);
        });
    }
    
    purchaseDevUpgrade(upgradeId, element) {
        if (!this.developerMode) return;
        
        const upgrade = this.getAllUpgrades().find(u => u.id === upgradeId);
        const upgradeName = upgrade ? upgrade.name : upgradeId;
        
        // Verificar se o upgrade já foi comprado
        if (!this.devUpgrades[upgradeId]) {
            // Comprar upgrade
            this.devUpgrades[upgradeId] = true;
            
            // Aplicar efeito visual de compra
            element.classList.add('purchasing');
            setTimeout(() => {
                element.classList.remove('purchasing');
                element.classList.add('purchased');
                
                // Aplicar efeito do upgrade
                this.applyDevUpgrade(upgradeId);
                
                // Atualizar visual dos upgrades
                this.updateDevUpgradesVisual();
            }, 300);
            
            // Feedback visual
            this.showDeveloperNotification(`${upgradeName} comprado!`);
        } else {
            // Descomprar upgrade
            this.devUpgrades[upgradeId] = false;
            
            // Aplicar efeito visual de descompra
            element.classList.add('purchasing');
            setTimeout(() => {
                element.classList.remove('purchasing');
                element.classList.remove('purchased');
                
                // Remover efeito do upgrade
                this.removeDevUpgrade(upgradeId);
                
                // Atualizar visual dos upgrades
                this.updateDevUpgradesVisual();
            }, 300);
            
            // Feedback visual
            this.showDeveloperNotification(`${upgradeName} removido!`);
        }
    }
    
    applyDevUpgrade(upgradeId) {
        // Adicionar upgrade à lista de upgrades ativos
        if (!this.activeUpgrades) {
            this.activeUpgrades = [];
        }
        
        // Verificar se o upgrade já está ativo
        const isAlreadyActive = this.activeUpgrades.some(upgrade => upgrade.id === upgradeId);
        if (!isAlreadyActive) {
            const upgrade = this.getAllUpgrades().find(u => u.id === upgradeId);
            if (upgrade) {
                this.activeUpgrades.push(upgrade);
                
                // Aplicar efeitos do upgrade
                this.applyUpgrades();
                
                // Atualizar UI
                this.updateUI();
            }
        }
    }
    
    removeDevUpgrade(upgradeId) {
        // Remover upgrade da lista de upgrades ativos
        if (this.activeUpgrades) {
            this.activeUpgrades = this.activeUpgrades.filter(upgrade => upgrade.id !== upgradeId);
            
            // Reaplicar todos os upgrades restantes
            this.applyUpgrades();
            
            // Atualizar UI
            this.updateUI();
        }
    }
    
    updateDevUpgradesVisual() {
        const upgradeItems = document.querySelectorAll('.dev-upgrade-item');
        upgradeItems.forEach(item => {
            const upgradeId = item.getAttribute('data-upgrade');
            // Verificar tanto no sistema de dev quanto no sistema normal de upgrades
            const isPurchasedInDev = this.devUpgrades && this.devUpgrades[upgradeId];
            const isPurchasedInNormal = this.hasUpgrade(upgradeId);
            
            if (isPurchasedInDev || isPurchasedInNormal) {
                item.classList.add('purchased');
            } else {
                item.classList.remove('purchased');
            }
        });
    }
    
    
    initializeDeveloperMode() {
        // Inicializar estado do modo desenvolvedor baseado na variável
        const developerPanel = document.getElementById('developerPanel');
        const controls = document.getElementById('developerControls');
        const infoPanel = document.getElementById('gameInfoPanel');
        const brickCounterPanel = document.getElementById('brickCounterPanel');
        const devUpgradesContainer = document.getElementById('devUpgradesContainer');
        
        if (this.developerMode) {
            developerPanel.style.display = 'block';
            controls.style.display = 'flex';
            infoPanel.style.display = 'block';
            brickCounterPanel.style.display = 'block';
            devUpgradesContainer.style.display = 'block';
            
            // Inicializar upgrades do desenvolvedor
            this.initializeDevUpgrades();
        } else {
            developerPanel.style.display = 'none';
            controls.style.display = 'none';
            infoPanel.style.display = 'none';
            brickCounterPanel.style.display = 'none';
            devUpgradesContainer.style.display = 'none';
        }
    }
    
    resetGameState() {
        // Resetar configurações de dificuldade
        this.difficultySettings = {
            ballSpeedMultiplier: 1.0,
            paddleSizeMultiplier: 1.0,
            purpleBrickChance: 0.15,
            whiteBrickChance: 0.05,

            glassCoatingChance: 0.0,
            movingBricksChance: 0.0,

            activeModifier: null,
            modifierStartPhase: 0
        };
        
        // Resetar modificadores de fase
        this.phaseModifiers = {
            chaoticMovement: false,
            inflatedMarket: false,
            redPanic: false,
            weakBattery: false,
            noGoodEffects: false,
            countdown: false
        };
        
        // Resetar configurações específicas
        this.countdownActive = false;
        this.countdownTimer = 0;
        this.redPanicDirectionTimer = 0;
        this.disabledPowers = [];
        
        // Resetar efeitos da bolinha
        this.resetBallEffects();
        
        // Resetar contador de batidas
        this.ballHitCount = 0;
        
        // Resetar combo da fase
        this.currentPhaseCombo = 0;
        this.maxPhaseCombo = 0;
        
        // Resetar tempo de jogo
        this.gameTime = 0;
        this.phaseTime = 0;
        
        // Resetar multiplicador do conversor de risco
        this.riskConverterSpeedMultiplier = null;
        this.riskConverterTimer = null;
        
        // Resetar último tempo de multi-bola
        this.lastMultiBallTime = 0;
        
        // Resetar fase para 1
        this.currentPhase = 1;
        
        // Resetar vidas para 3
        this.lives = 3;
        
        // Resetar dinheiro para 0
        this.money = 0;
        
        // Resetar upgrades ativos
        this.activeUpgrades = [];
        
        // Resetar efeitos ativos de upgrades
        this.activeUpgradeEffects = {
            superMagnet: { active: false, startTime: 0, duration: 500, cooldown: 10000 }, 
            paddleDash: { active: false, startTime: 0, duration: 2000, cooldown: 8000 },
            chargedShot: { active: false, startTime: 0, duration: 500, cooldown: 5000 },
            safetyNet: { active: false, startTime: 0, duration: 5000, cooldown: 15000 },
            effectActivator: { active: false, startTime: 0, duration: 500, cooldown: 5000 },
            cushionPaddle: { active: false, startTime: 0, duration: 3000, cooldown: 10000 },
            multiBall: { active: false, startTime: 0, duration: 500, cooldown: 20000 },
            timeBall: { active: false, startTime: 0, duration: 500, cooldown: 15000 },
            dimensionalBall: { active: false, startTime: 0, duration: 3000, cooldown: 15000 }
        };
        
        // Resetar timers de upgrades
        this.upgradeTimers = {
            explosiveBall: 0
        };
        
        // Resetar promoção da loja
        this.shopPromotion = {
            active: false,
            discountPercent: 0
        };
        
        // Resetar dinheiro antes da loja
        this.moneyBeforeShop = 0;
        
        // Resetar interface do modo desenvolvedor se necessário
        if (this.developerMode) {
            this.initializeDeveloperMode();
        }
    }
    
    showUpgradeScreen() {
        // Reativar poderes desativados pelo modificador "Sem Efeitos Bons" antes de entrar na loja
        if (this.disabledPowers.length > 0) {
            this.disabledPowers = [];
            this.createPowersInterface();
            this.updateActivatablePowers();
            this.updatePowerSelectionUI();
        }
        
        // Recompensa de fase: somar combo máximo da fase nas moedas
        if (this.maxPhaseCombo > 0) {
            let comboReward = this.maxPhaseCombo;
            
            // Bolinha Wombo Combo: dobra a recompensa do combo máximo
            if (this.hasUpgrade('wombo_combo_ball')) {
                comboReward *= 2;
            }
            
            this.money += comboReward;
            
            // Feedback visual da recompensa
            this.showComboRewardNotification(comboReward);
        }
        
        // Armazenar dinheiro antes de entrar na loja
        this.moneyBeforeShop = this.money;
        
        // Verificar se deve ativar promoção (a cada 3 fases)
        this.checkShopPromotion();
        
        this.generateUpgradeOptions();
        this.updateUI(); // Atualizar UI para mostrar dinheiro atual
        this.showScreen('upgradeScreen');
    }
    
    generateUpgradeOptions() {
        const upgradesGrid = document.getElementById('upgradesGrid');
        upgradesGrid.innerHTML = '';
        
        const availableUpgrades = this.getAvailableUpgrades();
        
        // Verificar se há upgrades suficientes
        if (availableUpgrades.length === 0) {
            // Se não há upgrades disponíveis, mostrar apenas a opção de poupança
            this.createSavingsOption(upgradesGrid);
            return;
        }
        
        // Sempre mostrar 3 upgrades aleatórios + 1 opção fixa de poupança
        const selectedUpgrades = [];
        
        // Embaralhar e selecionar 3 upgrades aleatórios
        const shuffledUpgrades = [...availableUpgrades].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(3, shuffledUpgrades.length); i++) {
            selectedUpgrades.push(shuffledUpgrades[i]);
        }
        
        // Mostrar upgrades selecionados
        selectedUpgrades.forEach(upgrade => {
            // Calcular preço base considerando promoção
            let displayPrice = upgrade.price;
            if (this.shopPromotion.active) {
                displayPrice = Math.floor(upgrade.price * (1 - this.shopPromotion.discountPercent / 100));
            }
            // Aplicar Modificador "Mercado Inflacionado" para exibição (+50%)
            if (this.phaseModifiers && this.phaseModifiers.inflatedMarket) {
                displayPrice = Math.floor(displayPrice * 1.5);
            }
            
            const upgradeCard = document.createElement('div');
            upgradeCard.className = 'upgrade-card';
            
            // Adicionar classe especial se promoção estiver ativa
            if (this.shopPromotion.active) {
                upgradeCard.classList.add('promotion-active');
            }
            
            // Determinar cor do preço baseado no dinheiro disponível
            const canAfford = this.money >= displayPrice;
            const priceColorClass = canAfford ? 'price-affordable' : 'price-expensive';
            
            upgradeCard.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.description}</div>
                <div class="upgrade-price ${priceColorClass}">
                    ${this.shopPromotion.active ? `<span class="original-price">${upgrade.price}</span>` : ''}
                    ${displayPrice} 🪙
                    ${this.shopPromotion.active ? `<span class="discount-badge">-${this.shopPromotion.discountPercent}%</span>` : ''}
                </div>
            `;
            
            // Desabilitar imediatamente se já comprado (nunca oferecer duplicado, por segurança visual)
            if (this.hasUpgrade(upgrade.id)) {
                upgradeCard.classList.add('disabled');
            }

            upgradeCard.addEventListener('click', () => {
                if (upgradeCard.classList.contains('disabled')) return;
                this.selectUpgrade(upgrade, upgradeCard, displayPrice);
            });
            
            upgradesGrid.appendChild(upgradeCard);
        });
        
        // Adicionar opção fixa de poupança
        this.createSavingsOption(upgradesGrid);
        
        // Atualizar cores dos preços após gerar todos os upgrades
        this.updateUpgradePriceColors();
    }
    
    getAvailableUpgrades() {
        // Lista completa de todos os upgrades
        const allUpgrades = [
            // Upgrades de Plataforma (1-7)
            {
                id: 'wide_paddle',
                name: 'Plataforma Larga',
                description: 'Aumenta o tamanho da plataforma em 50%',
                price: 150,
                type: 'paddle',
                icon: this.getUpgradeIcon('wide_paddle')
            },
            {
                id: 'attached_cannons',
                name: 'Canhões Acoplados',
                description: 'A plataforma atira 2 projéteis apenas em batidas ímpares',
                price: 170,
                type: 'paddle',
                icon: this.getUpgradeIcon('attached_cannons')
            },
            {
                id: 'super_magnet',
                name: 'Super Ímã',
                description: 'Campo magnético que puxa a bolinha por 2 segundos (Mantenha espaço pressionado)',
                price: 180,
                type: 'paddle',
                icon: this.getUpgradeIcon('super_magnet')
            },
            {
                id: 'paddle_dash',
                name: 'Dash de Plataforma',
                description: 'Permite um movimento rápido (dash) para a esquerda ou direita por 3 segundos.',
                price: 140,
                type: 'paddle',
                icon: this.getUpgradeIcon('paddle_dash')
            },
            {
                id: 'cushion_paddle',
                name: 'Plataforma de Desaceleração',
                description: 'Diminui em 50% a velocidade de todas as bolinhas por 10 segundos. Cooldown de 60 segundos.',
                price: 80,
                type: 'paddle',
                icon: this.getUpgradeIcon('cushion_paddle')
            },
            {
                id: 'repulsor_shield',
                name: 'Reforço',
                description: 'A plataforma fica 2x mais alta e a bolinha destrói o bloco atingido e o bloco de trás',
                price: 220,
                type: 'paddle',
                icon: this.getUpgradeIcon('repulsor_shield')
            },
            {
                id: 'charged_shot',
                name: 'Tiro Carregado',
                description: 'Atira um projétil perfurante imediatamente.',
                price: 190,
                type: 'paddle',
                icon: this.getUpgradeIcon('charged_shot')
            },
            
            // Upgrades de Bolinha (8-14)
            {
                id: 'piercing_ball',
                name: 'Bolinha Perfurante',
                description: 'A bolinha quebra 1 tijolo comum (azul) sem mudar de direção',
                price: 220,
                type: 'ball',
                icon: this.getUpgradeIcon('piercing_ball')
            },
            {
                id: 'friction_field',
                name: 'Campo de Fricção',
                description: 'Deixa a bolinha 10% mais lenta',
                price: 160,
                type: 'ball',
                icon: this.getUpgradeIcon('friction_field')
            },

            {
                id: 'multi_ball',
                name: 'Multi-bola',
                description: 'Cria uma nova bolinha grudada na plataforma. Liberada automaticamente em 2 segundos.',
                price: 200,
                type: 'ball',
                icon: this.getUpgradeIcon('multi_ball')
            },
            {
                id: 'combo_ball',
                name: 'Bolinha Combo',
                description: 'A cada 5 combos consecutivos, duplica a bolinha atual uma vez',
                price: 150,
                type: 'ball',
                icon: this.getUpgradeIcon('combo_ball')
            },
            {
                id: 'explosive_ball',
                name: 'Bolinha Explosiva',
                description: 'A bolinha explode ao atingir um tijolo, destruindo tijolos adjacentes em uma pequena área',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('explosive_ball')
            },
            {
                id: 'ball_echo',
                name: 'Eco da Bolinha',
                description: 'Destrói um bloco aleatório adicional a cada batida (apenas em fases ímpares)',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('ball_echo')
            },
            {
                id: 'effect_activator',
                name: 'Ativador de Efeito',
                description: 'Ativa efeito aleatório dos blocos na bolinha e ganha moedas baseadas na cor do efeito ativado',
                price: 60,
                type: 'ball',
                icon: this.getUpgradeIcon('effect_activator')
            },
            {
                id: 'mirror_ball',
                name: 'Bolinha Espelhada',
                description: 'Quando a bolinha destrói um bloco, também destrói o bloco simetricamente posicionado do outro lado da tela (apenas nos primeiros 2 minutos de cada fase)',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('mirror_ball')
            },
            {
                id: 'lucky_ball',
                name: 'Bolinha da Fortuna',
                description: 'A bolinha fica dourada e ganha +1 moeda extra por cada bloco quebrado',
                price: 150,
                type: 'ball',
                icon: this.getUpgradeIcon('lucky_ball')
            },
            {
                id: 'wombo_combo_ball',
                name: 'Bolinha Wombo Combo',
                description: 'Adiciona +1 moeda por bloco quebrado em combos e dobra a recompensa do combo máximo na loja',
                price: 200,
                type: 'ball',
                icon: this.getUpgradeIcon('wombo_combo_ball')
            },
            
            // Upgrades de Utilidade e Defesa (15-20)
            {
                id: 'extra_life',
                name: 'Coração Extra',
                description: 'Ganha uma vida a cada fase',
                price: 180,
                type: 'utility',
                icon: this.getUpgradeIcon('extra_life')
            },
            {
                id: 'safety_net',
                name: 'Rede de Segurança',
                description: 'Uma barreira de energia temporária aparece na parte inferior da tela por 15 segundos',
                price: 300,
                type: 'utility',
                icon: this.getUpgradeIcon('safety_net')
            },
            {
                id: 'lucky_amulet',
                name: 'Amuleto da Sorte',
                description: '25% de chance de dobrar dinheiro ao destruir blocos',
                price: 80,
                type: 'utility',
                icon: this.getUpgradeIcon('lucky_amulet')
            },
            {
                id: 'life_insurance',
                name: 'Seguro de Vida',
                description: 'Ao perder uma vida, ganha 100 moedas ao invés de perder 10',
                price: 150,
                type: 'utility',
                icon: this.getUpgradeIcon('life_insurance')
            },
            {
                id: 'recycling',
                name: 'Reciclagem',
                description: 'Tijolos azuis (comuns) têm 10% de chance de reaparecer após serem quebrados',
                price: 30,
                type: 'utility',
                icon: this.getUpgradeIcon('recycling')
            },
            {
                id: 'risk_converter',
                name: 'Conversor de Risco',
                description: 'Diminui vida do bloco vermelho para 2, muda velocidade da bolinha entre 80%-140% a cada 5s e desativa a troca de posição do bloco vermelho',
                price: 100,
                type: 'utility',
                icon: this.getUpgradeIcon('risk_converter')
            },
            {
                id: 'accelerated_vision',
                name: 'Visão Acelerada',
                description: 'Reduz velocidade dos fragmentos brancos em 40%',
                price: 120,
                type: 'utility',
                icon: this.getUpgradeIcon('accelerated_vision')
            },
            
            // Upgrades "Especiais" (21-25)
            {
                id: 'structural_damage',
                name: 'Dano Estrutural',
                description: 'A primeira batida no bloco vermelho dá 3 de dano',
                price: 180,
                type: 'special',
                icon: this.getUpgradeIcon('structural_damage')
            },
            {
                id: 'heat_vision',
                name: 'Visão de Calor',
                description: 'A bolinha invisível deixa um rastro térmico muito mais visível',
                price: 100,
                type: 'special',
                icon: this.getUpgradeIcon('heat_vision')
            },
            {
                id: 'controlled_reversal',
                name: 'Reversão Controlada',
                description: 'Desativa completamente o efeito de Inversão do tijolo verde',
                price: 120,
                type: 'special',
                icon: this.getUpgradeIcon('controlled_reversal')
            },
            {
                id: 'prime_ball',
                name: 'Bolinha Prima',
                description: 'A cada número primo de batidas, destrói um bloco aleatório (não vermelho)',
                price: 120,
                type: 'special',
                icon: this.getUpgradeIcon('prime_ball')
            },
            {
                id: 'investor',
                name: 'Investidor',
                description: 'Menos 1 vida máxima, mas toda fase começa com +100 moedas',
                price: 50,
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
            },
            {
                id: 'time_ball',
                name: 'Bolinha do Tempo',
                description: 'Pausa todas as bolinhas por 3 segundos. Cooldown de 40 segundos.',
                price: 180,
                type: 'ball',
                icon: this.getUpgradeIcon('time_ball')
            },
            {
                id: 'ghost_ball',
                name: 'Bolinha Fantasma',
                description: 'Quando a bolinha cai pela primeira vez em cada fase, ela reaparece no topo do campo.',
                price: 250,
                type: 'ball',
                icon: this.getUpgradeIcon('ghost_ball')
            },
            {
                id: 'dimensional_ball',
                name: 'Bolinha Dimensional',
                description: 'Mantenha espaço pressionado (até 5s) para atravessar tijolos sem quebrá-los. Cooldown 60s.',
                price: 140,
                type: 'ball',
                icon: this.getUpgradeIcon('dimensional_ball')
            }
        ];
        
        // Adicionar poder removido se existir (evitar duplicatas pelo id)
        if (this.removedInitialPower) {
            const exists = allUpgrades.some(u => u.id === this.removedInitialPower.id);
            if (!exists) {
                allUpgrades.push(this.removedInitialPower);
            }
        }
        
        // Filtrar upgrades já comprados
        return allUpgrades.filter(upgrade => !this.hasUpgrade(upgrade.id));
    }
    
    selectUpgrade(upgrade, cardElement, discountedPrice = null) {
        // Se já possui este upgrade, não permitir nova compra
        if (this.hasUpgrade(upgrade.id)) {
            if (cardElement) {
                cardElement.classList.add('disabled');
            }
            return;
        }
        
        // Se este é o poder removido sendo comprado novamente, limpar a referência
        if (this.removedInitialPower && upgrade.id === this.removedInitialPower.id) {
            this.removedInitialPower = null;
        }

        let priceToPay = discountedPrice !== null ? discountedPrice : upgrade.price;

        // Modificador "Mercado Inflacionado" - upgrades custam 50% a mais
        // Só aplicar se o discountedPrice não foi passado (já inclui o aumento)
        if (this.phaseModifiers.inflatedMarket && discountedPrice === null) {
            priceToPay = Math.floor(priceToPay * 1.5);
        }

        if (this.money >= priceToPay) {
            this.money -= priceToPay;
            
            // Registrar compra para sistema de poupança
            this.shopPurchases.push({
                upgrade: upgrade,
                price: priceToPay,
                timestamp: Date.now()
            });
            
            // Tocar som de compra
            this.playSound('purchase');
            
            this.updateUI(); // Atualizar UI em tempo real
            // Garantir que não haja duplicatas
            if (!this.hasUpgrade(upgrade.id)) {
                this.activeUpgrades.push(upgrade);
            }
            // Marcar visualmente como comprado e desabilitar novas compras
            if (cardElement) {
                cardElement.classList.add('selected');
                cardElement.classList.add('disabled');
            }
            this.updateUI();
            
            // Atualizar cores dos preços após a compra
            this.updateUpgradePriceColors();
            
            // Atualizar visualmente a opção de poupança se existir
            this.updateSavingsCardVisual();
            
            // Aplicar upgrade imediatamente se for do tipo especial
            if (upgrade.id === 'investor') {
                // Investidor altera o teto de vida; recalcular e clamp
                if (typeof this.updateMaxLivesAndClamp === 'function') {
                    this.updateMaxLivesAndClamp();
                }
                this.updateUI();
            }
            
            // Se for Conversor de Risco, regenerar blocos para aplicar o efeito
            if (upgrade.id === 'risk_converter') {
                this.generateBricks();
            }
        }
    }
    
    applyUpgrades() {
        this.activeUpgrades.forEach(upgrade => {
            switch (upgrade.id) {
                case 'wide_paddle':
                    this.paddle.width = this.config.paddleWidth * 1.5;
                    break;
                case 'reinforced_paddle':
                    // Reforço - plataforma 2x mais alta
                    this.paddle.height = this.config.paddleHeight * 2;
                    break;
                case 'repulsor_shield':
                    // Reforço - plataforma 2x mais alta
                    this.paddle.height = this.config.paddleHeight * 2;
                    break;
                case 'multi_ball':
                    // Multi-bola agora é um poder ativável
                    // Não precisa de inicialização especial
                    break;
                case 'extra_life':
                    // Coração Extra ajusta o teto conforme investidor
                    if (typeof this.updateMaxLivesAndClamp === 'function') {
                        this.updateMaxLivesAndClamp();
                    }
                    if (this.lives < this.maxLives) {
                        this.lives++;
                    }
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
                case 'prime_ball':
                    // Bolinha Prima - contador é gerenciado em handleBrickCollision
                    break;
                case 'zigzag_stabilizer':
                    // Estabilizador de Zigue-zague - efeito passivo aplicado no updateBalls
                    break;
                case 'speed_boost':
                    // Impulso de Velocidade - efeito passivo aplicado no updatePaddle
                    break;
            }
        });
        
        // Atualizar visual dos upgrades do desenvolvedor se estiver no modo dev
        if (this.developerMode) {
            this.updateDevUpgradesVisual();
        }
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
                    // Diminuir vida máxima do bloco vermelho para 2
                    break;
                case 'life_insurance':
                    // Proteger dinheiro ao perder vida
                    break;
            }
        });
    }
    
    continueToNextPhase() {
        this.currentPhase++;
        // Recalcular teto de vidas no início de cada fase e clamp
        if (typeof this.updateMaxLivesAndClamp === 'function') {
            this.updateMaxLivesAndClamp();
        }
        this.resetBallEffects(); // Resetar todos os efeitos para nova fase
        this.ballHitCount = 0; // Resetar contador da Bolinha Prima
        this.paddle.hitCount = 0; // Resetar contador de batidas da plataforma para Canhões Acoplados
        this.ghostBallUsedThisPhase = false; // Resetar uso da Bolinha Fantasma para nova fase
        
        // Resetar combo da fase para nova fase
        this.currentPhaseCombo = 0;
        this.maxPhaseCombo = 0;
        
        // Resetar tempo da fase
        this.phaseTime = 0;
        
        // Remover poder inicial na fase 2
        if (this.currentPhase === 2 && this.initialPower) {
            this.removeInitialPower();
        }
        
        // Resetar cooldowns de todos os poderes ativos
        Object.keys(this.activeUpgradeEffects).forEach(key => {
            this.activeUpgradeEffects[key].timer = 0;
            this.activeUpgradeEffects[key].active = false;
        });
        
        // Resetar modificadores de fase
        this.resetPhaseModifiers();
        
        // Atualizar configurações de dificuldade
        this.updateDifficultySettings();
        
        // Sistema de poupança automática - aplicado a cada loja individualmente
        const moneyBeforeShop = this.moneyBeforeShop || 0;
        const hasBoughtSomething = this.shopPurchases && this.shopPurchases.length > 0;
        
        if (!hasBoughtSomething && moneyBeforeShop > 0) {
            // Se não comprou nada nesta loja, manter 30% do dinheiro desta loja
            const savedMoney = Math.floor(moneyBeforeShop * 0.3);
            this.money = savedMoney;
            
            // Mostrar notificação de poupança ativada apenas no modo desenvolvedor
            if (this.developerMode) {
                this.showSavingsNotification(savedMoney, moneyBeforeShop);
            }
        } else {
            // Se comprou algo nesta loja, zerar dinheiro (não cumulativo)
            this.money = 0;
        }
        
        // Limpar compras da loja para próxima fase
        this.shopPurchases = [];

        // Investidor: cada fase inicia com +100 moedas
        if (this.hasUpgrade && this.hasUpgrade('investor')) {
            this.money += 100;
        }
        
        // Limpar referência do dinheiro antes da loja
        this.moneyBeforeShop = null;
        
        this.initGameObjects();
        this.generateBricks();
        this.applyUpgrades(); // Aplicar upgrades após inicializar objetos e gerar tijolos
        this.gameRunning = true;
        this.showScreen('gameScreen');
        this.updateUI();
        this.gameLoop(performance.now());
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
        
        // Atualizar subtitle da loja
        const upgradeSubtitle = document.getElementById('upgradeSubtitle');
        if (upgradeSubtitle) {
            const parts = [];
            if (this.shopPromotion.active) {
                parts.push(`Promoção: -${this.shopPromotion.discountPercent}%`);
            }
            if (this.phaseModifiers && this.phaseModifiers.inflatedMarket) {
                parts.push('Mercado Inflacionado: +50%');
            }
            upgradeSubtitle.textContent = parts.length ? parts.join(' | ') : 'Escolha seus upgrades';
        }
        
        // Atualizar vidas
        const livesElement = document.getElementById('lives');
        livesElement.innerHTML = '♥️'.repeat(this.lives);
        
        // Atualizar contador da Bolinha Prima
        const primeCounter = document.getElementById('primeCounter');
        const hitCountElement = document.getElementById('hitCount');
        if (primeCounter && hitCountElement) {
            if (this.hasUpgrade('prime_ball')) {
                primeCounter.style.display = 'flex';
                hitCountElement.textContent = this.ballHitCount;
            } else {
                primeCounter.style.display = 'none';
            }
        }
        
        // Atualizar combo máximo da fase
        const maxComboElement = document.getElementById('maxCombo');
        if (maxComboElement) {
            maxComboElement.textContent = this.maxPhaseCombo;
        }
        
        // Atualizar interface de poderes
        this.updatePowersUI();
        
        // Atualizar contador de tijolos
        this.updateBrickCounter();
        
        // Atualizar lista de poderes ativáveis e interface de seleção
        this.updateActivatablePowers();
        this.updatePowerSelectionUI();
        
        // Atualizar visual dos upgrades do desenvolvedor se estiver no modo dev
        if (this.developerMode) {
            this.updateDevUpgradesVisual();
        }
    }
    
    updateUpgradePriceColors() {
        // Atualizar cores dos preços dos upgrades baseado no dinheiro atual
        const upgradeCards = document.querySelectorAll('.upgrade-card');
        upgradeCards.forEach(card => {
            const priceElement = card.querySelector('.upgrade-price');
            if (priceElement) {
                // Remover classes de cor existentes
                priceElement.classList.remove('price-affordable', 'price-expensive');
                
                // Se o card não está desabilitado (não foi comprado)
                if (!card.classList.contains('disabled')) {
                    // Extrair o preço do texto de forma mais robusta
                    let priceText = priceElement.textContent;
                    
                    // Se há um span com original-price, remover essa parte
                    const originalPriceSpan = priceElement.querySelector('.original-price');
                    if (originalPriceSpan) {
                        priceText = priceText.replace(originalPriceSpan.textContent, '');
                    }
                    
                    // Se há um span com discount-badge, remover essa parte
                    const discountBadge = priceElement.querySelector('.discount-badge');
                    if (discountBadge) {
                        priceText = priceText.replace(discountBadge.textContent, '');
                    }
                    
                    // Remover emoji, espaços e caracteres especiais
                    priceText = priceText.replace(/[🪙\s-]/g, '');
                    
                    // Remover qualquer texto de desconto restante
                    priceText = priceText.replace(/\d+%/g, '');
                    
                    // Extrair apenas o primeiro número encontrado (que deve ser o preço final)
                    const priceMatch = priceText.match(/\d+/);
                    const price = priceMatch ? parseInt(priceMatch[0]) : null;
                    
                    if (price !== null && !isNaN(price)) {
                        // Aplicar cor baseada na capacidade de compra
                        // Preços 0 (gratuitos) sempre ficam verdes
                        const canAfford = price === 0 || this.money >= price;
                        const priceColorClass = canAfford ? 'price-affordable' : 'price-expensive';
                        priceElement.classList.add(priceColorClass);
                    }
                }
            }
        });
    }
    
    createSavingsOption(upgradesGrid) {
        const savingsCard = document.createElement('div');
        savingsCard.className = 'upgrade-card savings-card';
        
        // Verificar se o jogador já comprou algo nesta loja
        const hasBoughtSomething = this.shopPurchases && this.shopPurchases.length > 0;
        
        if (hasBoughtSomething) {
            savingsCard.classList.add('disabled');
        }
        
        // SVG do porquinho rosa segurando moeda
        const piggyBankIcon = `
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Corpo do porquinho -->
                <ellipse cx="24" cy="32" rx="18" ry="12" fill="#ff69b4"/>
                <!-- Cabeça do porquinho -->
                <circle cx="24" cy="20" r="12" fill="#ff69b4"/>
                <!-- Focinho de porco -->
                <ellipse cx="24" cy="16" rx="5" ry="4" fill="#ffb6c1"/>
                <!-- Nariz do porco (2 buracos) -->
                <ellipse cx="22" cy="15" rx="1" ry="0.8" fill="#ff1493"/>
                <ellipse cx="26" cy="15" rx="1" ry="0.8" fill="#ff1493"/>
                <!-- Orelhas -->
                <ellipse cx="16" cy="12" rx="3" ry="5" fill="#ff69b4" transform="rotate(-30 16 12)"/>
                <ellipse cx="32" cy="12" rx="3" ry="5" fill="#ff69b4" transform="rotate(30 32 12)"/>
                <!-- Pernas -->
                <ellipse cx="18" cy="42" rx="3" ry="4" fill="#ff69b4"/>
                <ellipse cx="30" cy="42" rx="3" ry="4" fill="#ff69b4"/>
                <!-- Moeda na pata -->
                <circle cx="12" cy="28" r="4" fill="#ffd700" stroke="#ff8c00" stroke-width="1"/>
                <text x="12" y="31" text-anchor="middle" font-size="4" fill="#ff8c00" font-weight="bold">$</text>
                <!-- Riscos na moeda -->
                <line x1="8" y1="28" x2="16" y2="28" stroke="#ff8c00" stroke-width="0.5"/>
                <line x1="12" y1="24" x2="12" y2="32" stroke="#ff8c00" stroke-width="0.5"/>
            </svg>
        `;
        
        savingsCard.innerHTML = `
            <div class="upgrade-icon">${piggyBankIcon}</div>
            <div class="upgrade-name">Poupança</div>
            <div class="upgrade-description">Se não comprar nada nesta loja, guarde 30% do dinheiro para próxima partida</div>
        `;
        
        // A opção de poupança não é clicável - é automática
        if (!hasBoughtSomething) {
            savingsCard.style.cursor = 'default';
        }
        
        upgradesGrid.appendChild(savingsCard);
    }
    
    showSavingsNotification(savedMoney, originalMoney) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'savings-notification';
        notification.innerHTML = `
            <div class="savings-notification-content">
                <div class="savings-icon">🐷</div>
                <div class="savings-text">
                    <div class="savings-title">Poupança Ativada!</div>
                    <div class="savings-details">Guardou ${savedMoney} de ${originalMoney} moedas (30%)</div>
                </div>
            </div>
        `;
        
        // Adicionar estilos inline para garantir que funcione
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 15px;
            border: 3px solid #27ae60;
            box-shadow: 0 10px 30px rgba(46, 204, 113, 0.5);
            z-index: 10000;
            font-family: 'Courier New', monospace;
            text-align: center;
            animation: savingsPop 0.6s ease forwards;
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    updateSavingsCardVisual() {
        const savingsCard = document.querySelector('.savings-card');
        if (savingsCard) {
            const hasBoughtSomething = this.shopPurchases && this.shopPurchases.length > 0;
            
            if (hasBoughtSomething) {
                savingsCard.classList.add('disabled');
            } else {
                savingsCard.classList.remove('disabled');
            }
        }
    }
    
    updateBrickCounter() {
        // Só atualizar se o modo desenvolvedor estiver ativo
        if (!this.developerMode) return;
        
        // Atualizar contadores de tijolos na interface
        document.getElementById('blueCount').textContent = this.currentBrickCount.blue;
        document.getElementById('yellowCount').textContent = this.currentBrickCount.yellow;
        document.getElementById('greenCount').textContent = this.currentBrickCount.green;
        document.getElementById('purpleCount').textContent = this.currentBrickCount.purple;
        document.getElementById('grayCount').textContent = this.currentBrickCount.gray;
        document.getElementById('whiteCount').textContent = this.currentBrickCount.white;
        document.getElementById('redCount').textContent = this.currentBrickCount.red;
    }
    
    updatePowersUI() {
        const powersContainer = document.getElementById('powersContainer');
        if (!powersContainer) return;
        
        // Só recriar a interface se os upgrades mudaram
        if (this.lastUpgradesCount !== this.activeUpgrades.length) {
            this.lastUpgradesCount = this.activeUpgrades.length;
            this.createPowersInterface();
        }
        
        // Atualizar estados dos poderes a cada segundo
        this.powerUIUpdateTimer++;
        if (this.powerUIUpdateTimer >= 60) { // 60 frames = 1 segundo
            this.updatePowerStates();
            this.powerUIUpdateTimer = 0;
        }
    }
    
    createPowersInterface() {
        const powersContainer = document.getElementById('powersContainer');
        if (!powersContainer) return;
        
        // Limpar container
        powersContainer.innerHTML = '';
        
        // Separar upgrades em ativos e inativos
        const activeUpgrades = [];
        const inactiveUpgrades = [];
        
        this.activeUpgrades.forEach(upgrade => {
            // Verificar se o upgrade está desativado pelo modificador "Sem Efeitos Bons"
            const isDisabled = this.disabledPowers.includes(upgrade.id);
            
            if (isDisabled) {
                inactiveUpgrades.push(upgrade);
            } else {
                activeUpgrades.push(upgrade);
            }
        });
        
        // Separar ativos por tipo de cooldown
        const activeUpgradesWithCooldown = activeUpgrades.filter(upgrade => this.hasCooldown(upgrade.id));
        const activeUpgradesWithoutCooldown = activeUpgrades.filter(upgrade => !this.hasCooldown(upgrade.id));
        
        // Separar inativos por tipo de cooldown
        const inactiveUpgradesWithCooldown = inactiveUpgrades.filter(upgrade => this.hasCooldown(upgrade.id));
        const inactiveUpgradesWithoutCooldown = inactiveUpgrades.filter(upgrade => !this.hasCooldown(upgrade.id));
        
        // Combinar: poderes com cooldown primeiro (ativos, depois inativos), depois sem cooldown (ativos, depois inativos)
        const sortedUpgrades = [
            ...activeUpgradesWithCooldown,
            ...inactiveUpgradesWithCooldown,
            ...activeUpgradesWithoutCooldown,
            ...inactiveUpgradesWithoutCooldown
        ];
        
        // Mostrar apenas os primeiros 10 upgrades
        const visibleUpgrades = sortedUpgrades.slice(0, 10);
        const hiddenUpgrades = sortedUpgrades.slice(10);
        
        // Criar upgrades visíveis
        visibleUpgrades.forEach(upgrade => {
            const powerItem = document.createElement('div');
            powerItem.className = 'power-item';
            powerItem.id = `power-${upgrade.id}`;
            
            // Verificar se o upgrade está desativado pelo modificador "Sem Efeitos Bons"
            const isDisabled = this.disabledPowers.includes(upgrade.id);
            if (isDisabled) {
                powerItem.classList.add('disabled');
            }
            
            // Adicionar ícone
            const icon = document.createElement('div');
            icon.className = 'power-icon';
            icon.innerHTML = this.getUpgradeIcon(upgrade.id);
            powerItem.appendChild(icon);
            
            // Adicionar cooldown apenas se o upgrade tiver cooldown
            if (this.hasCooldown(upgrade.id)) {
                const cooldown = document.createElement('div');
                cooldown.className = 'power-cooldown';
                cooldown.id = `cooldown-${upgrade.id}`;
                powerItem.appendChild(cooldown);
            }
            
            powersContainer.appendChild(powerItem);
        });
        
        // Criar upgrades ocultos com efeito de fade
        if (hiddenUpgrades.length > 0) {
            const hiddenContainer = document.createElement('div');
            hiddenContainer.className = 'power-item hidden-powers';
            hiddenContainer.style.cssText = `
                opacity: 0.3;
                filter: blur(1px);
                pointer-events: none;
                position: relative;
            `;
            
            // Mostrar contador de upgrades ocultos
            const hiddenCount = document.createElement('div');
            hiddenCount.className = 'hidden-count';
            hiddenCount.textContent = `+${hiddenUpgrades.length}`;
            hiddenCount.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 107, 53, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10;
            `;
            hiddenContainer.appendChild(hiddenCount);
            
            // Adicionar ícone genérico para upgrades ocultos
            const icon = document.createElement('div');
            icon.className = 'power-icon';
            icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="4" y="4" width="24" height="24" fill="#95a5a6" stroke="#7f8c8d" stroke-width="2" rx="4"/>
                <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="12" fill="#2c3e50">...</text>
            </svg>`;
            hiddenContainer.appendChild(icon);
            
            powersContainer.appendChild(hiddenContainer);
        }
    }
    
    showPowerModal(upgrade) {
        // Criar overlay do modal se não existir
        let overlay = document.getElementById('powerModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'powerModalOverlay';
            overlay.className = 'power-modal-overlay';
            document.body.appendChild(overlay);
            
            // Fechar modal ao clicar no overlay
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hidePowerModal();
                }
            });
        }
        
        // Criar modal se não existir
        let modal = document.getElementById('powerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'powerModal';
            modal.className = 'power-modal';
            overlay.appendChild(modal);
        }
        
        // Preencher conteúdo do modal
        const hasCooldown = this.hasCooldown(upgrade.id);
        const cooldownTime = hasCooldown ? this.getUpgradeCooldown(upgrade.id) : 0;
        
        modal.innerHTML = `
            <div class="power-modal-header">
                <div class="power-modal-icon">${this.getUpgradeIcon(upgrade.id)}</div>
                <h3 class="power-modal-title">${upgrade.name}</h3>
            </div>
            <div class="power-modal-description">${upgrade.description}</div>
            <div class="power-modal-stats">
                <div class="power-stat">
                    <div class="power-stat-label">Tipo</div>
                    <div class="power-stat-value">${upgrade.type || 'Poder'}</div>
                </div>
                <div class="power-stat">
                    <div class="power-stat-label">Cooldown</div>
                    <div class="power-stat-value">${hasCooldown ? cooldownTime + 's' : 'Nenhum'}</div>
                </div>
            </div>
        `;
        
        // Mostrar modal
        overlay.classList.add('active');
        
        // Adicionar listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hidePowerModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    hidePowerModal() {
        const overlay = document.getElementById('powerModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    getUpgradeCooldown(upgradeId) {
        // Tempos de cooldown para cada upgrade
        const cooldownTimes = {
            'super_magnet': 10,
            'paddle_dash': 8,
            'charged_shot': 5,
            'safety_net': 15,
            'effect_activator': 12,
            'cushion_paddle': 6,
            'multi_ball': 20,
            'time_ball': 40,
            'dimensional_ball': 60,
            'explosive_ball': 8,
            'laser_paddle': 10,
            'shield_paddle': 15,
            'gravity_well': 25,
            'time_slow': 30,
            'power_boost': 18,
            'brick_breaker': 12,
            'mega_paddle': 22
        };
        
        return cooldownTimes[upgradeId] || 0;
    }
    
    hasCooldown(upgradeId) {
        // Lista de upgrades que têm cooldown
        const upgradesWithCooldown = [
            'super_magnet',
            'paddle_dash', 
            'charged_shot',
            'safety_net',
            'effect_activator',
            'cushion_paddle',
            'multi_ball',
            'time_ball',
            'dimensional_ball'
        ];
        return upgradesWithCooldown.includes(upgradeId);
    }
    
    updatePowerStates() {
        // Atualizar apenas upgrades que têm cooldown
        const upgradesWithCooldown = [
            'super_magnet',
            'paddle_dash', 
            'charged_shot',
            'safety_net',
            'effect_activator',
            'cushion_paddle',
            'multi_ball',
            'time_ball',
            'dimensional_ball'
        ];
        
        upgradesWithCooldown.forEach(upgradeId => {
            if (this.hasUpgrade(upgradeId)) {
                const powerItem = document.getElementById(`power-${upgradeId}`);
                const cooldownElement = document.getElementById(`cooldown-${upgradeId}`);
                
                if (powerItem && cooldownElement) {
                    this.updateSinglePowerState(upgradeId, powerItem, cooldownElement);
                }
            }
        });
    }
    
    // Função auxiliar para calcular tempo restante baseado em tempo real
    getRemainingTime(effect) {
        if (effect.startTime === 0) return 0;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - effect.startTime;
        
        if (effect.active && effect.duration > 0) {
            // Efeito ativo - calcular tempo restante da duração
            return Math.max(0, effect.duration - elapsedTime);
        } else if (!effect.active && effect.cooldown > 0) {
            // Efeito em cooldown - calcular tempo restante do cooldown
            return Math.max(0, effect.cooldown - elapsedTime);
        }
        
        return 0;
    }

    updateSinglePowerState(upgradeId, powerItem, cooldownElement) {
        switch (upgradeId) {
            case 'super_magnet':
                const superMagnetEffect = this.activeUpgradeEffects.superMagnet;
                if (superMagnetEffect.active) {
                    powerItem.className = 'power-item active';
                    const remainingTime = this.getRemainingTime(superMagnetEffect);
                    if (remainingTime > 0) {
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                    } else {
                        cooldownElement.textContent = 'ATIVO';
                    }
                    cooldownElement.className = 'power-cooldown ready';
                } else {
                    const remainingTime = this.getRemainingTime(superMagnetEffect);
                    if (remainingTime > 0) {
                        powerItem.className = 'power-item on-cooldown';
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                        cooldownElement.className = 'power-cooldown';
                    } else {
                        powerItem.className = 'power-item';
                        cooldownElement.textContent = 'PRONTO';
                        cooldownElement.className = 'power-cooldown ready';
                    }
                }
                break;
                
            case 'paddle_dash':
                const dashEffect = this.activeUpgradeEffects.paddleDash;
                if (dashEffect.active) {
                    powerItem.className = 'power-item active';
                    const remainingTime = this.getRemainingTime(dashEffect);
                    if (remainingTime > 0) {
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                    } else {
                        cooldownElement.textContent = 'ATIVO';
                    }
                    cooldownElement.className = 'power-cooldown ready';
                } else {
                    const remainingTime = this.getRemainingTime(dashEffect);
                    if (remainingTime > 0) {
                        powerItem.className = 'power-item on-cooldown';
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                        cooldownElement.className = 'power-cooldown';
                    } else {
                        powerItem.className = 'power-item';
                        cooldownElement.textContent = 'PRONTO';
                        cooldownElement.className = 'power-cooldown ready';
                    }
                }
                break;
                
            case 'charged_shot':
                const chargedEffect = this.activeUpgradeEffects.chargedShot;
                const chargedRemainingTime = this.getRemainingTime(chargedEffect);
                if (chargedRemainingTime > 0) {
                    powerItem.className = 'power-item on-cooldown';
                    const seconds = Math.ceil(chargedRemainingTime / 1000);
                    cooldownElement.textContent = `${seconds}s`;
                    cooldownElement.className = 'power-cooldown';
                } else {
                    powerItem.className = 'power-item';
                    cooldownElement.textContent = 'PRONTO';
                    cooldownElement.className = 'power-cooldown ready';
                }
                break;
                
            case 'safety_net':
                const safetyEffect = this.activeUpgradeEffects.safetyNet;
                if (safetyEffect.active) {
                    powerItem.className = 'power-item active';
                    const remainingTime = this.getRemainingTime(safetyEffect);
                    if (remainingTime > 0) {
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                    } else {
                        cooldownElement.textContent = 'ATIVO';
                    }
                    cooldownElement.className = 'power-cooldown ready';
                } else {
                    const remainingTime = this.getRemainingTime(safetyEffect);
                    if (remainingTime > 0) {
                        powerItem.className = 'power-item on-cooldown';
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                        cooldownElement.className = 'power-cooldown';
                    } else {
                        powerItem.className = 'power-item';
                        cooldownElement.textContent = 'PRONTO';
                        cooldownElement.className = 'power-cooldown ready';
                    }
                }
                break;
                
            case 'effect_activator':
                const activatorEffect = this.activeUpgradeEffects.effectActivator;
                const activatorRemainingTime = this.getRemainingTime(activatorEffect);
                if (activatorRemainingTime > 0) {
                    powerItem.className = 'power-item on-cooldown';
                    const seconds = Math.ceil(activatorRemainingTime / 1000);
                    cooldownElement.textContent = `${seconds}s`;
                    cooldownElement.className = 'power-cooldown';
                } else {
                    powerItem.className = 'power-item';
                    cooldownElement.textContent = 'PRONTO';
                    cooldownElement.className = 'power-cooldown ready';
                }
                break;
                
            case 'cushion_paddle':
                const cushionEffect = this.activeUpgradeEffects.cushionPaddle;
                if (cushionEffect.active) {
                    powerItem.className = 'power-item active';
                    const remainingTime = this.getRemainingTime(cushionEffect);
                    if (remainingTime > 0) {
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                    } else {
                        cooldownElement.textContent = 'ATIVO';
                    }
                    cooldownElement.className = 'power-cooldown ready';
                } else {
                    const remainingTime = this.getRemainingTime(cushionEffect);
                    if (remainingTime > 0) {
                        powerItem.className = 'power-item on-cooldown';
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                        cooldownElement.className = 'power-cooldown';
                    } else {
                        powerItem.className = 'power-item';
                        cooldownElement.textContent = 'PRONTO';
                        cooldownElement.className = 'power-cooldown ready';
                    }
                }
                break;
                
            case 'multi_ball':
                const multiBallEffect = this.activeUpgradeEffects.multiBall;
                const multiBallRemainingTime = this.getRemainingTime(multiBallEffect);
                if (multiBallRemainingTime > 0) {
                    powerItem.className = 'power-item on-cooldown';
                    const seconds = Math.ceil(multiBallRemainingTime / 1000);
                    cooldownElement.textContent = `${seconds}s`;
                    cooldownElement.className = 'power-cooldown';
                } else {
                    powerItem.className = 'power-item';
                    cooldownElement.textContent = 'PRONTO';
                    cooldownElement.className = 'power-cooldown ready';
                }
                break;
                
            case 'time_ball':
                const timeBallEffect = this.activeUpgradeEffects.timeBall;
                const timeBallRemainingTime = this.getRemainingTime(timeBallEffect);
                if (timeBallRemainingTime > 0) {
                    powerItem.className = 'power-item on-cooldown';
                    const seconds = Math.ceil(timeBallRemainingTime / 1000);
                    cooldownElement.textContent = `${seconds}s`;
                    cooldownElement.className = 'power-cooldown';
                } else {
                    powerItem.className = 'power-item';
                    cooldownElement.textContent = 'PRONTO';
                    cooldownElement.className = 'power-cooldown ready';
                }
                break;
                
            case 'dimensional_ball':
                const dimensionalBallEffect = this.activeUpgradeEffects.dimensionalBall;
                if (dimensionalBallEffect.active) {
                    powerItem.className = 'power-item active';
                    const remainingTime = this.getRemainingTime(dimensionalBallEffect);
                    if (remainingTime > 0) {
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                    } else {
                        cooldownElement.textContent = 'ATIVO';
                    }
                    cooldownElement.className = 'power-cooldown active';
                } else {
                    const remainingTime = this.getRemainingTime(dimensionalBallEffect);
                    if (remainingTime > 0) {
                        powerItem.className = 'power-item on-cooldown';
                        const seconds = Math.ceil(remainingTime / 1000);
                        cooldownElement.textContent = `${seconds}s`;
                        cooldownElement.className = 'power-cooldown';
                    } else {
                        powerItem.className = 'power-item';
                        cooldownElement.textContent = 'PRONTO';
                        cooldownElement.className = 'power-cooldown ready';
                    }
                }
                break;
        }
    }
    
    updatePowerSelectionUI() {
        const powerSelectionContainer = document.getElementById('powerSelectionContainer');
        if (!powerSelectionContainer) return;
        
        // Só recriar a interface se os poderes ativáveis mudaram
        if (this.lastActivatablePowersCount !== this.activatablePowers.length) {
            this.lastActivatablePowersCount = this.activatablePowers.length;
            
            // Limpar container
            powerSelectionContainer.innerHTML = '';
            
            if (this.activatablePowers.length === 0) {
                powerSelectionContainer.innerHTML = '<div class="no-powers">Nenhum poder ativável</div>';
                return;
            }
            
            // Criar interface de seleção apenas quando a contagem mudou
            const title = document.createElement('div');
            title.className = 'power-selection-title';
            title.textContent = 'Poderes Ativáveis';
            powerSelectionContainer.appendChild(title);
            
            this.activatablePowers.forEach((powerId, index) => {
                const powerItem = document.createElement('div');
                powerItem.className = `power-selection-item ${index === this.selectedPowerIndex ? 'selected' : ''}`;
                powerItem.dataset.powerIndex = index;
                
                const icon = document.createElement('div');
                icon.className = 'power-selection-icon';
                icon.innerHTML = this.getUpgradeIcon(powerId);
                powerItem.appendChild(icon);
                
                const name = document.createElement('div');
                name.className = 'power-selection-name';
                name.textContent = this.getUpgradeName(powerId);
                powerItem.appendChild(name);
                
                powerSelectionContainer.appendChild(powerItem);
            });
            
            // Adicionar instruções
            const instructions = document.createElement('div');
            instructions.className = 'power-selection-instructions';
            instructions.innerHTML = 'W/S ou ↑/↓ para selecionar<br>ESPAÇO para ativar';
            powerSelectionContainer.appendChild(instructions);
        } else if (this.activatablePowers.length === 0) {
            // Garantir que a mensagem apareça mesmo se a contagem não mudou
            if (powerSelectionContainer.innerHTML.trim() === '') {
                powerSelectionContainer.innerHTML = '<div class="no-powers">Nenhum poder ativável</div>';
            }
            return;
        } else {
            // Se a contagem não mudou mas há poderes, apenas atualizar a seleção visual
            const powerItems = powerSelectionContainer.querySelectorAll('.power-selection-item');
            powerItems.forEach((item, index) => {
                if (index === this.selectedPowerIndex) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
    }
    
    getUpgradeName(upgradeId) {
        const names = {
            'super_magnet': 'Super Ímã',
            'paddle_dash': 'Dash',
            'charged_shot': 'Tiro Carregado',
            'safety_net': 'Rede de Segurança',
            'effect_activator': 'Ativador',
            'cushion_paddle': 'Desaceleração',
            'multi_ball': 'Multi-bola',
            'time_ball': 'Bolinha do Tempo',
            'ghost_ball': 'Bolinha Fantasma',
            'dimensional_ball': 'Bolinha Dimensional'
        };
        return names[upgradeId] || upgradeId;
    }
    
    render() {
        // Otimização: só renderizar se necessário
        if (!this.needsRedraw) {
            return;
        }
        
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
        
        // Eco da Bolinha - apenas efeito de destruir bloco aleatório (sem renderização)
        
        // Desenhar partículas
        this.particles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        // Desenhar textos de combo
        this.comboTexts.forEach(comboText => {
            this.drawComboText(comboText);
        });
        
        // Desenhar fragmentos
        this.fragments.forEach(fragment => {
            this.drawFragment(fragment);
        });
        
        // Desenhar power-ups
        this.powerUps.forEach(powerUp => {
            this.drawPowerUp(powerUp);
        });
        
        // Desenhar efeitos visuais dos upgrades
        this.drawUpgradeEffects();
        
        // Desenhar timer de contagem regressiva
        if (this.countdownActive && this.countdownTimer > 0) {
            this.drawCountdownTimer();
        }
        
        // Desenhar indicador de movimento caótico
        if (this.phaseModifiers.chaoticMovement) {
            this.drawChaoticMovementIndicator();
        }
        
        // Marcar que a renderização foi concluída
        this.needsRedraw = false;
    }
    
    drawCountdownTimer() {
        const timeLeft = Math.ceil(this.countdownTimer);
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Cor baseada no tempo restante - Verde → Amarelo → Vermelho
        let color = '#2ecc71'; // Verde (tempo alto)
        if (timeLeft <= 10) {
            color = '#e74c3c'; // Vermelho (tempo crítico)
        } else if (timeLeft <= 30) {
            color = '#f39c12'; // Amarelo/Laranja (tempo médio)
        }
        
        // Fundo semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.width - 120, 20, 100, 40);
        
        // Borda
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.width - 120, 20, 100, 40);
        
        // Texto centralizado verticalmente
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(timeString, this.width - 70, 40); // Centralizado na caixa de 40px de altura
        
        // Resetar alinhamento
        this.ctx.textAlign = 'left';
    }
    
    drawChaoticMovementIndicator() {
        // Calcular tempo restante para mudança de direção
        const timeLeft = Math.ceil(10 - this.chaoticMovementTimer);
        const seconds = timeLeft % 60;
        const timeString = `${seconds}s`;
        
        // Cor baseada no tempo restante - Verde → Amarelo → Vermelho
        let color = '#2ecc71'; // Verde (tempo alto)
        if (timeLeft <= 3) {
            color = '#e74c3c'; // Vermelho (tempo crítico)
        } else if (timeLeft <= 6) {
            color = '#f39c12'; // Amarelo/Laranja (tempo médio)
        }
        
        // Fundo semi-transparente (mesma posição do drawCountdownTimer)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.width - 120, 20, 100, 40);
        
        // Borda
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.width - 120, 20, 100, 40);
        
        // Texto centralizado verticalmente (mesmo estilo do drawCountdownTimer)
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(timeString, this.width - 70, 40); // Centralizado na caixa de 40px de altura
        
        // Resetar alinhamento
        this.ctx.textAlign = 'left';
    }
    
    
    drawBrick(brick) {
        let color = this.getBrickColorValue(brick.color);
        
        this.ctx.fillStyle = color;
        
        // Desenhar tijolo com efeito 2.5D
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Borda superior e esquerda (mais clara)
        this.ctx.fillStyle = this.lightenColor(color, 0.3);
        this.ctx.fillRect(brick.x, brick.y, brick.width, 2);
        this.ctx.fillRect(brick.x, brick.y, 2, brick.height);
        
        // Borda inferior e direita (mais escura)
        this.ctx.fillStyle = this.darkenColor(color, 0.3);
        this.ctx.fillRect(brick.x, brick.y + brick.height - 2, brick.width, 2);
        this.ctx.fillRect(brick.x + brick.width - 2, brick.y, 2, brick.height);
        
        // Película de vidro protetora
        if (brick.hasGlassCoating) {
            // Película azul principal
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
            
            // Efeito de brilho azul
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            this.ctx.fillRect(brick.x + 4, brick.y + 4, brick.width - 8, 2);
            
            // Borda azul para destacar
            this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
            
            // Efeito de reflexo no canto superior esquerdo
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width / 3, 2);
            this.ctx.fillRect(brick.x + 2, brick.y + 2, 2, brick.height / 3);
        }
        
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
        // Efeito visual da Bolinha Dimensional
        const isDimensional = this.hasUpgrade('dimensional_ball') && this.activeUpgradeEffects.dimensionalBall.active;
        
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
        
        // Durante a contagem de retomada, desenhar um guia tracejado à frente da bola
        if (this.resumeCountdownActive) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([12, 8]);

            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 1;
            const dirX = ball.vx / speed;
            const dirY = ball.vy / speed;

            const segmentLen = 12;
            const gapLen = 8;
            const totalDistance = 5 * (segmentLen + gapLen);

            for (let i = 1; i <= 5; i++) {
                const startX = ball.x + dirX * (i * (segmentLen + gapLen));
                const startY = ball.y + dirY * (i * (segmentLen + gapLen));
                const endX = startX + dirX * segmentLen;
                const endY = startY + dirY * segmentLen;
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }

            this.ctx.setLineDash([]);
            this.ctx.restore();
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
        } else if (this.hasUpgrade('wombo_combo_ball')) {
            // Bolinha Wombo Combo - cor roxa
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#9b59b6');
            gradient.addColorStop(1, '#8e44ad');
        } else if (ball.color === 'purple') {
            // Bolinha duplicada (Combo) - cor roxa
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#9b59b6');
            gradient.addColorStop(1, '#8e44ad');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#fdcb6e');
            gradient.addColorStop(1, '#ff6b35');
        }
        
        // Efeito visual da Bolinha Dimensional
        if (isDimensional) {
            this.ctx.globalAlpha = 0.8; // Transparência
            // Cor roxa para Bolinha Dimensional (igual ao SVG)
            this.ctx.fillStyle = '#8e44ad';
        } else {
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Resetar transparência
        if (isDimensional) {
            this.ctx.globalAlpha = 1.0;
        }
        
        // Borda
        if (isDimensional) {
            this.ctx.strokeStyle = '#f39c12'; // Dourado para Bolinha Dimensional
        } else if (this.hasUpgrade('lucky_ball')) {
            this.ctx.strokeStyle = '#d35400';
        } else if (this.hasUpgrade('wombo_combo_ball')) {
            this.ctx.strokeStyle = '#6c3483';
        } else {
            this.ctx.strokeStyle = '#d63031';
        }
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Desenhar trail
        ball.trail.forEach((point, index) => {
            const alpha = index / ball.trail.length;
            if (isDimensional) {
                this.ctx.fillStyle = `rgba(142, 68, 173, ${alpha * 0.5})`; // Roxo para Bolinha Dimensional
            } else if (this.hasUpgrade('lucky_ball')) {
                this.ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.5})`;
            } else if (this.hasUpgrade('wombo_combo_ball')) {
                this.ctx.fillStyle = `rgba(155, 89, 182, ${alpha * 0.5})`;
            } else if (ball.color === 'purple') {
                this.ctx.fillStyle = `rgba(155, 89, 182, ${alpha * 0.5})`; // Roxo para bolinha duplicada
            } else {
                this.ctx.fillStyle = `rgba(255, 107, 53, ${alpha * 0.5})`;
            }
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, ball.radius * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Desenhar contador da Bolinha do Tempo
        if (ball.timePaused && ball.timePauseCountdown > 0) {
            const timeLeft = Math.ceil(ball.timePauseCountdown / 60);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(timeLeft.toString(), ball.x, ball.y - 6);
            this.ctx.textAlign = 'left';
        }
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
    
    drawComboText(comboText) {
        this.ctx.save();
        this.ctx.globalAlpha = comboText.alpha;
        
        // Aplicar escala
        this.ctx.translate(comboText.x, comboText.y);
        this.ctx.scale(comboText.scale, comboText.scale);
        this.ctx.translate(-comboText.x, -comboText.y);
        
        // Usar cor personalizada se disponível, senão usar cor padrão
        this.ctx.fillStyle = comboText.color || '#ff6b35';
        this.ctx.font = 'bold 17px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Desenhar apenas o texto (sem contorno)
        this.ctx.fillText(comboText.text, comboText.x, comboText.y);
        
        this.ctx.restore();
    }
    
    drawFragment(fragment) {
        this.ctx.save();
        this.ctx.fillStyle = fragment.color;
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(fragment.x, fragment.y, fragment.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    drawPowerUp(powerUp) {
        if (powerUp.type === 'charged_shot') {
            // Efeito de luz pulsante
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
            const pulseRadius = powerUp.radius + pulseIntensity * 3;
            
            // Desenhar halo de luz pulsante
            const glowGradient = this.ctx.createRadialGradient(
                powerUp.x, powerUp.y, 0,
                powerUp.x, powerUp.y, pulseRadius
            );
            glowGradient.addColorStop(0, `rgba(255, 255, 0, ${0.3 * pulseIntensity})`);
            glowGradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.2 * pulseIntensity})`);
            glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, pulseRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Desenhar projétil carregado
            const gradient = this.ctx.createRadialGradient(
                powerUp.x, powerUp.y, 0,
                powerUp.x, powerUp.y, powerUp.radius
            );
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.3, '#ffd700');
            gradient.addColorStop(0.7, '#ffa500');
            gradient.addColorStop(1, '#ff8c00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borda dourada
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (powerUp.type === 'cannon_shot') {
            // Efeito de luz pulsante vermelha
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
            const pulseRadius = powerUp.radius + pulseIntensity * 2;
            
            // Desenhar halo de luz pulsante vermelha
            const glowGradient = this.ctx.createRadialGradient(
                powerUp.x, powerUp.y, 0,
                powerUp.x, powerUp.y, pulseRadius
            );
            glowGradient.addColorStop(0, `rgba(255, 0, 0, ${0.4 * pulseIntensity})`);
            glowGradient.addColorStop(0.5, `rgba(231, 76, 60, ${0.3 * pulseIntensity})`);
            glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, pulseRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Desenhar projétil de canhão vermelho
            const gradient = this.ctx.createRadialGradient(
                powerUp.x, powerUp.y, 0,
                powerUp.x, powerUp.y, powerUp.radius
            );
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.3, '#e74c3c');
            gradient.addColorStop(0.7, '#c0392b');
            gradient.addColorStop(1, '#a93226');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borda vermelha
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
    
    // Função drawEchoBall removida - Eco da Bolinha agora só tem efeito de destruir bloco aleatório
    
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
