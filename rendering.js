"use strict";

// Update loop
function update(delta, now) {
  if (state.messageTimer > 0) {
    state.messageTimer -= delta;
    if (state.messageTimer <= 0) ui.toast.classList.remove("show");
  }
  if (state.waveBannerTimer > 0) state.waveBannerTimer = Math.max(0, state.waveBannerTimer - delta);
  if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - delta * 0.05);

  if (state.paused || state.gameOver) return;

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

// Enemy updates
function updateEnemies(delta, now) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - delta);
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
        state.analytics.leakCount += 1;
        state.analytics.leaksByWave[state.wave] =
          (state.analytics.leaksByWave[state.wave] || 0) + 1;
        shakeCore();
        addScreenShake(enemy.type === "boss" ? 16 : 10);
        showToast(enemy.type === "boss" ? "Boss เจาะ Core!" : "ศัตรูหลุดเข้า Core");
        if (state.lives <= 0) endGame(false);
      }
    } else {
      enemy.x += (dx / distance) * step;
      enemy.y += (dy / distance) * step;
    }
  }
}

// Tower updates
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

    tower.cooldown = stats.cooldown * getCooldownMultiplier(tower) * getJammerDebuff(tower);
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
    state.analytics.economyGenerated += amount;
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

function getJammerDebuff(tower) {
  let debuff = 1;

  state.enemies.forEach((enemy) => {
    if (enemy.type !== "jammer" || !enemy.jamRange) return;
    const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    if (distance <= enemy.jamRange) debuff = Math.max(debuff, enemy.jamSlow || 1);
  });

  return debuff;
}

function acquireTarget(tower, range) {
  const priority = tower.targetPriority || "first";
  let best = null;
  let bestValue = null;

  state.enemies.forEach((enemy) => {
    const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    if (distance > range) return;

    const progress = enemy.segment * CELL + enemy.progress;
    let candidate = progress;

    if (priority === "last") candidate = -progress;
    if (priority === "strong") candidate = enemy.hp;
    if (priority === "fast") candidate = enemy.speed;

    if (best === null || candidate > bestValue) {
      best = enemy;
      bestValue = candidate;
    }
  });

  return best;
}

function fireProjectile(tower, target, stats) {
  const type = towerTypes[tower.type];
  state.analytics.towerShots[tower.type] = (state.analytics.towerShots[tower.type] || 0) + 1;
  state.projectiles.push({
    x: tower.x,
    y: tower.y,
    target,
    towerType: tower.type,
    towerId: tower.id,
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

// Projectile updates
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

// Enemy damage
function hitEnemy(projectile, now) {
  const target = projectile.target;

  if (projectile.splash) {
    popImpactRing(target.x, target.y, projectile.color, projectile.splash * 0.35, 280);
    popParticles(target.x, target.y, projectile.color, 18);
    addScreenShake(projectile.towerType === "patch" ? 9 : 6);
    [...state.enemies].forEach((enemy) => {
      const distance = Math.hypot(enemy.x - target.x, enemy.y - target.y);
      if (distance <= projectile.splash) {
        damageEnemy(enemy, projectile.damage * (1 - distance / (projectile.splash * 1.8)), projectile);
      }
    });
  } else {
    popImpactRing(target.x, target.y, projectile.color, projectile.towerType === "cryo" ? 16 : 12, 180);
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

  const effectiveDamage = Math.max(0, Math.min(enemy.hp, finalDamage));
  if (projectile?.towerType && state.analytics.towerDamage[projectile.towerType] !== undefined) {
    state.analytics.towerDamage[projectile.towerType] += effectiveDamage;
  }
  if (projectile?.towerId) {
    const sourceTower = state.towers.find((t) => t.id === projectile.towerId);
    if (sourceTower) sourceTower.totalDamage = (sourceTower.totalDamage || 0) + effectiveDamage;
  }

  enemy.hp -= finalDamage;
  enemy.hitFlash = 120;
  if (enemy.hp > 0) return;

  const index = state.enemies.indexOf(enemy);
  if (index !== -1) state.enemies.splice(index, 1);

  if (projectile?.towerType) {
    state.analytics.towerKills[projectile.towerType] =
      (state.analytics.towerKills[projectile.towerType] || 0) + 1;
  }
  if (projectile?.towerId) {
    const sourceTower = state.towers.find((t) => t.id === projectile.towerId);
    if (sourceTower) sourceTower.kills = (sourceTower.kills || 0) + 1;
  }

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
  popImpactRing(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 34 : 20, enemy.type === "boss" ? 360 : 240);
  popParticles(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 34 : enemy.elite ? 24 : 14);
  if (enemy.elite) popParticles(enemy.x, enemy.y, "#ffd23c", 12);
  addScreenShake(enemy.type === "boss" ? 14 : projectile?.splash ? 7 : 4);
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
      jamRange: 0,
      jamSlow: 1,
      split: 0,
      splitType: null,
      fromSplit: true,
      slowUntil: 0,
      slowFactor: 1,
      dotUntil: 0,
      dotDamage: 0,
      hitFlash: 0,
    });
  }

  popParticles(enemy.x, enemy.y, enemy.color, 18);
}

// Particle updates
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

function popImpactRing(x, y, color, radius, life = 240) {
  state.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    color,
    size: radius,
    life,
    maxLife: life,
    kind: "ring",
  });
}

function shakeCore() {
  const core = getCorePoint();
  popParticles(core.x, core.y, "#ff6b6b", 24);
  updateHud();
}

// Drawing
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const shakeX = state.screenShake > 0 ? (Math.random() - 0.5) * state.screenShake : 0;
  const shakeY = state.screenShake > 0 ? (Math.random() - 0.5) * state.screenShake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
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
  ctx.restore();
  drawWaveBanner();
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
    const hitFlash = Math.max(0, (enemy.hitFlash || 0) / 120);

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Elite outer glow ring
    if (enemy.elite) {
      const t = (performance.now() / 400) % (Math.PI * 2);
      const glow = 0.55 + Math.sin(t) * 0.25;
      ctx.strokeStyle = `rgba(255, 210, 60, ${glow})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#ffd23c";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = hexToRgba(enemy.color, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.color;
    roundRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 6);
    ctx.fill();
    if (hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + hitFlash * 0.42})`;
      roundRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 6);
      ctx.fill();
    }
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

    if (enemy.type === "jammer") {
      ctx.strokeStyle = "rgba(167, 139, 250, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(167, 139, 250, 0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.jamRange, 0, Math.PI * 2);
      ctx.stroke();
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

    // Elite crown marker above health bar
    if (enemy.elite) {
      ctx.fillStyle = "#ffd23c";
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("★", 0, -enemy.radius - 20);
    }

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
    if (particle.kind === "ring") {
      const progress = 1 - particle.life / (particle.maxLife || 240);
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size + progress * 18, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
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

function drawWaveBanner() {
  if (state.waveBannerTimer <= 0) return;

  const progress = Math.min(1, state.waveBannerTimer / 1800);
  const intro = Math.min(1, (1800 - state.waveBannerTimer) / 220);
  const alpha = Math.min(intro, progress);
  const y = 96 - (1 - intro) * 18;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const width = Math.min(canvas.width - 120, 420);
  const left = canvas.width / 2 - width / 2;
  roundRect(left, y - 32, width, 78, 8);
  ctx.fillStyle = "rgba(8, 16, 20, 0.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(70, 167, 255, 0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#eef9f7";
  ctx.font = "900 28px system-ui";
  ctx.fillText(state.waveBannerTitle, canvas.width / 2, y - 6);
  ctx.fillStyle = "#9db4b2";
  ctx.font = "800 14px system-ui";
  ctx.fillText(state.waveBannerText, canvas.width / 2, y + 20);
  ctx.restore();
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
