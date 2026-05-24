import { BUILDINGS, activeRecipe, inputPorts, outputPort } from './data.js';
import { inputAccepts, inputResourceForStorage, recipeTimeFor, salePriceFor, storageCapFor } from './rules.js';

export function canProduce(state, building) {
  if (BUILDINGS[building.type].kind === 'seller') return canSell(building);
  const recipe = activeRecipe(building);
  for (const [res, amount] of Object.entries(recipe.inputs)) {
    if ((building.inv[res] || 0) < amount) return false;
  }
  if (recipe.output.res !== 'gold' && (building.inv[recipe.output.res] || 0) + recipe.output.amount > storageCapFor(building, recipe.output.res, state.techs)) return false;
  return true;
}

export function produce(state, building) {
  if (BUILDINGS[building.type].kind === 'seller') {
    sellGoods(state, building);
    return;
  }
  const recipe = activeRecipe(building);
  for (const [res, amount] of Object.entries(recipe.inputs)) building.inv[res] = (building.inv[res] || 0) - amount;
  if (recipe.output.res === 'gold') state.gold += recipe.output.amount;
  else building.inv[recipe.output.res] = (building.inv[recipe.output.res] || 0) + recipe.output.amount;
}

export function canSell(building) {
  const prices = BUILDINGS[building.type].sellPrices || {};
  return Object.keys(prices).some(res => (building.inv[res] || 0) > 0);
}

export function sellGoods(state, building) {
  const prices = BUILDINGS[building.type].sellPrices || {};
  const res = Object.keys(prices).find(key => (building.inv[key] || 0) > 0);
  if (!res) return;
  building.inv[res]--;
  state.gold += salePriceFor(building.type, res, state.techs);
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
    if ((fromBuilding.inv[output.res] || 0) > 0 && (toBuilding.inv[targetResource] || 0) < storageCapFor(toBuilding, targetResource, state.techs)) {
      fromBuilding.inv[output.res]--;
      toBuilding.inv[targetResource] = (toBuilding.inv[targetResource] || 0) + 1;
    }
  }
}

export function tickGame(state) {
  state.ticks++;
  for (const [, building] of state.buildings) {
    if (BUILDINGS[building.type].kind === 'seller') {
      if (canSell(building)) sellGoods(state, building);
      continue;
    }
    const recipe = activeRecipe(building);
    if (canProduce(state, building)) {
      building.ptimer = (building.ptimer || 0) + 1;
      if (building.ptimer >= recipeTimeFor(building, recipe, state.techs)) {
        produce(state, building);
        building.ptimer = 0;
      }
    } else {
      building.ptimer = 0;
    }
  }
  transferResources(state);
}
