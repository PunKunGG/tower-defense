"use strict";

// Game state will be initialized during setup
let state;

function initAnalytics() {
  return {
    towerDamage: {
      firewall: 0,
      patch: 0,
      cryo: 0,
      cache: 0,
    },
    leakCount: 0,
    leaksByWave: {},
    peakCredits: activeMap.credits,
  };
}

// Main game loop
function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const rawDelta = Math.min(34, timestamp - state.lastTime);
  state.lastTime = timestamp;
  const delta = rawDelta * state.speed;

  update(delta, timestamp);
  draw();
  requestAnimationFrame(gameLoop);
}

// Event listeners - Canvas
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerleave", () => {
  state.mouse.x = -1000;
  state.mouse.y = -1000;
  state.mouse.col = -1;
  state.mouse.row = -1;
});
canvas.addEventListener("click", handleCanvasClick);

// Event listeners - Tower actions
ui.upgradeBtn.addEventListener("click", upgradeSelected);
ui.sellBtn.addEventListener("click", sellSelected);
ui.branchABtn.addEventListener("click", () => {
  const tower = state.selectedTower;
  if (!tower) return;
  chooseBranch(towerBranches[tower.type][0].id);
});
ui.branchBBtn.addEventListener("click", () => {
  const tower = state.selectedTower;
  if (!tower) return;
  chooseBranch(towerBranches[tower.type][1].id);
});

// Event listeners - UI navigation
ui.codexBtn.addEventListener("click", () => openCodex("towers"));
ui.pauseResumeBtn.addEventListener("click", resumeGame);
ui.pauseRestartBtn.addEventListener("click", () => {
  hidePauseModal();
  restart("Restarted level");
});
ui.pauseLevelBtn.addEventListener("click", () => {
  hidePauseModal();
  showMenu();
});
ui.pauseCodexBtn.addEventListener("click", () => openCodex("towers"));
ui.pauseModal.addEventListener("click", (event) => {
  if (event.target === ui.pauseModal) resumeGame();
});
ui.codexCloseBtn.addEventListener("click", closeCodex);
ui.codexModal.addEventListener("click", (event) => {
  if (event.target === ui.codexModal) closeCodex();
});
ui.codexTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tab]");
  if (!button) return;
  renderCodex(button.dataset.tab);
});

// Event listeners - Result screen
ui.resultReplayBtn.addEventListener("click", () => {
  hideResultModal();
  restart("เล่นด่านเดิมอีกครั้ง");
});
ui.resultMenuBtn.addEventListener("click", () => {
  hideResultModal();
  showMenu();
});

// Event listeners - Hints
ui.hintDismissBtn.addEventListener("click", dismissHint);
ui.hintCodexBtn.addEventListener("click", () => {
  const tab = state.activeHintTab;
  dismissHint();
  openCodex(tab);
});

// Event listeners - Menu
ui.menuStartBtn.addEventListener("click", enterGame);

// Event listeners - Game controls
ui.startWaveBtn.addEventListener("click", () => {
  if (state.gameOver) {
    restart();
    return;
  }
  startWave();
});
ui.pauseBtn.addEventListener("click", () => {
  togglePauseMenu();
});
ui.speedBtn.addEventListener("click", () => {
  state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
  updateHud();
});

// Event listeners - Keyboard
window.addEventListener("keydown", (event) => {
  if (state.menuOpen) {
    if (event.key === "Escape" && !ui.codexModal.hidden) {
      event.preventDefault();
      closeCodex();
      return;
    }
    if (event.key === "Escape" && state.gameStarted && !state.gameOver) {
      event.preventDefault();
      state.menuSelectedIndex = state.mapIndex;
      state.paused = false;
      hideMenu();
      buildMenuLevelCards();
      updateMenuMeta();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      enterGame();
    }
    if (event.key === " ") event.preventDefault();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    if (!ui.resultModal.hidden) {
      hideResultModal();
      showMenu();
      return;
    }
    if (!ui.codexModal.hidden) {
      closeCodex();
      return;
    }
    if (!ui.pauseModal.hidden) {
      resumeGame();
      return;
    }
    if (state.gameOver) {
      showMenu();
      return;
    }
    showPauseModal();
    return;
  }

  if (!ui.pauseModal.hidden || !ui.codexModal.hidden) {
    if (event.key === " ") event.preventDefault();
    if (event.key.toLowerCase() === "p" && ui.codexModal.hidden) {
      event.preventDefault();
      resumeGame();
    }
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    if (state.gameOver) restart();
    else startWave();
  }
  if (event.key.toLowerCase() === "p") {
    togglePauseMenu();
  }
  const towerKeys = {
    1: "firewall",
    2: "patch",
    3: "cryo",
    4: "cache",
  };
  if (towerKeys[event.key]) {
    const nextType = towerKeys[event.key];
    state.selectedTowerType =
      state.selectedTowerType === nextType && !state.selectedTower ? null : nextType;
    state.selectedTower = null;
    buildTowerCards();
    updateSelectionPanel();
  }
});

// Initialization
state = {
  credits: activeMap.credits,
  lives: activeMap.lives,
  wave: 0,
  score: 0,
  mapIndex: 0,
  menuSelectedIndex: 0,
  selectedTowerType: "firewall",
  selectedTower: null,
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  floaters: [],
  spawns: [],
  activeHintId: null,
  activeHintTab: "enemies",
  codexTab: "towers",
  waveActive: false,
  paused: false,
  speed: 1,
  gameOver: false,
  won: false,
  menuOpen: true,
  gameStarted: false,
  waveBannerTimer: 0,
  waveBannerTitle: "",
  waveBannerText: "",
  screenShake: 0,
  lastTime: 0,
  mouse: { x: -1000, y: -1000, col: -1, row: -1 },
  messageTimer: 0,
  analytics: initAnalytics(),
};

buildMenuLevelCards();
buildTowerCards();
updateSelectionPanel();
updateHud();
updateMenuMeta();
addLog(`${activeMap.name}: ${activeMap.desc}`);
wireOptionalImage(ui.menuLogo, ui.menuLogoFallback);
wireOptionalImage(ui.brandLogo, ui.brandLogoFallback);
requestAnimationFrame(gameLoop);
