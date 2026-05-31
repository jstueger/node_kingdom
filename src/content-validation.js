const RESOURCE_CONDITION_KEYS = ['lifetimeProduced', 'lifetimeSold'];
const GOLD_CONDITION_KEYS = ['lifetimeEarned'];
const ADDON_EFFECT_RESOURCE_KEYS = ['storage', 'inputEfficiency', 'outputBonus'];
const ADDON_EFFECT_KEYS = ['actionTicks', 'storage', 'storageAll', 'saleMultiplier', 'managerWork', 'inputEfficiency', 'outputBonus'];
const ADDON_TRACKS = ['manager', 'speed', 'quality', 'recipes', 'storage', 'efficiency', 'sale'];

export function validateContent(content) {
  const errors = [];
  const warnings = [];
  const itemIds = new Set(Object.keys(content.items || {}));
  const buildingIds = new Set(Object.keys(content.buildings || {}));
  const techIds = new Set(Object.keys(content.techs || {}));
  const unlockTreeIds = new Set(Object.keys(content.unlockTree || {}));

  validateItems(content.items || {}, errors);
  validateBuildings(content.buildings || {}, itemIds, errors);
  validateTechs(content.techs || {}, itemIds, buildingIds, errors, warnings);
  validateGoals(content.goals || {}, itemIds, techIds, buildingIds, errors);
  validateAddons(content.addons || {}, itemIds, buildingIds, techIds, errors);
  validateManagers(content.managers || {}, itemIds, buildingIds, errors);
  validateUnlockTree(content.unlockTree || {}, itemIds, buildingIds, techIds, unlockTreeIds, errors);
  validateStartState(content.startState || {}, content.buildings || {}, itemIds, buildingIds, errors);
  validateReachability(content, buildingIds, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

function validateUnlockTree(unlockTree, itemIds, buildingIds, techIds, unlockTreeIds, errors) {
  for (const [id, node] of Object.entries(unlockTree)) {
    if (node.kind !== 'buildingUnlock') errors.push(`Unlock tree node "${id}" has unknown kind "${node.kind}"`);
    if (!buildingIds.has(node.building)) errors.push(`Unlock tree node "${id}" references unknown building "${node.building}"`);
    if (node.parent !== undefined && !unlockTreeIds.has(node.parent)) errors.push(`Unlock tree node "${id}" references unknown parent "${node.parent}"`);
    validateRefs(node.parents || [], unlockTreeIds, `Unlock tree node "${id}" parents`, errors);
    validateNonNegativeNumber(node.position?.x, `Unlock tree node "${id}" position.x`, errors);
    validateNonNegativeNumber(node.position?.y, `Unlock tree node "${id}" position.y`, errors);
    requireString(node.identity?.hiddenLabel, `Unlock tree node "${id}" is missing identity.hiddenLabel`, errors);
    requireString(node.identity?.revealedLabel, `Unlock tree node "${id}" is missing identity.revealedLabel`, errors);
    requireString(node.description, `Unlock tree node "${id}" is missing description`, errors);
    validateCondition(node.revealWhen || {}, itemIds, techIds, buildingIds, `Unlock tree node "${id}" revealWhen`, errors);
    validateCondition(node.unlockWhen || {}, itemIds, techIds, buildingIds, `Unlock tree node "${id}" unlockWhen`, errors);
    validateCost(node.cost || {}, itemIds, `Unlock tree node "${id}" cost`, errors);
    validateRefs(node.unlocks?.buildings || [], buildingIds, `Unlock tree node "${id}" unlocked buildings`, errors);
    for (const [type, amount] of Object.entries(node.unlocks?.managerSlots || {})) {
      if (!buildingIds.has(type)) errors.push(`Unlock tree node "${id}" unlocks Manager slots for unknown building "${type}"`);
      validatePositiveNumber(amount, `Unlock tree node "${id}" Manager slot amount for "${type}"`, errors);
    }
  }
}

function validateItems(items, errors) {
  for (const [id, item] of Object.entries(items)) {
    requireString(item.label, `Item "${id}" is missing label`, errors);
    requireString(item.icon, `Item "${id}" is missing icon`, errors);
  }
}

function validateBuildings(buildings, itemIds, errors) {
  for (const [id, building] of Object.entries(buildings)) {
    requireString(building.label, `Building "${id}" is missing label`, errors);
    requireString(building.description, `Building "${id}" is missing description`, errors);
    requireString(building.icon, `Building "${id}" is missing icon`, errors);
    requireString(building.color, `Building "${id}" is missing color`, errors);
    if (!['producer', 'crafter', 'seller'].includes(building.kind)) errors.push(`Building "${id}" has unknown kind "${building.kind}"`);
    validatePositiveNumber(building.size?.w, `Building "${id}" size.w`, errors);
    validatePositiveNumber(building.size?.h, `Building "${id}" size.h`, errors);
    if (building.actionClicks !== undefined) errors.push(`Building "${id}" uses legacy actionClicks; use actionTicks`);
    if (building.actionTicks !== undefined) validatePositiveNumber(building.actionTicks, `Building "${id}" actionTicks`, errors);
    validateCost(building.cost, itemIds, `Building "${id}" cost`, errors);
    validateResourceMap(building.capacity || {}, itemIds, `Building "${id}" capacity`, errors);

    if (building.kind === 'seller') {
      validateResourceMap(building.sellPrices || {}, itemIds, `Building "${id}" sellPrices`, errors);
      return;
    }

    if (!building.recipes || !Object.keys(building.recipes).length) errors.push(`Building "${id}" needs at least one recipe`);
    for (const [recipeId, recipe] of Object.entries(building.recipes || {})) {
      requireString(recipe.label, `Recipe "${id}.${recipeId}" is missing label`, errors);
      validateResourceMap(recipe.inputs || {}, itemIds, `Recipe "${id}.${recipeId}" inputs`, errors);
      const resource = recipe.output?.resource;
      if (!resource) errors.push(`Recipe "${id}.${recipeId}" is missing output.resource`);
      else if (resource !== 'gold' && !itemIds.has(resource)) errors.push(`Recipe "${id}.${recipeId}" outputs unknown resource "${resource}"`);
      validatePositiveNumber(recipe.output?.amount, `Recipe "${id}.${recipeId}" output amount`, errors);
      if (resource && resource !== 'gold' && !building.capacity?.[resource]) {
        errors.push(`Building "${id}" produces "${resource}" but has no capacity for it`);
      }
    }
  }
}

function validateTechs(techs, itemIds, buildingIds, errors, warnings) {
  for (const [id, tech] of Object.entries(techs)) {
    requireString(tech.label, `Tech "${id}" is missing label`, errors);
    requireString(tech.description, `Tech "${id}" is missing description`, errors);
    validateRefs(tech.requires || [], Object.keys(techs), `Tech "${id}" requires`, errors);
    validateCost(tech.cost || {}, itemIds, `Tech "${id}" cost`, errors);
    validateCondition(tech.visibleWhen || {}, itemIds, Object.keys(techs), buildingIds, `Tech "${id}" visibleWhen`, errors);
    validateRefs(tech.unlocks?.buildings || [], buildingIds, `Tech "${id}" unlocked buildings`, errors);
    for (const [type, amount] of Object.entries(tech.unlocks?.managerSlots || {})) {
      if (!buildingIds.has(type)) errors.push(`Tech "${id}" unlocks Manager slots for unknown building "${type}"`);
      validatePositiveNumber(amount, `Tech "${id}" Manager slot amount for "${type}"`, errors);
    }
  }
  validateTechCycles(techs, errors);
  for (const [id, tech] of Object.entries(techs)) {
    if ((tech.requires || []).length && !tech.visibleWhen && !(tech.unlocks && Object.keys(tech.unlocks).length)) {
      warnings.push(`Tech "${id}" has prerequisites but no visibleWhen or unlocks`);
    }
  }
}

function validateGoals(goals, itemIds, techIds, buildingIds, errors) {
  for (const [id, goal] of Object.entries(goals)) {
    requireString(goal.label, `Goal "${id}" is missing label`, errors);
    requireString(goal.description, `Goal "${id}" is missing description`, errors);
    validateCondition(goal.visibleWhen || {}, itemIds, techIds, buildingIds, `Goal "${id}" visibleWhen`, errors);
    validateCondition(goal.completeWhen || {}, itemIds, techIds, buildingIds, `Goal "${id}" completeWhen`, errors);
    validateCost(goal.reward || {}, itemIds, `Goal "${id}" reward`, errors);
  }
}

function validateAddons(addons, itemIds, buildingIds, techIds, errors) {
  for (const [id, addon] of Object.entries(addons)) {
    if (!buildingIds.has(addon.node)) errors.push(`Addon "${id}" targets unknown building "${addon.node}"`);
    requireString(addon.track, `Addon "${id}" is missing track`, errors);
    if (addon.track !== undefined && !ADDON_TRACKS.includes(addon.track)) errors.push(`Addon "${id}" has unknown track "${addon.track}"`);
    requireString(addon.label, `Addon "${id}" is missing label`, errors);
    requireString(addon.description, `Addon "${id}" is missing description`, errors);
    validateCost(addon.cost || {}, itemIds, `Addon "${id}" cost`, errors);
    validateCondition(addon.visibleWhen || {}, itemIds, techIds, buildingIds, `Addon "${id}" visibleWhen`, errors);
    for (const key of Object.keys(addon.effects || {})) {
      if (!ADDON_EFFECT_KEYS.includes(key)) errors.push(`Addon "${id}" has unknown effect "${key}"`);
    }
    for (const key of ADDON_EFFECT_RESOURCE_KEYS) validateResourceMap(addon.effects?.[key] || {}, itemIds, `Addon "${id}" ${key}`, errors);
  }
}

function validateManagers(managers, itemIds, buildingIds, errors) {
  for (const [type, amount] of Object.entries(managers.slots || {})) {
    if (!buildingIds.has(type)) errors.push(`Manager slots reference unknown building "${type}"`);
    validatePositiveNumber(amount, `Manager slots for "${type}"`, errors);
  }
  for (const [type, cost] of Object.entries(managers.costs || {})) {
    if (type !== 'default' && !buildingIds.has(type)) errors.push(`Manager cost references unknown building "${type}"`);
    validateCost(cost, itemIds, `Manager cost for "${type}"`, errors);
  }
}

function validateStartState(startState, buildings, itemIds, buildingIds, errors) {
  validatePositiveNumber(startState.grid?.cols, 'Start state grid.cols', errors);
  validatePositiveNumber(startState.grid?.rows, 'Start state grid.rows', errors);
  validateNonNegativeNumber(startState.startingGold, 'Start state startingGold', errors);
  if (startState.hint !== undefined) requireString(startState.hint, 'Start state hint must be a string', errors);
  for (const type of Object.keys(startState.unlockedBuildings || {})) {
    if (!buildingIds.has(type)) errors.push(`Start state unlocks unknown building "${type}"`);
  }
  const occupied = new Set();
  for (const [index, building] of (startState.buildings || []).entries()) {
    const label = `Start building ${index + 1}`;
    if (!buildingIds.has(building.type)) {
      errors.push(`${label} references unknown building "${building.type}"`);
      continue;
    }
    const definition = buildings[building.type];
    validateNonNegativeNumber(building.gx, `${label} gx`, errors);
    validateNonNegativeNumber(building.gy, `${label} gy`, errors);
    validateResourceMap(building.inventory || {}, itemIds, `${label} inventory`, errors);
    if (building.recipe !== undefined && typeof building.recipe !== 'string') errors.push(`${label} recipe must be a string`);
    if (!definition) continue;
    if (building.recipe && definition.recipes && !definition.recipes[building.recipe]) {
      errors.push(`${label} references unknown recipe "${building.recipe}" for "${building.type}"`);
    }
    if (building.gx + definition.size.w > startState.grid.cols || building.gy + definition.size.h > startState.grid.rows) {
      errors.push(`${label} is outside the starting grid`);
    }
    for (let y = 0; y < definition.size.h; y++) {
      for (let x = 0; x < definition.size.w; x++) {
        const key = `${building.gx + x},${building.gy + y}`;
        if (occupied.has(key)) errors.push(`${label} overlaps another start building`);
        occupied.add(key);
      }
    }
  }
}

function validateReachability(content, buildingIds, warnings) {
  const startBuildings = new Set(Object.keys(content.startState?.unlockedBuildings || {}));
  const techUnlockedBuildings = new Set();
  for (const tech of Object.values(content.techs || {})) {
    for (const type of tech.unlocks?.buildings || []) techUnlockedBuildings.add(type);
  }
  for (const node of Object.values(content.unlockTree || {})) {
    for (const type of node.unlocks?.buildings || []) techUnlockedBuildings.add(type);
  }
  for (const type of buildingIds) {
    if (!startBuildings.has(type) && !techUnlockedBuildings.has(type)) {
      warnings.push(`Building "${type}" is not in start-state and is not unlocked by any tech`);
    }
  }
}

function validateCondition(condition, itemIds, techIds, buildingIds, label, errors) {
  for (const key of RESOURCE_CONDITION_KEYS) validateResourceMap(condition[key] || {}, itemIds, `${label}.${key}`, errors);
  for (const key of GOLD_CONDITION_KEYS) validateCost(condition[key] || {}, itemIds, `${label}.${key}`, errors);
  validateRefs(condition.techs || [], techIds, `${label}.techs`, errors);
  validateRefs(condition.unlockedBuildings || [], buildingIds, `${label}.unlockedBuildings`, errors);
}

function validateCost(cost = {}, itemIds, label, errors) {
  for (const [resource, amount] of Object.entries(cost)) {
    if (resource !== 'gold' && itemIds.size && !itemIds.has(resource)) errors.push(`${label} references unknown resource "${resource}"`);
    validateNonNegativeNumber(amount, `${label}.${resource}`, errors);
  }
}

function validateResourceMap(map = {}, itemIds, label, errors) {
  for (const [resource, amount] of Object.entries(map)) {
    if (!itemIds.has(resource)) errors.push(`${label} references unknown resource "${resource}"`);
    validateNonNegativeNumber(amount, `${label}.${resource}`, errors);
  }
}

function validateRefs(refs, known, label, errors) {
  const knownSet = known instanceof Set ? known : new Set(known);
  for (const ref of refs) if (!knownSet.has(ref)) errors.push(`${label} references unknown id "${ref}"`);
}

function validateTechCycles(techs, errors) {
  const visiting = new Set();
  const visited = new Set();
  const visit = (id, path) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`Tech dependency cycle: ${[...path, id].join(' -> ')}`);
      return;
    }
    visiting.add(id);
    for (const next of techs[id]?.requires || []) if (techs[next]) visit(next, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of Object.keys(techs)) visit(id, []);
}

function requireString(value, message, errors) {
  if (typeof value !== 'string' || !value.trim()) errors.push(message);
}

function validatePositiveNumber(value, label, errors) {
  if (typeof value !== 'number' || value <= 0) errors.push(`${label} must be a positive number`);
}

function validateNonNegativeNumber(value, label, errors) {
  if (typeof value !== 'number' || value < 0) errors.push(`${label} must be a non-negative number`);
}
