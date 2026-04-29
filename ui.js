"use strict";

// Codex
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

function enemyAbility(typeId, enemy) {
  if (typeId === "shield") return `Armor ${enemy.armor}: ลดดาเมจที่รับ ยกเว้นกระสุนทะลุ armor`;
  if (typeId === "fork") return `Split: แตกเป็น ${enemy.split} ${enemyTypes[enemy.splitType].name} เมื่อตาย`;
  if (typeId === "regen") return `Regen ${enemy.regen}/sec: ฟื้นเลือดระหว่างเดิน`;
  if (typeId === "jammer") return `Jam aura: ลดความเร็วการยิง tower ในรัศมี ${enemy.jamRange}`;
  if (typeId === "boss") return "Boss: หลุดเข้า Core แล้วเสีย core life มากกว่าปกติ";
  if (typeId === "spark") return "Fast: วิ่งเร็ว เลือดน้อย ต้องมี tower ยิงถี่หรือ slow";
  if (typeId === "worm") return "Durable: ช้ากว่าแต่เลือดเยอะกว่า Bug";
  return "Basic: ศัตรูพื้นฐาน ใช้ทดสอบจุดยิงและ economy";
}

// Pause modal
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

// Result modal
function hideResultModal() {
  ui.resultModal.hidden = true;
}

function showResultModal(won, stars) {
  const bestScore = getBestScore(activeMap.id);
  const coreLeft = Math.max(0, state.lives);
  const isNewBest = state.score >= bestScore && state.score > 0;
  const topTowerId = Object.entries(state.analytics.towerDamage).sort((a, b) => b[1] - a[1])[0]?.[0] || "firewall";
  const topTowerDamage = state.analytics.towerDamage[topTowerId] || 0;
  const worstWaveEntry = Object.entries(state.analytics.leaksByWave).sort((a, b) => b[1] - a[1])[0];
  const leakSummary = worstWaveEntry
    ? `Wave ${worstWaveEntry[0]} หลุด ${worstWaveEntry[1]} ตัว / รวม ${state.analytics.leakCount}`
    : "กันได้ครบทุก wave";

  hidePauseModal();
  ui.resultKicker.textContent = won ? "Level Complete" : "Core Breached";
  ui.resultTitle.textContent = won ? "Victory" : "Defeat";
  ui.resultStars.textContent = renderStars(stars);
  ui.resultScore.textContent = formatNumber(state.score);
  ui.resultBest.textContent = formatNumber(bestScore);
  ui.resultCore.textContent = `${formatNumber(coreLeft)}/${formatNumber(activeMap.lives)}`;
  ui.resultWave.textContent = `${state.wave}/${MAX_WAVES}`;
  ui.resultTopTower.textContent = towerTypes[topTowerId].name;
  ui.resultTopDamage.textContent = formatNumber(topTowerDamage);
  ui.resultPeakCredits.textContent = formatNumber(state.analytics.peakCredits);
  ui.resultLeakSummary.textContent = leakSummary;
  ui.resultNote.textContent = won
    ? isNewBest
      ? "New best score!"
      : "ด่านผ่านแล้ว ลองทำสกอร์ให้สูงกว่าเดิม"
    : "ลองปรับตำแหน่ง tower และอัปเกรดสายให้เข้ากับศัตรูในด่าน";
  ui.resultModal.hidden = false;
}

// Toast and banners
function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  state.messageTimer = 1800;
}

function showWaveBanner(title, text, duration = 1800) {
  state.waveBannerTitle = title;
  state.waveBannerText = text;
  state.waveBannerTimer = duration;
}

function addScreenShake(amount) {
  state.screenShake = Math.max(state.screenShake, amount);
}

function addLog(message) {
  ui.log.textContent = message;
}

// Hints
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

// Menu
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

// Tower selection
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

// HUD
function updateHud() {
  state.analytics.peakCredits = Math.max(state.analytics.peakCredits, state.credits);
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

// Wave preview
function getWaveSummary(wave) {
  const spawns = buildWave(wave);
  const counts = spawns.reduce((acc, spawn) => {
    acc[spawn.type] = (acc[spawn.type] || 0) + 1;
    return acc;
  }, {});
  const order = ["bug", "spark", "worm", "shield", "fork", "regen", "jammer", "boss"];
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

// Selection panel
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
