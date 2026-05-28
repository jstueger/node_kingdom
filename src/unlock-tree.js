import { canPayCost, isBuildingUnlocked, isConditionMet } from './rules.js';

export const UNLOCK_NODE_STATES = {
  HIDDEN_IDENTITY: 'hiddenIdentity',
  REVEALED_LOCKED: 'revealedLocked',
  UNLOCKABLE: 'unlockable',
  UNLOCKED: 'unlocked'
};

export function unlockNodeState(state, node) {
  if (isUnlockNodeUnlocked(state, node)) return UNLOCK_NODE_STATES.UNLOCKED;
  if (!isUnlockNodeIdentityRevealed(state, node)) return UNLOCK_NODE_STATES.HIDDEN_IDENTITY;
  if (isUnlockNodeUnlockable(state, node)) return UNLOCK_NODE_STATES.UNLOCKABLE;
  return UNLOCK_NODE_STATES.REVEALED_LOCKED;
}

export function isUnlockNodeUnlocked(state, node) {
  if (node.bought || state.unlockTree?.[node.id]?.bought) return true;
  if (node.building && isBuildingUnlocked(state, node.building)) return true;
  return false;
}

export function isUnlockNodeIdentityRevealed(state, node) {
  return isConditionMet(state, node.revealWhen || {});
}

export function areUnlockNodeConditionsMet(state, node) {
  if (!areParentNodesUnlocked(state, node)) return false;
  return isConditionMet(state, node.unlockWhen || node.visibleWhen || {});
}

export function isUnlockNodeAffordable(state, node) {
  return canPayCost(state, node.cost || {});
}

export function isUnlockNodeUnlockable(state, node) {
  return areUnlockNodeConditionsMet(state, node) && isUnlockNodeAffordable(state, node);
}

function areParentNodesUnlocked(state, node) {
  const parents = node.parents || (node.parent ? [node.parent] : []);
  return parents.every(parentId => state.unlockTree?.[parentId]?.bought);
}
