export const CELL = 72;
export const COLS = 20;
export const ROWS = 12;
export const W = COLS * CELL;
export const H = ROWS * CELL;

export const ITEMS = {
  iron_ore: { label: 'Iron Ore', icon: '🪨' },
  iron_bar: { label: 'Iron Bar', icon: '⬛' },
  wood: { label: 'Wood', icon: '🌿' },
  plank: { label: 'Plank', icon: '🟫' },
  coal: { label: 'Coal', icon: '⚫' },
  steel_bar: { label: 'Steel Bar', icon: '🔩' },
  sword: { label: 'Sword', icon: '🗡️' }
};

export const BUILDINGS = {
  iron_mine: {
    label: 'Iron Mine', icon: '⛏️', color: '#141c30', w: 1, h: 1,
    desc: 'Produces iron ore.', capacity: { iron_ore: 12 },
    kind: 'producer',
    recipes: {
      iron_ore: {
        label: 'Mine Iron Ore',
        inputs: {},
        output: { res: 'iron_ore', amount: 1 },
        time: 2
      }
    }
  },
  coal_mine: {
    label: 'Coal Mine', icon: '⚫', color: '#171717', w: 1, h: 1,
    desc: 'Produces coal.', capacity: { coal: 12 },
    kind: 'producer',
    recipes: {
      coal: {
        label: 'Mine Coal',
        inputs: {},
        output: { res: 'coal', amount: 1 },
        time: 2
      }
    }
  },
  lumber: {
    label: 'Lumber Camp', icon: '🌲', color: '#0c1c08', w: 1, h: 1,
    desc: 'Produces wood.', capacity: { wood: 12 },
    kind: 'producer',
    recipes: {
      wood: {
        label: 'Cut Wood',
        inputs: {},
        output: { res: 'wood', amount: 1 },
        time: 2
      }
    }
  },
  forge: {
    label: 'Forge', icon: '🔥', color: '#281208', w: 2, h: 1,
    desc: 'Configurable crafter with one active output.',
    kind: 'crafter', capacity: { iron_ore: 9, coal: 8, wood: 6, iron_bar: 8, steel_bar: 6 },
    recipes: {
      iron_bar_charcoal: {
        label: 'Iron Bar',
        inputs: { iron_ore: 3, wood: 1 },
        output: { res: 'iron_bar', amount: 1 },
        time: 3
      },
      steel_bar: {
        label: 'Steel Bar',
        inputs: { iron_ore: 2, coal: 2 },
        output: { res: 'steel_bar', amount: 1 },
        time: 5
      }
    }
  },
  sawmill: {
    label: 'Sawmill', icon: '🪚', color: '#1c1008', w: 2, h: 1,
    desc: 'Turns wood into planks.',
    kind: 'crafter', capacity: { wood: 8, plank: 8 },
    recipes: {
      plank: {
        label: 'Plank',
        inputs: { wood: 2 },
        output: { res: 'plank', amount: 1 },
        time: 2
      }
    }
  },
  blacksmith: {
    label: 'Blacksmith', icon: '⚒️', color: '#201018', w: 2, h: 1,
    desc: 'Crafts finished goods from bars and planks.',
    kind: 'crafter', capacity: { iron_bar: 6, steel_bar: 5, plank: 6, sword: 4 },
    recipes: {
      sword: {
        label: 'Sword',
        inputs: { iron_bar: 2, plank: 1 },
        output: { res: 'sword', amount: 1 },
        time: 4
      },
      steel_sword: {
        label: 'Steel Sword',
        inputs: { steel_bar: 2, plank: 1 },
        output: { res: 'sword', amount: 2 },
        time: 6
      }
    }
  },
  market: {
    label: 'Market', icon: '🏪', color: '#081c0c', w: 1, h: 1,
    desc: 'Sells selected goods for gold.',
    kind: 'seller', capacity: { iron_bar: 10, plank: 10, steel_bar: 8, sword: 8 },
    recipes: {
      sell_iron_bar: {
        label: 'Sell Iron Bars',
        inputs: { iron_bar: 1 },
        output: { res: 'gold', amount: 5 },
        time: 1
      },
      sell_plank: {
        label: 'Sell Planks',
        inputs: { plank: 1 },
        output: { res: 'gold', amount: 3 },
        time: 1
      },
      sell_steel: {
        label: 'Sell Steel Bars',
        inputs: { steel_bar: 1 },
        output: { res: 'gold', amount: 12 },
        time: 1
      },
      sell_sword: {
        label: 'Sell Swords',
        inputs: { sword: 1 },
        output: { res: 'gold', amount: 25 },
        time: 1
      }
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
  return Object.keys(BUILDINGS[type].recipes)[0];
}

export function activeRecipe(building) {
  return BUILDINGS[building.type].recipes[building.recipe];
}

export function inputPorts(building) {
  const inputs = activeRecipe(building).inputs;
  const keys = Object.keys(inputs);
  if (!keys.length) return [];
  return keys.map((res, i) => ({ side: 'left', t: (i + 1) / (keys.length + 1), res }));
}

export function outputPort(building) {
  const out = activeRecipe(building).output;
  if (out.res === 'gold') return null;
  return { side: 'right', t: 0.5, res: out.res };
}

export function capFor(building, res) {
  return BUILDINGS[building.type].capacity?.[res] ?? 10;
}
