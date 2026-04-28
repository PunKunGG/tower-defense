"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  credits: document.querySelector("#credits"),
  lives: document.querySelector("#lives"),
  wave: document.querySelector("#wave"),
  score: document.querySelector("#score"),
  towerList: document.querySelector("#towerList"),
  brandLogo: document.querySelector("#brandLogo"),
  brandLogoFallback: document.querySelector("#brandLogoFallback"),
  selectedTitle: document.querySelector("#selectedTitle"),
  selectedText: document.querySelector("#selectedText"),
  selectedPanel: document.querySelector("#selectedPanel"),
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

function buildPathSet(pathGroups) {
  return new Set(pathGroups.flat().map(([col, row]) => `${col},${row}`));
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
  credits: 150,
  lives: 20,
  wave: 0,
  score: 0,
  selectedTowerType: "firewall",
  selectedTower: null,
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  floaters: [],
  spawns: [],
  waveActive: false,
  paused: false,
  speed: 1,
  gameOver: false,
  won: false,
  lastTime: 0,
  mouse: { x: -1000, y: -1000, col: -1, row: -1 },
  messageTimer: 0,
};

function formatNumber(value) {
  return Math.floor(value).toLocaleString("en-US");
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  state.messageTimer = 1800;
}

function addLog(message) {
  ui.log.textContent = message;
}

function cellCenter(col, row) {
  return {
    x: col * CELL + CELL / 2,
    y: row * CELL + CELL / 2,
  };
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
  ui.startWaveBtn.disabled = state.waveActive || (!state.gameOver && state.wave >= MAX_WAVES);
}

function towerStats(tower) {
  const type = towerTypes[tower.type];
  const levelScale = 1 + (tower.level - 1) * 0.42;
  return {
    range: type.range + (tower.level - 1) * 13,
    damage: type.damage * levelScale,
    cooldown: Math.max(150, type.cooldown * (1 - (tower.level - 1) * 0.12)),
    splash: type.splash ? type.splash + (tower.level - 1) * 12 : 0,
    slow: type.slow ? Math.max(0.25, type.slow - (tower.level - 1) * 0.06) : 0,
    slowTime: type.slowTime ? type.slowTime + (tower.level - 1) * 260 : 0,
  };
}

function upgradeCost(tower) {
  const base = towerTypes[tower.type].cost;
  return Math.round(base * (0.72 + tower.level * 0.58));
}

function sellValue(tower) {
  return Math.floor(tower.spent * 0.62);
}

function updateSelectionPanel() {
  const selected = state.selectedTower;
  ui.upgradeBtn.disabled = true;
  ui.sellBtn.disabled = true;

  if (selected) {
    const type = towerTypes[selected.type];
    const stats = towerStats(selected);
    const upgradeText =
      selected.level >= 3 ? "เต็มเลเวลแล้ว" : `อัปเกรด ${upgradeCost(selected)} credits`;
    ui.selectedTitle.textContent = `${type.name} Lv.${selected.level}`;
    ui.selectedText.textContent =
      selected.type === "cache"
        ? `${upgradeText}. สร้าง credits ทุกไม่กี่วินาที ขายได้ ${sellValue(selected)}.`
        : `${upgradeText}. Damage ${Math.round(stats.damage)}, Range ${Math.round(stats.range)}, ขายได้ ${sellValue(selected)}.`;
    ui.upgradeBtn.disabled =
      selected.level >= 3 || state.credits < upgradeCost(selected) || state.gameOver;
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
  if (state.waveActive || state.gameOver || state.wave >= MAX_WAVES) return;

  state.wave += 1;
  state.waveActive = true;
  state.spawns = buildWave(state.wave);
  addLog(`Wave ${state.wave} เริ่มแล้ว`);
  showToast(`Wave ${state.wave}`);
  updateHud();
}

function buildWave(wave) {
  const spawns = [];
  const count = 7 + wave * 2;
  const hpScale = 1 + wave * 0.16;
  let at = 0;

  for (let i = 0; i < count; i += 1) {
    let type = "bug";
    if (wave >= 4 && i % 4 === 0) type = "spark";
    if (wave >= 6 && i % 5 === 2) type = "worm";
    spawns.push({ at, type, hpScale });
    at += Math.max(260, 760 - wave * 18);
  }

  if (wave % 5 === 0) {
    spawns.push({ at: at + 800, type: "boss", hpScale: 0.82 + wave * 0.18 });
  }

  return spawns;
}

function spawnEnemy(spawn) {
  const template = enemyTypes[spawn.type];
  const start = path[0];
  const enemy = {
    type: spawn.type,
    name: template.name,
    x: start.x - CELL,
    y: start.y,
    segment: 0,
    progress: 0,
    maxHp: template.hp * spawn.hpScale,
    hp: template.hp * spawn.hpScale,
    speed: template.speed * (1 + Math.min(0.24, state.wave * 0.012)),
    reward: Math.round(template.reward * (1 + state.wave * 0.08)),
    radius: template.radius,
    color: template.color,
    slowUntil: 0,
    slowFactor: 1,
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

    tower.cooldown = stats.cooldown;
    fireProjectile(tower, target, stats);
  });
}

function updateCacheTower(tower, now) {
  const earnDelay = 6100 - tower.level * 700;
  if (!tower.lastEarn) tower.lastEarn = now;
  if (state.waveActive && now - tower.lastEarn >= earnDelay) {
    const amount = 7 + tower.level * 4;
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

function acquireTarget(tower, range) {
  let best = null;
  let bestProgress = -1;

  state.enemies.forEach((enemy) => {
    const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    const progress = enemy.segment * CELL + Math.hypot(enemy.x - path[0].x, enemy.y - path[0].y);
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
        damageEnemy(enemy, projectile.damage * (1 - distance / (projectile.splash * 1.8)));
      }
    });
  } else {
    damageEnemy(target, projectile.damage);
    popParticles(target.x, target.y, projectile.color, 8);
  }

  if (projectile.slow && state.enemies.includes(target)) {
    target.slowUntil = now + projectile.slowTime;
    target.slowFactor = projectile.slow;
  }
}

function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  if (enemy.hp > 0) return;

  const index = state.enemies.indexOf(enemy);
  if (index !== -1) state.enemies.splice(index, 1);

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
  popParticles(path[path.length - 1].x, path[path.length - 1].y, "#ff6b6b", 24);
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
  state.gameOver = true;
  state.won = won;
  state.waveActive = false;
  state.spawns = [];
  addLog(won ? "Core ปลอดภัย คุณชนะแล้ว" : "Core ล่ม ลองวางทาวเวอร์ให้บีบเส้นทางยิงมากขึ้น");
  showToast(won ? "Victory" : "Game Over");
  updateHud();
}

function restart() {
  state.credits = 150;
  state.lives = 20;
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
  buildTowerCards();
  updateSelectionPanel();
  updateHud();
  addLog("พร้อมแล้ว เลือกทาวเวอร์แล้ววางข้างเส้นทาง");
  showToast("เริ่มใหม่แล้ว");
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

  ctx.beginPath();
  ctx.moveTo(path[0].x - CELL, path[0].y);
  path.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = "rgba(41, 73, 82, 0.98)";
  ctx.lineWidth = 56;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(path[0].x - CELL, path[0].y);
  path.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = "rgba(55, 227, 162, 0.22)";
  ctx.lineWidth = 32;
  ctx.stroke();

  ctx.setLineDash([16, 18]);
  ctx.lineDashOffset = -performance.now() / 40;
  ctx.beginPath();
  ctx.moveTo(path[0].x - CELL, path[0].y);
  path.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = "rgba(189, 255, 232, 0.4)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawCore() {
  const core = path[path.length - 1];
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
  if (!stats.range) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI * 2);
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
    ctx.fillText(`L${tower.level}`, 0, 36);
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
  const subtitle = state.gameOver ? "กด Start Wave เพื่อเริ่มรอบใหม่" : "กด Resume เพื่อเล่นต่อ";
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
ui.startWaveBtn.addEventListener("click", () => {
  if (state.gameOver) {
    restart();
    return;
  }
  startWave();
});
ui.pauseBtn.addEventListener("click", () => {
  if (state.gameOver) return;
  state.paused = !state.paused;
  updateHud();
});
ui.speedBtn.addEventListener("click", () => {
  state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
  updateHud();
});

window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    if (state.gameOver) restart();
    else startWave();
  }
  if (event.key.toLowerCase() === "p") {
    state.paused = !state.paused;
    updateHud();
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

buildTowerCards();
updateSelectionPanel();
updateHud();
addLog("พร้อมแล้ว เลือกทาวเวอร์แล้ววางข้างเส้นทาง");
ui.brandLogo.addEventListener("load", () => {
  ui.brandLogoFallback.hidden = true;
});
ui.brandLogo.addEventListener("error", () => {
  ui.brandLogo.remove();
  ui.brandLogoFallback.hidden = false;
});
requestAnimationFrame(gameLoop);
