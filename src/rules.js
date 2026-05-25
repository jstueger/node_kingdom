import { BUILDINGS, MANUAL_ACTION_CLICKS, activeRecipe, capFor, inputPorts, itemLabel, outputPort } from './data.js';
import { createManagerCosts } from './progression-data.js';

export function inputAccepts(inputPort, resource) {
  if (!inputPort) return false;
  if (!inputPort.acceptsAll) return inputPort.res === resource;
  return !inputPort.acceptedResources || inputPort.acceptedResources.includes(resource);
}

export function inputResourceForStorage(inputPort, outputResource) {
  return inputPort.acceptsAll ? outputResource : inputPort.res;
}

export function inputAlreadyConnected(connections, buildingId, portIndex) {
  return connections.some(connection => connection.tb === buildingId && connection.tpi === portIndex);
}

export function storageCapFor(building, resource, techs, addons = {}) {
  return capFor(building, resource)
    + (techs.storage_bins.bought ? 5 : 0)
    + addonStorageBonus(addons, building.type, resource);
}

export function isBuildingUnlocked(state, type) {
  return Boolean(state.unlockedBuildings[type]);
}

export function actionClicksFor(building, techs, addons = {}) {
  const addonBonus = addonActionClickBonus(addons, building.type);
  const base = BUILDINGS[building.type].actionClicks || MANUAL_ACTION_CLICKS;
  if (BUILDINGS[building.type].kind === 'seller') {
    return Math.max(1, base - (techs.basic_accounting?.bought ? 2 : 0) + addonBonus);
  }
  if (BUILDINGS[building.type].kind !== 'crafter') return Math.max(1, base + addonBonus);
  return Math.max(1, base - (techs.workshop_tuning.bought ? 2 : 0) + addonBonus);
}

export function managerWorkFor(building, addons = {}) {
  if (managerCountFor(building) <= 0) return 0;
  return Math.max(1, 1 + addonManagerWorkBonus(addons, building.type));
}

export function recipeInputsFor(building, addons = {}) {
  const recipe = activeRecipe(building);
  if (!recipe) return {};
  const reductions = addonInputEfficiency(addons, building.type);
  return Object.fromEntries(Object.entries(recipe.inputs).map(([resource, amount]) => {
    return [resource, Math.max(1, amount - (reductions[resource] || 0))];
  }));
}

export function recipeOutputFor(building, addons = {}) {
  const recipe = activeRecipe(building);
  if (!recipe) return null;
  const bonus = addonOutputBonus(addons, building.type, recipe.output.res);
  return {
    ...recipe.output,
    amount: recipe.output.amount + bonus
  };
}

export function salePriceFor(type, resource, techs, addons = {}) {
  const base = BUILDINGS[type].sellPrices?.[resource] || 0;
  return Math.floor(base * ((techs.market_bargaining.bought ? 1.25 : 1) + addonSaleMultiplier(addons, type)));
}

export function totalStoredResource(state, resource) {
  let total = 0;
  for (const building of state.buildings.values()) total += building.inv[resource] || 0;
  return total;
}

export function formatCost(cost = {}) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${resource === 'gold' ? 'gold' : itemLabel(resource)}`)
    .join(', ') || 'Free';
}

export function isTechVisible(state, tech) {
  return areTechPrerequisitesMet(state, tech) && areTechMilestonesMet(state, tech);
}

export function isTechDiscovered(state, tech) {
  if (tech.bought || isTechVisible(state, tech)) return true;
  if (tech.requires?.some(key => state.techs[key]?.bought)) return true;
  return false;
}

export function areTechPrerequisitesMet(state, tech) {
  return !(tech.requires?.some(key => !state.techs[key]?.bought));
}

export function areTechMilestonesMet(state, tech) {
  const visibleWhen = tech.visibleWhen || {};
  if (visibleWhen.unlockedBuildings?.some(type => !isBuildingUnlocked(state, type))) return false;
  for (const [resource, amount] of Object.entries(visibleWhen.lifetimeProduced || {})) {
    if ((state.stats.lifetimeProduced[resource] || 0) < amount) return false;
  }
  for (const [resource, amount] of Object.entries(visibleWhen.lifetimeEarned || {})) {
    if ((state.stats.lifetimeEarned[resource] || 0) < amount) return false;
  }
  return true;
}

export function canPayCost(state, cost = {}) {
  for (const [resource, amount] of Object.entries(cost)) {
    const available = resource === 'gold' ? state.gold : totalStoredResource(state, resource);
    if (available < amount) return false;
  }
  return true;
}

export function spendCost(state, cost = {}) {
  if (!canPayCost(state, cost)) return false;
  for (const [resource, amount] of Object.entries(cost)) {
    if (resource === 'gold') {
      state.gold -= amount;
      continue;
    }
    spendStoredResource(state, resource, amount);
  }
  return true;
}

export function applyTechUnlocks(state, tech) {
  for (const type of tech.unlocks?.buildings || []) state.unlockedBuildings[type] = true;
  for (const [type, amount] of Object.entries(tech.unlocks?.managerSlots || {})) {
    state.managerSlots[type] = Math.max(state.managerSlots[type] || 0, amount);
  }
}

export function isGoalVisible(state, goal) {
  return isConditionMet(state, goal.visibleWhen || {});
}

export function isGoalComplete(state, goal) {
  return isConditionMet(state, goal.completeWhen || {});
}

export function applyGoalReward(state, goal) {
  if (goal.reward?.gold) state.gold += goal.reward.gold;
}

export function isAddonVisible(state, addon) {
  return isBuildingUnlocked(state, addon.node) && isConditionMet(state, addon.visibleWhen || {});
}

export function activeAddonsFor(addons = {}, type) {
  return Object.values(addons).filter(addon => addon.node === type && addon.bought);
}

export function managerSlotsFor(state, type) {
  return state.managerSlots[type] || 0;
}

export function managerCountFor(building) {
  return building.managers || 0;
}

export function openManagerSlotsFor(state, building) {
  return Math.max(0, managerSlotsFor(state, building.type) - managerCountFor(building));
}

export function managerCostFor(type) {
  const costs = createManagerCosts();
  return costs[type] || costs.default || {};
}

export function canBuyManager(state, building) {
  return Boolean(building) && openManagerSlotsFor(state, building) > 0 && canPayCost(state, managerCostFor(building.type));
}

export function buyManager(state, building) {
  if (!canBuyManager(state, building)) return false;
  if (!spendCost(state, managerCostFor(building.type))) return false;
  building.managers = managerCountFor(building) + 1;
  return true;
}

function addonStorageBonus(addons, type, resource) {
  return activeAddonsFor(addons, type).reduce((total, addon) => {
    return total + (addon.effects?.storage?.[resource] || 0) + (addon.effects?.storageAll || 0);
  }, 0);
}

function addonActionClickBonus(addons, type) {
  return activeAddonsFor(addons, type).reduce((total, addon) => total + (addon.effects?.actionClicks || 0), 0);
}

function addonManagerWorkBonus(addons, type) {
  return activeAddonsFor(addons, type).reduce((total, addon) => total + (addon.effects?.managerWork || 0), 0);
}

function addonInputEfficiency(addons, type) {
  return activeAddonsFor(addons, type).reduce((totals, addon) => {
    for (const [resource, amount] of Object.entries(addon.effects?.inputEfficiency || {})) {
      totals[resource] = (totals[resource] || 0) + amount;
    }
    return totals;
  }, {});
}

function addonOutputBonus(addons, type, resource) {
  return activeAddonsFor(addons, type).reduce((total, addon) => {
    return total + (addon.effects?.outputBonus?.[resource] || 0);
  }, 0);
}

function addonSaleMultiplier(addons, type) {
  return activeAddonsFor(addons, type).reduce((total, addon) => total + (addon.effects?.saleMultiplier || 0), 0);
}

function isConditionMet(state, condition) {
  for (const key of condition.techs || []) {
    if (!state.techs[key]?.bought) return false;
  }
  for (const type of condition.unlockedBuildings || []) {
    if (!isBuildingUnlocked(state, type)) return false;
  }
  for (const [resource, amount] of Object.entries(condition.lifetimeProduced || {})) {
    if ((state.stats.lifetimeProduced[resource] || 0) < amount) return false;
  }
  for (const [resource, amount] of Object.entries(condition.lifetimeEarned || {})) {
    if ((state.stats.lifetimeEarned[resource] || 0) < amount) return false;
  }
  return true;
}

function spendStoredResource(state, resource, amount) {
  let remaining = amount;
  for (const building of state.buildings.values()) {
    const available = building.inv[resource] || 0;
    if (!available) continue;
    const spent = Math.min(available, remaining);
    building.inv[resource] -= spent;
    remaining -= spent;
    if (remaining <= 0) return;
  }
}

export function connectionStatus(connection, buildings, techs, addons = {}) {
  const fromBuilding = buildings.get(connection.fb);
  const toBuilding = buildings.get(connection.tb);
  if (!fromBuilding || !toBuilding) return 'blocked';

  const out = outputPort(fromBuilding);
  const input = inputPorts(toBuilding)[connection.tpi];
  if (!out || !inputAccepts(input, out.res)) return 'blocked';

  const targetResource = inputResourceForStorage(input, out.res);
  if ((toBuilding.inv[targetResource] || 0) >= storageCapFor(toBuilding, targetResource, techs, addons)) return 'blocked';
  if ((fromBuilding.inv[out.res] || 0) <= 0) return 'starved';

  return 'flowing';
}
