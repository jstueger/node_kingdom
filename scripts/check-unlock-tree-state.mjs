import { loadTestContent } from './test-helpers.mjs';
import { applyUnlockNodeUnlocks, spendCost } from '../src/rules.js';
import { createState } from '../src/state.js';
import { UNLOCK_NODE_STATES, unlockNodeState } from '../src/unlock-tree.js';

await loadTestContent();

function assertState(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

const state = createState();
const mineNode = {
  id: 'mine_unlock',
  building: 'iron_mine',
  revealWhen: { lifetimeEarned: { gold: 30 } },
  unlockWhen: { lifetimeEarned: { gold: 60 } },
  cost: { gold: 80 }
};

assertState(unlockNodeState(state, mineNode), UNLOCK_NODE_STATES.HIDDEN_IDENTITY, 'unrevealed node');

state.stats.lifetimeEarned.gold = 30;
assertState(unlockNodeState(state, mineNode), UNLOCK_NODE_STATES.REVEALED_LOCKED, 'revealed but missing milestone');

state.stats.lifetimeEarned.gold = 60;
state.gold = 50;
assertState(unlockNodeState(state, mineNode), UNLOCK_NODE_STATES.REVEALED_LOCKED, 'revealed but unaffordable');

state.gold = 100;
assertState(unlockNodeState(state, mineNode), UNLOCK_NODE_STATES.UNLOCKABLE, 'unlockable node');

state.unlockedBuildings.iron_mine = true;
assertState(unlockNodeState(state, mineNode), UNLOCK_NODE_STATES.UNLOCKED, 'building-backed unlocked node');

const parentedState = createState();
parentedState.unlockTree = { market_unlock: { bought: false } };
parentedState.stats.lifetimeProduced.plank = 2;
const marketChild = {
  id: 'mine_after_market',
  parent: 'market_unlock',
  revealWhen: { lifetimeProduced: { plank: 1 } },
  unlockWhen: { lifetimeProduced: { plank: 2 } },
  cost: {}
};

assertState(unlockNodeState(parentedState, marketChild), UNLOCK_NODE_STATES.REVEALED_LOCKED, 'locked parent node');
parentedState.unlockTree.market_unlock.bought = true;
assertState(unlockNodeState(parentedState, marketChild), UNLOCK_NODE_STATES.UNLOCKABLE, 'unlocked parent node');

const startingParentState = createState();
startingParentState.stats.lifetimeProduced.plank = 2;
const marketNode = { ...startingParentState.unlockTree.market_unlock, id: 'market_unlock' };
assertState(unlockNodeState(startingParentState, marketNode), UNLOCK_NODE_STATES.UNLOCKABLE, 'building-backed starting parent node');

if (!spendCost(startingParentState, marketNode.cost)) throw new Error('free unlock node cost should be spendable');
startingParentState.unlockTree.market_unlock.bought = true;
applyUnlockNodeUnlocks(startingParentState, marketNode);
if (!startingParentState.unlockedBuildings.market) throw new Error('unlock node should apply building unlocks');

console.log('unlock tree state checks ok');
