# CS Fantasy Major

Simulador interativo de torneios Major de Counter-Strike com dados históricos reais (2013–2026).

## 🚀 Sobre o Projeto

O **CS Fantasy Major** permite que você monte seu *Dream Team* dos sonhos escolhendo 5 jogadores e 1 coach de qualquer era anual da história do Counter-Strike. O motor de simulação calcula **8 fatores reais de química** (idioma, co-play, balanceamento de roles, choque de meta, estabilidade de roster, histórico do coach, etc.) e simula um Major completo contra 15 lendas históricas reais.

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js (App Router) & React 19
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4 & Vanilla CSS Tokens
- **Ícones**: Lucide React
- **Dados**: CS Player Eras Database (HLTV & Liquipedia)

## 📌 Funcionalidades

- **Team Builder**: Pesquisa e seleção de pro players por era (2013–2026), função (IGL, AWPer, Rifler, Entry, Support, Lurker) e pontuação.
- **Cálculo de Química Real**: Algoritmo matemático que ajusta a força do time baseado em compatibilidade histórica e tática.
- **Simulador de Major**: Fase de Grupos (BO1) + Playoffs em Árvore (BO3/BO5) com variância estocástica e upsets.
- **Design System Dark Cinematic**: Interface moderna, minimalista e responsiva.

## ⚡ Como Rodar o Projeto

```bash
cd cs-fantasy
npm install
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.
