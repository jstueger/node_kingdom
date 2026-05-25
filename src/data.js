export const CELL = 18;
export const COLS = 40;
export const ROWS = 40;
export const W = COLS * CELL;
export const H = ROWS * CELL;
export const STARTING_GOLD = 25;
export const MANUAL_ACTION_CLICKS = 10;

export const ITEMS = {
  iron_ore: { label: 'Iron Ore', icon: '🪨' },
  iron_bar: { label: 'Iron Bar', icon: '⬛' },
  wood: { label: 'Wood', icon: '🌿' },
  plank: { label: 'Plank', icon: '🟫' },
  coal: { label: 'Coal', icon: '⚫' },
  steel_bar: { label: 'Steel Bar', icon: '🔩' },
  sword: { label: 'Sword', icon: '🗡️' },
  knowledge: { label: 'Knowledge', icon: '📜' }
};

export const BUILDINGS = {
  iron_mine: {
    label: 'Iron Mine', icon: '⛏️', color: '#141c30', w: 8, h: 8,
    desc: 'Produces iron ore.',
    kind: 'producer',
    cost: 5,
    capacity: { iron_ore: 12 },
    recipes: {
      iron_ore: {
        label: 'Mine Iron Ore',
        inputs: {},
        output: { res: 'iron_ore', amount: 1 }
      }
    }
  },
  coal_mine: {
    label: 'Coal Mine', icon: '⚫', color: '#171717', w: 8, h: 8,
    desc: 'Produces coal.',
    kind: 'producer',
    cost: 5,
    capacity: { coal: 12 },
    recipes: {
      coal: {
        label: 'Mine Coal',
        inputs: {},
        output: { res: 'coal', amount: 1 }
      }
    }
  },
  lumber: {
    label: 'Lumber Camp', icon: '🌲', color: '#0c1c08', w: 8, h: 8,
    desc: 'Produces wood.',
    kind: 'producer',
    cost: 5,
    capacity: { wood: 12 },
    recipes: {
      wood: {
        label: 'Cut Wood',
        inputs: {},
        output: { res: 'wood', amount: 1 }
      }
    }
  },
  forge: {
    label: 'Forge', icon: '🔥', color: '#281208', w: 16, h: 8,
    desc: 'Configurable crafter with one active output.',
    kind: 'crafter',
    cost: 12,
    capacity: { iron_ore: 9, coal: 8, wood: 6, iron_bar: 8, steel_bar: 6 },
    recipes: {
      iron_bar_charcoal: {
        label: 'Iron Bar',
        inputs: { iron_ore: 3, wood: 1 },
        output: { res: 'iron_bar', amount: 1 }
      },
      steel_bar: {
        label: 'Steel Bar',
        inputs: { iron_ore: 2, coal: 2 },
        output: { res: 'steel_bar', amount: 1 }
      }
    }
  },
  sawmill: {
    label: 'Sawmill', icon: '🪚', color: '#1c1008', w: 16, h: 8,
    desc: 'Turns wood into planks.',
    kind: 'crafter',
    cost: 10,
    capacity: { wood: 8, plank: 8 },
    recipes: {
      plank: {
        label: 'Plank',
        inputs: { wood: 2 },
        output: { res: 'plank', amount: 1 }
      }
    }
  },
  blacksmith: {
    label: 'Blacksmith', icon: '⚒️', color: '#201018', w: 16, h: 8,
    desc: 'Crafts finished goods from bars and planks.',
    kind: 'crafter',
    cost: 18,
    capacity: { iron_bar: 6, steel_bar: 5, plank: 6, sword: 4 },
    recipes: {
      sword: {
        label: 'Sword',
        inputs: { iron_bar: 2, plank: 1 },
        output: { res: 'sword', amount: 1 }
      },
      steel_sword: {
        label: 'Steel Sword',
        inputs: { steel_bar: 2, plank: 1 },
        output: { res: 'sword', amount: 2 }
      }
    }
  },
  school: {
    label: 'School', icon: '📚', color: '#10201c', w: 16, h: 8,
    desc: 'Produces knowledge for science upgrades.',
    kind: 'producer',
    cost: 25,
    capacity: { knowledge: 10 },
    recipes: {
      knowledge: {
        label: 'Study',
        inputs: {},
        output: { res: 'knowledge', amount: 1 }
      }
    }
  },
  market: {
    label: 'Market', icon: '🏪', color: '#081c0c', w: 8, h: 8,
    desc: 'Sells any trade goods it receives.',
    kind: 'seller',
    cost: 5,
    capacity: { iron_ore: 10, wood: 10, coal: 10, iron_bar: 10, plank: 10, steel_bar: 8, sword: 8 },
    sellPrices: {
      iron_ore: 1,
      wood: 1,
      coal: 2,
      iron_bar: 5,
      plank: 3,
      steel_bar: 12,
      sword: 25
    }
  }
};

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
