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
      cost: { gold: 5, wood: 5 },
      unlocks: { buildings: ['iron_mine'] },
      bought: false
    },
    woodworking: {
      label: 'Woodworking',
      desc: 'Unlocks Sawmills so wood can be processed into planks.',
      visibleWhen: { lifetimeEarned: { gold: 10 }, lifetimeProduced: { wood: 12 } },
      requires: ['market_access'],
      cost: { gold: 6, wood: 8 },
      unlocks: { buildings: ['sawmill'] },
      bought: false
    },
    smelting: {
      label: 'Smelting',
      desc: 'Unlocks Forges for turning ore and fuel into metal bars.',
      visibleWhen: { lifetimeProduced: { iron_ore: 6 } },
      requires: ['mining'],
      cost: { gold: 8, iron_ore: 6, wood: 3 },
      unlocks: { buildings: ['forge'] },
      bought: false
    },
    coal_processing: {
      label: 'Coal Processing',
      desc: 'Unlocks Coal Mines for hotter, stronger metal production.',
      visibleWhen: { lifetimeProduced: { iron_bar: 1 } },
      requires: ['smelting'],
      cost: { gold: 10, iron_bar: 1 },
      unlocks: { buildings: ['coal_mine'] },
      bought: false
    },
    blacksmithing: {
      label: 'Blacksmithing',
      desc: 'Unlocks Blacksmiths for finished goods and stronger trade value.',
      visibleWhen: { lifetimeProduced: { plank: 3, iron_bar: 2 } },
      requires: ['woodworking', 'smelting'],
      cost: { gold: 15, plank: 3, iron_bar: 2 },
      unlocks: { buildings: ['blacksmith'] },
      bought: false
    },
    knowledge_production: {
      tree: 'science',
      label: 'Knowledge Production',
      desc: 'Unlocks Schools so the kingdom can turn wealth into knowledge.',
      visibleWhen: { lifetimeProduced: { sword: 1 }, lifetimeEarned: { gold: 60 } },
      requires: ['blacksmithing'],
      cost: { gold: 25, plank: 3, sword: 1 },
      unlocks: { buildings: ['school'] },
      bought: false
    },
    basic_accounting: {
      tree: 'science',
      label: 'Basic Accounting',
      desc: 'Markets need 2 fewer work clicks to complete a sale.',
      visibleWhen: { lifetimeProduced: { knowledge: 5 } },
      requires: ['knowledge_production'],
      cost: { knowledge: 5 },
      unlocks: {},
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
      cost: { gold: 12, wood: 8 },
      unlocks: {},
      bought: false
    },
    workshop_tuning: {
      label: 'Workshop Tuning',
      desc: 'Crafters need 2 fewer work clicks per action.',
      visibleWhen: { unlockedBuildings: ['sawmill'] },
      requires: ['woodworking'],
      cost: { gold: 35 },
      unlocks: {},
      bought: false
    },
    market_bargaining: {
      label: 'Market Bargaining',
      desc: 'Markets earn 25% more gold from every sale.',
      visibleWhen: { lifetimeEarned: { gold: 40 }, unlockedBuildings: ['market'] },
      requires: ['market_access', 'woodworking'],
      cost: { gold: 35, plank: 2 },
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

export function createGoals() {
  return {
    first_wood: {
      label: 'First Timber',
      desc: 'Produce enough wood to discover trade.',
      completeWhen: { lifetimeProduced: { wood: 5 } },
      reward: { gold: 3 },
      claimed: false
    },
    first_trade: {
      label: 'Open Trade',
      desc: 'Research Market Access.',
      visibleWhen: { lifetimeProduced: { wood: 5 } },
      completeWhen: { techs: ['market_access'] },
      reward: { gold: 5 },
      claimed: false
    },
    first_sales: {
      label: 'First Sales',
      desc: 'Earn 10 lifetime gold from Markets.',
      visibleWhen: { techs: ['market_access'] },
      completeWhen: { lifetimeEarned: { gold: 10 } },
      reward: { gold: 5 },
      claimed: false
    },
    first_ore: {
      label: 'Strike Ore',
      desc: 'Produce 6 Iron Ore.',
      visibleWhen: { techs: ['mining'] },
      completeWhen: { lifetimeProduced: { iron_ore: 6 } },
      reward: { gold: 5 },
      claimed: false
    },
    first_planks: {
      label: 'Cut Planks',
      desc: 'Produce 3 Planks.',
      visibleWhen: { techs: ['woodworking'] },
      completeWhen: { lifetimeProduced: { plank: 3 } },
      reward: { gold: 6 },
      claimed: false
    },
    first_bars: {
      label: 'First Bars',
      desc: 'Produce 2 Iron Bars.',
      visibleWhen: { techs: ['smelting'] },
      completeWhen: { lifetimeProduced: { iron_bar: 2 } },
      reward: { gold: 8 },
      claimed: false
    },
    first_sword: {
      label: 'Armed Trade',
      desc: 'Produce 1 Sword.',
      visibleWhen: { techs: ['blacksmithing'] },
      completeWhen: { lifetimeProduced: { sword: 1 } },
      reward: { gold: 10 },
      claimed: false
    },
    first_knowledge: {
      label: 'Written Records',
      desc: 'Produce 5 Knowledge.',
      visibleWhen: { techs: ['knowledge_production'] },
      completeWhen: { lifetimeProduced: { knowledge: 5 } },
      reward: { gold: 10 },
      claimed: false
    }
  };
}

export function createAddons() {
  return {
    lumber_sharper_axes: {
      node: 'lumber',
      label: 'Sharper Axes',
      desc: 'Lumber Camps need 2 fewer work clicks.',
      cost: { gold: 10, wood: 8 },
      effects: { actionClicks: -2 },
      bought: false
    },
    lumber_wood_yard: {
      node: 'lumber',
      label: 'Wood Yard',
      desc: 'Lumber Camps store 8 more Wood.',
      cost: { gold: 8, wood: 10 },
      effects: { storage: { wood: 8 } },
      bought: false
    },
    market_larger_stall: {
      node: 'market',
      label: 'Larger Stall',
      desc: 'Markets store 5 more of every good.',
      cost: { gold: 15, wood: 10 },
      effects: { storageAll: 5 },
      bought: false
    },
    market_better_rates: {
      node: 'market',
      label: 'Better Rates',
      desc: 'Markets earn 15% more gold from sales.',
      cost: { gold: 25, plank: 2 },
      visibleWhen: { techs: ['woodworking'] },
      effects: { saleMultiplier: 0.15 },
      bought: false
    }
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
  goals: createGoals(),
  addons: createAddons(),
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
