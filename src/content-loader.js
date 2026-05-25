import { setGameContent } from './data.js';
import { validateContent } from './content-validation.js';

const CONTENT_FILES = {
  items: 'items.json',
  buildings: 'buildings.json',
  techs: 'techs.json',
  goals: 'goals.json',
  addons: 'addons.json',
  managers: 'managers.json',
  startState: 'start-state.json'
};

export async function loadContent(basePath = 'content') {
  const raw = {};
  for (const [key, filename] of Object.entries(CONTENT_FILES)) {
    const response = await fetch(`${basePath}/${filename}`);
    if (!response.ok) throw new Error(`Could not load ${filename}: ${response.status}`);
    raw[key] = await response.json();
  }
  return initializeContent(raw);
}

export function initializeContent(rawContent) {
  const validation = validateContent(rawContent);
  if (!validation.valid) {
    throw new Error(`Content validation failed:\n${validation.errors.join('\n')}`);
  }
  if (validation.warnings.length) console.warn('Content validation warnings:', validation.warnings);
  const content = normalizeContent(rawContent);
  setGameContent(content);
  return { content, validation };
}

export function normalizeContent(raw) {
  return {
    items: structuredClone(raw.items),
    buildings: normalizeBuildings(raw.buildings),
    techs: normalizeProgression(raw.techs, 'bought', false),
    goals: normalizeProgression(raw.goals, 'claimed', false),
    addons: normalizeProgression(raw.addons, 'bought', false),
    managers: structuredClone(raw.managers),
    startState: structuredClone(raw.startState)
  };
}

function normalizeBuildings(buildings) {
  return Object.fromEntries(Object.entries(buildings).map(([id, building]) => {
    return [id, {
      label: building.label,
      icon: building.icon,
      color: building.color,
      w: building.size.w,
      h: building.size.h,
      desc: building.description,
      kind: building.kind,
      cost: building.cost.gold || 0,
      costResources: structuredClone(building.cost || {}),
      capacity: structuredClone(building.capacity || {}),
      recipes: normalizeRecipes(building.recipes),
      sellPrices: structuredClone(building.sellPrices || undefined)
    }];
  }));
}

function normalizeRecipes(recipes) {
  if (!recipes) return undefined;
  return Object.fromEntries(Object.entries(recipes).map(([id, recipe]) => {
    return [id, {
      label: recipe.label,
      inputs: structuredClone(recipe.inputs || {}),
      output: {
        res: recipe.output.resource,
        amount: recipe.output.amount
      }
    }];
  }));
}

function normalizeProgression(collection, runtimeFlag, defaultValue) {
  return Object.fromEntries(Object.entries(collection || {}).map(([id, entry]) => {
    return [id, {
      ...structuredClone(entry),
      desc: entry.description,
      [runtimeFlag]: entry[runtimeFlag] ?? defaultValue
    }];
  }));
}
