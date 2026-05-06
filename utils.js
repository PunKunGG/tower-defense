"use strict";

// Number formatting
function formatNumber(value) {
  return Math.floor(value).toLocaleString("en-US");
}

// LocalStorage keys
function bestScoreKey(mapId) {
  return `byte-defense.best-score.${mapId}`;
}

function bestStarsKey(mapId) {
  return `byte-defense.best-stars.${mapId}`;
}

function hintSeenKey(id) {
  return `byte-defense.hint.${id}`;
}

function achievementsKey() {
  return "byte-defense.achievements";
}

function towerMasteryKey() {
  return "byte-defense.tower-mastery";
}

function buildPresetKey(mapId) {
  return `byte-defense.build.${mapId}`;
}

function loadoutKey() {
  return "byte-defense.loadout";
}

function dailyPlayedKey(dayKey) {
  return `byte-defense.daily-played.${dayKey}`;
}

// LocalStorage retrieval
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

function getJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function getUnlockedAchievements() {
  return getJson(achievementsKey(), []);
}

function saveUnlockedAchievements(ids) {
  return setJson(achievementsKey(), ids);
}

function loadBuildPreset(mapId) {
  return getJson(buildPresetKey(mapId), null);
}

function saveBuildPreset(mapId, preset) {
  return setJson(buildPresetKey(mapId), preset);
}

function getSavedLoadout() {
  return getJson(loadoutKey(), null);
}

function saveLoadout(loadout) {
  return setJson(loadoutKey(), loadout);
}

function getTowerMastery() {
  const defaults = { firewall: 0, patch: 0, cryo: 0, cache: 0 };
  return getJson(towerMasteryKey(), defaults);
}

function saveTowerMastery(mastery) {
  setJson(towerMasteryKey(), mastery);
}

function getEffectiveTowerMastery(type) {
  const stored = state?.towerMastery?.[type] || 0;
  const runKills = state?.analytics?.towerKills?.[type] || 0;
  return stored + runKills;
}

function markDailyPlayed(dayKey) {
  try {
    localStorage.setItem(dailyPlayedKey(dayKey), "1");
  } catch {
    // Ignore storage errors.
  }
}

function hasPlayedDaily(dayKey) {
  try {
    return localStorage.getItem(dailyPlayedKey(dayKey)) === "1";
  } catch {
    return false;
  }
}

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let stateSeed = seed || 1;
  return () => {
    stateSeed ^= stateSeed << 13;
    stateSeed ^= stateSeed >>> 17;
    stateSeed ^= stateSeed << 5;
    return ((stateSeed >>> 0) % 1000000) / 1000000;
  };
}

// Star calculations
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

// Image loading
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

// Map utilities
function mapMetaText(map) {
  const lanes = map.pathCells.length === 1 ? "1 lane" : `${map.pathCells.length} lanes`;
  return `${map.difficulty} / ${lanes} / Core ${map.lives} / Credits ${map.credits}`;
}

// Grid utilities
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

// Canvas utilities
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
