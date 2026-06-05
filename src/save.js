import { BUILDINGS, COLS, CONTENT, ROWS, STARTING_GOLD } from './data.js';
import { createAddons, createGoals, createManagerSlots, createStartingBuildings, createStartingSelection, createTechs, createUnlockedBuildings, createUnlockTree, occupyStartingBuildings } from './progression-data.js';
import { applyUnlockNodeUnlocks } from './rules.js';
import { createGrid, createInteractionState, createStats } from './state.js';

const STORAGE_KEY = 'factory-node-prototype-save';
const SAVE_VERSION = 2;
const MONEY_SCALE_VERSION = 2;

export function saveGame({ state, toast }) {
  const payload = {
    version: SAVE_VERSION,
    moneyScaleVersion: MONEY_SCALE_VERSION,
    nextId: state.nextId,
    gold: state.gold,
    ticks: state.ticks,
    worldCols: state.world.cols,
    worldRows: state.world.rows,
    stats: state.stats,
    goals: state.goals,
    addons: state.addons,
    managerSlots: state.managerSlots,
    unlockTree: state.unlockTree,
    unlockedBuildings: state.unlockedBuildings,
    uiUnlocks: {
      revealedBuildingsButton: state.interaction.revealedBuildingsButton,
      revealedTechButton: state.interaction.revealedTechButton,
      revealedMineHint: state.interaction.revealedMineHint
    },
    techCamera: state.techCamera,
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
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    console.warn('Could not load save:', error);
    toast('Save data is corrupted');
    return;
  }
  const moneyScale = payload.moneyScaleVersion === MONEY_SCALE_VERSION ? 1 : 10;
  resetWorld(context, false);
  state.nextId = payload.nextId;
  state.gold = scaleMoney(payload.gold ?? STARTING_GOLD, moneyScale);
  state.ticks = payload.ticks || 0;
  state.connections = payload.conns || [];
  state.interaction.revealedBuildingsButton = Boolean(payload.uiUnlocks?.revealedBuildingsButton);
  state.interaction.revealedTechButton = Boolean(payload.uiUnlocks?.revealedTechButton);
  state.interaction.revealedMineHint = Boolean(payload.uiUnlocks?.revealedMineHint);
  state.interaction.buildingsMenuOpen = false;
  state.techCamera = normalizeTechCamera(payload.techCamera);
  state.stats = {
    lifetimeProduced: { ...(payload.stats?.lifetimeProduced || {}) },
    lifetimeSold: { ...(payload.stats?.lifetimeSold || {}) },
    lifetimeEarned: scaleMoneyMap({ gold: 0, ...(payload.stats?.lifetimeEarned || {}) }, moneyScale)
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
  state.unlockTree = createUnlockTree();
  for (const [key, saved] of Object.entries(payload.unlockTree || {})) {
    if (state.unlockTree[key]) state.unlockTree[key].bought = Boolean(saved.bought);
  }
  const legacyUnlockTechs = { market_access: 'market_unlock', mining: 'mine_unlock' };
  for (const [techKey, unlockKey] of Object.entries(legacyUnlockTechs)) {
    if (payload.techs?.[techKey]?.bought && state.unlockTree[unlockKey]) state.unlockTree[unlockKey].bought = true;
  }
  state.unlockedBuildings = { ...createUnlockedBuildings(), ...(payload.unlockedBuildings || {}) };
  state.world.cols = Math.max(payload.worldCols || COLS, COLS);
  state.world.rows = Math.max(payload.worldRows || ROWS, ROWS);
  state.grid = createGrid(state.world.cols, state.world.rows);
  state.buildings = new Map();
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
  for (const node of Object.values(state.unlockTree)) {
    if (node.bought) applyUnlockNodeUnlocks(state, node);
  }
  context.applyWorldSize();
  context.drawBg();
  for (const building of payload.buildings || []) {
    const definition = BUILDINGS[building.type];
    if (!definition) {
      console.warn(`Skipping saved building with unknown type: ${building.type}`);
      continue;
    }
    building.managers = building.managers || 0;
    building.active = Boolean(building.active);
    state.buildings.set(building.id, building);
    state.unlockedBuildings[building.type] = true;
    context.gridSet(building.gx, building.gy, definition.w, definition.h, building.id);
  }
  state.connections = state.connections.filter(connection => {
    const fromBuilding = state.buildings.get(connection.fb);
    const toBuilding = state.buildings.get(connection.tb);
    if (!fromBuilding || !toBuilding) return false;
    const inputCount = BUILDINGS[toBuilding.type]?.kind === 'seller'
      ? 1
      : Object.keys(BUILDINGS[toBuilding.type]?.recipes?.[toBuilding.recipe]?.inputs || {}).length;
    return connection.tpi >= 0 && connection.tpi < inputCount;
  });
  context.renderAll();
  toast('Loaded');
}

function scaleMoney(amount, scale) {
  return Math.floor((amount || 0) * scale);
}

function normalizeTechCamera(saved) {
  return {
    zoom: Number.isFinite(saved?.zoom) ? saved.zoom : 1.45,
    panOffset: {
      x: Number.isFinite(saved?.panOffset?.x) ? saved.panOffset.x : 0,
      y: Number.isFinite(saved?.panOffset?.y) ? saved.panOffset.y : 0
    },
    initialized: Boolean(saved?.initialized)
  };
}

function scaleMoneyMap(values, scale) {
  return Object.fromEntries(Object.entries(values).map(([resource, amount]) => {
    return [resource, resource === 'gold' ? scaleMoney(amount, scale) : amount];
  }));
}

export function resetWorld(context, confirmFirst = true) {
  const { state, setHint } = context;
  if (confirmFirst && !confirm('Reset the prototype?')) return;
  const starting = createStartingBuildings();
  state.nextId = starting.nextId;
  state.gold = STARTING_GOLD;
  state.ticks = 0;
  state.view = 'main';
  state.techTreeView = { mode: 'map', building: null };
  state.selectedId = createStartingSelection(starting.buildings);
  state.mode = 'idle';
  state.placeType = null;
  state.connFrom = null;
  state.connections = [];
  state.stats = createStats();
  state.goals = createGoals();
  state.addons = createAddons();
  state.managerSlots = createManagerSlots();
  state.unlockedBuildings = createUnlockedBuildings();
  state.unlockTree = createUnlockTree();
  state.buildings = starting.buildings;
  state.world.cols = COLS;
  state.world.rows = ROWS;
  state.camera.panOffset = { x: 0, y: 0 };
  state.camera.zoom = 1;
  state.techCamera = { zoom: 1.45, panOffset: { x: 0, y: 0 }, initialized: false };
  state.clock.lastTickAt = performance.now();
  state.interaction = createInteractionState();
  state.grid = createGrid(state.world.cols, state.world.rows);
  occupyStartingBuildings(state.grid, state.buildings);
  state.techs = createTechs();
  context.applyWorldSize();
  context.applyZoom();
  context.applyPan();
  context.drawBg();
  document.querySelectorAll('.bcard').forEach(card => card.classList.remove('sel'));
  setHint(CONTENT.startState.hint || 'Select a building from the sidebar to place it');
  context.renderAll();
}
