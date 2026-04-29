"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  credits: document.querySelector("#credits"),
  lives: document.querySelector("#lives"),
  wave: document.querySelector("#wave"),
  score: document.querySelector("#score"),
  menuScreen: document.querySelector("#menuScreen"),
  menuLevelList: document.querySelector("#menuLevelList"),
  menuStartBtn: document.querySelector("#menuStartBtn"),
  menuMeta: document.querySelector("#menuMeta"),
  menuLogo: document.querySelector("#menuLogo"),
  menuLogoFallback: document.querySelector("#menuLogoFallback"),
  towerList: document.querySelector("#towerList"),
  wavePreview: document.querySelector("#wavePreview"),
  codexBtn: document.querySelector("#codexBtn"),
  pauseModal: document.querySelector("#pauseModal"),
  pauseKicker: document.querySelector("#pauseKicker"),
  pauseTitle: document.querySelector("#pauseTitle"),
  pauseMeta: document.querySelector("#pauseMeta"),
  pauseResumeBtn: document.querySelector("#pauseResumeBtn"),
  pauseRestartBtn: document.querySelector("#pauseRestartBtn"),
  pauseLevelBtn: document.querySelector("#pauseLevelBtn"),
  pauseCodexBtn: document.querySelector("#pauseCodexBtn"),
  codexModal: document.querySelector("#codexModal"),
  codexCloseBtn: document.querySelector("#codexCloseBtn"),
  codexTabs: document.querySelector("#codexTabs"),
  codexContent: document.querySelector("#codexContent"),
  resultModal: document.querySelector("#resultModal"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultStars: document.querySelector("#resultStars"),
  resultScore: document.querySelector("#resultScore"),
  resultBest: document.querySelector("#resultBest"),
  resultCore: document.querySelector("#resultCore"),
  resultWave: document.querySelector("#resultWave"),
  resultNote: document.querySelector("#resultNote"),
  resultReplayBtn: document.querySelector("#resultReplayBtn"),
  resultMenuBtn: document.querySelector("#resultMenuBtn"),
  hintPanel: document.querySelector("#hintPanel"),
  hintTitle: document.querySelector("#hintTitle"),
  hintText: document.querySelector("#hintText"),
  hintCodexBtn: document.querySelector("#hintCodexBtn"),
  hintDismissBtn: document.querySelector("#hintDismissBtn"),
  brandLogo: document.querySelector("#brandLogo"),
  brandLogoFallback: document.querySelector("#brandLogoFallback"),
  selectedTitle: document.querySelector("#selectedTitle"),
  selectedText: document.querySelector("#selectedText"),
  selectedPanel: document.querySelector("#selectedPanel"),
  branchActions: document.querySelector("#branchActions"),
  branchABtn: document.querySelector("#branchABtn"),
  branchBBtn: document.querySelector("#branchBBtn"),
  upgradeBtn: document.querySelector("#upgradeBtn"),
  sellBtn: document.querySelector("#sellBtn"),
  startWaveBtn: document.querySelector("#startWaveBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  speedBtn: document.querySelector("#speedBtn"),
  toast: document.querySelector("#toast"),
  log: document.querySelector("#log"),
};

const COLS = 14;
const ROWS = 9;
const CELL = 80;
const MAX_WAVES = 20;

const maps = [
  {
    id: "training",
    name: "Training Circuit",
    difficulty: "Easy",
    desc: "เส้นทางยาวทางเดียว เหมาะลอง build ใหม่",
    credits: 170,
    lives: 24,
    hpScale: 0.88,
    countBonus: -1,
    gapBonus: 90,
    rewardScale: 1.05,
    pathCells: [
      [
        [0, 4],
        [1, 4],
        [2, 4],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [5, 6],
        [6, 6],
        [7, 6],
        [8, 6],
        [8, 3],
        [9, 3],
        [10, 3],
        [11, 3],
        [11, 6],
        [12, 6],
        [13, 6],
      ],
    ],
  },
  {
    id: "split",
    name: "Split Circuit",
    difficulty: "Normal",
    desc: "สองทางเข้าไปรวมกลางแมพ ต้องคุม choke ให้ดี",
    credits: 155,
    lives: 20,
    hpScale: 1,
    countBonus: 2,
    gapBonus: 0,
    rewardScale: 1,
    pathCells: [
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 4],
        [7, 4],
        [8, 4],
        [8, 6],
        [9, 6],
        [10, 6],
        [11, 6],
        [12, 6],
        [13, 6],
      ],
      [
        [0, 6],
        [1, 6],
        [2, 6],
        [3, 6],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 4],
        [7, 4],
        [8, 4],
        [8, 6],
        [9, 6],
        [10, 6],
        [11, 6],
        [12, 6],
        [13, 6],
      ],
    ],
  },
  {
    id: "triport",
    name: "Triport Breach",
    difficulty: "Hard",
    desc: "สามทางเกิดพร้อมกัน ระยะสั้นกว่าและศัตรูหนากว่า",
    credits: 135,
    lives: 16,
    hpScale: 1.14,
    countBonus: 5,
    gapBonus: -70,
    rewardScale: 0.95,
    pathCells: [
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
        [6, 3],
        [6, 5],
        [7, 5],
        [8, 5],
        [9, 5],
        [10, 5],
        [11, 5],
        [12, 5],
        [13, 5],
      ],
      [
        [0, 4],
        [1, 4],
        [2, 4],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 5],
        [7, 5],
        [8, 5],
        [9, 5],
        [10, 5],
        [11, 5],
        [12, 5],
        [13, 5],
      ],
      [
        [0, 7],
        [1, 7],
        [2, 7],
        [3, 7],
        [3, 6],
        [4, 6],
        [5, 6],
        [6, 5],
        [7, 5],
        [8, 5],
        [9, 5],
        [10, 5],
        [11, 5],
        [12, 5],
        [13, 5],
      ],
    ],
  },
];

function cellsToPath(cells) {
  return cells.map(([col, row]) => ({
    x: col * CELL + CELL / 2,
    y: row * CELL + CELL / 2,
  }));
}

function addPathCell(set, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
  set.add(`${col},${row}`);
}

function addPathSegmentCells(set, from, to) {
  const [fromCol, fromRow] = from;
  const [toCol, toRow] = to;
  const colDistance = toCol - fromCol;
  const rowDistance = toRow - fromRow;
  const steps = Math.max(Math.abs(colDistance), Math.abs(rowDistance), 1);

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps;
    const col = Math.round(fromCol + colDistance * progress);
    const row = Math.round(fromRow + rowDistance * progress);
    addPathCell(set, col, row);
  }
}

function buildPathSet(pathGroups) {
  const blockedCells = new Set();

  pathGroups.forEach((cells) => {
    for (let index = 0; index < cells.length; index += 1) {
      const current = cells[index];
      const previous = cells[index - 1];
      if (previous) addPathSegmentCells(blockedCells, previous, current);
      else addPathCell(blockedCells, current[0], current[1]);
    }
  });

  return blockedCells;
}

let activeMap = maps[0];
let paths = activeMap.pathCells.map(cellsToPath);
let pathSet = buildPathSet(activeMap.pathCells);

const towerTypes = {
  firewall: {
    id: "firewall",
    name: "Firewall",
    key: "F",
    image: "assets/towers/firewall.png",
    cost: 55,
    color: "#37e3a2",
    range: 165,
    damage: 13,
    cooldown: 420,
    desc: "ยิงเร็ว เหมาะเคลียร์ตัวบาง",
  },
  patch: {
    id: "patch",
    name: "Patch",
    key: "P",
    image: "assets/towers/patch.png",
    cost: 85,
    color: "#ffd166",
    range: 150,
    damage: 32,
    cooldown: 960,
    splash: 58,
    desc: "ยิงแรง ระเบิดโดนกลุ่ม",
  },
  cryo: {
    id: "cryo",
    name: "Cryo",
    key: "C",
    image: "assets/towers/cryo.png",
    cost: 70,
    color: "#46a7ff",
    range: 145,
    damage: 7,
    cooldown: 680,
    slow: 0.46,
    slowTime: 1200,
    desc: "ทำให้ศัตรูช้าลง",
  },
  cache: {
    id: "cache",
    name: "Cache",
    key: "$",
    image: "assets/towers/cache.png",
    cost: 65,
    color: "#c084fc",
    range: 0,
    damage: 0,
    cooldown: 0,
    desc: "สร้าง credits ระหว่าง wave",
  },
};

const towerBranches = {
  firewall: [
    {
      id: "rapid",
      name: "Rapid Thread",
      desc: "ยิงถี่ขึ้นมาก เหมาะเก็บศัตรูเร็ว",
    },
    {
      id: "pierce",
      name: "Pierce Port",
      desc: "กระสุนทะลุ armor และทำดาเมจเพิ่มกับตัวเกราะ",
    },
  ],
  patch: [
    {
      id: "blast",
      name: "Blast Radius",
      desc: "รัศมีระเบิดกว้างขึ้นสำหรับ wave หนา",
    },
    {
      id: "payload",
      name: "Payload Spike",
      desc: "ดาเมจสูงขึ้น เน้นจัดการตัวถึกและ boss",
    },
  ],
  cryo: [
    {
      id: "deepFreeze",
      name: "Deep Freeze",
      desc: "slow แรงและนานขึ้นเพื่อซื้อเวลา",
    },
    {
      id: "frostbite",
      name: "Frostbite",
      desc: "ติดสถานะกัดเลือดหลังโดนแช่แข็ง",
    },
  ],
  cache: [
    {
      id: "interest",
      name: "Interest Loop",
      desc: "สร้าง credits มากขึ้นต่อรอบ",
    },
    {
      id: "overclock",
      name: "Overclock Aura",
      desc: "เร่ง tower ใกล้ๆ ให้ยิงถี่ขึ้น",
    },
  ],
};

const enemyTypes = {
  bug: {
    name: "Bug",
    color: "#ff6b6b",
    hp: 42,
    speed: 58,
    reward: 7,
    radius: 14,
  },
  worm: {
    name: "Worm",
    color: "#f59e0b",
    hp: 72,
    speed: 42,
    reward: 11,
    radius: 17,
  },
  spark: {
    name: "Spark",
    color: "#7dd3fc",
    hp: 30,
    speed: 86,
    reward: 8,
    radius: 12,
  },
  shield: {
    name: "Shield",
    color: "#94a3b8",
    hp: 118,
    speed: 38,
    reward: 15,
    radius: 18,
    armor: 6,
  },
  fork: {
    name: "Fork Bomb",
    color: "#fb7185",
    hp: 68,
    speed: 55,
    reward: 13,
    radius: 15,
    split: 2,
    splitType: "bug",
  },
  regen: {
    name: "Regen",
    color: "#34d399",
    hp: 95,
    speed: 45,
    reward: 16,
    radius: 16,
    regen: 5,
  },
  boss: {
    name: "Kernel Panic",
    color: "#f472b6",
    hp: 360,
    speed: 32,
    reward: 42,
    radius: 24,
  },
};

const state = {
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
  lastTime: 0,
  mouse: { x: -1000, y: -1000, col: -1, row: -1 },
  messageTimer: 0,
};

function formatNumber(value) {
  return Math.floor(value).toLocaleString("en-US");
}

function bestScoreKey(mapId) {
  return `byte-defense.best-score.${mapId}`;
}

function bestStarsKey(mapId) {
  return `byte-defense.best-stars.${mapId}`;
}

function hintSeenKey(id) {
  return `byte-defense.hint.${id}`;
}

function getBestScore(mapId) {
  try {
    return Number(localStorage.getItem(bestScoreKey(mapId))) || 0;
  } catch {
    return 0;
  }
}

function getBestStars(mapId) {
  try {
    return Number(localStorage.getItem(bestStarsKey(mapId))) || 0;
  } catch {
    return 0;
  }
}

function hasSeenHint(id) {
  try {
    return localStorage.getItem(hintSeenKey(id)) === "1";
  } catch {
    return false;
  }
}

function markHintSeen(id) {
  try {
    localStorage.setItem(hintSeenKey(id), "1");
  } catch {
    // Hints can repeat if localStorage is unavailable.
  }
}

function saveBestScore(mapId, score) {
  const bestScore = getBestScore(mapId);
  if (score <= bestScore) return;

  try {
    localStorage.setItem(bestScoreKey(mapId), String(score));
  } catch {
    // The game still works if localStorage is unavailable.
  }
}

function saveBestStars(mapId, stars) {
  const bestStars = getBestStars(mapId);
  if (stars <= bestStars) return;

  try {
    localStorage.setItem(bestStarsKey(mapId), String(stars));
  } catch {
    // The game still works if localStorage is unavailable.
  }
}

function calculateStars(won) {
  if (!won) return 0;

  const coreRatio = state.lives / activeMap.lives;
  if (coreRatio >= 0.75) return 3;
  if (coreRatio >= 0.45) return 2;
  return 1;
}

function renderStars(count) {
  return `${"★".repeat(count)}${"☆".repeat(3 - count)}`;
}

function wireOptionalImage(image, fallback) {
  const showImage = () => {
    fallback.hidden = true;
  };
  const showFallback = () => {
    image.remove();
    fallback.hidden = false;
  };

  image.addEventListener("load", showImage);
  image.addEventListener("error", showFallback);

  if (image.complete) {
    if (image.naturalWidth > 0) showImage();
    else showFallback();
  }
}

function mapMetaText(map) {
  const lanes = map.pathCells.length === 1 ? "1 lane" : `${map.pathCells.length} lanes`;
  return `${map.difficulty} / ${lanes} / Core ${map.lives} / Credits ${map.credits}`;
}

function enemyAbility(typeId, enemy) {
  if (typeId === "shield") return `Armor ${enemy.armor}: ลดดาเมจที่รับ ยกเว้นกระสุนทะลุ armor`;
  if (typeId === "fork") return `Split: แตกเป็น ${enemy.split} ${enemyTypes[enemy.splitType].name} เมื่อตาย`;
  if (typeId === "regen") return `Regen ${enemy.regen}/sec: ฟื้นเลือดระหว่างเดิน`;
  if (typeId === "boss") return "Boss: หลุดเข้า Core แล้วเสีย core life มากกว่าปกติ";
  if (typeId === "spark") return "Fast: วิ่งเร็ว เลือดน้อย ต้องมี tower ยิงถี่หรือ slow";
  if (typeId === "worm") return "Durable: ช้ากว่าแต่เลือดเยอะกว่า Bug";
  return "Basic: ศัตรูพื้นฐาน ใช้ทดสอบจุดยิงและ economy";
}

function renderCodex(tab = state.codexTab) {
  state.codexTab = tab;
  ui.codexTabs.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.tab === tab));
  });

  if (tab === "towers") {
    ui.codexContent.innerHTML = Object.values(towerTypes)
      .map((tower) => {
        const branches = towerBranches[tower.id]
          .map((branch) => `${branch.name}: ${branch.desc}`)
          .join(" / ");
        const details =
          tower.id === "cache"
            ? `Cost ${tower.cost} / Economy tower`
            : `Cost ${tower.cost} / Damage ${tower.damage} / Range ${tower.range}`;
        return `
          <article class="codex-card">
            <h3>${tower.name}</h3>
            <p>${tower.desc}</p>
            <span>${details}</span>
            <small>${branches}</small>
          </article>
        `;
      })
      .join("");
    return;
  }

  if (tab === "enemies") {
    ui.codexContent.innerHTML = Object.entries(enemyTypes)
      .map(([typeId, enemy]) => `
        <article class="codex-card">
          <h3>${enemy.name}</h3>
          <p>${enemyAbility(typeId, enemy)}</p>
          <span>HP ${enemy.hp} / Speed ${enemy.speed} / Reward ${enemy.reward}</span>
        </article>
      `)
      .join("");
    return;
  }

  ui.codexContent.innerHTML = Object.entries(towerBranches)
    .map(([towerId, branches]) => `
      <article class="codex-card">
        <h3>${towerTypes[towerId].name} branches</h3>
        ${branches.map((branch) => `<p><strong>${branch.name}</strong>: ${branch.desc}</p>`).join("")}
      </article>
    `)
    .join("");
}

function openCodex(tab = state.codexTab) {
  ui.codexModal.hidden = false;
  renderCodex(tab);
}

function closeCodex() {
  ui.codexModal.hidden = true;
}

function hidePauseModal() {
  ui.pauseModal.hidden = true;
}

function showPauseModal() {
  if (state.menuOpen || state.gameOver) return;

  closeCodex();
  hideResultModal();
  state.paused = true;
  ui.pauseTitle.textContent = "Pause Menu";
  ui.pauseMeta.textContent = `${activeMap.name} - Wave ${state.wave}/${MAX_WAVES} - Score ${formatNumber(state.score)}`;
  ui.pauseModal.hidden = false;
  updateHud();
}

function resumeGame() {
  if (state.gameOver) return;

  hidePauseModal();
  state.paused = false;
  updateHud();
}

function togglePauseMenu() {
  if (state.menuOpen || state.gameOver) return;

  if (ui.pauseModal.hidden) {
    showPauseModal();
  } else {
    resumeGame();
  }
}

function hideResultModal() {
  ui.resultModal.hidden = true;
}

function showResultModal(won, stars) {
  const bestScore = getBestScore(activeMap.id);
  const coreLeft = Math.max(0, state.lives);
  const isNewBest = state.score >= bestScore && state.score > 0;

  hidePauseModal();
  ui.resultKicker.textContent = won ? "Level Complete" : "Core Breached";
  ui.resultTitle.textContent = won ? "Victory" : "Defeat";
  ui.resultStars.textContent = renderStars(stars);
  ui.resultScore.textContent = formatNumber(state.score);
  ui.resultBest.textContent = formatNumber(bestScore);
  ui.resultCore.textContent = `${formatNumber(coreLeft)}/${formatNumber(activeMap.lives)}`;
  ui.resultWave.textContent = `${state.wave}/${MAX_WAVES}`;
  ui.resultNote.textContent = won
    ? isNewBest
      ? "New best score!"
      : "ด่านผ่านแล้ว ลองทำสกอร์ให้สูงกว่าเดิม"
    : "ลองปรับตำแหน่ง tower และอัปเกรดสายให้เข้ากับศัตรูในด่าน";
  ui.resultModal.hidden = false;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  state.messageTimer = 1800;
}

function addLog(message) {
  ui.log.textContent = message;
}

function showHint(id, title, text, tab = "enemies") {
  if (hasSeenHint(id) || !ui.hintPanel.hidden) return false;

  state.activeHintId = id;
  state.activeHintTab = tab;
  ui.hintTitle.textContent = title;
  ui.hintText.textContent = text;
  ui.hintPanel.hidden = false;
  return true;
}

function dismissHint() {
  if (state.activeHintId) markHintSeen(state.activeHintId);
  state.activeHintId = null;
  state.activeHintTab = "enemies";
  ui.hintPanel.hidden = true;
}

function cellCenter(col, row) {
  return {
    x: col * CELL + CELL / 2,
    y: row * CELL + CELL / 2,
  };
}

function getCorePoint() {
  const primaryPath = paths[0];
  return primaryPath[primaryPath.length - 1];
}

function isPath(col, row) {
  return pathSet.has(`${col},${row}`);
}

function towerAt(col, row) {
  return state.towers.find((tower) => tower.col === col && tower.row === row);
}

function canPlace(col, row) {
  return (
    col >= 0 &&
    row >= 0 &&
    col < COLS &&
    row < ROWS &&
    !isPath(col, row) &&
    !towerAt(col, row)
  );
}

function applyMap(index) {
  state.mapIndex = index;
  activeMap = maps[index];
  paths = activeMap.pathCells.map(cellsToPath);
  pathSet = buildPathSet(activeMap.pathCells);
}

function buildMenuLevelCards() {
  ui.menuLevelList.innerHTML = "";

  maps.forEach((map, index) => {
    const button = document.createElement("button");
    button.className = "menu-level";
    button.type = "button";
    button.setAttribute("aria-pressed", String(state.menuSelectedIndex === index));
    button.innerHTML = `
      <small>${map.difficulty}</small>
      <strong>${map.name}</strong>
      <span>${map.desc}</span>
      <span class="menu-level-stars">${renderStars(getBestStars(map.id))}</span>
      <span class="menu-level-stats">${mapMetaText(map)} / Best ${formatNumber(getBestScore(map.id))}</span>
    `;
    button.addEventListener("click", () => {
      selectMenuMap(index);
    });
    ui.menuLevelList.appendChild(button);
  });
}

function updateMenuMeta() {
  const selectedMap = maps[state.menuSelectedIndex];
  ui.menuMeta.textContent = `${selectedMap.name}: ${renderStars(getBestStars(selectedMap.id))} / ${mapMetaText(selectedMap)}`;

  if (!state.gameStarted) {
    ui.menuStartBtn.textContent = "Start Game";
  } else if (state.menuSelectedIndex === state.mapIndex && !state.gameOver) {
    ui.menuStartBtn.textContent = "Resume Game";
  } else if (state.menuSelectedIndex === state.mapIndex) {
    ui.menuStartBtn.textContent = "Restart Level";
  } else {
    ui.menuStartBtn.textContent = "Start Selected Level";
  }
}

function selectMenuMap(index) {
  state.menuSelectedIndex = index;
  buildMenuLevelCards();
  updateMenuMeta();
}

function buildTowerCards() {
  ui.towerList.innerHTML = "";

  Object.values(towerTypes).forEach((tower) => {
    const button = document.createElement("button");
    button.className = "tower";
    button.type = "button";
    button.setAttribute("aria-pressed", String(state.selectedTowerType === tower.id));
    button.dataset.tower = tower.id;
    button.innerHTML = `
      <span class="tower-icon" style="background:${tower.color}">
        <img class="tower-icon-image" src="${tower.image}" alt="" />
        <span class="tower-icon-key">${tower.key}</span>
      </span>
      <span>
        <h2>${tower.name}</h2>
        <p>${tower.desc}</p>
      </span>
      <span class="tower-cost">${tower.cost}</span>
    `;
    const iconImage = button.querySelector(".tower-icon-image");
    const iconKey = button.querySelector(".tower-icon-key");
    iconImage.addEventListener("load", () => {
      iconKey.hidden = true;
    });
    iconImage.addEventListener("error", () => {
      iconImage.remove();
      iconKey.hidden = false;
    });
    button.addEventListener("click", () => {
      state.selectedTowerType =
        state.selectedTowerType === tower.id && !state.selectedTower ? null : tower.id;
      state.selectedTower = null;
      buildTowerCards();
      updateSelectionPanel();
      showToast(state.selectedTowerType ? `เลือก ${tower.name}` : "ยกเลิกการเลือกทาวเวอร์");
    });
    ui.towerList.appendChild(button);
  });
}

function updateHud() {
  ui.credits.textContent = formatNumber(state.credits);
  ui.lives.textContent = formatNumber(state.lives);
  ui.wave.textContent = `${state.wave}/${MAX_WAVES}`;
  ui.score.textContent = formatNumber(state.score);
  ui.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  ui.pauseBtn.setAttribute("aria-pressed", String(state.paused));
  ui.speedBtn.textContent = `${state.speed}x`;
  ui.speedBtn.setAttribute("aria-pressed", String(state.speed > 1));
  ui.startWaveBtn.textContent = state.gameOver ? "Restart" : "Start Wave";
  ui.startWaveBtn.disabled =
    state.menuOpen || state.waveActive || (!state.gameOver && state.wave >= MAX_WAVES);
  updateWavePreview();
}

function getWaveSummary(wave) {
  const spawns = buildWave(wave);
  const counts = spawns.reduce((acc, spawn) => {
    acc[spawn.type] = (acc[spawn.type] || 0) + 1;
    return acc;
  }, {});
  const order = ["bug", "spark", "worm", "shield", "fork", "regen", "boss"];
  const enemies = order
    .filter((type) => counts[type])
    .map((type) => `${enemyTypes[type].name} x${counts[type]}`);

  return {
    enemies,
    lanes: paths.length,
    total: spawns.length,
  };
}

function updateWavePreview() {
  if (state.gameOver) {
    ui.wavePreview.innerHTML = `
      <h2>${state.won ? "Level Cleared" : "Core Down"}</h2>
      <p>${state.won ? `${renderStars(calculateStars(true))} / Score ${formatNumber(state.score)}` : "กด Restart เพื่อลองใหม่"}</p>
    `;
    return;
  }

  if (state.waveActive) {
    ui.wavePreview.innerHTML = `
      <h2>Wave ${state.wave} กำลังบุก</h2>
      <p>เหลือศัตรู ${state.enemies.length + state.spawns.length} ตัว / ${paths.length} lane</p>
    `;
    return;
  }

  const nextWave = state.wave + 1;
  if (nextWave > MAX_WAVES) {
    ui.wavePreview.innerHTML = `
      <h2>Final wave cleared</h2>
      <p>กด Esc เพื่อกลับเมนูเลือกด่าน</p>
    `;
    return;
  }

  const summary = getWaveSummary(nextWave);
  ui.wavePreview.innerHTML = `
    <h2>Next Wave ${nextWave}</h2>
    <p>${summary.enemies.join(" / ")}</p>
    <span>${summary.total} enemies / ${summary.lanes} lane${summary.lanes > 1 ? "s" : ""}</span>
  `;
}

function towerStats(tower) {
  const type = towerTypes[tower.type];
  const levelScale = 1 + (tower.level - 1) * 0.42;
  const stats = {
    range: type.range + (tower.level - 1) * 13,
    damage: type.damage * levelScale,
    cooldown: Math.max(150, type.cooldown * (1 - (tower.level - 1) * 0.12)),
    splash: type.splash ? type.splash + (tower.level - 1) * 12 : 0,
    slow: type.slow ? Math.max(0.25, type.slow - (tower.level - 1) * 0.06) : 0,
    slowTime: type.slowTime ? type.slowTime + (tower.level - 1) * 260 : 0,
    bypassArmor: false,
    dotDamage: 0,
    auraRange: 0,
  };

  if (tower.branch === "rapid") {
    stats.cooldown *= 0.62;
    stats.damage *= 0.92;
  }
  if (tower.branch === "pierce") {
    stats.damage *= 1.35;
    stats.bypassArmor = true;
  }
  if (tower.branch === "blast") {
    stats.splash *= 1.65;
    stats.cooldown *= 1.08;
  }
  if (tower.branch === "payload") {
    stats.damage *= 1.7;
    stats.splash *= 0.82;
    stats.cooldown *= 1.1;
  }
  if (tower.branch === "deepFreeze") {
    stats.slow = Math.max(0.16, stats.slow - 0.14);
    stats.slowTime *= 1.7;
  }
  if (tower.branch === "frostbite") {
    stats.dotDamage = 7;
  }
  if (tower.branch === "overclock") {
    stats.auraRange = 150;
  }

  stats.cooldown = Math.max(110, stats.cooldown);
  return stats;
}

function upgradeCost(tower) {
  const base = towerTypes[tower.type].cost;
  return Math.round(base * (0.72 + tower.level * 0.58));
}

function branchCost(tower) {
  return upgradeCost(tower);
}

function getTowerBranch(tower) {
  return towerBranches[tower.type]?.find((branch) => branch.id === tower.branch);
}

function sellValue(tower) {
  return Math.floor(tower.spent * 0.62);
}

function updateSelectionPanel() {
  const selected = state.selectedTower;
  ui.upgradeBtn.disabled = true;
  ui.sellBtn.disabled = true;
  ui.branchActions.hidden = true;
  ui.branchABtn.disabled = true;
  ui.branchBBtn.disabled = true;

  if (selected) {
    const type = towerTypes[selected.type];
    const stats = towerStats(selected);
    const branch = getTowerBranch(selected);
    const upgradeText = selected.level >= 3 ? "เต็มเลเวลแล้ว" : `อัปเกรด ${upgradeCost(selected)} credits`;
    const branchText = branch ? ` / ${branch.name}` : "";
    ui.selectedTitle.textContent = `${type.name} Lv.${selected.level}`;
    ui.selectedText.textContent = selected.type === "cache"
      ? `${upgradeText}${branchText}. สร้าง credits ทุกไม่กี่วินาที ขายได้ ${sellValue(selected)}.`
      : `${upgradeText}${branchText}. Damage ${Math.round(stats.damage)}, Range ${Math.round(stats.range)}, ขายได้ ${sellValue(selected)}.`;

    if (selected.level === 2 && !selected.branch) {
      const branches = towerBranches[selected.type] || [];
      const cost = branchCost(selected);
      ui.branchActions.hidden = false;
      ui.selectedText.textContent = `เลือกสายอัปเกรด ${cost} credits. ${branches[0].name}: ${branches[0].desc} / ${branches[1].name}: ${branches[1].desc}`;
      showHint("branches", "เลือกสาย Lv.3", "Tower ที่ถึง Lv.2 ต้องเลือกสายก่อนขึ้น Lv.3 แต่ละสายเปลี่ยนบทบาทของ tower ชัดเจน เลือกให้เข้ากับศัตรูในด่าน", "upgrades");
      ui.branchABtn.textContent = `${branches[0].name} (${cost})`;
      ui.branchBBtn.textContent = `${branches[1].name} (${cost})`;
      ui.branchABtn.title = branches[0].desc;
      ui.branchBBtn.title = branches[1].desc;
      ui.branchABtn.disabled = state.credits < cost || state.gameOver;
      ui.branchBBtn.disabled = state.credits < cost || state.gameOver;
      ui.upgradeBtn.disabled = true;
    } else {
      ui.upgradeBtn.disabled =
        selected.level >= 3 || state.credits < upgradeCost(selected) || state.gameOver;
    }
    ui.sellBtn.disabled = state.gameOver;
    return;
  }

  const type = towerTypes[state.selectedTowerType];
  if (!type) {
    ui.selectedTitle.textContent = "ยังไม่ได้เลือกทาวเวอร์";
    ui.selectedText.textContent =
      "เลือกทาวเวอร์ด้านบนเพื่อเข้าสู่โหมดวาง หรือคลิกทาวเวอร์บนกระดานเพื่ออัปเกรด";
    return;
  }

  ui.selectedTitle.textContent = type.name;
  ui.selectedText.textContent = `${type.desc}. ราคา ${type.cost} credits. วางได้เฉพาะช่องว่างที่ไม่ใช่เส้นทาง`;
}

function startWave() {
  if (state.menuOpen) return;
  if (state.paused) return;
  if (state.waveActive || state.gameOver || state.wave >= MAX_WAVES) return;

  state.wave += 1;
  state.waveActive = true;
  state.spawns = buildWave(state.wave);
  showWaveHint(state.wave, state.spawns);
  addLog(`Wave ${state.wave} เริ่มแล้ว`);
  showToast(`Wave ${state.wave}`);
  updateHud();
}

function showWaveHint(wave, spawns) {
  const types = new Set(spawns.map((spawn) => spawn.type));
  if (wave === 5 || types.has("boss")) {
    if (showHint("boss", "Boss wave", "Kernel Panic จะทำ Core เสียหายหนักกว่าศัตรูปกติ ถ้าหลุดเข้าไปควรเตรียม slow หรือ damage หนักไว้ก่อน")) return;
  }
  if (types.has("shield")) {
    if (showHint("shield", "เจอ Shield แล้ว", "Shield มี armor ลดดาเมจ กระสุนสาย Pierce Port ของ Firewall ช่วยทะลุเกราะได้ดี")) return;
  }
  if (types.has("fork")) {
    if (showHint("fork", "Fork Bomb", "Fork Bomb แตกเป็นตัวเล็กเมื่อตาย ระเบิดวงกว้างหรือ tower ยิงถี่จะช่วยเก็บเศษได้ไว")) return;
  }
  if (types.has("regen")) {
    showHint("regen", "Regen process", "Regen ฟื้นเลือดระหว่างเดิน ถ้าปล่อยให้เดินนานเกินไปจะเสีย damage ฟรี ควรใช้ burst หรือ frostbite");
  }
}

function showMenu() {
  if (state.menuOpen) return;

  state.menuOpen = true;
  state.menuSelectedIndex = state.mapIndex;
  state.paused = true;
  hidePauseModal();
  hideResultModal();
  ui.menuScreen.classList.remove("is-hidden");
  ui.menuScreen.setAttribute("aria-hidden", "false");
  buildMenuLevelCards();
  updateMenuMeta();
  updateHud();
}

function hideMenu() {
  state.menuOpen = false;
  hidePauseModal();
  hideResultModal();
  ui.menuScreen.classList.add("is-hidden");
  ui.menuScreen.setAttribute("aria-hidden", "true");
  updateHud();
}

function enterGame() {
  const shouldStartLevel =
    !state.gameStarted || state.gameOver || state.menuSelectedIndex !== state.mapIndex;

  if (shouldStartLevel) {
    state.mapIndex = state.menuSelectedIndex;
    state.gameStarted = true;
    hideMenu();
    restart(`เข้าสู่ ${maps[state.mapIndex].name}`);
    showHint("first-run", "เริ่มต้น", "วาง tower ข้างเส้นทางก่อนกด Start Wave แล้วคลิก tower ที่วางเพื่ออัปเกรดหรือขาย", "towers");
    return;
  }

  state.paused = false;
  hideMenu();
}

function buildWave(wave) {
  const spawns = [];
  const laneCount = paths.length;
  const count = Math.max(5, 7 + wave * 2 + activeMap.countBonus);
  const hpScale = (1 + wave * 0.16) * activeMap.hpScale;
  const gap = Math.max(220, 760 - wave * 18 + activeMap.gapBonus);
  let at = 0;

  for (let i = 0; i < count; i += 1) {
    let type = "bug";
    if (wave >= 4 && i % 4 === 0) type = "spark";
    if (wave >= 6 && i % 5 === 2) type = "worm";
    if (wave >= 8 && i % 7 === 3) type = "shield";
    if (wave >= 10 && i % 6 === 1) type = "fork";
    if (wave >= 12 && i % 8 === 5) type = "regen";
    const pathIndex = i % laneCount;
    spawns.push({ at: at + pathIndex * 180, type, hpScale, pathIndex });
    at += gap;
  }

  if (wave % 5 === 0) {
    spawns.push({
      at: at + 800,
      type: "boss",
      hpScale: (0.82 + wave * 0.18) * activeMap.hpScale,
      pathIndex: Math.floor(wave / 5) % laneCount,
    });
  }

  return spawns;
}

function spawnEnemy(spawn) {
  const template = enemyTypes[spawn.type];
  const path = paths[spawn.pathIndex || 0];
  const start = path[0];
  const enemy = {
    type: spawn.type,
    name: template.name,
    pathIndex: spawn.pathIndex || 0,
    x: start.x - CELL,
    y: start.y,
    segment: 0,
    progress: 0,
    maxHp: template.hp * spawn.hpScale,
    hp: template.hp * spawn.hpScale,
    speed: template.speed * (1 + Math.min(0.24, state.wave * 0.012)),
    reward: Math.round(template.reward * (1 + state.wave * 0.08) * activeMap.rewardScale),
    radius: template.radius,
    color: template.color,
    armor: template.armor || 0,
    regen: template.regen || 0,
    split: template.split || 0,
    splitType: template.splitType || null,
    fromSplit: false,
    slowUntil: 0,
    slowFactor: 1,
    dotUntil: 0,
    dotDamage: 0,
  };
  state.enemies.push(enemy);
}

function placeTower(col, row) {
  const type = towerTypes[state.selectedTowerType];
  if (!type) {
    showToast("เลือกทาวเวอร์ก่อนวาง");
    return;
  }

  if (!canPlace(col, row)) {
    showToast(isPath(col, row) ? "ช่องนี้เป็นทางเดินของศัตรู" : "ช่องนี้วางไม่ได้");
    return;
  }

  if (state.credits < type.cost) {
    showToast("credits ไม่พอ");
    return;
  }

  const center = cellCenter(col, row);
  const tower = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type: type.id,
    col,
    row,
    x: center.x,
    y: center.y,
    level: 1,
    cooldown: 0,
    lastEarn: 0,
    spent: type.cost,
    branch: null,
    pulse: 0,
  };

  state.credits -= type.cost;
  state.towers.push(tower);
  state.selectedTower = null;
  popParticles(tower.x, tower.y, type.color, 14);
  showToast(`วาง ${type.name}`);
  updateSelectionPanel();
  updateHud();
}

function upgradeSelected() {
  const tower = state.selectedTower;
  if (!tower || tower.level >= 3) return;

  if (tower.level === 2 && !tower.branch) {
    showToast("เลือกสายอัปเกรดก่อน");
    return;
  }

  const cost = upgradeCost(tower);
  if (state.credits < cost) {
    showToast("credits ไม่พอสำหรับอัปเกรด");
    return;
  }

  state.credits -= cost;
  tower.spent += cost;
  tower.level += 1;
  tower.pulse = 1;
  popParticles(tower.x, tower.y, towerTypes[tower.type].color, 22);
  showToast(`${towerTypes[tower.type].name} Lv.${tower.level}`);
  updateSelectionPanel();
  updateHud();
}

function chooseBranch(branchId) {
  const tower = state.selectedTower;
  if (!tower || tower.level !== 2 || tower.branch) return;

  const branch = towerBranches[tower.type]?.find((item) => item.id === branchId);
  if (!branch) return;

  const cost = branchCost(tower);
  if (state.credits < cost) {
    showToast("credits ไม่พอสำหรับเลือกสาย");
    return;
  }

  state.credits -= cost;
  tower.spent += cost;
  tower.level += 1;
  tower.branch = branch.id;
  tower.pulse = 1;
  popParticles(tower.x, tower.y, towerTypes[tower.type].color, 26);
  showToast(`${towerTypes[tower.type].name}: ${branch.name}`);
  updateSelectionPanel();
  updateHud();
}

function sellSelected() {
  const tower = state.selectedTower;
  if (!tower) return;

  state.credits += sellValue(tower);
  state.towers = state.towers.filter((item) => item !== tower);
  state.selectedTower = null;
  showToast("ขายทาวเวอร์แล้ว");
  updateSelectionPanel();
  updateHud();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function handlePointerMove(event) {
  const point = canvasPoint(event);
  state.mouse.x = point.x;
  state.mouse.y = point.y;
  state.mouse.col = Math.floor(point.x / CELL);
  state.mouse.row = Math.floor(point.y / CELL);
}

function handleCanvasClick(event) {
  if (state.gameOver) return;
  const point = canvasPoint(event);
  const col = Math.floor(point.x / CELL);
  const row = Math.floor(point.y / CELL);
  const existing = towerAt(col, row);

  if (existing) {
    state.selectedTowerType = null;
    state.selectedTower = existing;
    buildTowerCards();
    updateSelectionPanel();
    showToast(`${towerTypes[existing.type].name} Lv.${existing.level}`);
    return;
  }

  state.selectedTower = null;
  if (!state.selectedTowerType) {
    updateSelectionPanel();
    showToast("เลือกทาวเวอร์ก่อนวาง");
    return;
  }

  placeTower(col, row);
}

function update(delta, now) {
  if (state.paused || state.gameOver) return;

  if (state.messageTimer > 0) {
    state.messageTimer -= delta;
    if (state.messageTimer <= 0) ui.toast.classList.remove("show");
  }

  for (let i = state.spawns.length - 1; i >= 0; i -= 1) {
    const spawn = state.spawns[i];
    spawn.at -= delta;
    if (spawn.at <= 0) {
      spawnEnemy(spawn);
      state.spawns.splice(i, 1);
    }
  }

  updateEnemies(delta, now);
  updateTowers(delta, now);
  updateProjectiles(delta, now);
  updateParticles(delta);
  updateFloaters(delta);
  checkWaveState();
}

function updateEnemies(delta, now) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    if (enemy.regen && enemy.hp > 0 && enemy.hp < enemy.maxHp) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regen * (delta / 1000));
    }
    if (enemy.dotUntil > now && enemy.dotDamage) {
      enemy.hp -= enemy.dotDamage * (delta / 1000);
      if (enemy.hp <= 0) {
        damageEnemy(enemy, 0, { bypassArmor: true });
        continue;
      }
    }

    const path = paths[enemy.pathIndex];
    const target = path[enemy.segment];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const slow = enemy.slowUntil > now ? enemy.slowFactor : 1;
    const step = (enemy.speed * slow * delta) / 1000;

    if (distance <= step) {
      enemy.x = target.x;
      enemy.y = target.y;
      enemy.segment += 1;
      if (enemy.segment >= path.length) {
        state.enemies.splice(i, 1);
        state.lives -= enemy.type === "boss" ? 4 : 1;
        shakeCore();
        showToast(enemy.type === "boss" ? "Boss เจาะ Core!" : "ศัตรูหลุดเข้า Core");
        if (state.lives <= 0) endGame(false);
      }
    } else {
      enemy.x += (dx / distance) * step;
      enemy.y += (dy / distance) * step;
    }
  }
}

function updateTowers(delta, now) {
  state.towers.forEach((tower) => {
    tower.cooldown -= delta;
    tower.pulse = Math.max(0, tower.pulse - delta / 450);

    if (tower.type === "cache") {
      updateCacheTower(tower, now);
      return;
    }

    if (tower.cooldown > 0) return;

    const stats = towerStats(tower);
    const target = acquireTarget(tower, stats.range);
    if (!target) return;

    tower.cooldown = stats.cooldown * getCooldownMultiplier(tower);
    fireProjectile(tower, target, stats);
  });
}

function updateCacheTower(tower, now) {
  const earnDelay = 6100 - tower.level * 700 - (tower.branch === "interest" ? 900 : 0);
  if (!tower.lastEarn) tower.lastEarn = now;
  if (state.waveActive && now - tower.lastEarn >= earnDelay) {
    const amount = 7 + tower.level * 4 + (tower.branch === "interest" ? 9 : 0);
    tower.lastEarn = now;
    state.credits += amount;
    state.score += amount;
    tower.pulse = 1;
    state.floaters.push({
      x: tower.x,
      y: tower.y - 18,
      text: `+${amount}`,
      color: towerTypes.cache.color,
      life: 900,
    });
    updateHud();
  }
}

function getCooldownMultiplier(tower) {
  if (tower.type === "cache") return 1;

  let multiplier = 1;
  state.towers.forEach((otherTower) => {
    if (otherTower.type !== "cache" || otherTower.branch !== "overclock") return;
    const stats = towerStats(otherTower);
    const distance = Math.hypot(otherTower.x - tower.x, otherTower.y - tower.y);
    if (distance <= stats.auraRange) multiplier = Math.min(multiplier, 0.78);
  });

  return multiplier;
}

function acquireTarget(tower, range) {
  let best = null;
  let bestProgress = -1;

  state.enemies.forEach((enemy) => {
    const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    const progress = enemy.segment * CELL;
    if (distance <= range && progress > bestProgress) {
      best = enemy;
      bestProgress = progress;
    }
  });

  return best;
}

function fireProjectile(tower, target, stats) {
  const type = towerTypes[tower.type];
  state.projectiles.push({
    x: tower.x,
    y: tower.y,
    target,
    towerType: tower.type,
    color: type.color,
    speed: tower.type === "patch" ? 360 : 520,
    damage: stats.damage,
    splash: stats.splash,
    slow: stats.slow,
    slowTime: stats.slowTime,
    bypassArmor: stats.bypassArmor,
    dotDamage: stats.dotDamage,
    trail: [],
  });
}

function updateProjectiles(delta, now) {
  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = state.projectiles[i];

    if (!state.enemies.includes(projectile.target)) {
      state.projectiles.splice(i, 1);
      continue;
    }

    projectile.trail.push({ x: projectile.x, y: projectile.y, life: 160 });
    projectile.trail.forEach((point) => {
      point.life -= delta;
    });
    projectile.trail = projectile.trail.filter((point) => point.life > 0);

    const dx = projectile.target.x - projectile.x;
    const dy = projectile.target.y - projectile.y;
    const distance = Math.hypot(dx, dy);
    const step = (projectile.speed * delta) / 1000;

    if (distance <= step) {
      hitEnemy(projectile, now);
      state.projectiles.splice(i, 1);
    } else {
      projectile.x += (dx / distance) * step;
      projectile.y += (dy / distance) * step;
    }
  }
}

function hitEnemy(projectile, now) {
  const target = projectile.target;

  if (projectile.splash) {
    popParticles(target.x, target.y, projectile.color, 18);
    [...state.enemies].forEach((enemy) => {
      const distance = Math.hypot(enemy.x - target.x, enemy.y - target.y);
      if (distance <= projectile.splash) {
        damageEnemy(enemy, projectile.damage * (1 - distance / (projectile.splash * 1.8)), projectile);
      }
    });
  } else {
    damageEnemy(target, projectile.damage, projectile);
    popParticles(target.x, target.y, projectile.color, 8);
  }

  if (projectile.slow && state.enemies.includes(target)) {
    target.slowUntil = now + projectile.slowTime;
    target.slowFactor = projectile.slow;
  }

  if (projectile.dotDamage && state.enemies.includes(target)) {
    target.dotUntil = now + 2400;
    target.dotDamage = Math.max(target.dotDamage || 0, projectile.dotDamage);
  }
}

function damageEnemy(enemy, amount, projectile = null) {
  let finalDamage = amount;
  if (enemy.armor && !projectile?.bypassArmor) {
    finalDamage = Math.max(1, finalDamage - enemy.armor);
  }

  enemy.hp -= finalDamage;
  if (enemy.hp > 0) return;

  const index = state.enemies.indexOf(enemy);
  if (index !== -1) state.enemies.splice(index, 1);

  spawnSplitEnemies(enemy);

  state.credits += enemy.reward;
  state.score += enemy.reward * 10;
  state.floaters.push({
    x: enemy.x,
    y: enemy.y - 18,
    text: `+${enemy.reward}`,
    color: "#ffe28a",
    life: 760,
  });
  popParticles(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 34 : 14);
  updateHud();
}

function spawnSplitEnemies(enemy) {
  if (!enemy.split || enemy.fromSplit) return;

  const template = enemyTypes[enemy.splitType];
  for (let index = 0; index < enemy.split; index += 1) {
    const offset = (index - (enemy.split - 1) / 2) * 12;
    state.enemies.push({
      type: enemy.splitType,
      name: template.name,
      pathIndex: enemy.pathIndex,
      x: enemy.x - 10,
      y: enemy.y + offset,
      segment: enemy.segment,
      progress: enemy.progress,
      maxHp: template.hp * 0.62,
      hp: template.hp * 0.62,
      speed: template.speed * 1.08,
      reward: Math.max(2, Math.floor(template.reward * 0.45)),
      radius: Math.max(8, template.radius - 3),
      color: template.color,
      armor: 0,
      regen: 0,
      split: 0,
      splitType: null,
      fromSplit: true,
      slowUntil: 0,
      slowFactor: 1,
      dotUntil: 0,
      dotDamage: 0,
    });
  }

  popParticles(enemy.x, enemy.y, enemy.color, 18);
}

function updateParticles(delta) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.x += particle.vx * (delta / 1000);
    particle.y += particle.vy * (delta / 1000);
    particle.life -= delta;
    if (particle.life <= 0) state.particles.splice(i, 1);
  }
}

function updateFloaters(delta) {
  for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
    const floater = state.floaters[i];
    floater.y -= 28 * (delta / 1000);
    floater.life -= delta;
    if (floater.life <= 0) state.floaters.splice(i, 1);
  }
}

function popParticles(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 55 + Math.random() * 150;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 4,
      life: 360 + Math.random() * 440,
    });
  }
}

function shakeCore() {
  const core = getCorePoint();
  popParticles(core.x, core.y, "#ff6b6b", 24);
  updateHud();
}

function checkWaveState() {
  if (!state.waveActive) return;
  if (state.spawns.length === 0 && state.enemies.length === 0) {
    state.waveActive = false;
    const bonus = 18 + state.wave * 4;
    state.credits += bonus;
    state.score += bonus * 5;
    addLog(`Wave ${state.wave} จบ ได้โบนัส ${bonus} credits`);
    showToast(`Wave clear +${bonus}`);

    if (state.wave >= MAX_WAVES) {
      endGame(true);
    }
    updateHud();
    updateSelectionPanel();
  }
}

function endGame(won) {
  const stars = calculateStars(won);
  state.gameOver = true;
  state.won = won;
  state.waveActive = false;
  state.spawns = [];
  saveBestScore(activeMap.id, state.score);
  saveBestStars(activeMap.id, stars);
  state.menuSelectedIndex = state.mapIndex;
  buildMenuLevelCards();
  addLog(
    won
      ? `Core ปลอดภัย คุณชนะแล้ว ${renderStars(stars)}`
      : "Core ล่ม ลองวางทาวเวอร์ให้บีบเส้นทางยิงมากขึ้น",
  );
  showToast(won ? `Victory ${renderStars(stars)}` : "Game Over");
  showResultModal(won, stars);
  updateHud();
  updateMenuMeta();
}

function restart(message = "เริ่มใหม่แล้ว", options = {}) {
  applyMap(state.mapIndex);
  state.credits = activeMap.credits;
  state.lives = activeMap.lives;
  state.wave = 0;
  state.score = 0;
  state.selectedTowerType = "firewall";
  state.selectedTower = null;
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.particles = [];
  state.floaters = [];
  state.spawns = [];
  state.waveActive = false;
  state.paused = false;
  state.speed = 1;
  state.gameOver = false;
  state.won = false;
  hidePauseModal();
  hideResultModal();
  state.menuSelectedIndex = state.mapIndex;
  buildMenuLevelCards();
  buildTowerCards();
  updateSelectionPanel();
  updateHud();
  updateMenuMeta();
  addLog(`${activeMap.name}: ${activeMap.desc}`);
  if (options.toast ?? true) showToast(message);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPath();
  drawCore();
  drawPlacementPreview();
  drawTowerRanges();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawParticles();
  drawFloaters();
  drawOverlay();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0a1519");
  gradient.addColorStop(0.58, "#102028");
  gradient.addColorStop(1, "#11151a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = "rgba(105, 155, 160, 0.12)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= COLS; col += 1) {
    ctx.beginPath();
    ctx.moveTo(col * CELL, 0);
    ctx.lineTo(col * CELL, canvas.height);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL);
    ctx.lineTo(canvas.width, row * CELL);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPath() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  paths.forEach((path, index) => {
    ctx.beginPath();
    ctx.moveTo(path[0].x - CELL, path[0].y);
    path.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = "rgba(41, 73, 82, 0.98)";
    ctx.lineWidth = 56;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(path[0].x - CELL, path[0].y);
    path.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle =
      index === 0 ? "rgba(55, 227, 162, 0.22)" : "rgba(70, 167, 255, 0.2)";
    ctx.lineWidth = 32;
    ctx.stroke();

    ctx.setLineDash([16, 18]);
    ctx.lineDashOffset = -performance.now() / 40 - index * 10;
    ctx.beginPath();
    ctx.moveTo(path[0].x - CELL, path[0].y);
    path.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = "rgba(189, 255, 232, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
  });
  ctx.restore();
}

function drawCore() {
  const core = getCorePoint();
  const pulse = 0.5 + Math.sin(performance.now() / 220) * 0.5;
  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.fillStyle = `rgba(55, 227, 162, ${0.1 + pulse * 0.08})`;
  ctx.beginPath();
  ctx.arc(0, 0, 52 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111d22";
  roundRect(-29, -29, 58, 58, 8);
  ctx.fill();
  ctx.strokeStyle = "#37e3a2";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#37e3a2";
  ctx.fillRect(-16, -16, 10, 10);
  ctx.fillRect(6, -16, 10, 10);
  ctx.fillRect(-16, 6, 10, 10);
  ctx.fillRect(6, 6, 10, 10);
  ctx.restore();
}

function drawPlacementPreview() {
  const { col, row } = state.mouse;
  if (
    col < 0 ||
    row < 0 ||
    col >= COLS ||
    row >= ROWS ||
    state.selectedTower ||
    !state.selectedTowerType
  ) {
    return;
  }

  const allowed = canPlace(col, row) && state.credits >= towerTypes[state.selectedTowerType].cost;
  ctx.save();
  ctx.fillStyle = allowed ? "rgba(55, 227, 162, 0.16)" : "rgba(255, 107, 107, 0.18)";
  ctx.strokeStyle = allowed ? "rgba(55, 227, 162, 0.9)" : "rgba(255, 107, 107, 0.9)";
  ctx.lineWidth = 2;
  roundRect(col * CELL + 8, row * CELL + 8, CELL - 16, CELL - 16, 8);
  ctx.fill();
  ctx.stroke();

  const type = towerTypes[state.selectedTowerType];
  if (type.range) {
    const center = cellCenter(col, row);
    ctx.beginPath();
    ctx.arc(center.x, center.y, type.range, 0, Math.PI * 2);
    ctx.fillStyle = `${hexToRgba(type.color, 0.08)}`;
    ctx.fill();
  }
  ctx.restore();
}

function drawTowerRanges() {
  if (!state.selectedTower) return;
  const tower = state.selectedTower;
  const stats = towerStats(tower);
  const radius = stats.range || stats.auraRange;
  if (!radius) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(towerTypes[tower.type].color, 0.09);
  ctx.strokeStyle = hexToRgba(towerTypes[tower.type].color, 0.45);
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTowers() {
  state.towers.forEach((tower) => {
    const type = towerTypes[tower.type];
    const selected = state.selectedTower === tower;
    ctx.save();
    ctx.translate(tower.x, tower.y);

    if (selected || tower.pulse > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 34 + tower.pulse * 12, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(type.color, selected ? 0.16 : 0.12);
      ctx.fill();
    }

    ctx.fillStyle = "#0e171b";
    roundRect(-25, -25, 50, 50, 8);
    ctx.fill();
    ctx.strokeStyle = type.color;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.stroke();

    ctx.fillStyle = type.color;
    if (tower.type === "firewall") {
      ctx.fillRect(-12, -10, 24, 7);
      ctx.fillRect(-12, 3, 24, 7);
      ctx.fillRect(-4, -18, 8, 36);
    } else if (tower.type === "patch") {
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(18, 0);
      ctx.lineTo(0, 17);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0e171b";
      ctx.fillRect(-4, -12, 8, 24);
      ctx.fillRect(-12, -4, 24, 8);
    } else if (tower.type === "cryo") {
      for (let i = 0; i < 6; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.fillRect(-2, -18, 4, 18);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.font = "900 22px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 0, 1);
    }

    ctx.fillStyle = "#eef9f7";
    ctx.font = "800 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`L${tower.level}${tower.branch ? ` ${tower.branch[0].toUpperCase()}` : ""}`, 0, 36);
    ctx.restore();
  });
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
    const slowed = enemy.slowUntil > performance.now();

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = hexToRgba(enemy.color, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.color;
    roundRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 6);
    ctx.fill();
    ctx.strokeStyle = slowed ? "#bcecff" : "#10191e";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#0b1215";
    ctx.fillRect(-enemy.radius + 5, -3, 5, 6);
    ctx.fillRect(enemy.radius - 10, -3, 5, 6);

    if (enemy.type === "boss") {
      ctx.fillStyle = "#fff1fa";
      ctx.font = "900 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("!", 0, 4);
    }

    if (enemy.armor) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -enemy.radius + 3);
      ctx.lineTo(enemy.radius - 6, -4);
      ctx.lineTo(enemy.radius - 10, enemy.radius - 4);
      ctx.lineTo(0, enemy.radius - 1);
      ctx.lineTo(-enemy.radius + 10, enemy.radius - 4);
      ctx.lineTo(-enemy.radius + 6, -4);
      ctx.closePath();
      ctx.stroke();
    }

    if (enemy.split) {
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath();
      ctx.arc(-5, 7, 3, 0, Math.PI * 2);
      ctx.arc(5, 7, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.regen) {
      ctx.fillStyle = "#062016";
      ctx.fillRect(-2, -10, 4, 20);
      ctx.fillRect(-10, -2, 20, 4);
    }

    if (enemy.dotUntil > performance.now()) {
      ctx.strokeStyle = "#a7f3d0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(5, 10, 12, 0.86)";
    roundRect(-24, -enemy.radius - 16, 48, 6, 3);
    ctx.fill();
    ctx.fillStyle = hpRatio > 0.45 ? "#37e3a2" : "#ff6b6b";
    roundRect(-24, -enemy.radius - 16, 48 * hpRatio, 6, 3);
    ctx.fill();
    ctx.restore();
  });
}

function drawProjectiles() {
  state.projectiles.forEach((projectile) => {
    ctx.save();
    projectile.trail.forEach((point) => {
      ctx.globalAlpha = point.life / 180;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.towerType === "patch" ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / 800);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawFloaters() {
  state.floaters.forEach((floater) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, floater.life / 900);
    ctx.fillStyle = floater.color;
    ctx.font = "900 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(floater.text, floater.x, floater.y);
    ctx.restore();
  });
}

function drawOverlay() {
  if (!state.paused && !state.gameOver) return;

  ctx.save();
  ctx.fillStyle = "rgba(5, 9, 12, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#eef9f7";
  ctx.font = "900 48px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const title = state.gameOver ? (state.won ? "VICTORY" : "CORE DOWN") : "PAUSED";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 18);
  ctx.font = "800 18px system-ui";
  ctx.fillStyle = "#9db4b2";
  const subtitle = state.gameOver ? "เลือก Replay หรือ Level Select" : "กด Resume เพื่อเล่นต่อ";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 28);
  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const rawDelta = Math.min(34, timestamp - state.lastTime);
  state.lastTime = timestamp;
  const delta = rawDelta * state.speed;

  update(delta, timestamp);
  draw();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerleave", () => {
  state.mouse.x = -1000;
  state.mouse.y = -1000;
  state.mouse.col = -1;
  state.mouse.row = -1;
});
canvas.addEventListener("click", handleCanvasClick);

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
ui.resultReplayBtn.addEventListener("click", () => {
  hideResultModal();
  restart("เล่นด่านเดิมอีกครั้ง");
});
ui.resultMenuBtn.addEventListener("click", () => {
  hideResultModal();
  showMenu();
});
ui.hintDismissBtn.addEventListener("click", dismissHint);
ui.hintCodexBtn.addEventListener("click", () => {
  const tab = state.activeHintTab;
  dismissHint();
  openCodex(tab);
});
ui.menuStartBtn.addEventListener("click", enterGame);
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

buildMenuLevelCards();
buildTowerCards();
updateSelectionPanel();
updateHud();
updateMenuMeta();
addLog(`${activeMap.name}: ${activeMap.desc}`);
wireOptionalImage(ui.menuLogo, ui.menuLogoFallback);
wireOptionalImage(ui.brandLogo, ui.brandLogoFallback);
requestAnimationFrame(gameLoop);
