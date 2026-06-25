import * as THREE from 'three';
import { SceneManager } from './scene.js';
import { Player } from './player.js';
import { Environment } from './environment.js';
import { AudioManager } from './audio.js';
import { EffectsManager } from './effects.js';
import { TouchControls } from './touch-controls.js';

// --- DOM References ---
const loadingEl = document.getElementById('loading');
const titleScreen = document.getElementById('title-screen');
const btnStart = document.getElementById('btn-start');
const hud = document.getElementById('hud');
const clickToLock = document.getElementById('click-to-lock');
const controlsHint = document.getElementById('controls-hint');
const echoIndicator = document.getElementById('echo-indicator');
const echoBarFill = document.getElementById('echo-bar-fill');
const bookLabel = document.getElementById('book-label');
const meditationBadge = document.getElementById('meditation-badge');
const storyText = document.getElementById('story-text');
const canvas = document.getElementById('game-canvas');
const btnMeditate = document.getElementById('btn-meditate');

// --- Device detection ---
const isMobile = TouchControls.isMobile();

// --- Game State ---
const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  MEDITATING: 'meditating'
};

let gameState = STATE.MENU;

// --- Initialize Systems ---
const sceneManager = new SceneManager(canvas);
const player = new Player(sceneManager.camera, canvas);
const environment = new Environment(sceneManager.scene);
const audio = new AudioManager();
const effects = new EffectsManager(sceneManager.scene, sceneManager.camera);

// Pass colliders to player
player.colliders = environment.getColliders();

// --- Touch Controls (mobile) ---
let touchControls = null;
if (isMobile) {
  touchControls = new TouchControls(player, canvas);
  // On mobile, the player always has control (no pointer lock needed)
  player.isLocked = true;

  // Set tap callback for book interaction
  touchControls.setTapCallback(() => {
    if (currentBook && gameState === STATE.PLAYING) {
      interactWithBook(currentBook);
    }
  });

  // Hide click-to-lock overlay on mobile
  if (clickToLock) clickToLock.style.display = 'none';

  // Show mobile meditation button
  if (btnMeditate) btnMeditate.classList.add('visible');

  // Update controls hint for mobile
  if (controlsHint) {
    controlsHint.textContent = 'JOYSTICK — MOVER · ARRASTAR — OLHAR · Toque — INTERAGIR';
  }
}

// --- Game Loop ---
let lastTime = performance.now();
let gameStartTime = 0;
let storyIndex = 0;
let lastStoryTime = 0;
let meditationTime = 0;

const STORY_MESSAGES = [
  '"Estes livros não têm palavras... apenas ecos do que está por vir."',
  '"Ouça com atenção. O futuro deixa rastros."',
  '"O Silêncio Branco está crescendo. Sincronize com seu eco."',
  '"Na sala azul, a gravidade se inverte. Os livros caem para o alto."',
  '"Você não está ouvindo o futuro. O futuro está ouvindo você."',
  '"Para restaurar o Éter, aprenda a melodia do tempo."'
];

function gameLoop(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  if (gameState === STATE.PLAYING || gameState === STATE.MEDITATING) {
    const elapsed = (time - gameStartTime) / 1000;

    // Update touch controls (mobile)
    if (touchControls) {
      touchControls.update();
    }

    // Update player
    player.update(delta);

    // Get player speed for audio
    const speed = player.getSpeed();

    // Get echo alignment (proximity to ghost)
    const pastState = player.getPastState(5000);
    let echoAlignment = 0;

    if (pastState) {
      const dist = player.position.distanceTo(pastState.position);
      // Closer = higher alignment (max at ~0.5 units distance)
      echoAlignment = Math.max(0, 1 - dist / 3);
    }

    // Update environment
    environment.update(time, delta);

    // Update audio
    if (!audio.initialized) {
      audio.init();
    }
    audio.update(time, delta, speed, echoAlignment);

    // Update effects
    effects.updateGhost(pastState, time, delta);
    effects.updateTrail(player.recordingBuffer, time);
    effects.setEchoAlignment(echoAlignment);
    effects.renderNoise(time);

    // Update scene
    sceneManager.update(time, delta);

    // --- UI Updates ---

    // Echo alignment bar
    if (echoIndicator) {
      echoIndicator.classList.toggle('visible', (player.isLocked || isMobile) && echoAlignment > 0.1);
    }
    if (echoBarFill) {
      echoBarFill.style.width = `${echoAlignment * 100}%`;
    }

    // Book interaction (raycasting)
    checkBookInteraction(time);

    // Story messages
    if (elapsed > 10 && elapsed - lastStoryTime > 15) {
      if (storyIndex < STORY_MESSAGES.length) {
        showStoryMessage(STORY_MESSAGES[storyIndex]);
        storyIndex++;
        lastStoryTime = elapsed;
      }
    }

    // Meditation
    if (gameState === STATE.MEDITATING) {
      meditationTime += delta;
      meditationBadge.classList.add('visible');

      // Slow rotation of camera for meditation
      if (player.isLocked || isMobile) {
        const medRot = Math.sin(time * 0.0001) * 0.5;
        // Gentle breathing effect
      }
    } else {
      meditationBadge.classList.remove('visible');
    }

    // Controls hint - fade after 15 seconds
    if (controlsHint) {
      if (elapsed < 15) {
        controlsHint.classList.add('visible');
      } else {
        controlsHint.classList.remove('visible');
      }
    }
  }

  // Render
  sceneManager.render();

  requestAnimationFrame(gameLoop);
}

// --- Book Interaction (Raycasting) ---
const raycaster = new THREE.Raycaster();
let currentBook = null;

function checkBookInteraction(time) {
  const canInteract = player.isLocked || isMobile;
  if (!canInteract) return;

  raycaster.setFromCamera({ x: 0, y: 0 }, sceneManager.camera);

  const bookMeshes = environment.getBookMeshes();
  const meshes = bookMeshes.map(b => b.mesh);

  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const bookData = bookMeshes.find(b => b.mesh === hit);

    if (bookData && !bookData.interacted) {
      currentBook = bookData;
      bookLabel.textContent = `📖 ${getCategoryName(bookData.category)} — Toque para ouvir`;
      bookLabel.classList.add('visible');

      // Highlight book
      hit.material.emissiveIntensity = 0.5;
    }
  } else {
    if (currentBook) {
      currentBook.mesh.material.emissiveIntensity = 0.1;
      currentBook = null;
    }
    bookLabel.classList.remove('visible');
  }
}

function getCategoryName(category) {
  const names = {
    physics: 'Física',
    poetry: 'Poesia',
    history: 'História',
    fiction: 'Ficção',
    philosophy: 'Filosofia',
    fantasy: 'Fantasia',
    science: 'Ciência',
    art: 'Arte'
  };
  return names[category] || category;
}

// Desktop click to interact with books
document.addEventListener('click', () => {
  if (currentBook && player.isLocked && !isMobile) {
    interactWithBook(currentBook);
  }
});

function interactWithBook(book) {
  const category = book.category;
  // Play the sound for this book category
  audio.playBookSound(category);
  book.interacted = true;
  book.mesh.material.emissiveIntensity = 0.3;

  // Reset after a cooldown
  setTimeout(() => {
    if (book) {
      book.interacted = false;
    }
  }, 3000);

  bookLabel.textContent = `🎵 ${getCategoryName(category)} — ${getFrequencyNote(category)}`;
}

function getFrequencyNote(category) {
  const notes = {
    physics: 'Lá (220 Hz)',
    poetry: 'Lá (440 Hz)',
    history: 'Mi (330 Hz)',
    fiction: 'Dó# (554 Hz)',
    philosophy: 'Mi (660 Hz)',
    fantasy: 'Lá (880 Hz)',
    science: 'Dó# (550 Hz)',
    art: 'Sol (770 Hz)'
  };
  return notes[category] || '440 Hz';
}

// --- Story Message ---
let storyTimeout = null;

function showStoryMessage(text) {
  if (storyTimeout) clearTimeout(storyTimeout);

  storyText.textContent = text;
  storyText.classList.add('visible');

  storyTimeout = setTimeout(() => {
    storyText.classList.remove('visible');
  }, 6000);
}

// --- Meditation Mode ---
document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM' && (gameState === STATE.PLAYING || gameState === STATE.MEDITATING)) {
    toggleMeditation();
  }
});

// Mobile meditation button
if (btnMeditate) {
  btnMeditate.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState === STATE.PLAYING || gameState === STATE.MEDITATING) {
      toggleMeditation();
    }
  });
}

function toggleMeditation() {
  if (gameState === STATE.PLAYING) {
    gameState = STATE.MEDITATING;
    audio.enterMeditation();
    showStoryMessage('"Sente-se. Ouça os ecos do tempo."');
    document.body.style.transition = 'filter 3s ease';
    document.body.style.filter = 'brightness(0.6) saturate(0.5)';
    if (btnMeditate) btnMeditate.textContent = '⏳';
  } else if (gameState === STATE.MEDITATING) {
    gameState = STATE.PLAYING;
    audio.exitMeditation();
    document.body.style.filter = 'none';
    if (btnMeditate) btnMeditate.textContent = '🧘';
  }
}

// --- Start Game ---
btnStart.addEventListener('click', () => {
  // Hide title screen
  titleScreen.classList.add('hidden');

  // Show HUD
  hud.classList.add('visible');

  // Start game
  gameState = STATE.PLAYING;
  gameStartTime = performance.now();

  // On desktop, request pointer lock
  if (!isMobile) {
    canvas.focus();
    canvas.requestPointerLock();
  }

  // Initialize audio on user gesture
  audio.resume();

  // Show first story message after a moment
  setTimeout(() => {
    showStoryMessage(STORY_MESSAGES[0]);
    storyIndex = 1;
    lastStoryTime = 3; // elapsed seconds when first story shows
  }, 3000);
});

// --- Initialization ---
// Hide loading when ready
window.addEventListener('load', () => {
  setTimeout(() => {
    loadingEl.classList.add('hidden');
  }, 500);
});

// Handle visibility change - pause/resume audio context
document.addEventListener('visibilitychange', () => {
  if (document.hidden && audio.ctx) {
    audio.ctx.suspend();
  } else if (audio.ctx) {
    audio.ctx.resume().catch(() => {});
  }
});

// Handle window resize for mobile orientation changes
window.addEventListener('resize', () => {
  // The scene manager already handles camera/resize
  // Additional mobile-specific handling if needed
});

// Prevent context menu on long-press (mobile)
document.addEventListener('contextmenu', (e) => {
  if (isMobile) e.preventDefault();
});

// --- Start Loop ---
requestAnimationFrame(gameLoop);

// --- Expose for debugging ---
window.__game = { sceneManager, player, environment, audio, effects, touchControls };
