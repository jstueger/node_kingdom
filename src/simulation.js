import { BUILDINGS, inputPorts, outputPort } from './data.js';
import { actionTicksFor, inputAccepts, inputResourceForStorage, managerCountFor, managerWorkFor, recipeInputsFor, recipeOutputFor, salePriceFor, storageCapFor } from './rules.js';

export function canProduce(state, building) {
  if (BUILDINGS[building.type].kind === 'seller') return canSell(building);
  const output = recipeOutputFor(building, state.addons);
  for (const [res, amount] of Object.entries(recipeInputsFor(building, state.addons))) {
    if ((building.inv[res] || 0) < amount) return false;
  }
  if (output.res !== 'gold' && (building.inv[output.res] || 0) + output.amount > storageCapFor(building, output.res, state.techs, state.addons)) return false;
  return true;
}

export function produce(state, building) {
  if (BUILDINGS[building.type].kind === 'seller') {
    sellGoods(state, building);
    return;
  }
  const output = recipeOutputFor(building, state.addons);
  for (const [res, amount] of Object.entries(recipeInputsFor(building, state.addons))) building.inv[res] = (building.inv[res] || 0) - amount;
  if (output.res === 'gold') state.gold += output.amount;
  else building.inv[output.res] = (building.inv[output.res] || 0) + output.amount;
  state.stats.lifetimeProduced[output.res] = (state.stats.lifetimeProduced[output.res] || 0) + output.amount;
}

export function canSell(building) {
  const prices = BUILDINGS[building.type].sellPrices || {};
  return Object.keys(prices).some(res => (building.inv[res] || 0) > 0);
}

export function sellGoods(state, building) {
  const prices = BUILDINGS[building.type].sellPrices || {};
  for (const res of Object.keys(prices)) {
    const amount = building.inv[res] || 0;
    if (amount <= 0) continue;
    const earned = salePriceFor(building.type, res, state.techs, state.addons) * amount;
    building.inv[res] = 0;
    state.gold += earned;
    state.stats.lifetimeSold[res] = (state.stats.lifetimeSold[res] || 0) + amount;
    state.stats.lifetimeEarned.gold = (state.stats.lifetimeEarned.gold || 0) + earned;
  }
}

export function workBuilding(state, building) {
  if (!building) return { worked: false, completed: false, reason: 'missing' };
  if (building.active) return { worked: true, completed: false, reason: 'active' };
  if (!canProduce(state, building)) {
    building.ptimer = 0;
    building.active = false;
    return { worked: false, completed: false, reason: 'blocked' };
  }
  building.ptimer = 0;
  building.active = true;
  return { worked: true, completed: false, reason: 'started' };
}

export function advanceBuildingWork(state, building, amount) {
  if (!building) return { worked: false, completed: false, reason: 'missing' };
  if (!building.active) return { worked: false, completed: false, reason: 'idle' };
  if (!canProduce(state, building)) {
    building.ptimer = 0;
    building.active = false;
    return { worked: false, completed: false, reason: 'blocked' };
  }
  building.ptimer = (building.ptimer || 0) + amount;
  if (building.ptimer < actionTicksFor(building, state.techs, state.addons)) return { worked: true, completed: false };
  produce(state, building);
  building.ptimer = 0;
  building.active = false;
  return { worked: true, completed: true };
}

export function transferResources(state) {
  // Each connection can move one unit per tick if source has output and target has capacity.
  for (const connection of state.connections) {
    const fromBuilding = state.buildings.get(connection.fb);
    const toBuilding = state.buildings.get(connection.tb);
    if (!fromBuilding || !toBuilding) continue;
    const output = outputPort(fromBuilding);
    const input = inputPorts(toBuilding)[connection.tpi];
    if (!output || !inputAccepts(input, output.res)) continue;
    const targetResource = inputResourceForStorage(input, output.res);
    if ((fromBuilding.inv[output.res] || 0) > 0 && (toBuilding.inv[targetResource] || 0) < storageCapFor(toBuilding, targetResource, state.techs, state.addons)) {
      fromBuilding.inv[output.res]--;
      toBuilding.inv[targetResource] = (toBuilding.inv[targetResource] || 0) + 1;
    }
  }
}

export function automateManagedBuildings(state) {
  for (const building of state.buildings.values()) {
    if (managerCountFor(building) <= 0) continue;
    if (!building.active && canProduce(state, building)) building.active = true;
    advanceBuildingWork(state, building, managerWorkFor(building, state.addons));
  }
}

export function tickGame(state) {
  state.ticks++;
  transferResources(state);
  advanceManualBuildings(state);
  automateManagedBuildings(state);
}

export function advanceManualBuildings(state) {
  for (const building of state.buildings.values()) {
    if (managerCountFor(building) > 0 || !building.active) continue;
    advanceBuildingWork(state, building, 1);
  }
}
