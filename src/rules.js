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

export function storageCapFor(building, resource, techs) {
  return capFor(building, resource) + (techs.storage_bins.bought ? 5 : 0);
}

export function isBuildingUnlocked(state, type) {
  return Boolean(state.unlockedBuildings[type]);
}

export function actionClicksFor(building, techs) {
  if (BUILDINGS[building.type].kind !== 'crafter') return MANUAL_ACTION_CLICKS;
  return Math.max(1, MANUAL_ACTION_CLICKS - (techs.workshop_tuning.bought ? 2 : 0));
}

export function salePriceFor(type, resource, techs) {
  const base = BUILDINGS[type].sellPrices?.[resource] || 0;
  return Math.floor(base * (techs.market_bargaining.bought ? 1.25 : 1));
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
  const visibleWhen = tech.visibleWhen || {};
  if (tech.requires?.some(key => !state.techs[key]?.bought)) return false;
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

export function connectionStatus(connection, buildings, techs) {
  const fromBuilding = buildings.get(connection.fb);
  const toBuilding = buildings.get(connection.tb);
  if (!fromBuilding || !toBuilding) return 'blocked';

  const out = outputPort(fromBuilding);
  const input = inputPorts(toBuilding)[connection.tpi];
  if (!out || !inputAccepts(input, out.res)) return 'blocked';

  const targetResource = inputResourceForStorage(input, out.res);
  if ((toBuilding.inv[targetResource] || 0) >= storageCapFor(toBuilding, targetResource, techs)) return 'blocked';
  if ((fromBuilding.inv[out.res] || 0) <= 0) return 'starved';

  return 'flowing';
}
