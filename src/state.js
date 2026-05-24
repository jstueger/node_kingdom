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
    mining: {
      label: 'Mining',
      desc: 'Unlocks Iron Mines for the first ore production chain.',
      visibleWhen: { lifetimeEarned: { gold: 8 } },
      requires: ['market_access'],
      cost: { gold: 8, wood: 5 },
      unlocks: { buildings: ['iron_mine'] },
      bought: false
    },
    woodworking: {
      label: 'Woodworking',
      desc: 'Unlocks Sawmills so wood can be processed into planks.',
      visibleWhen: { lifetimeEarned: { gold: 12 }, lifetimeProduced: { wood: 12 } },
      requires: ['market_access'],
      cost: { gold: 10, wood: 8 },
      unlocks: { buildings: ['sawmill'] },
      bought: false
    },
    smelting: {
      label: 'Smelting',
      desc: 'Unlocks Forges for turning ore and fuel into metal bars.',
      visibleWhen: { lifetimeProduced: { iron_ore: 6 } },
      requires: ['mining'],
      cost: { gold: 12, iron_ore: 6, wood: 4 },
      unlocks: { buildings: ['forge'] },
      bought: false
    },
    coal_processing: {
      label: 'Coal Processing',
      desc: 'Unlocks Coal Mines for hotter, stronger metal production.',
      visibleWhen: { lifetimeProduced: { iron_bar: 1 } },
      requires: ['smelting'],
      cost: { gold: 15, iron_bar: 1 },
      unlocks: { buildings: ['coal_mine'] },
      bought: false
    },
    blacksmithing: {
      label: 'Blacksmithing',
      desc: 'Unlocks Blacksmiths for finished goods and stronger trade value.',
      visibleWhen: { lifetimeProduced: { plank: 3, iron_bar: 2 } },
      requires: ['woodworking', 'smelting'],
      cost: { gold: 25, plank: 3, iron_bar: 2 },
      unlocks: { buildings: ['blacksmith'] },
      bought: false
    },
    grid_expansion: {
      label: 'Grid Expansion',
      desc: 'Adds 16 columns and 8 rows to the build grid.',
      visibleWhen: { lifetimeEarned: { gold: 25 } },
      requires: ['market_access'],
      cost: { gold: 50 },
      unlocks: {},
      bought: false
    },
    storage_bins: {
      label: 'Storage Bins',
      desc: 'Adds 5 storage capacity to every resource slot.',
      visibleWhen: { lifetimeProduced: { wood: 12 } },
      requires: ['market_access'],
      cost: { gold: 20, wood: 10 },
      unlocks: {},
      bought: false
    },
    workshop_tuning: {
      label: 'Workshop Tuning',
      desc: 'Crafters need 2 fewer work clicks per action.',
      visibleWhen: { unlockedBuildings: ['sawmill'] },
      requires: ['woodworking'],
      cost: { gold: 60 },
      unlocks: {},
      bought: false
    },
    market_bargaining: {
      label: 'Market Bargaining',
      desc: 'Markets earn 25% more gold from every sale.',
      visibleWhen: { lifetimeEarned: { gold: 40 }, unlockedBuildings: ['market'] },
      requires: ['market_access', 'woodworking'],
      cost: { gold: 50, plank: 2 },
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
