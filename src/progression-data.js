import { BUILDINGS, CONTENT, firstRecipe } from './data.js';

export function createTechs() {
  return cloneCollection(CONTENT.techs, 'bought', false);
}

export function createGoals() {
  return cloneCollection(CONTENT.goals, 'claimed', false);
}

export function createAddons() {
  return cloneCollection(CONTENT.addons, 'bought', false);
}

export function createUnlockTree() {
  return cloneCollection(CONTENT.unlockTree, 'bought', false);
}

export function createUnlockedBuildings() {
  return { ...(CONTENT.startState.unlockedBuildings || {}) };
}

export function createStartingBuildings() {
  const buildings = new Map();
  let nextId = 1;
  for (const entry of CONTENT.startState.buildings || []) {
    const id = entry.id || nextId;
    nextId = Math.max(nextId, id + 1);
    buildings.set(id, {
      id,
      type: entry.type,
      gx: entry.gx,
      gy: entry.gy,
      recipe: entry.recipe || firstRecipe(entry.type),
      inv: structuredClone(entry.inventory || {}),
      ptimer: 0,
      managers: 0,
      active: false
    });
  }
  return { buildings, nextId };
}

export function createStartingSelection(buildings) {
  return buildings.keys().next().value || null;
}

export function occupyStartingBuildings(grid, buildings) {
  for (const building of buildings.values()) {
    const definition = BUILDINGS[building.type];
    if (!definition) continue;
    for (let y = 0; y < definition.h; y++) {
      for (let x = 0; x < definition.w; x++) {
        if (grid[building.gy + y]?.[building.gx + x] !== undefined) {
          grid[building.gy + y][building.gx + x] = building.id;
        }
      }
    }
  }
}

export function createManagerSlots() {
  return { ...(CONTENT.managers.slots || {}) };
}

export function createManagerCosts() {
  return structuredClone(CONTENT.managers.costs || {});
}

function cloneCollection(collection = {}, runtimeFlag, defaultValue) {
  return Object.fromEntries(Object.entries(collection).map(([key, entry]) => {
    return [key, {
      ...structuredClone(entry),
      [runtimeFlag]: entry[runtimeFlag] ?? defaultValue
    }];
  }));
}
