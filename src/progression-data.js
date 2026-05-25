import { CONTENT } from './data.js';

export function createTechs() {
  return cloneCollection(CONTENT.techs, 'bought', false);
}

export function createGoals() {
  return cloneCollection(CONTENT.goals, 'claimed', false);
}

export function createAddons() {
  return cloneCollection(CONTENT.addons, 'bought', false);
}

export function createUnlockedBuildings() {
  return { ...(CONTENT.startState.unlockedBuildings || {}) };
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
