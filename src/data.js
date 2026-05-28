export const CELL = 18;
export const DEFAULT_ACTION_TICKS = 10;

export let COLS = 40;
export let ROWS = 40;
export let W = COLS * CELL;
export let H = ROWS * CELL;
export let STARTING_GOLD = 100;
export let ITEMS = {};
export let BUILDINGS = {};
export let CONTENT = {
  techs: {},
  goals: {},
  addons: {},
  managers: { slots: {}, costs: {} },
  unlockTree: {},
  startState: { unlockedBuildings: {} }
};

export function setGameContent(content) {
  ITEMS = content.items;
  BUILDINGS = content.buildings;
  CONTENT = {
    techs: content.techs,
    goals: content.goals,
    addons: content.addons,
    managers: content.managers,
    unlockTree: content.unlockTree,
    startState: content.startState
  };
  COLS = content.startState.grid.cols;
  ROWS = content.startState.grid.rows;
  W = COLS * CELL;
  H = ROWS * CELL;
  STARTING_GOLD = content.startState.startingGold;
}

export function itemLabel(res) {
  return ITEMS[res]?.label ?? res;
}

export function itemIcon(res) {
  return ITEMS[res]?.icon ?? '？';
}

export function firstRecipe(type) {
  const recipes = BUILDINGS[type].recipes;
  return recipes ? Object.keys(recipes)[0] : null;
}

export function activeRecipe(building) {
  const recipes = BUILDINGS[building.type].recipes;
  return recipes ? recipes[building.recipe] : null;
}

export function inputPorts(building) {
  const d = BUILDINGS[building.type];
  if (d.kind === 'seller') return [{ side: 'left', t: 0.5, res: 'any', acceptsAll: true, acceptedResources: Object.keys(d.sellPrices || {}) }];
  const inputs = activeRecipe(building).inputs;
  const keys = Object.keys(inputs);
  if (!keys.length) return [];
  return keys.map((res, i) => ({ side: 'left', t: (i + 1) / (keys.length + 1), res }));
}

export function outputPort(building) {
  if (BUILDINGS[building.type].kind === 'seller') return null;
  const out = activeRecipe(building).output;
  if (out.res === 'gold') return null;
  return { side: 'right', t: 0.5, res: out.res };
}

export function capFor(building, res) {
  return BUILDINGS[building.type].capacity?.[res] ?? 10;
}
