import { COLS, ROWS, STARTING_GOLD } from './data.js';

export function createGrid(cols, rows) {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

export function createTechs() {
  return {
    market_access: {
      label: 'Market Access',
      desc: 'Unlocks Markets so stocked goods can be sold for gold.',
      visibleWhen: { lifetimeProduced: { wood: 5 } },
      cost: { wood: 5 },
      unlocks: { buildings: ['market'] },
      bought: false
    },
    grid_expansion: {
      label: 'Grid Expansion',
      desc: 'Adds 16 columns and 8 rows to the build grid.',
      visibleWhen: {},
      cost: { gold: 50 },
      unlocks: {},
      bought: false
    },
    storage_bins: {
      label: 'Storage Bins',
      desc: 'Adds 5 storage capacity to every resource slot.',
      visibleWhen: {},
      cost: { gold: 35 },
      unlocks: {},
      bought: false
    },
    workshop_tuning: {
      label: 'Workshop Tuning',
      desc: 'Crafters need 2 fewer work clicks per action.',
      visibleWhen: { unlockedBuildings: ['sawmill'] },
      cost: { gold: 60 },
      unlocks: {},
      bought: false
    },
    market_bargaining: {
      label: 'Market Bargaining',
      desc: 'Markets earn 25% more gold from every sale.',
      visibleWhen: { unlockedBuildings: ['market'] },
      cost: { gold: 75 },
      unlocks: {},
      bought: false
    }
  };
}

export function createStats() {
  return {
    lifetimeProduced: {},
    lifetimeSold: {},
    lifetimeEarned: { gold: 0 }
  };
}

export function createUnlockedBuildings() {
  return { lumber: true };
}

export function createInteractionState() {
  return {
    pan: null,
    moving: null,
    placementDrag: null,
    movingInvalid: false,
    suppressNextSidebarClick: false,
    suppressNextGridClick: false
  };
}

export const state = {
  nextId: 1,
  gold: STARTING_GOLD,
  ticks: 0,
  selectedId: null,
  mode: 'idle',
  placeType: null,
  connFrom: null,
  connections: [],
  stats: createStats(),
  unlockedBuildings: createUnlockedBuildings(),
  world: { cols: COLS, rows: ROWS },
  camera: {
    zoom: 1,
    panOffset: { x: 0, y: 0 }
  },
  clock: {
    lastTickAt: 0
  },
  interaction: createInteractionState(),
  buildings: new Map(),
  grid: createGrid(COLS, ROWS),
  techs: createTechs()
};
