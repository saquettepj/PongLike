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
| 🟣 Roxo | Zigue-zague | 3 🪙 |
| ⚫ Cinza | Invisibilidade (ciclo 2s) | 3 🪙 |
| 🔴 Vermelho (Núcleo) | Objetivo da Fase | 10 🪙 |

## ⚡ Sistema Roguelike

### Upgrades Disponíveis (28 total)

#### 🏓 Upgrades de Plataforma
1. **Plataforma Larga** - Aumenta tamanho em 50% (120 🪙)
2. **Canhões Acoplados** - Atira projéteis ao rebater (100 🪙)
3. **Super Ímã** - Campo magnético para puxar bolinha (120 🪙)
4. **Dash de Plataforma** - Movimento rápido lateral (80 🪙)
5. **Plataforma de Aceleração** - Acelera bolinha 30% quando espaço apertado (70 🪙)
6. **Reforço** - Plataforma 2x mais alta e destrói bloco de trás (80 🪙)
7. **Tiro Carregado** - Projétil perfurante (90 🪙)

#### ⚽ Upgrades de Bolinha
8. **Bolinha Perfurante** - Quebra tijolos azuis sem mudar direção (80 🪙)
9. **Campo de Fricção** - Reduz velocidade em 10% (120 🪙)
10. **Bolinha Fantasma** - Primeira queda passa pela parte inferior (100 🪙)
11. **Multi-bola** - Duas bolinhas simultâneas (120 🪙)
12. **Bolinha Explosiva** - Explode ao atingir tijolos (80 🪙)
13. **Eco da Bolinha** - Segunda bolinha com atraso de 10ms + destrói bloco aleatório (70 🪙)
14. **Ativador de Efeito** - Escolhe efeito ativo (110 🪙)
15. **Bolinha Espelhada** - Destrói bloco simétrico ao quebrar um (90 🪙)
16. **Bolinha da Fortuna** - Bolinha dourada que dá +1 moeda por bloco (85 🪙)

#### 🛡️ Upgrades de Utilidade
17. **Coração Extra** - Vida adicional (100 🪙)
18. **Rede de Segurança** - Barreira temporária (120 🪙)
19. **Amuleto da Sorte** - +25% dinheiro (80 🪙)
20. **Seguro de Vida** - Ganha 20 moedas ao perder vida (70 🪙)
21. **Reciclagem** - Tijolos azuis podem reaparecer (100 🪙)
22. **Conversor de Risco** - Mais dinheiro com efeitos negativos (120 🪙)

#### 🔥 Upgrades "Quebra-Regras"
23. **Dano Estrutural** - Primeira batida no núcleo conta como duas (80 🪙)
24. **Visão de Calor** - Rastro térmico mais visível (80 🪙)
25. **Reversão Controlada** - Inversão só acontece 50% das vezes (100 🪙)
26. **Atrator de Núcleo** - Atração magnética para o núcleo (70 🪙)
27. **Investidor** - Sacrifica vida por 50 moedas (0 🪙)
28. **Poupança** - Mantém até 50 moedas para próxima fase (80 🪙)

## 🎮 Regras do Jogo

### 💰 Sistema de Moedas
- **Perda de Vida**: Ao perder uma vida, você perde 10 moedas
- **Seguro de Vida**: Com este upgrade, ao perder vida você ganha 20 moedas ao invés de perder 10

### ⚡ Efeitos dos Tijolos
- **Não Acumulativos**: Efeitos da mesma cor não se acumulam
- **Amarelo**: Velocidade só ativa se não estiver já acelerado
- **Roxo**: Zigue-zague só ativa se não estiver já ativo
- **Cinza**: Invisibilidade só ativa se não estiver já ativo
- **Verde**: Inversão sempre alterna (pode ser aplicado múltiplas vezes)

## 🚀 Como Jogar

1. **Inicie o jogo** clicando em "INICIAR"
2. **Controle a plataforma** com as teclas A/D ou setas
3. **Quebre tijolos** para ganhar dinheiro
4. **Destrua o Tijolo Núcleo** vermelho para completar a fase
5. **Compre upgrades** estratégicos entre as fases
6. **Pause o jogo** com a tecla P quando necessário
7. **Sobreviva** o máximo de fases possível!

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
