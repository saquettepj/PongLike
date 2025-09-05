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

## 📈 Sistema de Dificuldade Progressiva

### Dificuldades Base
- **Velocidade da Bolinha**: Aumenta 2% a cada fase (máximo 20% na fase 11+)
- **Tamanho da Plataforma**: Reduz 3% a cada 2 fases (mínimo 50% do tamanho original)
- **Densidade de Tijolos**: A cada 2 fases, aumenta chances de tijolos roxos (+1%) e brancos (+2%)

### Novos Tipos de Tijolos
- **Película de Vidro** (Fase 4+): 15% de chance em qualquer tijolo
  - Adiciona +1 vida extra ao tijolo
  - Efeito visual translúcido

### Mecânicas Especiais
- **Tijolos Móveis** (Fase 5+): 10% de chance por fileira de se mover horizontalmente

### Modificadores Aleatórios (Fase 6+)
A partir da fase 6, um modificador aleatório é aplicado a cada fase. Cada modificador dura apenas uma fase e é resetado na próxima.

#### 🌪️ Movimento Caótico
- **Efeito**: A bolinha muda completamente de direção a cada 10 segundos
- **Impacto**: Dificuldade extrema de previsão - movimento totalmente imprevisível
- **Dificuldade**: Muito Alta - exige reação rápida e adaptação constante
- **Indicador**: Mostra ícone de tornado e tempo restante para próxima mudança (10 segundos)

#### 💰 Mercado Inflacionado
- **Efeito**: Todos os upgrades na próxima loja custam 50% a mais
- **Impacto**: Dificuldade econômica - força o jogador a ser mais seletivo
- **Dificuldade**: Alta - reduz significativamente o poder de compra

#### 🔴 Pânico Vermelho
- **Efeito**: O Tijolo Núcleo se move horizontalmente pela formação e restaura blocos destruídos
- **Impacto**: Alvo móvel torna o objetivo mais difícil de atingir + blocos restaurados aumentam a dificuldade
- **Dificuldade**: Muito Alta - muda completamente a estratégia e adiciona blocos de volta
- **Movimento**: Muda de direção aleatoriamente a cada 3 segundos (esquerda/direita)
- **Restauração**: Quando o bloco vermelho troca de posição, restaura sempre 25 blocos destruídos aleatoriamente
- **Fragmentos Brancos**: Metade dos blocos azuis restaurados + bloco vermelho atiram fragmentos brancos perigosos

#### 🔋 Bateria Fraca
- **Efeito**: A plataforma do jogador se move 20% mais devagar
- **Impacto**: Reduz a capacidade de resposta e controle
- **Dificuldade**: Alta - exige antecipação e precisão

#### ❌ Sem Efeitos Bons
- **Efeito**: Desativa aleatoriamente metade dos poderes do jogador para aquela fase
- **Impacto**: Remove temporariamente upgrades comprados
- **Dificuldade**: Muito Alta - força o jogador a jogar sem suas vantagens

#### ⏰ Contagem Regressiva
- **Efeito**: Timer de 60 segundos + bloco vermelho móvel + restauração de blocos
- **Impacto**: Se o Tijolo Vermelho não for acertado antes do tempo acabar, o jogador perde uma vida
- **Dificuldade**: **EXTREMA** - pressão de tempo + alvo móvel + restauração de blocos

## 🧱 Sistema de Tijolos

### 🎯 Sistema de COMBO
- **Ativação**: Quando a bolinha acerta mais de um bloco diferente consecutivamente sem tocar na plataforma
- **Recompensa Imediata**: Cada bloco destruído em combo dá +1 moeda extra
- **Recompensa de Fase**: Ao entrar na loja, o combo máximo da fase é somado às moedas

### Cores e Efeitos

| Cor | Efeito | Recompensa |
|-----|--------|------------|
| 🔵 Azul | Física Padrão | 1 🪙 |
| 🟡 Amarelo | Velocidade (+40%) | 3 🪙 |
| 🟢 Verde | Inversão Horizontal | 2 🪙 |
| 🟣 Roxo | Zigue-zague | 7 🪙 |
| ⚫ Cinza | Invisibilidade (ciclo 1s) | 3 🪙 |
| ⚪ Branco | Fragmento perigoso que cai e tira vida se acertar plataforma | 5 🪙 |

| 🔴 Vermelho (Núcleo) | Objetivo da Fase + Acelera bolinha 4% por hit + Troca posição com bloco aleatório | 10 🪙 |

## ⚡ Sistema Roguelike

### Sistema de Loja
- **Ofertas Limitadas**: A loja oferece apenas 2-4 upgrades aleatoriamente por fase
- **Seleção Aleatória**: Os upgrades disponíveis mudam a cada fase
- **Promoções**: A cada 3 fases, a loja entra em promoção com descontos de 20-40%

### Upgrades Disponíveis (36 total)

#### 🏓 Upgrades de Plataforma (8 total)
1. **Plataforma Larga** - Aumenta tamanho em 50% (150 🪙)
2. **Canhões Acoplados** - Atira projéteis apenas em batidas ímpares (170 🪙)
3. **Super Ímã** - Campo magnético para puxar bolinha por 1s (cooldown 10s) (180 🪙)
4. **Dash de Plataforma** - Movimento rápido lateral por 2s (cooldown 8s) (140 🪙)
5. **Plataforma de Desaceleração** - Diminui em 50% a velocidade de todas as bolinhas por 3s (cooldown 10s) (80 🪙)
6. **Reforço** - Plataforma 2x mais alta e destrói bloco da linha de cima (220 🪙)
7. **Impulso de Velocidade** - Aumenta a velocidade da plataforma em 25% (120 🪙)
8. **Tiro Carregado** - Atira projétil perfurante imediatamente (cooldown 5s) (190 🪙)

#### ⚽ Upgrades de Bolinha (14 total)
8. **Bolinha Perfurante** - Quebra tijolos azuis sem mudar direção (220 🪙)
9. **Campo de Fricção** - Reduz velocidade em 10% (160 🪙)
10. **Multi-bola** - Cria uma nova bolinha grudada na plataforma. Liberada automaticamente em 2 segundos. (cooldown 20s) (200 🪙)
11. **Bolinha Combo** - A cada 5 combos consecutivos, duplica a bolinha atual uma vez (150 🪙)
12. **Bolinha Explosiva** - Explode se atingir tijolos amarelos ou vermelho (não afeta o núcleo vermelho) (250 🪙)
13. **Eco da Bolinha** - Destrói um bloco aleatório adicional a cada batida (apenas em fases ímpares) (250 🪙)
14. **Ativador de Efeito** - Ativa efeito aleatório dos blocos na bolinha e ganha moedas baseadas na cor do bloco do efeito ativado (cooldown 5s) (60 🪙)
15. **Bolinha Espelhada** - Destrói bloco simétrico ao quebrar um (apenas nos primeiros 2 minutos) (250 🪙)
16. **Bolinha da Fortuna** - Bolinha dourada que dá +1 moeda por bloco (150 🪙)
17. **Bolinha do Tempo** - Para a bolinha por 3 segundos. (cooldown 15s) (180 🪙)
18. **Bolinha Prima** - Destrói bloco aleatório a cada número primo de batidas (120 🪙)
19. **Bolinha Wombo Combo**: Com esta upgrade, cada bloco em combo dá +2 moedas (ao invés de +1) e a recompensa do combo máximo na loja é dobrada (120 🪙)
20. **Bolinha Fantasma** - Quando a bolinha cai pela primeira vez em cada fase, ela reaparece no topo do campo (250 🪙)
21. **Bolinha Dimensional** - Pode atravessar tijolos sem quebrá-los (Mantenha espaço pressionado) (até 3s, cooldown 15s) (140 🪙)

#### 🛡️ Upgrades de Utilidade (8 total)
22. **Coração Extra** - Ganha uma vida a cada fase (180 🪙)
23. **Rede de Segurança** - Barreira temporária por 5s (cooldown 15s) (300 🪙)
24. **Amuleto da Sorte** - 25% de chance de dobrar dinheiro ao destruir blocos (80 🪙)
25. **Seguro de Vida** - Ganha 100 moedas ao perder vida (150 🪙)
26. **Reciclagem** - Tijolos azuis podem reaparecer (30 🪙)
27. **Conversor de Risco** - Diminui vida do bloco vermelho para 3, muda velocidade da bolinha entre 80%-140% a cada 5s e desativa a troca de posição do bloco vermelho (100 🪙)
28. **Visão Acelerada** - Reduz velocidade dos fragmentos brancos em 40% (120 🪙)
29. **Estabilizador de Zigue-zague** - Reduz a curva do efeito de zigue-zague em 20% (110 🪙)

#### ⭐ Upgrades Especiais (6 total)
30. **Dano Estrutural** - A primeira batida no bloco vermelho dá 3 de dano (180 🪙)
31. **Visão de Calor** - A bolinha invisível deixa um rastro térmico muito mais visível (100 🪙)
32. **Reversão Controlada** - Desativa completamente o efeito de Inversão do tijolo verde (120 🪙)
33. **Bolinha Prima** - A cada número primo de batidas, destrói um bloco aleatório (não vermelho) (120 🪙)
34. **Investidor** - Menos 1 vida máxima, mas toda fase começa com +100 moedas (50 🪙)
35. **Poupança** - Mantém até 50 moedas para a próxima fase (80 🪙)

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

- **Vermelho (Núcleo)**: Cooldown de 1 segundo entre danos + acelera bolinha 4% por hit + troca posição com bloco aleatório

### 💥 Sistema de Fragmentos Brancos
- **Origem**: Criados por blocos brancos quando destruídos
- **Pânico Vermelho**: Quando ativo sozinho, metade dos blocos azuis restaurados + bloco vermelho atiram fragmentos
- **Perigo**: Fragmentos causam perda de vida se atingirem a plataforma

### 🆕 Novas Mecânicas por Fase
- **Fase 2+**: Ao acertar o bloco vermelho, gera 2-5 novos tijolos aleatórios

- **Fase 4+**: Tijolos podem ter película de vidro (+1 vida, 15% de chance)
- **Fase 5+**: Tijolos podem se mover horizontalmente (10% de chance por fileira)
- **Fase 6+**: Modificadores aleatórios são aplicados a cada fase

### 🛡️ Proteção do Núcleo Vermelho
- **Apenas Toque Direto**: O bloco vermelho só pode ser destruído pelo toque direto da bolinha
- **Proteção Contra Poderes**: Nenhum poder pode destruir o núcleo indiretamente:
  - ❌ Bolinha Explosiva não afeta o núcleo (explode apenas ao acertar bloco vermelho ou amarelo)
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
- ✅ Sistema de upgrades roguelike (34 upgrades)
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
