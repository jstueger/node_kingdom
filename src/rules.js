import { BUILDINGS, MANUAL_ACTION_CLICKS, capFor, inputPorts, outputPort } from './data.js';

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

export function actionClicksFor(building, techs) {
  if (BUILDINGS[building.type].kind !== 'crafter') return MANUAL_ACTION_CLICKS;
  return Math.max(1, MANUAL_ACTION_CLICKS - (techs.workshop_tuning.bought ? 2 : 0));
}

export function salePriceFor(type, resource, techs) {
  const base = BUILDINGS[type].sellPrices?.[resource] || 0;
  return Math.floor(base * (techs.market_bargaining.bought ? 1.25 : 1));
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
