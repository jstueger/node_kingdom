import { BUILDINGS, COLS, ROWS, STARTING_GOLD } from './data.js';
import { createGrid, createTechs } from './state.js';

const STORAGE_KEY = 'factory-node-prototype-save';

export function saveGame({ state, toast }) {
  const payload = {
    nextId: state.nextId,
    gold: state.gold,
    ticks: state.ticks,
    worldCols: state.world.cols,
    worldRows: state.world.rows,
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
  state.world.cols = Math.max(payload.worldCols || COLS, COLS);
  state.world.rows = Math.max(payload.worldRows || ROWS, ROWS);
  state.grid = createGrid(state.world.cols, state.world.rows);
  for (const [key, saved] of Object.entries(payload.techs || {})) {
    if (state.techs[key]) state.techs[key].bought = Boolean(saved.bought);
  }
  context.applyWorldSize();
  context.drawBg();
  for (const building of payload.buildings || []) {
    state.buildings.set(building.id, building);
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
  state.buildings.clear();
  state.world.cols = COLS;
  state.world.rows = ROWS;
  state.camera.panOffset = { x: 0, y: 0 };
  state.grid = createGrid(state.world.cols, state.world.rows);
  state.techs = createTechs();
  context.applyWorldSize();
  context.applyPan();
  context.drawBg();
  document.querySelectorAll('.bcard').forEach(card => card.classList.remove('sel'));
  setHint('Select a building from the sidebar to place it');
  context.renderAll();
}
