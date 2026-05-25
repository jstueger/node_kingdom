import { BUILDINGS, MANUAL_ACTION_CLICKS, capFor, inputPorts, itemLabel, outputPort } from './data.js';

export function inputAccepts(inputPort, resource) {
  return Boolean(inputPort && (inputPort.acceptsAll || inputPort.res === resource));
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
  if (BUILDINGS[building.type].kind === 'seller') {
    return Math.max(1, MANUAL_ACTION_CLICKS - (techs.basic_accounting?.bought ? 2 : 0) + addonBonus);
  }
  if (BUILDINGS[building.type].kind !== 'crafter') return Math.max(1, MANUAL_ACTION_CLICKS + addonBonus);
  return Math.max(1, MANUAL_ACTION_CLICKS - (techs.workshop_tuning.bought ? 2 : 0) + addonBonus);
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

function addonStorageBonus(addons, type, resource) {
  return activeAddonsFor(addons, type).reduce((total, addon) => {
    return total + (addon.effects?.storage?.[resource] || 0) + (addon.effects?.storageAll || 0);
  }, 0);
}

function addonActionClickBonus(addons, type) {
  return activeAddonsFor(addons, type).reduce((total, addon) => total + (addon.effects?.actionClicks || 0), 0);
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
