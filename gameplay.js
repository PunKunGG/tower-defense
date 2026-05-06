"use strict";

// Map
function applyMap(index) {
  state.mapIndex = index;
  activeMap = maps[index];
  paths = activeMap.pathCells.map(cellsToPath);
  pathSet = buildPathSet(activeMap.pathCells);
}

function getWaveCap() {
  return state.endlessMode ? Infinity : MAX_WAVES;
}

function getWaveLabelValue() {
  return state.endlessMode ? "∞" : String(MAX_WAVES);
}

function getRunModifierTotals() {
  return state.runModifiers.reduce(
    (acc, modifier) => {
      acc.speedMul *= modifier.speedMul || 1;
      acc.hpMul *= modifier.hpMul || 1;
      acc.rewardMul *= modifier.rewardMul || 1;
      acc.countBonus += modifier.countBonus || 0;
      acc.jammerWaveShift += modifier.jammerWaveShift || 0;
      return acc;
    },
    {
      speedMul: 1,
      hpMul: 1,
      rewardMul: 1,
      countBonus: 0,
      jammerWaveShift: 0,
    },
  );
}

function pickRunModifiers(seedValue, count = 1) {
  const rng = seededRandom(seedValue || Date.now());
  const pool = [...RUN_MODIFIER_POOL];
  const picks = [];
  const targetCount = Math.max(1, Math.min(count, pool.length));

  while (picks.length < targetCount && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }

  return picks;
}

function getDailyConfig() {
  const dayKey = getTodayKey();
  const seed = hashString(`daily:${dayKey}`);
  const rng = seededRandom(seed);
  const mapIndex = Math.floor(rng() * maps.length);
  const modifierCount = rng() > 0.55 ? 2 : 1;
  const modifiers = pickRunModifiers(seed ^ 0x9e3779b9, modifierCount);
  const loadout = Object.keys(towerTypes)
    .sort(() => rng() - 0.5)
    .slice(0, 3);

  return {
    dayKey,
    seed,
    mapIndex,
    modifiers,
    loadout,
  };
}

function applyRunSetup() {
  state.endlessMode = !!state.menuEndless;
  state.loadout = [...state.menuLoadout];
  state.dailyKey = null;

  if (state.dailyMode) {
    const daily = getDailyConfig();
    state.dailyKey = daily.dayKey;
    state.mapIndex = daily.mapIndex;
    state.menuSelectedIndex = daily.mapIndex;
    state.runSeed = daily.seed;
    state.runModifiers = daily.modifiers;
    state.loadout = daily.loadout;
    state.endlessMode = false;
    state.runAffix = null;
    return;
  }

  state.runSeed = Date.now();
  state.runModifiers = pickRunModifiers(state.runSeed, 1);
  
  // Pick random map affix
  const affixPool = [...MAP_AFFIX_POOL];
  if (affixPool.length > 0) {
    const affixIndex = Math.floor(seededRandom(state.runSeed ^ 0xDEADBEEF)() * affixPool.length);
    state.runAffix = affixPool[affixIndex];
    addLog(`Map Affix: ${state.runAffix.name} - ${state.runAffix.desc}`);
  } else {
    state.runAffix = null;
  }
}

function objectiveBasePool() {
  return [
    {
      id: "kill_spark",
      label: "กำจัด Spark",
      rarity: "normal",
      target: 12,
      rewardCredits: 40,
      rewardScore: 900,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && payload.enemyType === "spark";
      },
    },
    {
      id: "kill_shield",
      label: "กำจัด Shield",
      rarity: "normal",
      target: 10,
      rewardCredits: 45,
      rewardScore: 1000,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && payload.enemyType === "shield";
      },
    },
    {
      id: "kill_elite",
      label: "กำจัด Elite",
      rarity: "normal",
      target: 8,
      rewardCredits: 55,
      rewardScore: 1200,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && !!payload.elite;
      },
    },
    {
      id: "clear_waves",
      label: "เคลียร์ Wave ให้ไว",
      rarity: "normal",
      target: 4,
      rewardCredits: 50,
      rewardScore: 1100,
      matches(eventType) {
        return eventType === "wave_clear";
      },
    },
    {
      id: "no_leak_streak",
      label: "ห้ามมี Leak ต่อเนื่อง",
      rarity: "normal",
      target: 3,
      rewardCredits: 60,
      rewardScore: 1400,
      matches(eventType) {
        return eventType === "wave_clear";
      },
      usesStreak: true,
    },
  ];
}

function objectiveRarePool() {
  return [
    {
      id: "boss_hunter",
      label: "RARE: Boss Hunter",
      rarity: "rare",
      target: 2,
      rewardCredits: 110,
      rewardScore: 2800,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && payload.enemyType === "boss";
      },
    },
    {
      id: "jammer_breaker",
      label: "RARE: Jammer Breaker",
      rarity: "rare",
      target: 8,
      rewardCredits: 105,
      rewardScore: 2400,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && payload.enemyType === "jammer";
      },
    },
    {
      id: "perfect_chain",
      label: "RARE: Perfect Chain",
      rarity: "rare",
      target: 5,
      rewardCredits: 120,
      rewardScore: 3200,
      matches(eventType) {
        return eventType === "wave_clear";
      },
      usesStreak: true,
    },
  ];
}

function objectiveLegendaryPool() {
  return [
    {
      id: "legendary_boss_slayer",
      label: "LEGENDARY: Boss Slayer",
      rarity: "legendary",
      target: 4,
      rewardCredits: 220,
      rewardScore: 5200,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && payload.enemyType === "boss";
      },
    },
    {
      id: "legendary_elite_purge",
      label: "LEGENDARY: Elite Purge",
      rarity: "legendary",
      target: 18,
      rewardCredits: 210,
      rewardScore: 4800,
      matches(eventType, payload) {
        return eventType === "enemy_kill" && !!payload.elite;
      },
    },
    {
      id: "legendary_perfect_core",
      label: "LEGENDARY: Perfect Core",
      rarity: "legendary",
      target: 8,
      rewardCredits: 240,
      rewardScore: 6000,
      matches(eventType) {
        return eventType === "wave_clear";
      },
      usesStreak: true,
    },
  ];
}

function createRunObjectives() {
  const rng = seededRandom((state.runSeed || Date.now()) ^ hashString(`objective:${activeMap.id}`));
  const pool = objectiveBasePool().map((item) => ({ ...item, progress: 0 }));
  const rarePool = objectiveRarePool().map((item) => ({ ...item, progress: 0 }));
  const legendaryPool = objectiveLegendaryPool().map((item) => ({ ...item, progress: 0 }));
  const picks = [];
  const legendaryChance = 0.08;
  const rareChance = 0.35;

  if (legendaryPool.length > 0 && rng() < legendaryChance) {
    const legendaryIndex = Math.floor(rng() * legendaryPool.length);
    picks.push(legendaryPool.splice(legendaryIndex, 1)[0]);
  } else if (rarePool.length > 0 && rng() < rareChance) {
    const rareIndex = Math.floor(rng() * rarePool.length);
    picks.push(rarePool.splice(rareIndex, 1)[0]);
  }

  while (pool.length > 0 && picks.length < state.objectives.total) {
    const index = Math.floor(rng() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }

  state.objectives.queue = picks;
  state.objectives.completed = [];
  state.objectives.active = null;
  state.objectives.noLeakStreak = 0;
  activateNextObjective();
}

function activateNextObjective() {
  const next = state.objectives.queue.shift() || null;
  state.objectives.active = next;
  if (!next) {
    addLog("Mini Objective: ทำครบทุกภารกิจแล้ว");
    updateHud();
    return;
  }

  addLog(`Mini Objective: ${next.label} (${next.target})`);
  showToast(`Objective: ${next.label}`);
  updateHud();
}

function completeObjective(objective) {
  state.objectives.completed.push(objective.id);
  state.credits += objective.rewardCredits;
  state.score += objective.rewardScore;
  const rewardColor =
    objective.rarity === "legendary" ? "#8ce8ff" : objective.rarity === "rare" ? "#ffd166" : "#37e3a2";
  const rewardBurst = objective.rarity === "legendary" ? 30 : objective.rarity === "rare" ? 22 : 14;
  popParticles(canvas.width * 0.82, 54, rewardColor, rewardBurst);
  addLog(
    `Objective สำเร็จ${objective.rarity === "legendary" ? " [LEGENDARY]" : objective.rarity === "rare" ? " [RARE]" : ""}: ${objective.label} (+${objective.rewardCredits} credits / +${objective.rewardScore} score)`,
  );
  showToast(
    `${objective.rarity === "legendary" ? "LEGENDARY" : objective.rarity === "rare" ? "RARE" : "Objective"} complete +${objective.rewardCredits} credits`,
  );
  activateNextObjective();
  updateHud();
}

function updateMiniObjectives(eventType, payload = {}) {
  const objective = state.objectives?.active;
  if (!objective || state.gameOver) return;

  if (
    (objective.id === "no_leak_streak" || objective.id === "perfect_chain" || objective.id === "legendary_perfect_core") &&
    eventType === "wave_clear"
  ) {
    state.objectives.noLeakStreak = payload.noLeak ? state.objectives.noLeakStreak + 1 : 0;
    objective.progress = state.objectives.noLeakStreak;
    if (objective.progress >= objective.target) completeObjective(objective);
    else updateHud();
    return;
  }

  if (!objective.matches(eventType, payload)) return;
  objective.progress += 1;
  if (objective.progress >= objective.target) completeObjective(objective);
  else updateHud();
}

function isTowerAllowed(towerType) {
  return state.loadout.includes(towerType);
}

function recordAchievement(achievementId) {
  if (state.unlockedAchievements.includes(achievementId)) return;
  state.unlockedAchievements.push(achievementId);
  saveUnlockedAchievements(state.unlockedAchievements);
}

function evaluateRunAchievements(won) {
  if (state.analytics.leakCount === 0) recordAchievement("core_guardian");
  if (won && !state.runStats.usedCache) recordAchievement("no_cache");
  if (won && activeMap.id === "triport") recordAchievement("triport_winner");
  if (won && activeMap.id === "maze") recordAchievement("maze_winner");
  if (won && state.dailyMode) recordAchievement("daily_clear");
  if (state.endlessMode && state.wave >= 25) recordAchievement("endless_25");
}

function buildTowerSpentFromSpec(spec) {
  const base = towerTypes[spec.type]?.cost;
  if (!base) return 0;
  let spent = base;
  if (spec.level >= 2) spent += Math.round(base * (0.72 + 1 * 0.58));
  if (spec.level >= 3) spent += Math.round(base * (0.72 + 2 * 0.58));
  return spent;
}

function saveCurrentBuildPreset() {
  if (state.waveActive) {
    showToast("บันทึก build ได้เฉพาะช่วงเตรียมตัว");
    return;
  }

  const preset = {
    mapId: activeMap.id,
    loadout: [...state.loadout],
    towers: state.towers.map((tower) => ({
      type: tower.type,
      col: tower.col,
      row: tower.row,
      level: tower.level,
      branch: tower.branch,
      targetPriority: tower.targetPriority || "first",
    })),
  };

  const ok = saveBuildPreset(activeMap.id, preset);
  showToast(ok ? "บันทึก preset แล้ว" : "บันทึก preset ไม่สำเร็จ");
}

function loadCurrentBuildPreset() {
  if (state.waveActive) {
    showToast("โหลด build ได้เฉพาะช่วงเตรียมตัว");
    return;
  }

  const preset = loadBuildPreset(activeMap.id);
  if (!preset || !Array.isArray(preset.towers) || preset.towers.length === 0) {
    showToast("ยังไม่มี preset ของด่านนี้");
    return;
  }

  const invalid = preset.towers.some((tower) => !isTowerAllowed(tower.type) || isPath(tower.col, tower.row));
  if (invalid) {
    showToast("preset นี้ใช้กับ loadout ปัจจุบันไม่ได้");
    return;
  }

  let totalCost = 0;
  const occupied = new Set();
  for (const spec of preset.towers) {
    const key = `${spec.col},${spec.row}`;
    if (occupied.has(key)) {
      showToast("preset ซ้อนตำแหน่งกัน");
      return;
    }
    occupied.add(key);
    totalCost += buildTowerSpentFromSpec(spec);
  }

  if (totalCost > state.credits) {
    showToast(`credits ไม่พอ (ต้องใช้ ${formatNumber(totalCost)})`);
    return;
  }

  state.towers = [];
  state.credits -= totalCost;
  state.selectedTower = null;
  state.runStats.usedCache = false;

  preset.towers.forEach((spec) => {
    const center = cellCenter(spec.col, spec.row);
    state.towers.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      type: spec.type,
      col: spec.col,
      row: spec.row,
      x: center.x,
      y: center.y,
      level: Math.max(1, Math.min(3, spec.level || 1)),
      cooldown: 0,
      lastEarn: 0,
      spent: buildTowerSpentFromSpec(spec),
      branch: spec.level >= 3 ? spec.branch || null : null,
      pulse: 1,
      targetPriority: spec.targetPriority || "first",
      kills: 0,
      totalDamage: 0,
    });
    if (spec.type === "cache") state.runStats.usedCache = true;
  });

  popParticles(canvas.width * 0.5, canvas.height * 0.5, "#46a7ff", 26);
  buildTowerCards();
  updateSelectionPanel();
  updateHud();
  showToast("โหลด preset สำเร็จ");
}

function setSelectedTowerPriority(priority) {
  if (!TARGET_PRIORITIES[priority]) return;
  if (!state.selectedTower || state.selectedTower.type === "cache") return;
  state.selectedTower.targetPriority = priority;
  updateSelectionPanel();
}

// Tower stats and costs
function towerStats(tower) {
  const type = towerTypes[tower.type];
  const levelScale = 1 + (tower.level - 1) * 0.42;
  const mastery = getEffectiveTowerMastery(tower.type);
  const masteryLevel = mastery < 50 ? 0 : mastery < 200 ? 1 : mastery < 500 ? 2 : 3;
  const masteryBonus = 1 + masteryLevel * 0.01;
  
  let stats = {
    range: type.range + (tower.level - 1) * 13,
    damage: type.damage * levelScale * masteryBonus,
    cooldown: Math.max(150, type.cooldown * (1 - (tower.level - 1) * 0.12)),
    splash: type.splash ? type.splash + (tower.level - 1) * 12 : 0,
    slow: type.slow ? Math.max(0.25, type.slow - (tower.level - 1) * 0.06) : 0,
    slowTime: type.slowTime ? type.slowTime + (tower.level - 1) * 260 : 0,
    bypassArmor: false,
    dotDamage: 0,
    auraRange: 0,
  };

  // Apply cache income penalty from affix
  let cacheIncomeMultiplier = 1;
  if (tower.type === "cache" && state.runAffix?.id === "cache_drain") {
    cacheIncomeMultiplier = 0.8;
  }

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
  if (state.waveActive || state.gameOver || state.wave >= getWaveCap()) return;

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
  const modifierTotals = getRunModifierTotals();
  let count = Math.max(5, 7 + wave * 2 + activeMap.countBonus + modifierTotals.countBonus);
  let hpScale = (1 + wave * 0.16) * activeMap.hpScale * modifierTotals.hpMul;
  
  // Apply map affix effects
  const affix = state.runAffix;
  if (affix?.id === "enemy_swarm") count += 2;
  if (affix?.id === "crystal_armor") hpScale *= 1.05; // Extra armor gets applied to enemy
  if (affix?.id === "regen_power") hpScale *= 1.08; // Regen boost
  
  const gap = Math.max(220, 760 - wave * 18 + activeMap.gapBonus);
  const isSplitMap = activeMap.id === "split";
  const isTriportMap = activeMap.id === "triport";
  const isMazeMap = activeMap.id === "maze";
  const laneOffsetBase = isMazeMap ? 55 : isTriportMap ? 80 : isSplitMap ? 110 : 180;
  const syncEvery = isMazeMap ? 4 : isTriportMap ? 3 : isSplitMap ? 4 : 0;
  const mapPressureBoost = isMazeMap ? 0.12 : isTriportMap ? 0.08 : isSplitMap ? 0.04 : 0;
  let at = 0;

  const jammerWave = 14 + modifierTotals.jammerWaveShift;

  for (let i = 0; i < count; i += 1) {
    let type = "bug";
    if (wave >= 4 && i % 4 === 0) type = "spark";
    if (wave >= 6 && i % 5 === 2) type = "worm";
    if (wave >= 8 && i % 7 === 3) type = "shield";
    if (wave >= 10 && i % 6 === 1) type = "fork";
    if (wave >= 12 && i % 8 === 5) type = "regen";
    if (wave >= jammerWave && i % 9 === 2) type = "jammer";
    if (isSplitMap && wave >= 8 && i % 7 === 4) type = "shield";
    if (isSplitMap && wave >= 12 && i % 9 === 6) type = "jammer";
    if (isTriportMap && wave >= 7 && i % 5 === 1) type = "spark";
    if (isTriportMap && wave >= 11 && i % 7 === 4) type = "shield";
    if (isTriportMap && wave >= 10 && i % 6 === 2) type = "jammer";
    if (isMazeMap && wave >= 5 && i % 4 === 1) type = "spark";
    if (isMazeMap && wave >= 7 && i % 5 === 3) type = "shield";
    if (isMazeMap && wave >= 9 && i % 6 === 2) type = "fork";
    if (isMazeMap && wave >= 11 && i % 7 === 5) type = "regen";
    if (isMazeMap && wave >= 12 && i % 8 === 4) type = "jammer";
    const pathIndex = i % laneCount;
    const pressureScale = 1 + Math.floor(wave / 4) * mapPressureBoost;
    const spawnAt = at + pathIndex * laneOffsetBase;
    let eliteChance = 0.13;
    if (state.runAffix?.id === "spark_surge" && type === "spark") {
      eliteChance = 0.18; // More elite sparks with affix
    }
    const elite = type !== "boss" && Math.random() < eliteChance;
    spawns.push({ at: spawnAt, type, hpScale: hpScale * pressureScale, pathIndex, elite });

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
  const modifierTotals = getRunModifierTotals();
  const template = enemyTypes[spawn.type];
  const path = paths[spawn.pathIndex || 0];
  const start = path[0];
  const affix = state.runAffix;
  let speed = template.speed * (1 + Math.min(0.24, state.wave * 0.012)) * modifierTotals.speedMul;
  let armor = template.armor || 0;
  let regen = template.regen || 0;
  
  // Apply affix effects
  if (affix?.id === "spark_surge" && spawn.type === "spark") {
    speed *= 1.25;
  }
  if (affix?.id === "crystal_armor") {
    armor += 3;
  }
  if (affix?.id === "regen_power" && spawn.type === "regen") {
    regen *= 1.4;
  }
  
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
    speed: speed,
    reward: Math.round(template.reward * (1 + state.wave * 0.08) * activeMap.rewardScale * modifierTotals.rewardMul),
    radius: template.radius,
    color: template.color,
    armor: armor,
    regen: regen,
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
    elite: false,
  };

  if (spawn.elite) {
    enemy.maxHp = Math.round(enemy.maxHp * 1.5);
    enemy.hp = enemy.maxHp;
    enemy.speed *= 1.18;
    enemy.reward = Math.round(enemy.reward * 1.6);
    enemy.elite = true;
  }

  state.enemies.push(enemy);
}

// Tower placement and management
function placeTower(col, row) {
  const type = towerTypes[state.selectedTowerType];
  if (!type) {
    showToast("เลือกทาวเวอร์ก่อนวาง");
    return;
  }

  if (!isTowerAllowed(type.id)) {
    showToast("Tower นี้ไม่อยู่ใน loadout");
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
    targetPriority: "first",
    kills: 0,
    totalDamage: 0,
  };

  state.credits -= type.cost;
  state.towers.push(tower);
  if (type.id === "cache") state.runStats.usedCache = true;
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
    setHudTab("manage");
    buildTowerCards();
    updateSelectionPanel();
    showToast(`${towerTypes[existing.type].name} Lv.${existing.level}`);
    return;
  }

  state.selectedTower = null;
  if (!state.selectedTowerType) {
    setHudTab("towers");
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
    applyRunSetup();
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
    updateMiniObjectives("wave_clear", {
      noLeak: (state.analytics.leaksByWave[state.wave] || 0) === 0,
    });

    if (!state.endlessMode && state.wave >= getWaveCap()) {
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
  if (state.dailyMode && won && state.dailyKey) markDailyPlayed(state.dailyKey);
  evaluateRunAchievements(won);
  
  // Save mastery using run kill totals so sold towers are counted too.
  const mastery = { ...(state.towerMastery || getTowerMastery()) };
  Object.keys(state.analytics.towerKills || {}).forEach((type) => {
    mastery[type] = (mastery[type] || 0) + (state.analytics.towerKills[type] || 0);
  });
  state.towerMastery = mastery;
  saveTowerMastery(mastery);
  
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
  state.selectedTowerType = state.loadout[0] || "firewall";
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
  state.runStats = {
    usedCache: false,
  };
  state.objectives.rerollUsed = false;
  createRunObjectives();
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
