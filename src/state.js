import { COLS, ROWS, STARTING_GOLD } from './data.js';
import { createAddons, createGoals, createManagerSlots, createStartingBuildings, createStartingSelection, createTechs, createUnlockedBuildings, occupyStartingBuildings } from './progression-data.js';

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
    suppressNextGridClick: false,
    revealedBuildingsButton: false,
    revealedTechButton: false,
    revealedMineHint: false
  };
}

export function createState() {
  const starting = createStartingBuildings();
  const grid = createGrid(COLS, ROWS);
  occupyStartingBuildings(grid, starting.buildings);
  return {
    nextId: starting.nextId,
    gold: STARTING_GOLD,
    ticks: 0,
    selectedId: createStartingSelection(starting.buildings),
    mode: 'idle',
    placeType: null,
    connFrom: null,
    connections: [],
    stats: createStats(),
    goals: createGoals(),
    addons: createAddons(),
    managerSlots: createManagerSlots(),
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
    buildings: starting.buildings,
    grid,
    techs: createTechs()
  };
}
