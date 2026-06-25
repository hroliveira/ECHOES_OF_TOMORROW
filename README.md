<div align="center">

# 🎵 ECHOES OF TOMORROW

### *Uma Arqueologia Sônica — Protótipo Interativo*

<img src="https://img.shields.io/badge/status-em%20desenvolvimento-ffd700?style=flat-square" />
<img src="https://img.shields.io/badge/engine-Three.js-8a2be2?style=flat-square" />
<img src="https://img.shields.io/badge/audio-Web%20Audio%20API-00d4ff?style=flat-square" />
<img src="https://img.shields.io/badge/build-Vite-646cff?style=flat-square" />

> *"Na Cápsula do Éter, o tempo não é uma linha reta. É um eco que você aprendeu a ouvir."*

---

**ECHOES OF TOMORROW** é um jogo de aventura e quebra-cabeça em primeira pessoa onde você não viaja no tempo — você o *escuta*. Como um **Arqueólogo Sônico**, você usa um fone de ouvido especial para ouvir as "ondas do tempo" e interagir com ecos do seu próprio futuro para salvar a Biblioteca Flutuante.

</div>

---

## 📖 A Premissa

O jogo se passa em **A Cápsula do Éter**, uma biblioteca flutuante que está sendo corroída por um **Silêncio Branco** — uma estática que apaga a realidade. Você descobre que a única maneira de salvar a biblioteca não é consertando o presente, mas prevenindo um erro que você *ainda cometerá no futuro*.

<div align="center">

> **O antagonista não é um vilão. É a sua própria ansiedade em resolver os puzzles rápido demais.**

</div>

## 🎮 Mecânicas Centrais

### 👻 Eco-Visão
Ao ativar o fone, o mundo entra em câmera lenta e você vê um **afterimage** (rastro fantasma) de você mesmo realizando ações que você *ainda vai fazer*. Você precisa assistir ao seu próprio futuro para saber onde pisar ou o que pegar.

**No protótipo atual:** Um fantasma translúcido com anéis de luz aparece 5 segundos atrás de você, seguindo seus passos anteriores. A barra de **SINCRONIA DO ECO** na HUD mostra o quão perto você está do seu próprio eco.

### 🔊 Memória Auditiva
Os livros na biblioteca não têm palavras — apenas **frequências sonoras**. Cada frequência representa uma categoria (Física, Poesia, História, Ficção, Filosofia, Fantasia, Ciência, Arte). Você precisa "ouvir" a categoria correta para ativar mecanismos.

**No protótipo atual:** Aproxime-se de um livro e clique para ouvir sua frequência. Cada categoria tem uma nota musical única (Lá 220 Hz, Lá 440 Hz, Mi 330 Hz, etc.).

### 🌌 O Paradoxo da Gravidade
Em determinadas salas, a gravidade é **invertida para o jogador, mas não para os objetos**. Você anda no teto enquanto os livros caem para o chão. Use isso a seu favor criando "trilhas" de livros caindo para formar plataformas.

**No protótipo atual:** Uma zona de gravidade invertida com um anel azul no chão marca a área. Livros flutuam para cima dentro dela, e uma plataforma no teto reflete a área abaixo.

### 🧘 Modo Meditação
Pressione **M** para sentar e ouvir os ecos. A paisagem sonora muda organicamente, sem objetivos — apenas para relaxar e apreciar a atmosfera.

## 🎨 Estilo Visual e Áudio

### Visual
- **Low-Poly com texturas de aquarela** — um estilo onírico de livro de histórias
- Cores **saturadas e vibrantes** no presente
- O fantasma do futuro aparece em tons **monocromáticos azulados**
- Partículas flutuantes de éter preenchem o ambiente
- Pilares de luz etéreos

### Áudio (Gerativo)
A trilha sonora **responde às suas ações**:
- **Drone ambiente** — rico e evolutivo quando você está sincronizado com seu eco
- **Pulso de movimento** — acelera quando você anda, desacelera quando para
- **Ruído branco (Silêncio Branco)** — constante e irritante, diminui quando você está alinhado com seu eco
- **Batimento cardíaco** — desacelera na meditação, acelera com movimento
- **Livros** — cada categoria toca uma nota com harmônicos e delay, como sinos

## 🕹️ Controles

| Tecla | Ação |
|-------|------|
| `W` / `↑` | Andar para frente |
| `S` / `↓` | Andar para trás |
| `A` / `←` | Andar para esquerda |
| `D` / `→` | Andar para direita |
| **Mouse** | Olhar ao redor |
| **Clique** | Interagir com livros |
| `M` | Alternar Modo Meditação |

## 🏗️ Estrutura do Projeto

```
ECHOES_OF_TOMORROW/
├── index.html          # Página principal com UI e HUD
├── package.json        # Dependências (Three.js, Vite)
├── vite.config.js      # Configuração do Vite
├── .gitignore          # Arquivos ignorados
└── src/
    ├── main.js         # Orquestrador do jogo, game loop, UI
    ├── scene.js        # Cena 3D, iluminação, câmera, partículas
    ├── player.js       # Jogador FPS, movimento, colisão, gravação de eco
    ├── environment.js  # Biblioteca: estantes, livros, mesas, zonas
    ├── audio.js        # Sistema de áudio generativo (Web Audio API)
    └── effects.js      # Efeitos visuais: fantasma, rastro, ruído
```

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **[Three.js](https://threejs.org/)** | Renderização 3D no navegador |
| **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** | Áudio generativo e sônico |
| **[Vite](https://vitejs.dev/)** | Servidor de desenvolvimento e build |
| **JavaScript (ES Modules)** | Lógica do jogo |

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação e execução

```bash
# Clone o repositório
git clone https://github.com/hroliveira/ECHOES_OF_TOMORROW.git
cd ECHOES_OF_TOMORROW

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Para build de produção
npm run build
npm run preview
```

O servidor iniciará em `http://localhost:3000`.

## 🗺️ Progressão e Narrativa

> ⚠️ **SPOILERS — A Surpresa Final**

Ao longo do jogo, você encontra cartas escritas por você mesmo, *de ontem*, pedindo ajuda. No final, você descobre que **você é o criador do Silêncio Branco** — no desespero para salvar a biblioteca no primeiro dia, usou um feitiço proibido que distorceu o tempo.

Para vencer, você não deve **lutar** contra o ruído, mas sim **tocar uma melodia** (aprendida com os ecos) que sincroniza todos os tempos simultaneamente, transformando o ruído em música.

### Mensagens da História
O jogo revela mensagens progressivamente durante a exploração:
1. *"Estes livros não têm palavras... apenas ecos do que está por vir."*
2. *"Ouça com atenção. O futuro deixa rastros."*
3. *"O Silêncio Branco está crescendo. Sincronize com seu eco."*
4. *"Na sala azul, a gravidade se inverte. Os livros caem para o alto."*
5. *"Você não está ouvindo o futuro. O futuro está ouvindo você."*
6. *"Para restaurar o Éter, aprenda a melodia do tempo."*

## 🔮 Roadmap

- [x] **v0.1 — Protótipo Base**
  - [x] Cena 3D com biblioteca flutuante
  - [x] Movimento em primeira pessoa (WASD + Mouse)
  - [x] Sistema de áudio generativo
  - [x] Fantasma do eco com delay de 5 segundos
  - [x] Livros interativos com frequências sonoras
  - [x] Zona de gravidade invertida
  - [x] Modo Meditação
  - [ ] **Próximos passos:**
  - [ ] Sistema de loop temporal (ciclo de 1 minuto com mudanças sutis)
  - [ ] Puzzles não-lineares auditivos
  - [ ] Tela de abertura cinematográfica
  - [ ] Melodia final para restaurar a biblioteca
  - [ ] Cartas do "eu do passado" espalhadas pela biblioteca
  - [ ] Efeitos de pós-processamento (glow, bloom, câmera lenta)
  - [ ] Suporte a dispositivos móveis (touch controls)

## 📜 Licença

Este projeto é privado e está em desenvolvimento. © 2026.

---

<div align="center">
  <sub>Feito com 🎧 e ☕ por <a href="https://github.com/hroliveira">hroliveira</a></sub>
</div>
