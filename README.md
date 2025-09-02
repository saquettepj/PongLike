# Brick Rogue: O Desafio dos Efeitos

Um jogo web que funde a mecânica clássica de Breakout com elementos de Roguelike, criado com HTML5 Canvas e JavaScript puro.

## 🎮 Sobre o Jogo

**Brick Rogue: O Desafio dos Efeitos** é um jogo inovador que combina a nostalgia do Breakout com a estratégia dos jogos roguelike. O jogador controla uma plataforma para rebater uma bolinha e quebrar tijolos coloridos, cada um com efeitos únicos e caóticos.

### 🎯 Objetivo
- Quebrar o **Tijolo Núcleo** vermelho em cada fase
- Sobreviver o máximo de fases possível
- Usar dinheiro ganho para comprar upgrades estratégicos

## 🎨 Características Visuais

- **Estilo Pixel Art 2.5D**: Sprites em pixel art com sombreamento e bordas arredondadas
- **Efeitos Visuais Vibrantes**: Partículas, brilhos e explosões contrastam com o estilo pixelado
- **Interface Moderna**: Design limpo e intuitivo com cores vibrantes

## 🎮 Controles

- **Teclas A/D ou Setas ← →**: Controlar a plataforma
- **Barra de Espaço**: Ativar poderes especiais / Soltar bolinha presa
- **Tecla P**: Pausar/Despausar o jogo
- **Clique Esquerdo do Mouse**: Navegar / Comprar upgrades

## 🧱 Sistema de Tijolos

### Cores e Efeitos

| Cor | Efeito | Recompensa |
|-----|--------|------------|
| 🔵 Azul | Física Padrão | 1 🪙 |
| 🟡 Amarelo | Velocidade (+40%) | 3 🪙 |
| 🟢 Verde | Inversão Horizontal | 1 🪙 |
| 🟣 Roxo | Zigue-zague | 7 🪙 |
| ⚫ Cinza | Invisibilidade (ciclo 1s) | 3 🪙 |
| ⚪ Branco | Fragmento perigoso que cai e tira vida se acertar plataforma | 5 🪙 |
| 🔴 Vermelho (Núcleo) | Objetivo da Fase + Acelera bolinha 2% por hit + Troca posição com bloco aleatório | 10 🪙 |

## ⚡ Sistema Roguelike

### Upgrades Disponíveis (28 total)

#### 🏓 Upgrades de Plataforma (7 total)
1. **Plataforma Larga** - Aumenta tamanho em 50% (150 🪙)
2. **Canhões Acoplados** - Atira projéteis ao rebater (200 🪙)
3. **Super Ímã** - Campo magnético para puxar bolinha (180 🪙)
4. **Dash de Plataforma** - Movimento rápido lateral por 3s (cooldown 20s) (140 🪙)
5. **Plataforma de Aceleração** - Ativa aceleração de 30% na bolinha por 10 segundos. Cooldown de 20 segundos (80 🪙)
6. **Reforço** - Plataforma 2x mais alta e destrói bloco de trás (220 🪙)
7. **Tiro Carregado** - Atira projétil perfurante imediatamente (190 🪙)

#### ⚽ Upgrades de Bolinha (10 total)
8. **Bolinha Perfurante** - Quebra tijolos azuis sem mudar direção (220 🪙)
9. **Campo de Fricção** - Reduz velocidade em 10% (160 🪙)
10. **Multi-bola** - Cria uma nova bolinha grudada na plataforma. Cooldown de 1 minuto (200 🪙)
11. **Bolinha Explosiva** - Explode ao atingir tijolos (não afeta o núcleo vermelho) (350 🪙)
12. **Eco da Bolinha** - Destrói um bloco aleatório adicional a cada batida (250 🪙)
13. **Ativador de Efeito** - Ativa efeito aleatório dos blocos na bolinha (cooldown 20s) (30 🪙)
14. **Bolinha Espelhada** - Destrói bloco simétrico ao quebrar um (250 🪙)
15. **Bolinha da Fortuna** - Bolinha dourada que dá +1 moeda por bloco (150 🪙)
17. **Bolinha Prima** - Destrói bloco aleatório a cada número primo de batidas (120 🪙)

#### 🛡️ Upgrades de Utilidade (6 total)
17. **Coração Extra** - Ganha uma vida a cada fase (180 🪙)
18. **Rede de Segurança** - Barreira temporária por 15s (cooldown 80s) (300 🪙)
19. **Amuleto da Sorte** - +25% dinheiro (30 🪙)
20. **Seguro de Vida** - Ganha 100 moedas ao perder vida (150 🪙)
21. **Reciclagem** - Tijolos azuis podem reaparecer (30 🪙)
22. **Conversor de Risco** - Diminui vida do bloco vermelho para 3 e muda velocidade da bolinha entre 80%-140% a cada 5s (50 🪙)

#### 🔥 Upgrades "Quebra-Regras" (5 total)
23. **Dano Estrutural** - Primeira batida no núcleo conta como duas (180 🪙)
24. **Visão de Calor** - Rastro térmico mais visível (100 🪙)
25. **Reversão Controlada** - Inversão só acontece 50% das vezes (40 🪙)
26. **Investidor** - Sacrifica vida por 50 moedas (0 🪙)
27. **Poupança** - Mantém até 50 moedas para próxima fase (80 🪙)

## 🎮 Regras do Jogo

### 💰 Sistema de Moedas
- **Perda de Vida**: Ao perder uma vida, você perde 10 moedas
- **Seguro de Vida**: Com este upgrade, ao perder vida você ganha 100 moedas ao invés de perder 10
- **Economia na Loja**: Se não comprar nada na loja, você mantém 30% do dinheiro para a próxima fase

### ⚡ Efeitos dos Tijolos
- **Não Acumulativos**: Efeitos da mesma cor não se acumulam
- **Amarelo**: Velocidade só ativa se não estiver já acelerado
- **Roxo**: Zigue-zague só ativa se não estiver já ativo
- **Cinza**: Invisibilidade só ativa se não estiver já ativo
- **Verde**: Inversão sempre alterna (pode ser aplicado múltiplas vezes)
- **Branco**: Cria fragmento perigoso que cai e tira vida se acertar a plataforma
- **Vermelho (Núcleo)**: Cooldown de 1 segundo entre danos + acelera bolinha 2% por hit + troca posição com bloco aleatório

### 🛡️ Proteção do Núcleo Vermelho
- **Apenas Toque Direto**: O bloco vermelho só pode ser destruído pelo toque direto da bolinha
- **Proteção Contra Poderes**: Nenhum poder pode destruir o núcleo indiretamente:
  - ❌ Bolinha Explosiva não afeta o núcleo
  - ❌ Eco da Bolinha não pode destruir o núcleo
  - ❌ Bolinha Espelhada não afeta o núcleo
  - ❌ Bolinha Prima não pode destruir o núcleo
  - ❌ Reforço não afeta o núcleo
  - ❌ Projéteis não podem quebrar o núcleo

## 🚀 Como Jogar

1. **Inicie o jogo** clicando em "INICIAR"
2. **Controle a plataforma** com as teclas A/D ou setas
3. **Quebre tijolos** para ganhar dinheiro
4. **Destrua o Tijolo Núcleo** vermelho para completar a fase
5. **Compre upgrades** estratégicos entre as fases
6. **Pause o jogo** com a tecla P quando necessário
7. **Sobreviva** o máximo de fases possível!

### 💡 Dica Estratégica
- **Ponto Fraco**: Os blocos são mais vulneráveis quando atingidos nas quinas!

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas** - Renderização gráfica
- **JavaScript ES6+** - Lógica do jogo
- **CSS3** - Estilização e animações
- **LocalStorage** - Persistência de recordes

## 📁 Estrutura do Projeto

```
brick-rogue/
├── index.html          # Página principal
├── styles.css          # Estilos e animações
├── game.js            # Engine do jogo
└── README.md          # Documentação
```

## 🎯 Recursos Implementados

- ✅ Sistema completo de física da bolinha
- ✅ 6 tipos de tijolos com efeitos únicos
- ✅ Sistema de upgrades roguelike (25 upgrades)
- ✅ Interface de usuário responsiva
- ✅ Sistema de partículas e efeitos visuais
- ✅ Persistência de recordes
- ✅ Múltiplas telas (menu, jogo, upgrades, game over)
- ✅ Controles por mouse e teclado
- ✅ Estilo pixel art 2.5D

## 🚀 Deploy

Este jogo está preparado para ser hospedado no **GitHub Pages**:

1. Faça upload dos arquivos para um repositório GitHub
2. Ative o GitHub Pages nas configurações do repositório
3. Acesse o jogo através da URL gerada

## 🎮 Jogar Online

[Clique aqui para jogar](https://saquettepj.github.io/PongLike)

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

**Divirta-se jogando Brick Rogue: O Desafio dos Efeitos!** 🎮✨
