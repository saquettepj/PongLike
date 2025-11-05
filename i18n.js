// Sistema de Internacionalização (i18n) para Brick Rogue
// Suporta Português (pt-BR) e Inglês (en)

class I18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {
      'pt-BR': {
        // Títulos e cabeçalhos
        gameTitle: 'Brick Rogue',
        gameSubtitle: 'O Desafio dos Efeitos',
        
        // Menu principal
        startButton: 'INICIAR',
        controls: 'Controles',
        blockEffects: 'Efeitos dos Blocos',
        
        // Controles desktop
        controlPaddle: 'Controlar a plataforma',
        selectPower: 'Selecionar poder',
        activatePower: 'Ativar poder selecionado',
        pauseResume: 'Pausar/Despausar',
        navigateShop: 'Navegar / Comprar upgrades',
        
        // Controles mobile
        touchSidesMove: 'Toque nas <strong>laterais</strong> da <strong>tela</strong> para mover a plataforma',
        touchCenterRelease: 'Toque no <strong>centro</strong> da <strong>tela</strong> para soltar a bolinha ou ativar o poder',
        swipeChangePower: 'Deslize para cima/baixo no <strong>centro</strong> da <strong>tela</strong> para trocar o poder',
        
        // Help overlay (touch zones)
        movePaddleLeft: 'Mover<br>Plataforma<br>←',
        movePaddleRight: 'Mover<br>Plataforma<br>→',
        releaseBallOrActivate: 'Soltar Bolinha<br>ou Ativar Poder',
        
        // Efeitos dos blocos
        standardPhysics: 'Física Padrão',
        speed: 'Velocidade (+40%)',
        horizontalInversion: 'Inversão Horizontal',
        zigzag: 'Zigue-zague',
        invisibility: 'Invisibilidade (0.5s invisível / 1s visível)',
        dangerousFragment: 'Fragmento perigoso que tira vida',
        objective: 'Objetivo do Nível + Acelera 4% por hit + Troca posição',
        
        // UI do jogo
        level: 'NÍVEL:',
        record: 'RECORDE:',
        combo: 'COMBO:',
        money: 'DINHEIRO:',
        lives: 'VIDAS:',
        hits: 'BATIDAS:',
        currentMoney: 'DINHEIRO ATUAL:',
        
        // Telas
        shop: 'Loja',
        chooseUpgrades: 'Escolha seus Upgrades',
        confirmPower: 'Confirmar Poder',
        continue: 'Continuar',
        pause: 'PAUSE',
        gameOver: 'Game Over',
        playAgain: 'Jogar Novamente',
        purchasedPowers: 'Poderes Comprados',
        
        // Power selection
        initialPower: 'Poder Inicial',
        selectOneToStart: 'Selecione um para começar',
        powerDurationWarning: 'Este poder durará apenas 1 nível',
        
        // Game Over
        reachedLevel: 'Você chegou até o nível',
        yourRecord: 'Seu recorde:',
        
        // Informações do jogo
        gameInfo: 'Informações do Jogo',
        ballSpeed: 'Velocidade da Bolinha:',
        baseMultiplier: 'Multiplicador Base:',
        effectsMultiplier: 'Multiplicador Efeitos:',
        brickCounter: 'Contador de Tijolos',
        developerMode: 'Modo Desenvolvedor',
        skipLevel: 'Pular Nível',
        addMoney: '+200 Moedas',
        
        // Cores dos blocos
        blue: 'Azul:',
        yellow: 'Amarelo:',
        green: 'Verde:',
        purple: 'Roxo:',
        gray: 'Cinza:',
        white: 'Branco:',
        red: 'Vermelho:',
        
        // Upgrades
        upgrades: {
          wide_paddle: { name: 'Plataforma Larga', description: 'Aumenta o tamanho da plataforma em 50%' },
          attached_cannons: { name: 'Canhões Acoplados', description: 'Atira projéteis apenas em batidas ímpares' },
          super_magnet: { name: 'Super Ímã', description: 'Campo magnético para puxar bolinha por 1s (cooldown 10s)' },
          paddle_dash: { name: 'Dash de Plataforma', description: 'Movimento rápido lateral por 2s (cooldown 8s)' },
          cushion_paddle: { name: 'Plataforma de Desaceleração', description: 'Diminui em 50% a velocidade de todas as bolinhas por 3s (cooldown 10s)' },
          reinforced_paddle: { name: 'Reforço', description: 'Plataforma 2x mais alta e destrói bloco da linha de cima' },
          speed_boost: { name: 'Impulso de Velocidade', description: 'Aumenta a velocidade da plataforma em 25%' },
          charged_shot: { name: 'Tiro Carregado', description: 'Atira projétil perfurante imediatamente' },
          paddle_shield: { name: 'Escudo Protetor', description: 'Escudo azul protetor que absorve uma colisão de fragmento branco' },
          piercing_ball: { name: 'Bolinha Perfurante', description: 'Quebra tijolos azuis sem mudar direção' },
          friction_field: { name: 'Campo de Fricção', description: 'Reduz velocidade em 10%' },
          multi_ball: { name: 'Multi-bola', description: 'Cria uma nova bolinha grudada na plataforma. Liberada automaticamente em 2 segundos (cooldown 20s)' },
          combo_ball: { name: 'Bolinha Combo', description: 'A cada 5 combos consecutivos, duplica a bolinha atual uma vez' },
          heavy_ball: { name: 'Bolinha Pesada', description: 'A bolinha se move 15% mais devagar, facilitando o controle' },
          explosive_ball: { name: 'Bolinha Explosiva', description: 'A bolinha explode sempre ao atingir blocos amarelos ou vermelhos, destruindo tijolos adjacentes em uma pequena área' },
          ball_echo: { name: 'Eco da Bolinha', description: 'Destrói um bloco aleatório adicional a cada batida (apenas em níveis ímpares)' },
          effect_activator: { name: 'Ativador de Efeito', description: 'Ativa efeito aleatório dos blocos na bolinha e ganha moedas baseadas na cor do bloco do efeito ativado (cooldown 5s)' },
          mirror_ball: { name: 'Bolinha Espelhada', description: 'Destrói bloco simétrico ao quebrar um (apenas nos primeiros 30 segundos de cada nível)' },
          lucky_ball: { name: 'Bolinha da Fortuna', description: 'Bolinha dourada que dá +1 moeda por bloco' },
          time_ball: { name: 'Bolinha do Tempo', description: 'Para a bolinha por 3 segundos (cooldown 15s)' },
          prime_ball: { name: 'Bolinha Prima', description: 'Destrói bloco aleatório a cada número primo de batidas' },
          wombo_combo_ball: { name: 'Bolinha Wombo Combo', description: 'Cada bloco em combo dá +2 moedas (ao invés de +1) e a recompensa do combo máximo na loja é dobrada' },
          portal_ball: { name: 'Bolinha Portal', description: 'Quando a bolinha cai pela primeira vez em cada nível, ela reaparece no topo do campo' },
          dimensional_ball: { name: 'Bolinha Dimensional', description: 'Pode atravessar tijolos sem quebrá-los (Mantenha espaço pressionado / Toque para ativar) (até 3s, cooldown 15s)' },
          shatter_glass: { name: 'Estilhaços', description: '50% de chance de estilhaçar o vidro de um bloco, causando efeito explosivo' },
          combo_power: { name: 'Combo Power', description: 'Todos os poderes que destroem blocos ativam o combo quando destroem um bloco' },
          shield_breaker: { name: 'Quebra Blindagem', description: 'Permite que todos os upgrades que destroem blocos também quebrem blocos com vidro' },
          extra_life: { name: 'Coração Extra', description: 'Ganha uma vida a cada nível' },
          safety_net: { name: 'Rede de Segurança', description: 'Barreira temporária por 5s (cooldown 15s)' },
          lucky_amulet: { name: 'Amuleto da Sorte', description: '25% de chance de dobrar dinheiro ao destruir blocos' },
          life_insurance: { name: 'Seguro de Vida', description: 'Ganha 100 moedas ao perder vida' },
          recycling: { name: 'Reciclagem', description: 'Tijolos azuis podem reaparecer, concedendo 5 moedas' },
          risk_converter: { name: 'Conversor de Risco', description: 'Diminui vida do bloco vermelho para 2, muda velocidade da bolinha entre 80%-140% a cada 5s e desativa a troca de posição do bloco vermelho' },
          accelerated_vision: { name: 'Visão Acelerada', description: 'Reduz velocidade dos fragmentos brancos em 40%' },
          zigzag_stabilizer: { name: 'Estabilizador de Zigue-zague', description: 'Reduz a curva do efeito de zigue-zague em 20%' },
          structural_damage: { name: 'Dano Estrutural', description: 'A primeira batida no bloco vermelho dá 3 de dano' },
          heat_vision: { name: 'Visão de Calor', description: 'A bolinha invisível deixa um rastro térmico muito mais visível' },
          controlled_reversal: { name: 'Reversão Controlada', description: 'Desativa completamente o efeito de Inversão do tijolo verde' },
          investor: { name: 'Investidor', description: 'Menos 1 vida máxima, mas todo nível começa com +100 moedas' },
          money_saver: { name: 'Poupança', description: 'Mantém até 50 moedas para o próximo nível' }
        },
        
        // Notificações
        powerRemoved: 'Poder "{name}" removido!',
        canBuyAgain: 'Você pode comprá-lo novamente na loja',
        
        // Status de poderes
        active: 'ATIVO',
        ready: 'PRONTO',
        
        // Interface de poderes
        activatablePowers: 'Poderes Ativáveis',
        noActivatablePowers: 'Nenhum poder ativável',
        noPowersPurchased: 'Nenhum poder comprado ainda',
        powerSelectionInstructions: 'W/S ou ↑/↓ para selecionar<br>ESPAÇO para ativar',
        
        // Modificadores
        activeModifier: 'Modificador Ativo:',
        modifiers: {
          chaoticMovement: 'Movimento Caótico',
          inflatedMarket: 'Mercado Inflacionado',
          redPanic: 'Pânico Vermelho',
          weakBattery: 'Bateria Fraca',
          noGoodEffects: 'Sem Efeitos Bons',
          countdown: 'Contagem Regressiva'
        },
        
        // Notificações de combo
        comboReward: 'Recompensa de Combo:',
        comboRewardWombo: 'Recompensa de Combo (Wombo Combo!):',
        coinsEarnedByCombo: 'moedas 🪙 ganhas pelo combo máximo',
        womboComboDoubled: 'Bolinha Wombo Combo dobrou a recompensa!',
        
        // Poupança
        savingsActivated: 'Poupança Ativada!',
        savingsDetails: 'Guardou {saved} de {original} moedas (30%)',
        
        // Desenvolvedor
        developerMoneyAdded: '+200 Moedas!',
        developerUpgradePurchased: '{name} comprado!',
        developerUpgradeRemoved: '{name} removido!',
        
        // Idioma
        toggleLanguage: 'Trocar Idioma'
      },
      
      'en': {
        // Titles and headers
        gameTitle: 'Brick Rogue',
        gameSubtitle: 'The Effects Challenge',
        
        // Main menu
        startButton: 'START',
        controls: 'Controls',
        blockEffects: 'Block Effects',
        
        // Desktop controls
        controlPaddle: 'Control the paddle',
        selectPower: 'Select power',
        activatePower: 'Activate selected power',
        pauseResume: 'Pause/Resume',
        navigateShop: 'Navigate / Buy upgrades',
        
        // Mobile controls
        touchSidesMove: 'Touch the <strong>sides</strong> of the <strong>screen</strong> to move the paddle',
        touchCenterRelease: 'Touch the <strong>center</strong> of the <strong>screen</strong> to release the ball or activate power',
        swipeChangePower: 'Swipe up/down in the <strong>center</strong> of the <strong>screen</strong> to change power',
        
        // Help overlay (touch zones)
        movePaddleLeft: 'Move<br>Paddle<br>←',
        movePaddleRight: 'Move<br>Paddle<br>→',
        releaseBallOrActivate: 'Release Ball<br>or Activate Power',
        
        // Block effects
        standardPhysics: 'Standard Physics',
        speed: 'Speed (+40%)',
        horizontalInversion: 'Horizontal Inversion',
        zigzag: 'Zigzag',
        invisibility: 'Invisibility (0.5s invisible / 1s visible)',
        dangerousFragment: 'Dangerous fragment that takes life',
        objective: 'Level Objective + Accelerates 4% per hit + Swaps position',
        
        // Game UI
        level: 'LEVEL:',
        record: 'RECORD:',
        combo: 'COMBO:',
        money: 'MONEY:',
        lives: 'LIVES:',
        hits: 'HITS:',
        currentMoney: 'CURRENT MONEY:',
        
        // Screens
        shop: 'Shop',
        chooseUpgrades: 'Choose your Upgrades',
        confirmPower: 'Confirm Power',
        continue: 'Continue',
        pause: 'PAUSE',
        gameOver: 'Game Over',
        playAgain: 'Play Again',
        purchasedPowers: 'Purchased Powers',
        
        // Power selection
        initialPower: 'Initial Power',
        selectOneToStart: 'Select one to start',
        powerDurationWarning: 'This power will last only 1 level',
        
        // Game Over
        reachedLevel: 'You reached level',
        yourRecord: 'Your record:',
        
        // Game information
        gameInfo: 'Game Information',
        ballSpeed: 'Ball Speed:',
        baseMultiplier: 'Base Multiplier:',
        effectsMultiplier: 'Effects Multiplier:',
        brickCounter: 'Brick Counter',
        developerMode: 'Developer Mode',
        skipLevel: 'Skip Level',
        addMoney: '+200 Coins',
        
        // Block colors
        blue: 'Blue:',
        yellow: 'Yellow:',
        green: 'Green:',
        purple: 'Purple:',
        gray: 'Gray:',
        white: 'White:',
        red: 'Red:',
        
        // Upgrades
        upgrades: {
          wide_paddle: { name: 'Wide Paddle', description: 'Increases paddle size by 50%' },
          attached_cannons: { name: 'Attached Cannons', description: 'Fires projectiles only on odd hits' },
          super_magnet: { name: 'Super Magnet', description: 'Magnetic field to pull ball for 1s (cooldown 10s)' },
          paddle_dash: { name: 'Paddle Dash', description: 'Fast lateral movement for 2s (cooldown 8s)' },
          cushion_paddle: { name: 'Cushion Paddle', description: 'Reduces all balls speed by 50% for 3s (cooldown 10s)' },
          reinforced_paddle: { name: 'Reinforcement', description: 'Paddle 2x taller and destroys block from top row' },
          speed_boost: { name: 'Speed Boost', description: 'Increases paddle speed by 25%' },
          charged_shot: { name: 'Charged Shot', description: 'Fires piercing projectile immediately' },
          paddle_shield: { name: 'Protective Shield', description: 'Blue protective shield that absorbs one white fragment collision' },
          piercing_ball: { name: 'Piercing Ball', description: 'Breaks blue bricks without changing direction' },
          friction_field: { name: 'Friction Field', description: 'Reduces speed by 10%' },
          multi_ball: { name: 'Multi-ball', description: 'Creates a new ball attached to paddle. Automatically released in 2 seconds (cooldown 20s)' },
          combo_ball: { name: 'Combo Ball', description: 'Every 5 consecutive combos, duplicates current ball once' },
          heavy_ball: { name: 'Heavy Ball', description: 'Ball moves 15% slower, making control easier' },
          explosive_ball: { name: 'Explosive Ball', description: 'Ball always explodes when hitting yellow or red blocks, destroying adjacent bricks in a small area' },
          ball_echo: { name: 'Ball Echo', description: 'Destroys an additional random block on each hit (only on odd levels)' },
          effect_activator: { name: 'Effect Activator', description: 'Activates random block effect on ball and earns coins based on the activated block color (cooldown 5s)' },
          mirror_ball: { name: 'Mirror Ball', description: 'Destroys symmetric block when breaking one (only in first 30 seconds of each level)' },
          lucky_ball: { name: 'Lucky Ball', description: 'Golden ball that gives +1 coin per block' },
          time_ball: { name: 'Time Ball', description: 'Stops ball for 3 seconds (cooldown 15s)' },
          prime_ball: { name: 'Prime Ball', description: 'Destroys random block every prime number of hits' },
          wombo_combo_ball: { name: 'Wombo Combo Ball', description: 'Each block in combo gives +2 coins (instead of +1) and max combo reward in shop is doubled' },
          portal_ball: { name: 'Portal Ball', description: 'When ball falls for first time in each level, it reappears at top of field' },
          dimensional_ball: { name: 'Dimensional Ball', description: 'Can pass through bricks without breaking them (Hold space / Touch to activate) (up to 3s, cooldown 15s)' },
          shatter_glass: { name: 'Shatter', description: '50% chance to shatter glass of a block, causing explosive effect' },
          combo_power: { name: 'Combo Power', description: 'All powers that destroy blocks activate combo when destroying a block' },
          shield_breaker: { name: 'Shield Breaker', description: 'Allows all upgrades that destroy blocks to also break blocks with glass' },
          extra_life: { name: 'Extra Heart', description: 'Gains one life each level' },
          safety_net: { name: 'Safety Net', description: 'Temporary barrier for 5s (cooldown 15s)' },
          lucky_amulet: { name: 'Lucky Amulet', description: '25% chance to double money when destroying blocks' },
          life_insurance: { name: 'Life Insurance', description: 'Gains 100 coins when losing life' },
          recycling: { name: 'Recycling', description: 'Blue bricks can reappear, granting 5 coins' },
          risk_converter: { name: 'Risk Converter', description: 'Reduces red block life to 2, changes ball speed between 80%-140% every 5s and disables red block position swap' },
          accelerated_vision: { name: 'Accelerated Vision', description: 'Reduces white fragments speed by 40%' },
          zigzag_stabilizer: { name: 'Zigzag Stabilizer', description: 'Reduces zigzag effect curve by 20%' },
          structural_damage: { name: 'Structural Damage', description: 'First hit on red block deals 3 damage' },
          heat_vision: { name: 'Heat Vision', description: 'Invisible ball leaves a much more visible thermal trail' },
          controlled_reversal: { name: 'Controlled Reversal', description: 'Completely disables green block Inversion effect' },
          investor: { name: 'Investor', description: 'Minus 1 max life, but each level starts with +100 coins' },
          money_saver: { name: 'Savings', description: 'Keeps up to 50 coins for next level' }
        },
        
        // Notifications
        powerRemoved: 'Power "{name}" removed!',
        canBuyAgain: 'You can buy it again in the shop',
        
        // Power status
        active: 'ACTIVE',
        ready: 'READY',
        
        // Power interface
        activatablePowers: 'Activatable Powers',
        noActivatablePowers: 'No activatable powers',
        noPowersPurchased: 'No powers purchased yet',
        powerSelectionInstructions: 'W/S or ↑/↓ to select<br>SPACE to activate',
        
        // Modifiers
        activeModifier: 'Active Modifier:',
        modifiers: {
          chaoticMovement: 'Chaotic Movement',
          inflatedMarket: 'Inflated Market',
          redPanic: 'Red Panic',
          weakBattery: 'Weak Battery',
          noGoodEffects: 'No Good Effects',
          countdown: 'Countdown'
        },
        
        // Combo notifications
        comboReward: 'Combo Reward:',
        comboRewardWombo: 'Combo Reward (Wombo Combo!):',
        coinsEarnedByCombo: 'coins 🪙 earned by max combo',
        womboComboDoubled: 'Wombo Combo Ball doubled the reward!',
        
        // Savings
        savingsActivated: 'Savings Activated!',
        savingsDetails: 'Saved {saved} of {original} coins (30%)',
        
        // Developer
        developerMoneyAdded: '+200 Coins!',
        developerUpgradePurchased: '{name} purchased!',
        developerUpgradeRemoved: '{name} removed!',
        
        // Language
        toggleLanguage: 'Toggle Language'
      }
    };
  }
  
  detectLanguage() {
    // Verificar se há preferência salva
    const saved = localStorage.getItem('brickRogueLanguage');
    if (saved && (saved === 'pt-BR' || saved === 'en')) {
      return saved;
    }
    
    // Idioma padrão: Inglês
    return 'en';
  }
  
  setLanguage(lang) {
    if (lang === 'pt-BR' || lang === 'en') {
      this.currentLanguage = lang;
      localStorage.setItem('brickRogueLanguage', lang);
      document.documentElement.lang = lang;
      this.updatePage();
    }
  }
  
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    // Substituir placeholders se houver parâmetros
    if (params && typeof value === 'string') {
      Object.keys(params).forEach(param => {
        value = value.replace(`{${param}}`, params[param]);
      });
    }
    
    return value;
  }
  
  updatePage() {
    // Atualizar elementos com data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      
      // Se for HTML, usar innerHTML, senão textContent
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    });
    
    // Atualizar atributos title com data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      el.setAttribute('title', translation);
    });
    
    // Atualizar atributo lang do HTML
    document.documentElement.lang = this.currentLanguage;
  }
}

// Criar instância global
const i18n = new I18n();

