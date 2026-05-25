const RESOURCE_CONDITION_KEYS = ['lifetimeProduced', 'lifetimeSold'];
const GOLD_CONDITION_KEYS = ['lifetimeEarned'];
const ADDON_EFFECT_RESOURCE_KEYS = ['storage', 'inputEfficiency', 'outputBonus'];
const ADDON_EFFECT_KEYS = ['actionClicks', 'storage', 'storageAll', 'saleMultiplier', 'managerWork', 'inputEfficiency', 'outputBonus'];

export function validateContent(content) {
  const errors = [];
  const warnings = [];
  const itemIds = new Set(Object.keys(content.items || {}));
  const buildingIds = new Set(Object.keys(content.buildings || {}));
  const techIds = new Set(Object.keys(content.techs || {}));

  validateItems(content.items || {}, errors);
  validateBuildings(content.buildings || {}, itemIds, errors);
  validateTechs(content.techs || {}, itemIds, buildingIds, errors, warnings);
  validateGoals(content.goals || {}, itemIds, techIds, errors);
  validateAddons(content.addons || {}, itemIds, buildingIds, techIds, errors);
  validateManagers(content.managers || {}, itemIds, buildingIds, errors);
  validateStartState(content.startState || {}, buildingIds, errors);

  return { valid: errors.length === 0, errors, warnings };
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

function validateGoals(goals, itemIds, techIds, errors) {
  for (const [id, goal] of Object.entries(goals)) {
    requireString(goal.label, `Goal "${id}" is missing label`, errors);
    requireString(goal.description, `Goal "${id}" is missing description`, errors);
    validateCondition(goal.visibleWhen || {}, itemIds, techIds, new Set(), `Goal "${id}" visibleWhen`, errors);
    validateCondition(goal.completeWhen || {}, itemIds, techIds, new Set(), `Goal "${id}" completeWhen`, errors);
    validateCost(goal.reward || {}, itemIds, `Goal "${id}" reward`, errors);
  }
}

function validateAddons(addons, itemIds, buildingIds, techIds, errors) {
  for (const [id, addon] of Object.entries(addons)) {
    if (!buildingIds.has(addon.node)) errors.push(`Addon "${id}" targets unknown building "${addon.node}"`);
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

function validateStartState(startState, buildingIds, errors) {
  validatePositiveNumber(startState.grid?.cols, 'Start state grid.cols', errors);
  validatePositiveNumber(startState.grid?.rows, 'Start state grid.rows', errors);
  validateNonNegativeNumber(startState.startingGold, 'Start state startingGold', errors);
  for (const type of Object.keys(startState.unlockedBuildings || {})) {
    if (!buildingIds.has(type)) errors.push(`Start state unlocks unknown building "${type}"`);
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
