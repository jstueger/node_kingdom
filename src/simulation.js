import { BUILDINGS, inputPorts, outputPort } from './data.js';
import { actionClicksFor, inputAccepts, inputResourceForStorage, managerCountFor, managerWorkFor, recipeInputsFor, recipeOutputFor, salePriceFor, storageCapFor } from './rules.js';

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
  const res = Object.keys(prices).find(key => (building.inv[key] || 0) > 0);
  if (!res) return;
  const price = salePriceFor(building.type, res, state.techs, state.addons);
  building.inv[res]--;
  state.gold += price;
  state.stats.lifetimeSold[res] = (state.stats.lifetimeSold[res] || 0) + 1;
  state.stats.lifetimeEarned.gold = (state.stats.lifetimeEarned.gold || 0) + price;
}

export function workBuilding(state, building) {
  return advanceBuildingWork(state, building, 1);
}

export function advanceBuildingWork(state, building, amount) {
  if (!building) return { worked: false, completed: false, reason: 'missing' };
  if (!canProduce(state, building)) {
    building.ptimer = 0;
    return { worked: false, completed: false, reason: 'blocked' };
  }
  building.ptimer = (building.ptimer || 0) + amount;
  if (building.ptimer < actionClicksFor(building, state.techs, state.addons)) return { worked: true, completed: false };
  produce(state, building);
  building.ptimer = 0;
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
    advanceBuildingWork(state, building, managerWorkFor(building, state.addons));
  }
}

export function tickGame(state) {
  state.ticks++;
  transferResources(state);
  automateManagedBuildings(state);
}
