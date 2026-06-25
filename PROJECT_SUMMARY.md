# 🎵 ECHOES OF TOMORROW — RESUMO COMPLETO DO PROJETO

> **Propósito deste arquivo:** Qualquer IA que ler este resumo consegue entender o estado atual do projeto, o que já foi implementado, quais bugs foram corrigidos e por onde continuar o desenvolvimento.

---

## 1. 📋 VISÃO GERAL

| Campo | Valor |
|-------|-------|
| **Nome** | ECHOES OF TOMORROW |
| **Tipo** | Jogo de aventura e quebra-cabeça em primeira pessoa (navegador) |
| **Engine** | Three.js (3D) + Web Audio API (áudio generativo) |
| **Ferramenta de build** | Vite |
| **Linguagem** | JavaScript ES Modules |
| **Repositório** | https://github.com/hroliveira/ECHOES_OF_TOMORROW.git |
| **Branch** | `master` |
| **Status** | Protótipo funcional v0.1 — Desktop + Mobile |
| **Último commit** | `docs: add comprehensive README with game details, controls, and roadmap` |
| **Próximos commits pendentes** | Versão mobile (touch-controls.js, player.js, main.js, index.html modificados) + este resumo |

---

## 2. 🎮 CONCEITO DO JOGO

O jogador é um **Arqueólogo Sônico** que usa um fone de ouvido especial para ouvir as "ondas do tempo". O jogo se passa em **A Cápsula do Éter**, uma biblioteca flutuante sendo corroída por um **Silêncio Branco** (estática que apaga a realidade).

**Mecânicas principais:**
- **Eco-Visão:** Um fantasma translúcido aparece 5 segundos atrás de você, mostrando seus movimentos passados. A barra de SINCRONIA DO ECO na HUD mostra o quão perto você está do seu próprio fantasma.
- **Memória Auditiva:** Livros contêm frequências sonoras em vez de texto. Cada categoria (Física, Poesia, História, etc.) tem uma nota musical única.
- **Gravidade Invertida:** Uma zona especial onde a gravidade é invertida, marcada por um anel azul no chão.
- **Modo Meditação:** Pressione M para sentar e ouvir a paisagem sonora evoluir organicamente.

**Twist narrativo:** O jogador descobre que ele mesmo causou o Silêncio Branco ao tentar salvar a biblioteca. Para vencer, deve tocar uma melodia que sincroniza todos os tempos.

---

## 3. 🏗️ ARQUITETURA DO PROJETO

```
ECHOES_OF_TOMORROW/
├── index.html              # UI completa, HUD, joystick mobile, CSS responsivo
├── package.json            # Dependências: three, vite
├── vite.config.js          # Configuração Vite
├── .gitignore              # node_modules, dist, .env, .vne, .vscode
├── README.md               # Documentação do jogo para visitantes do GitHub
├── PROJECT_SUMMARY.md      # ← VOCÊ ESTÁ AQUI
└── src/
    ├── main.js             # Orquestrador: game loop, estado, UI, raycasting livros
    ├── scene.js            # Cena 3D: câmera, renderizador, luzes, partículas
    ├── player.js           # Jogador: movimento WASD+touch, câmera mouse+touch, colisão, buffer de gravação do eco
    ├── environment.js      # Biblioteca: chão, paredes, 8 estantes, livros, mesa central, zona de gravidade invertida, pilares de luz
    ├── audio.js            # Áudio generativo: drone, pulso de movimento, ruído branco, batimento cardíaco, sons de livros
    ├── effects.js          # Efeitos visuais: fantasma do eco (com anéis e partículas), rastro de movimento, ruído branco na tela
    └── touch-controls.js   # Controles mobile: joystick virtual, arrastar para olhar, detecção de toque
```

### Fluxo de inicialização:
1. `index.html` carrega → `main.js` (module)
2. `main.js` instancia: SceneManager → Player → Environment → AudioManager → EffectsManager
3. Detecta se é mobile (`TouchControls.isMobile()`)
4. Se mobile: inicia TouchControls, oculta pointer lock, mostra botão meditação
5. Se desktop: aguarda pointer lock para movimento
6. Game loop: `requestAnimationFrame(gameLoop)` — ~60fps

---

## 4. 🧩 MÓDULOS — DETALHAMENTO

### `src/scene.js` — SceneManager
- Câmera perspectiva (70° FOV)
- Renderizador WebGL com shadow map, ACESFilmicToneMapping
- 6 luzes: ambiente, direcional (lua), fill azul, accent dourada, hemispherica, glow central
- 2000 partículas de éter com movimento flutuante
- Tratamento de resize da janela

### `src/player.js` — Player
- Movimento WASD + setas (desktop)
- Câmera por mouse (pointer lock) ou touch drag (mobile)
- `setTouchMove(x, y)` — recebe direção do joystick (-1 a 1)
- `applyTouchLook(dx, dy)` — rotação da câmera sem pointer lock
- Buffer de gravação: posição + quaternion a cada 50ms, mantém 6s
- `getPastState(5000)` — busca binária no buffer para o estado de 5s atrás
- Colisão: círculo vs cilindro/box com sliding
- Limite circular de raio 16 unidades
- `getSpeed()` — usado pelo áudio

### `src/environment.js` — Environment
- **Chão:** círculo de 18 unidades de raio, com anéis concêntricos e centro de vidro com glow
- **Paredes:** 8 painéis em arco com 8m de altura e 48 segmentos
- **8 Estantes:** cada uma com 5 prateleiras, ~5-8 livros por prateleira, com cores aleatórias da paleta aquarela
- **Mesa central:** com livro aberto e cristal brilhante (OctahedronGeometry)
- **12 livros flutuantes:** com animação senoidal suave
- **Zona de gravidade invertida:** anel azul no chão, livros flutuando para cima, plataforma no teto
- **6 pilares de luz:** cilindros transparentes com AdditiveBlending
- Colisores: box colliders para cada estante

### `src/audio.js` — AudioManager
- **Drone ambiente:** 3 osciladores (C2, G2, C3) com LFOs aleatórios + subgrave C1
- **Pulso de movimento:** oscilador triangular que acelera com velocidade
- **Ruído branco (Silêncio Branco):** buffer de 2s, filtro bandpass com LFO, volume inversamente proporcional ao alinhamento do eco
- **Batimento cardíaco:** pulsa a cada 0.8s (varia com movimento/meditação)
- **Sons de livros:** tons de sino com 2 osciladores + delay para reverb
- **Métodos:** `init()`, `resume()`, `update()`, `playBookSound()`, `enterMeditation()`, `exitMeditation()`

### `src/effects.js` — EffectsManager
- **Fantasma do eco:** grupo 3D com esfera central, 2 anéis brilhantes, point light, partículas de rastro (20 pontos), partículas em órbita (12 pontos)
- **Animação:** pulsação respiratória, rotação dos anéis, órbita 3D
- **Ruído branco na tela:** canvas overlay com perlin noise, opacidade controlada pelo alinhamento do eco
- **Métodos:** `updateGhost()`, `updateTrail()`, `renderNoise()`, `setEchoAlignment()`

### `src/touch-controls.js` — TouchControls (NOVO — versão mobile)
- **Joystick virtual:** metade esquerda da tela. Aparece no ponto de toque, com deadzone radial
- **Touch look:** metade direita da tela. Arrastar para rotacionar câmera
- **Detecção de toque:** toque rápido (<300ms, <10px) no lado direito → interage com livros
- **Propriedades:** `joystickRadius: 55px`, `moveDeadzone: 0.12`, `lookSensitivity: 0.004`
- **Métodos:** `update()` (chamado a cada frame), `setTapCallback()`, `showJoystick()`, `hideJoystick()`
- **Estático:** `isMobile()` — detecta touch + maxTouchPoints + tela pequena
- **Manuseio de eventos:** touchstart (passive), touchmove (preventDefault), touchend, touchcancel

### `src/main.js` — Orquestrador
- Detecta mobile e inicializa TouchControls se aplicável
- No mobile: `player.isLocked = true` (movimento sem pointer lock), oculta overlay click-to-lock
- **Game loop:** ~60fps, update na ordem: touchControls → player → environment → audio → effects → scene → UI
- **Estado:** MENU, PLAYING, MEDITATING
- **Livros:** raycasting central, destaca livro com emissiveIntensity, toca som ao interagir
- **Mensagens da história:** 6 mensagens progressivas, 15s entre cada, após 10s de jogo
- **Meditação:** toggle com tecla M ou botão mobile 🧘, escurece a tela, altera áudio
- **Tratamento de visibilidade:** pausa/resume AudioContext
- **Mobile:** previne context menu (long-press)

---

## 5. 📱 SUPORTE MOBILE — O QUE FOI FEITO

### 5.1. Funcionalidades implementadas:
- ✅ Joystick virtual na metade esquerda da tela
- ✅ Arrastar para olhar na metade direita
- ✅ Toque rápido para interagir com livros
- ✅ Botão 🧘 de meditação no canto inferior direito
- ✅ CSS responsivo (smartphones pequenos, tablets, landscape)
- ✅ `touch-action: none` para prevenir scroll e zoom
- ✅ Meta viewport otimizada (`user-scalable=no`)
- ✅ Detecção automática de dispositivo (`TouchControls.isMobile()`)
- ✅ Desktop continua funcionando normalmente com WASD + mouse

### 5.2. Como testar no celular:
```bash
# Descubra o IP da sua máquina
ipconfig  # Windows
# Ou: ifconfig | Linux/macOS

# Inicie o servidor
npm run dev

# Acesse pelo navegador do celular na mesma rede:
# http://SEU_IP:3000
```

### 5.3. Limitações conhecidas do mobile:
- ❌ Livros são pequenos para toque preciso em telas pequenas
- ❌ Sem tutorial visual de como usar os controles touch
- ❌ Sem suporte a landscape vs portrait otimizado (funciona mas não ideal)
- ❌ Botão de meditação pode sobrepor o joystick em telas muito pequenas
- ❌ Performance pode ser menor em dispositivos mais antigos

---

## 6. 🐛 BUGS CORRIGIDOS (HISTÓRICO)

### Bug #1 — `speed is not defined` (ReferenceError)
- **Sintoma:** Jogo não funcionava, erro no console
- **Causa:** `const speed = movementSpeed;` estava dentro de um bloco `if (this.moveGain && this.moveEnv)` mas era usado em outro bloco `if (this.heartGain)` depois
- **Solução:** Movido `const speed` para o escopo da função `update()`
- **Arquivo:** `src/audio.js`

### Bug #2 — Pointer lock não ativava com clique na overlay
- **Sintoma:** Clicar no centro da tela não ativava pointer lock no desktop
- **Causa:** A overlay `#click-to-lock` com `pointer-events: all` e `z-index: 50` interceptava os cliques antes de chegarem ao canvas
- **Solução:** Adicionado click handler diretamente na overlay `#click-to-lock` que chama `requestPointerLock()`
- **Arquivo:** `src/player.js`

### Bug #3 — `audio.resume().catch()` quebrava
- **Sintoma:** Erro "audio.resume(...).catch is not a function"
- **Causa:** `audio.resume()` retornava `undefined` em vez da Promise do `AudioContext.resume()`
- **Solução:** Modificado `resume()` para retornar a Promise
- **Arquivo:** `src/audio.js`

### Bug #4 — Mensagens da história com timing errado
- **Sintoma:** Mensagens apareciam no momento errado ou nunca
- **Causa:** `lastStoryTime` era setado com `performance.now()` (ms) mas comparado com `elapsed` (segundos)
- **Solução:** Padronizado tudo para segundos (elapsed)
- **Arquivo:** `src/main.js`

### Bug #5 — Joystick X-axis invertido no mobile
- **Sintoma:** Puxar joystick para esquerda movia o jogador para direita
- **Causa:** Condicional incorreta: `-touchMoveX` quando touchMoveX era negativo resultava em positivo → direita
- **Solução:** Simplificado para `right * touchMoveX` (correto para ambos os sinais)
- **Arquivo:** `src/player.js`

---

## 7. 📝 COMO EXECUTAR

```bash
# Pré-requisitos: Node.js 16+
cd CAMINHO_DO_PROJETO
npm install
npm run dev
# Acesse: http://localhost:3000
```

### Para build de produção:
```bash
npm run build
npm run preview
```

### Para enviar para o GitHub:
```bash
git add .
git commit -m "descrição das alterações"
git push origin master
```

---

## 8. 🗺️ ROADMAP — PRÓXIMOS PASSOS

### Prioridade Alta (Implementação):
- [ ] **Sistema de loop temporal (ciclo de 1 minuto)**
  - A cada 60s, um ciclo se completa
  - Cenário muda minimamente (um livro aparece, outro some)
  - Arquivo sugerido: `src/time-loop.js`
- [ ] **Puzzles não-lineares auditivos**
  - Sala A, B, C resolvíveis em qualquer ordem
  - Solução da sala C depende do som ouvido na sala A
  - Modificar `src/main.js` (lógica de progressão) e `src/environment.js` (portas, mecanismos)
- [ ] **Melodia final para restaurar a biblioteca**
  - Sequência de notas aprendidas com os livros
  - Toque na ordem correta para vencer
  - Novo arquivo: `src/melody-puzzle.js`

### Prioridade Média (Jogabilidade):
- [ ] **Tela de abertura cinematográfica com animação**
- [ ] **Cartas do "eu do passado" espalhadas pela biblioteca**
  - Objetos 3D coletáveis com texto
  - Avançam a narrativa
- [ ] **Efeitos de pós-processamento** (glow, bloom, câmera lenta ao ativar eco)
- [ ] **Mais salas / áreas da biblioteca** (expansão do ambiente)

### Prioridade Mobile:
- [ ] **Tutorial visual para mobile** (setas mostrando onde tocar na primeira vez)
- [ ] **Otimização de performance** (reduzir contagem de partículas, simplificar geometry)
- [ ] **Suporte a orientação landscape vs retrato**
- [ ] **Ajuste fino da sensibilidade do joystick** (configurável)
- [ ] **Feedback háptico** (vibration API para toques nos livros)

### Prioridade Baixa (Polimento):
- [ ] Sistema de conquistas / colecionáveis
- [ ] Múltiplos idiomas (i18n)
- [ ] Tela de configurações (áudio, sensibilidade, gráficos)
- [ ] Save game (localStorage)

---

## 9. 🔧 ARQUITETURA — PARA OUTRAS IAS

### Padrão de código:
- **ES Modules** (import/export)
- **Classes** para cada sistema (SceneManager, Player, etc.)
- **Three.js** para toda a parte 3D
- **Web Audio API** para todo som
- **DOM + CSS** para toda UI/HUD
- **Game loop** via `requestAnimationFrame`

### Como adicionar uma nova feature:
1. Leia o módulo relevante (ex: se for puzzle, leia `main.js` + `environment.js`)
2. Crie um novo arquivo em `src/` se for um sistema novo
3. Importe e instancie em `main.js`
4. Adicione ao game loop se precisar de update a cada frame
5. Commit + push

### Convenções de nomenclatura:
- Arquivos: `kebab-case.js`
- Classes: `PascalCase`
- Funções/métodos: `camelCase`
- Constantes: `UPPER_SNAKE_CASE` ou `camelCase`
- IDs HTML: `kebab-case`
- Variáveis Three.js: evitamos prefixos, usamos nomes descritivos

### Debug:
```javascript
// No console do navegador:
window.__game  // { sceneManager, player, environment, audio, effects, touchControls }
```

---

## 10. 📄 ARQUIVOS NO REPOSITÓRIO

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `index.html` | ✅ Modificado | Versão mobile com joystick, botão meditação, CSS responsivo |
| `package.json` | ✅ Original | Dependências Three.js + Vite |
| `vite.config.js` | ✅ Original | Configuração do servidor |
| `.gitignore` | ✅ Original | Ignora node_modules, dist, .env, .vne etc |
| `README.md` | ✅ Adicionado | Documentação do jogo para GitHub |
| `PROJECT_SUMMARY.md` | ✅ Adicionado | Este arquivo — resumo completo |
| `src/main.js` | ✅ Modificado | Versão mobile: TouchControls, botão meditação, livro com nome pt-BR |
| `src/player.js` | ✅ Modificado | Touch input: setTouchMove, applyTouchLook, isTouchActive |
| `src/scene.js` | ✅ Original | Cena 3D — sem alterações |
| `src/environment.js` | ✅ Original | Ambiente — sem alterações recentes |
| `src/audio.js` | ✅ Corrigido | Bug speed is not defined + resume() retorna Promise |
| `src/effects.js` | ✅ Original | Efeitos visuais — sem alterações |
| `src/touch-controls.js` | ✅ Novo | Controles touch para mobile |

---

> **Data do último resumo:** Junho de 2026
> **Mantido por:** hroliveira
> **Próxima IA, leia este arquivo primeiro!** 🎧
