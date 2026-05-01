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
  menuLoadout: document.querySelector("#menuLoadout"),
  endlessToggle: document.querySelector("#endlessToggle"),
  dailyChallengeBtn: document.querySelector("#dailyChallengeBtn"),
  dailyMeta: document.querySelector("#dailyMeta"),
  menuLogo: document.querySelector("#menuLogo"),
  menuLogoFallback: document.querySelector("#menuLogoFallback"),
  towerList: document.querySelector("#towerList"),
  wavePreview: document.querySelector("#wavePreview"),
  objectivePanel: document.querySelector("#objectivePanel"),
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
  resultTopTower: document.querySelector("#resultTopTower"),
  resultTopDamage: document.querySelector("#resultTopDamage"),
  resultPeakCredits: document.querySelector("#resultPeakCredits"),
  resultLeakSummary: document.querySelector("#resultLeakSummary"),
  resultBadges: document.querySelector("#resultBadges"),
  resultTotalKills: document.querySelector("#resultTotalKills"),
  resultTotalShots: document.querySelector("#resultTotalShots"),
  resultEconomy: document.querySelector("#resultEconomy"),
  resultModifiers: document.querySelector("#resultModifiers"),
  resultReplayBtn: document.querySelector("#resultReplayBtn"),
  resultMenuBtn: document.querySelector("#resultMenuBtn"),
  hintPanel: document.querySelector("#hintPanel"),
  hintTitle: document.querySelector("#hintTitle"),
  hintText: document.querySelector("#hintText"),
  hintCodexBtn: document.querySelector("#hintCodexBtn"),
  hintDismissBtn: document.querySelector("#hintDismissBtn"),
  brandLogo: document.querySelector("#brandLogo"),
  brandLogoFallback: document.querySelector("#brandLogoFallback"),
  hudTabs: document.querySelector("#hudTabs"),
  selectedTitle: document.querySelector("#selectedTitle"),
  selectedText: document.querySelector("#selectedText"),
  selectedPanel: document.querySelector("#selectedPanel"),
  branchActions: document.querySelector("#branchActions"),
  branchABtn: document.querySelector("#branchABtn"),
  branchBBtn: document.querySelector("#branchBBtn"),
  upgradeBtn: document.querySelector("#upgradeBtn"),
  sellBtn: document.querySelector("#sellBtn"),
  targetingControls: document.querySelector("#targetingControls"),
  targetingActions: document.querySelector("#targetingActions"),
  saveBuildBtn: document.querySelector("#saveBuildBtn"),
  loadBuildBtn: document.querySelector("#loadBuildBtn"),
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

const TARGET_PRIORITIES = {
  first: "First",
  last: "Last",
  strong: "Strong",
  fast: "Fast",
};

const RUN_MODIFIER_POOL = [
  {
    id: "haste",
    name: "Haste Nodes",
    desc: "Enemy speed +15%",
    speedMul: 1.15,
  },
  {
    id: "fortified",
    name: "Fortified Packets",
    desc: "Enemy HP +22%",
    hpMul: 1.22,
  },
  {
    id: "swarm",
    name: "Swarm Burst",
    desc: "Each wave gains +3 enemies",
    countBonus: 3,
  },
  {
    id: "ration",
    name: "Credit Drought",
    desc: "Enemy reward -12%",
    rewardMul: 0.88,
  },
  {
    id: "jamstorm",
    name: "Jam Storm",
    desc: "Jammer appears 3 waves earlier",
    jammerWaveShift: -3,
  },
];

const MAP_AFFIX_POOL = [
  {
    id: "spark_surge",
    name: "Spark Surge",
    desc: "Spark enemies +25% speed",
    apply: (state) => { state.runAffix = this; },
  },
  {
    id: "cache_drain",
    name: "Cache Drain",
    desc: "Cache tower income -20%",
    apply: (state) => { state.runAffix = this; },
  },
  {
    id: "enemy_swarm",
    name: "Enemy Swarm",
    desc: "Each wave +2 enemies",
    apply: (state) => { state.runAffix = this; },
  },
  {
    id: "crystal_armor",
    name: "Crystal Armor",
    desc: "All enemies +3 armor",
    apply: (state) => { state.runAffix = this; },
  },
  {
    id: "regen_power",
    name: "Regen Power",
    desc: "Regen enemies +40% HP regen rate",
    apply: (state) => { state.runAffix = this; },
  },
];

const ACHIEVEMENTS = [
  {
    id: "core_guardian",
    name: "Core Guardian",
    desc: "Clear a run without any leak",
  },
  {
    id: "no_cache",
    name: "No Cache Economy",
    desc: "Win without placing Cache towers",
  },
  {
    id: "triport_winner",
    name: "Triport Winner",
    desc: "Win on Triport Breach",
  },
  {
    id: "daily_clear",
    name: "Daily Defender",
    desc: "Clear the Daily Challenge",
  },
  {
    id: "endless_25",
    name: "Beyond Twenty",
    desc: "Reach wave 25 in Endless mode",
  },
  {
    id: "maze_winner",
    name: "Maze Runner",
    desc: "Win on Maze Grid",
  },
];

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
    desc: "สองทางวิ่งขนานแล้วบีบเข้าปลายทางพร้อมกัน",
    credits: 155,
    lives: 20,
    hpScale: 1.04,
    countBonus: 3,
    gapBonus: -20,
    rewardScale: 0.98,
    pathCells: [
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [3, 3],
        [4, 3],
        [5, 3],
        [6, 3],
        [7, 3],
        [8, 3],
        [9, 3],
        [10, 3],
        [11, 3],
        [11, 5],
        [12, 5],
        [13, 5],
        [13, 6],
      ],
      [
        [0, 6],
        [1, 6],
        [2, 6],
        [3, 6],
        [3, 5],
        [4, 5],
        [5, 5],
        [6, 5],
        [7, 5],
        [8, 5],
        [9, 5],
        [10, 5],
        [11, 5],
        [12, 5],
        [13, 5],
        [13, 6],
      ],
    ],
  },
  {
    id: "triport",
    name: "Triport Breach",
    difficulty: "Hard",
    desc: "สามทางบุกพร้อมกันและรวมเฉพาะปลายทาง ใกล้ Core",
    credits: 130,
    lives: 15,
    hpScale: 1.2,
    countBonus: 6,
    gapBonus: -90,
    rewardScale: 0.9,
    pathCells: [
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [6, 2],
        [7, 2],
        [8, 2],
        [9, 2],
        [10, 2],
        [11, 2],
        [12, 2],
        [12, 3],
        [13, 3],
        [13, 4],
        [13, 5],
      ],
      [
        [0, 4],
        [1, 4],
        [2, 4],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 4],
        [7, 4],
        [8, 4],
        [9, 4],
        [10, 4],
        [11, 4],
        [12, 4],
        [12, 5],
        [13, 5],
      ],
      [
        [0, 7],
        [1, 7],
        [2, 7],
        [3, 7],
        [4, 7],
        [5, 7],
        [6, 7],
        [6, 6],
        [7, 6],
        [8, 6],
        [9, 6],
        [10, 6],
        [11, 6],
        [12, 6],
        [12, 7],
        [13, 7],
        [13, 6],
        [13, 5],
      ],
    ],
  },
  {
    id: "maze",
    name: "Maze Grid",
    difficulty: "Expert",
    desc: "สี่เลน ซิกแซกคนละพื้นที่ รวมกันที่ Core ขวา — วาง tower ให้ครอบหลายเลนพร้อมกัน",
    credits: 115,
    lives: 12,
    hpScale: 1.35,
    countBonus: 8,
    gapBonus: -120,
    rewardScale: 0.88,
    pathCells: [
      // Lane 1 — top zigzag (rows 0-1)
      [
        [0, 0], [1, 0], [2, 0], [3, 0],
        [3, 1], [4, 1], [5, 1], [6, 1],
        [6, 0], [7, 0], [8, 0], [9, 0], [10, 0],
        [10, 1], [11, 1], [12, 1], [13, 1],
        [13, 2], [13, 3], [13, 4],
      ],
      // Lane 2 — upper-mid zigzag (rows 2-3)
      [
        [0, 3], [1, 3], [2, 3],
        [2, 2], [3, 2], [4, 2], [5, 2],
        [5, 3], [6, 3], [7, 3], [8, 3],
        [8, 2], [9, 2], [10, 2], [11, 2],
        [11, 3], [12, 3], [12, 4], [13, 4],
      ],
      // Lane 3 — lower-mid zigzag (rows 5-6)
      [
        [0, 5], [1, 5], [2, 5],
        [2, 6], [3, 6], [4, 6], [5, 6],
        [5, 5], [6, 5], [7, 5], [8, 5],
        [8, 6], [9, 6], [10, 6], [11, 6],
        [11, 5], [12, 5], [13, 5], [13, 4],
      ],
      // Lane 4 — bottom zigzag (rows 7-8)
      [
        [0, 8], [1, 8], [2, 8], [3, 8],
        [3, 7], [4, 7], [5, 7], [6, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8],
        [10, 7], [11, 7], [12, 7], [13, 7],
        [13, 6], [13, 5], [13, 4],
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
  jammer: {
    name: "Jammer",
    color: "#a78bfa",
    hp: 90,
    speed: 48,
    reward: 18,
    radius: 16,
    jamRange: 150,
    jamSlow: 1.33,
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
