import { BUILDINGS, COLS, ROWS, STARTING_GOLD } from './data.js';
import { createAddons, createGoals, createManagerSlots, createTechs, createUnlockedBuildings } from './progression-data.js';
import { createGrid, createInteractionState, createStats } from './state.js';

const STORAGE_KEY = 'factory-node-prototype-save';

export function saveGame({ state, toast }) {
  const payload = {
    nextId: state.nextId,
    gold: state.gold,
    ticks: state.ticks,
    worldCols: state.world.cols,
    worldRows: state.world.rows,
    stats: state.stats,
    goals: state.goals,
    addons: state.addons,
    managerSlots: state.managerSlots,
    unlockedBuildings: state.unlockedBuildings,
    techs: state.techs,
    buildings: [...state.buildings.values()],
    conns: state.connections
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  toast('Saved');
}

export function loadGame(context) {
  const { state, toast } = context;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    toast('No save found');
    return;
  }
  const payload = JSON.parse(raw);
  resetWorld(context, false);
  state.nextId = payload.nextId;
  state.gold = payload.gold ?? STARTING_GOLD;
  state.ticks = payload.ticks || 0;
  state.connections = payload.conns || [];
  state.stats = {
    lifetimeProduced: { ...(payload.stats?.lifetimeProduced || {}) },
    lifetimeSold: { ...(payload.stats?.lifetimeSold || {}) },
    lifetimeEarned: { gold: 0, ...(payload.stats?.lifetimeEarned || {}) }
  };
  state.goals = createGoals();
  for (const [key, saved] of Object.entries(payload.goals || {})) {
    if (state.goals[key]) state.goals[key].claimed = Boolean(saved.claimed);
  }
  state.addons = createAddons();
  for (const [key, saved] of Object.entries(payload.addons || {})) {
    if (state.addons[key]) state.addons[key].bought = Boolean(saved.bought);
  }
  state.managerSlots = { ...createManagerSlots(), ...(payload.managerSlots || {}) };
  state.unlockedBuildings = { ...createUnlockedBuildings(), ...(payload.unlockedBuildings || {}) };
  state.world.cols = Math.max(payload.worldCols || COLS, COLS);
  state.world.rows = Math.max(payload.worldRows || ROWS, ROWS);
  state.grid = createGrid(state.world.cols, state.world.rows);
  for (const [key, saved] of Object.entries(payload.techs || {})) {
    if (state.techs[key]) state.techs[key].bought = Boolean(saved.bought);
  }
  for (const [key, tech] of Object.entries(state.techs)) {
    if (tech.bought) {
      for (const type of tech.unlocks?.buildings || []) state.unlockedBuildings[type] = true;
      for (const [type, amount] of Object.entries(tech.unlocks?.managerSlots || {})) {
        state.managerSlots[type] = Math.max(state.managerSlots[type] || 0, amount);
      }
    }
  }
  context.applyWorldSize();
  context.drawBg();
  for (const building of payload.buildings || []) {
    state.buildings.set(building.id, building);
    state.unlockedBuildings[building.type] = true;
    context.gridSet(building.gx, building.gy, BUILDINGS[building.type].w, BUILDINGS[building.type].h, building.id);
  }
  context.renderAll();
  toast('Loaded');
}

export function resetWorld(context, confirmFirst = true) {
  const { state, setHint } = context;
  if (confirmFirst && !confirm('Reset the prototype?')) return;
  state.nextId = 1;
  state.gold = STARTING_GOLD;
  state.ticks = 0;
  state.selectedId = null;
  state.mode = 'idle';
  state.placeType = null;
  state.connFrom = null;
  state.connections = [];
  state.stats = createStats();
  state.goals = createGoals();
  state.addons = createAddons();
  state.managerSlots = createManagerSlots();
  state.unlockedBuildings = createUnlockedBuildings();
  state.buildings.clear();
  state.world.cols = COLS;
  state.world.rows = ROWS;
  state.camera.panOffset = { x: 0, y: 0 };
  state.camera.zoom = 1;
  state.clock.lastTickAt = performance.now();
  state.interaction = createInteractionState();
  state.grid = createGrid(state.world.cols, state.world.rows);
  state.techs = createTechs();
  context.applyWorldSize();
  context.applyZoom();
  context.applyPan();
  context.drawBg();
  document.querySelectorAll('.bcard').forEach(card => card.classList.remove('sel'));
  setHint('Select a building from the sidebar to place it');
  context.renderAll();
}
