import { COLS, ROWS, STARTING_GOLD } from './data.js';

export function createGrid(cols, rows) {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

export function createTechs() {
  return {
    grid_expansion: {
      label: 'Grid Expansion',
      desc: 'Adds 16 columns and 8 rows to the build grid.',
      cost: 50,
      bought: false
    },
    storage_bins: {
      label: 'Storage Bins',
      desc: 'Adds 5 storage capacity to every resource slot.',
      cost: 35,
      bought: false
    },
    workshop_tuning: {
      label: 'Workshop Tuning',
      desc: 'Crafters finish recipes 1 tick faster.',
      cost: 60,
      bought: false
    },
    market_bargaining: {
      label: 'Market Bargaining',
      desc: 'Markets earn 25% more gold from every sale.',
      cost: 75,
      bought: false
    }
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
  world: { cols: COLS, rows: ROWS },
  camera: {
    zoom: 1,
    panOffset: { x: 0, y: 0 }
  },
  interaction: {
    pan: null,
    moving: null,
    movingInvalid: false,
    suppressNextGridClick: false
  },
  buildings: new Map(),
  grid: createGrid(COLS, ROWS),
  techs: createTechs()
};
