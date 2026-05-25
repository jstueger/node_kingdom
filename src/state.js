import { COLS, ROWS, STARTING_GOLD } from './data.js';
import { createAddons, createGoals, createTechs, createUnlockedBuildings } from './progression-data.js';

export function createGrid(cols, rows) {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

export function createStats() {
  return {
    lifetimeProduced: {},
    lifetimeSold: {},
    lifetimeEarned: { gold: 0 }
  };
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
