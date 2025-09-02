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

- **Mouse**: Mova para controlar a plataforma
- **Teclas A/D ou Setas ← →**: Alternativa para controlar a plataforma
- **Clique Esquerdo do Mouse**: Navegar / Comprar upgrades

## 🧱 Sistema de Tijolos

### Cores e Efeitos

| Cor | Efeito | Recompensa |
|-----|--------|------------|
| 🔵 Azul | Física Padrão | 1 🪙 |
| 🟡 Amarelo | Velocidade (+30%) | 3 🪙 |
| 🟢 Verde | Inversão Horizontal | 1 🪙 |
| 🟣 Roxo | Zigue-zague | 3 🪙 |
| ⚫ Cinza | Invisibilidade (2s) | 3 🪙 |
| 🔴 Vermelho (Núcleo) | Objetivo da Fase | 10 🪙 |

## ⚡ Sistema Roguelike

### Upgrades Disponíveis (25 total)

#### 🏓 Upgrades de Plataforma
1. **Plataforma Larga** - Aumenta tamanho em 50%
2. **Canhões Acoplados** - Atira projéteis ao rebater
3. **Super Ímã** - Campo magnético para puxar bolinha
4. **Dash de Plataforma** - Movimento rápido lateral
5. **Plataforma de Amortecimento** - Remove efeitos negativos
6. **Escudo Repulsor** - Rebate com mais força
7. **Tiro Carregado** - Projétil perfurante

#### ⚽ Upgrades de Bolinha
8. **Bolinha Perfurante** - Quebra tijolos azuis sem mudar direção
9. **Campo de Fricção** - Reduz velocidade em 10%
10. **Bolinha Fantasma** - Primeira queda passa pela parte inferior
11. **Multi-bola** - Duas bolinhas simultâneas
12. **Bolinha Explosiva** - Explode ao atingir tijolos
13. **Eco da Bolinha** - Segunda bolinha com atraso
14. **Ativador de Efeito** - Escolhe efeito ativo

#### 🛡️ Upgrades de Utilidade
15. **Coração Extra** - Vida adicional
16. **Rede de Segurança** - Barreira temporária
17. **Amuleto da Sorte** - +25% dinheiro
18. **Seguro de Vida** - Protege dinheiro ao morrer
19. **Reciclagem** - Tijolos azuis podem reaparecer
20. **Conversor de Risco** - Mais dinheiro com efeitos negativos

#### 🔥 Upgrades "Quebra-Regras"
21. **Dano Estrutural** - Primeira batida no núcleo conta como duas
22. **Visão de Calor** - Rastro térmico mais visível
23. **Reversão Controlada** - Inversão só acontece 50% das vezes
24. **Atrator de Núcleo** - Atração magnética para o núcleo
25. **Investidor** - Sacrifica vida por 50 moedas

## 🚀 Como Jogar

1. **Inicie o jogo** clicando em "INICIAR"
2. **Controle a plataforma** com o mouse ou teclado
3. **Quebre tijolos** para ganhar dinheiro
4. **Destrua o Tijolo Núcleo** vermelho para completar a fase
5. **Compre upgrades** estratégicos entre as fases
6. **Sobreviva** o máximo de fases possível!

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

[Clique aqui para jogar](https://seu-usuario.github.io/brick-rogue)

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

**Divirta-se jogando Brick Rogue: O Desafio dos Efeitos!** 🎮✨
