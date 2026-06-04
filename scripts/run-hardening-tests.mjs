import assert from 'node:assert/strict';
import { activeRecipe } from '../src/data.js';
import { canProduce, sellGoods, tickGame, workBuilding } from '../src/simulation.js';
import { createState } from '../src/state.js';
import { gridFree } from '../src/world.js';
import { applyAddonUnlocks, applyUnlockNodeUnlocks, buyManager, managerWorkFor, recipeInputsFor, salePriceFor, storageCapFor } from '../src/rules.js';
import { loadGame, saveGame } from '../src/save.js';
import { validateContent } from '../src/content-validation.js';
import { loadTestContent, createContext, createDomStub, createMemoryStorage } from './test-helpers.mjs';

const { raw: baseContent } = await loadTestContent();

globalThis.performance = globalThis.performance || { now: () => 0 };
globalThis.document = createDomStub();
globalThis.confirm = () => true;

function test(name, fn) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (error) {
    console.error(`not ok ${name}`);
    throw error;
  }
}

function freshState() {
  return createState();
}

test('starting sawmill can produce one plank after timed work', () => {
  const state = freshState();
  const sawmill = [...state.buildings.values()].find(building => building.type === 'sawmill');
  assert.equal(canProduce(state, sawmill), true);
  assert.deepEqual(recipeInputsFor(sawmill, state.addons), { wood: 2 });
  assert.equal(workBuilding(state, sawmill).reason, 'started');
  for (let i = 0; i < 10; i++) tickGame(state);
  assert.equal(sawmill.inv.wood, 0);
  assert.equal(sawmill.inv.plank, 1);
  assert.equal(state.stats.lifetimeProduced.plank, 1);
  assert.equal(sawmill.active, false);
});

test('market selling clears all stocked goods and records lifetime stats', () => {
  const state = freshState();
  const market = { id: 200, type: 'market', gx: 0, gy: 0, recipe: null, inv: { plank: 3, wood: 2 }, ptimer: 0, managers: 0, active: false };
  state.buildings.set(market.id, market);
  const expected = salePriceFor('market', 'plank', state.techs, state.addons) * 3
    + salePriceFor('market', 'wood', state.techs, state.addons) * 2;
  sellGoods(state, market);
  assert.equal(market.inv.plank, 0);
  assert.equal(market.inv.wood, 0);
  assert.equal(state.gold, 100 + expected);
  assert.equal(state.stats.lifetimeSold.plank, 3);
  assert.equal(state.stats.lifetimeSold.wood, 2);
  assert.equal(state.stats.lifetimeEarned.gold, expected);
});

test('unlock-tree purchase applies building availability', () => {
  const state = freshState();
  state.stats.lifetimeProduced.plank = 2;
  const node = state.unlockTree.market_unlock;
  node.bought = true;
  applyUnlockNodeUnlocks(state, node);
  assert.equal(state.unlockedBuildings.market, true);
});

test('addon effects alter storage, speed, manager work, efficiency, and sale value', () => {
  const state = freshState();
  const lumber = { id: 300, type: 'lumber', gx: 0, gy: 0, recipe: 'wood', inv: {}, ptimer: 0, managers: 1, active: false };
  const sawmill = [...state.buildings.values()].find(building => building.type === 'sawmill');
  const market = { id: 301, type: 'market', gx: 0, gy: 0, recipe: null, inv: {}, ptimer: 0, managers: 0, active: false };
  state.addons.lumber_wood_yard.bought = true;
  state.addons.lumber_sharper_axes.bought = true;
  state.addons.lumber_foreman.bought = true;
  state.addons.sawmill_thin_kerf.bought = true;
  state.addons.market_better_rates.bought = true;
  assert.equal(storageCapFor(lumber, 'wood', state.techs, state.addons), 20);
  assert.equal(managerWorkFor(lumber, state.addons), 2);
  assert.deepEqual(recipeInputsFor(sawmill, state.addons), { wood: 1 });
  assert.equal(salePriceFor(market.type, 'plank', state.techs, state.addons), 34);
});

test('addon unlocks can grant manager slots', () => {
  const state = freshState();
  applyAddonUnlocks(state, state.addons.lumber_manager_slot);
  assert.equal(state.managerSlots.lumber, 1);
});

test('managed buildings auto-start and complete production', () => {
  const state = freshState();
  const lumber = { id: 400, type: 'lumber', gx: 0, gy: 0, recipe: 'wood', inv: {}, ptimer: 0, managers: 1, active: false };
  state.buildings.set(lumber.id, lumber);
  for (let i = 0; i < 5; i++) tickGame(state);
  assert.equal(lumber.inv.wood, 1);
  assert.equal(state.stats.lifetimeProduced.wood, 1);
});

test('grid bounds and occupancy are enforced', () => {
  const state = freshState();
  const sawmill = [...state.buildings.values()].find(building => building.type === 'sawmill');
  assert.equal(gridFree(state, sawmill.gx, sawmill.gy, 1, 1), false);
  assert.equal(gridFree(state, -1, 0, 1, 1), false);
  assert.equal(gridFree(state, 0, 0, 1, 1), true);
});

test('save/load preserves unlocks, addons, buildings, and stats', () => {
  const storage = createMemoryStorage();
  globalThis.localStorage = storage;
  const state = freshState();
  state.unlockTree.market_unlock.bought = true;
  state.unlockedBuildings.market = true;
  state.addons.market_larger_stall.bought = true;
  state.stats.lifetimeEarned.gold = 42;
  saveGame({ state, toast() {} });
  const loaded = freshState();
  const context = createContext(loaded);
  loadGame(context);
  assert.equal(loaded.unlockTree.market_unlock.bought, true);
  assert.equal(loaded.unlockedBuildings.market, true);
  assert.equal(loaded.addons.market_larger_stall.bought, true);
  assert.equal(loaded.stats.lifetimeEarned.gold, 42);
});

test('legacy building-unlock techs migrate into unlock-tree nodes', () => {
  const storage = createMemoryStorage();
  globalThis.localStorage = storage;
  storage.setItem('factory-node-prototype-save', JSON.stringify({
    moneyScaleVersion: 2,
    nextId: 1,
    gold: 100,
    techs: {
      market_access: { bought: true },
      mining: { bought: true }
    },
    buildings: [],
    conns: []
  }));
  const state = freshState();
  loadGame(createContext(state));
  assert.equal(state.unlockTree.market_unlock.bought, true);
  assert.equal(state.unlockTree.mine_unlock.bought, true);
  assert.equal(state.unlockedBuildings.market, true);
  assert.equal(state.unlockedBuildings.iron_mine, true);
});

test('corrupted save data reports an error without resetting state', () => {
  const storage = createMemoryStorage();
  globalThis.localStorage = storage;
  storage.setItem('factory-node-prototype-save', '{bad json');
  const state = freshState();
  const beforeGold = state.gold;
  const context = createContext(state);
  const warn = console.warn;
  console.warn = () => {};
  try {
    loadGame(context);
  } finally {
    console.warn = warn;
  }
  assert.equal(state.gold, beforeGold);
  assert.deepEqual(context.toasts, ['Save data is corrupted']);
});

test('content shape exposes expected recipes for starter building', () => {
  const state = freshState();
  const sawmill = [...state.buildings.values()].find(building => building.type === 'sawmill');
  assert.equal(activeRecipe(sawmill).output.res, 'plank');
});

test('unlock-tree validation rejects parent cycles', () => {
  const content = structuredClone(baseContent);
  content.unlockTree.sawmill_unlock.parent = 'lumber_unlock';
  content.unlockTree.lumber_unlock.parent = 'sawmill_unlock';
  const result = validateContent(content);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.includes('parent cycle')));
});

test('unlock-tree validation rejects duplicate positions', () => {
  const content = structuredClone(baseContent);
  content.unlockTree.market_unlock.position = { ...content.unlockTree.lumber_unlock.position };
  const result = validateContent(content);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.includes('share position')));
});

test('unlock-tree validation rejects empty hidden descriptions', () => {
  const content = structuredClone(baseContent);
  content.unlockTree.mine_unlock.identity.hiddenDescription = ' ';
  const result = validateContent(content);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.includes('identity.hiddenDescription')));
});

test('content validation rejects buyable placeholders', () => {
  const content = structuredClone(baseContent);
  content.addons.forge_quality_reserved.cost = { gold: 10 };
  const result = validateContent(content);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.includes('placeholder')));
});

console.log('hardening tests ok');
