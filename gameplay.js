"use strict";

// Map
function applyMap(index) {
  state.mapIndex = index;
  activeMap = maps[index];
  paths = activeMap.pathCells.map(cellsToPath);
  pathSet = buildPathSet(activeMap.pathCells);
}

// Tower stats and costs
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

// Wave management
function startWave() {
  if (state.menuOpen) return;
  if (state.paused) return;
  if (state.waveActive || state.gameOver || state.wave >= MAX_WAVES) return;

  state.wave += 1;
  state.waveActive = true;
  state.spawns = buildWave(state.wave);
  const hasBoss = state.spawns.some((spawn) => spawn.type === "boss");
  showWaveBanner(
    hasBoss ? `Boss Wave ${state.wave}` : `Wave ${state.wave}`,
    hasBoss ? "Kernel Panic inbound. Hold the core." : `Threats incoming across ${paths.length} lane${paths.length > 1 ? "s" : ""}.`,
    hasBoss ? 2400 : 1800,
  );
  addScreenShake(hasBoss ? 10 : 5);
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
    return;
  }
  if (types.has("jammer")) {
    showHint("jammer", "Jammer มาแล้ว", "Jammer จะลดความเร็วการยิงของ tower ในออร่า ควรรีบโฟกัสยิงก่อนเพื่อลดแรงกดดัน");
  }
}

function buildWave(wave) {
  const spawns = [];
  const laneCount = paths.length;
  const count = Math.max(5, 7 + wave * 2 + activeMap.countBonus);
  const hpScale = (1 + wave * 0.16) * activeMap.hpScale;
  const gap = Math.max(220, 760 - wave * 18 + activeMap.gapBonus);
  const isSplitMap = activeMap.id === "split";
  const isTriportMap = activeMap.id === "triport";
  const laneOffsetBase = isTriportMap ? 80 : isSplitMap ? 110 : 180;
  const syncEvery = isTriportMap ? 3 : isSplitMap ? 4 : 0;
  const mapPressureBoost = isTriportMap ? 0.08 : isSplitMap ? 0.04 : 0;
  let at = 0;

  for (let i = 0; i < count; i += 1) {
    let type = "bug";
    if (wave >= 4 && i % 4 === 0) type = "spark";
    if (wave >= 6 && i % 5 === 2) type = "worm";
    if (wave >= 8 && i % 7 === 3) type = "shield";
    if (wave >= 10 && i % 6 === 1) type = "fork";
    if (wave >= 12 && i % 8 === 5) type = "regen";
    if (wave >= 14 && i % 9 === 2) type = "jammer";
    if (isSplitMap && wave >= 8 && i % 7 === 4) type = "shield";
    if (isSplitMap && wave >= 12 && i % 9 === 6) type = "jammer";
    if (isTriportMap && wave >= 7 && i % 5 === 1) type = "spark";
    if (isTriportMap && wave >= 11 && i % 7 === 4) type = "shield";
    if (isTriportMap && wave >= 10 && i % 6 === 2) type = "jammer";
    const pathIndex = i % laneCount;
    const pressureScale = 1 + Math.floor(wave / 4) * mapPressureBoost;
    const spawnAt = at + pathIndex * laneOffsetBase;
    spawns.push({ at: spawnAt, type, hpScale: hpScale * pressureScale, pathIndex });

    if (laneCount > 1 && syncEvery && wave >= 5 && i % syncEvery === syncEvery - 1) {
      const burstType = wave >= 12 ? "fork" : wave >= 8 ? "worm" : "bug";
      for (let lane = 0; lane < laneCount; lane += 1) {
        spawns.push({
          at: at + lane * 45,
          type: burstType,
          hpScale: hpScale * (1.05 + Math.floor(wave / 5) * 0.03),
          pathIndex: lane,
        });
      }
    }

    at += gap;
  }

  if (isSplitMap && wave >= 6 && wave % 3 === 0) {
    spawns.push({ at: 520, type: "shield", hpScale: hpScale * 1.08, pathIndex: 0 });
    spawns.push({ at: 700, type: "shield", hpScale: hpScale * 1.08, pathIndex: 1 % laneCount });
  }

  if (isTriportMap && wave >= 7 && wave % 2 === 1) {
    for (let lane = 0; lane < laneCount; lane += 1) {
      spawns.push({ at: 440 + lane * 90, type: "spark", hpScale: hpScale * 1.12, pathIndex: lane });
    }
  }

  if (laneCount > 1 && wave >= 14 && [14, 17, 19].includes(wave)) {
    for (let lane = 0; lane < laneCount; lane += 1) {
      spawns.push({ at: 560 + lane * 60, type: "shield", hpScale: hpScale * 1.2, pathIndex: lane });
      spawns.push({ at: 680 + lane * 60, type: "regen", hpScale: hpScale * 1.18, pathIndex: lane });
      spawns.push({ at: 760 + lane * 60, type: "jammer", hpScale: hpScale * 1.12, pathIndex: lane });
    }
  }

  if (wave % 5 === 0) {
    const bossLane = Math.floor(wave / 5) % laneCount;
    spawns.push({
      at: at + 800,
      type: "boss",
      hpScale: (0.82 + wave * 0.18) * activeMap.hpScale,
      pathIndex: bossLane,
    });

    if (laneCount > 1) {
      for (let lane = 0; lane < laneCount; lane += 1) {
        if (lane === bossLane) continue;
        spawns.push({
          at: at + 620 + lane * 80,
          type: wave >= 10 ? "regen" : "shield",
          hpScale: hpScale * (1.08 + wave * 0.005),
          pathIndex: lane,
        });
      }
    }
  }

  spawns.sort((a, b) => a.at - b.at);
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
    jamRange: template.jamRange || 0,
    jamSlow: template.jamSlow || 1,
    split: template.split || 0,
    splitType: template.splitType || null,
    fromSplit: false,
    slowUntil: 0,
    slowFactor: 1,
    dotUntil: 0,
    dotDamage: 0,
    hitFlash: 0,
  };
  state.enemies.push(enemy);
}

// Tower placement and management
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

// Input handling
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

// Game state
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
  state.waveBannerTimer = 0;
  state.waveBannerTitle = "";
  state.waveBannerText = "";
  state.screenShake = 0;
  state.analytics = initAnalytics();
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
