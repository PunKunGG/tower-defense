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
