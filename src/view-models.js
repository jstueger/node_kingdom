import { BUILDINGS, activeRecipe, inputPorts, outputPort } from './data.js?v=save-1';
import { inputAlreadyConnected, recipeTimeFor, salePriceFor, storageCapFor } from './rules.js?v=save-1';

export function nodeViewState(building, connections, techs) {
  const definition = BUILDINGS[building.type];
  const recipe = activeRecipe(building);
  const output = outputPort(building);
  const recipeTime = recipe ? recipeTimeFor(building, recipe, techs) : 0;
  const progress = recipeTime ? Math.min(1, (building.ptimer || 0) / recipeTime) : 0;

  const inputs = inputPorts(building).map((port, index) => {
    const need = recipe?.inputs?.[port.res] || null;
    return {
      res: port.res,
      acceptsAll: Boolean(port.acceptsAll),
      have: port.acceptsAll ? totalInventory(building) : (building.inv[port.res] || 0),
      need,
      connected: inputAlreadyConnected(connections, building.id, index)
    };
  });

  const outputView = output ? {
    res: output.res,
    have: building.inv[output.res] || 0,
    cap: storageCapFor(building, output.res, techs),
    connected: connections.some(connection => connection.fb === building.id)
  } : null;

  return {
    id: building.id,
    type: building.type,
    definition,
    recipe,
    label: definition.label,
    icon: definition.icon,
    color: definition.color,
    size: { w: definition.w, h: definition.h },
    recipeLabel: recipe ? recipe.label : 'Auto Sell',
    progress,
    progressPct: Math.floor(progress * 100),
    status: nodeStatus(definition, recipe, inputs, outputView, building),
    inputs,
    output: outputView,
    inventory: Object.entries(building.inv)
      .filter(([, amount]) => amount > 0)
      .map(([res, amount]) => ({
        res,
        amount,
        cap: storageCapFor(building, res, techs),
        salePrice: salePriceFor(building.type, res, techs)
      }))
  };
}

function totalInventory(building) {
  return Object.values(building.inv).reduce((total, amount) => total + amount, 0);
}

function nodeStatus(definition, recipe, inputs, outputView, building) {
  if (definition.kind === 'seller') return totalInventory(building) > 0 ? 'working' : 'idle';
  if (outputView && outputView.have >= outputView.cap) return 'blocked';
  if (inputs.some(input => input.need !== null && input.have < input.need)) return 'starved';
  if (!recipe) return 'idle';
  return 'working';
}
