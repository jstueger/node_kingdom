import { BUILDINGS, CELL, activeRecipe, inputPorts, itemIcon, itemLabel, outputPort } from './data.js';
import { canPayCost, connectionStatus, formatCost, isBuildingUnlocked, isTechVisible, salePriceFor, storageCapFor } from './rules.js';
import { nodeViewState } from './view-models.js';

function inventoryText(view) {
  return view.inventory.map(item => `${itemIcon(item.res)}${item.amount}`).join(' ');
}

function inputQueueHtml(view) {
  if (!view.inputs.length) return '';
  const rows = view.inputs.map(input => {
    const label = input.acceptsAll ? 'Any' : itemIcon(input.res);
    const amount = input.need === null ? input.have : `${input.have}/${input.need}`;
    return `<div class="qrow ${input.connected ? 'connected' : 'open'} ${input.need !== null && input.have < input.need ? 'missing' : ''}"><span>${label}</span><span>${amount}</span></div>`;
  }).join('');
  return `<div class="node-queue inq">${rows}</div>`;
}

function outputQueueHtml(view) {
  if (!view.output) return '';
  return `<div class="node-queue outq"><div class="qrow ${view.output.connected ? 'connected' : 'open'} ${view.output.have >= view.output.cap ? 'full' : ''}"><span>${itemIcon(view.output.res)}</span><span>${view.output.have}/${view.output.cap}</span></div></div>`;
}

function producerOutputHtml(view) {
  const output = view.output;
  if (!output) return '';
  const fill = Math.floor((output.have / output.cap) * 100);
  return `
    <div class="producer-output ${output.connected ? 'connected' : 'open'} ${output.have >= output.cap ? 'full' : ''}">
      <div class="producer-resource"><span>${itemIcon(output.res)}</span><span>${itemLabel(output.res)}</span></div>
      <div class="producer-meter"><span style="width:${fill}%"></span></div>
      <div class="producer-count">${output.have}/${output.cap}</div>
    </div>`;
}

function marketQueueHtml(view) {
  if (view.inventory.length) {
    const rows = view.inventory.slice(0, 2).map(item => `<div class="qrow connected"><span>${itemIcon(item.res)}</span><span>${item.amount}/${item.cap}</span></div>`).join('');
    return `<div class="market-queue"><div class="market-flow"><span>Sells</span><span>→</span><span>💰</span></div>${rows}<div class="market-sale">+${view.inventory[0].salePrice}g each</div></div>`;
  }
  const input = view.inputs[0];
  return `<div class="market-queue empty"><div class="market-flow"><span>Sells</span><span>→</span><span>💰</span></div><div class="qrow ${input?.connected ? 'connected' : 'open'}"><span>${input?.connected ? 'Ready' : 'No link'}</span><span>0</span></div><div class="market-sale">${input?.connected ? 'Waiting' : 'Connect goods'}</div></div>`;
}

function recipeControlHtml(view, building) {
  if (view.definition.kind !== 'crafter') return '';
  const recipes = Object.keys(view.definition.recipes);
  const hasChoices = recipes.length > 1;
  return `
    <div class="node-recipe-control" data-bid="${building.id}">
      <button class="recipe-step" data-dir="-1" title="Previous recipe" ${hasChoices ? '' : 'disabled'}>&lt;</button>
      <span class="node-recipe-label" title="${view.recipeLabel}">${view.recipeLabel}</span>
      <button class="recipe-step" data-dir="1" title="Next recipe" ${hasChoices ? '' : 'disabled'}>&gt;</button>
    </div>`;
}

function actionControlHtml(view, building) {
  const labels = {
    producer: view.recipeLabel,
    crafter: 'Work',
    seller: 'Sell'
  };
  const disabled = view.status !== 'working';
  return `
    <div class="node-action-control">
      <button class="node-work" data-bid="${building.id}" title="${labels[view.definition.kind]} this node" ${disabled ? 'disabled' : ''}>${labels[view.definition.kind]}</button>
      <span>${view.progressClicks}/${view.actionClicks}</span>
    </div>`;
}

function nodeBodyHtml(view) {
  if (view.definition.kind === 'producer') {
    return `
      <div class="node-main producer-main">
        ${producerOutputHtml(view)}
      </div>`;
  }
  if (view.definition.kind === 'seller') {
    return `
      <div class="node-main seller-main">
        <div class="node-core"><div class="b-ico">${view.icon}</div></div>
        ${marketQueueHtml(view)}
      </div>`;
  }
  return `
    <div class="node-main">
      ${inputQueueHtml(view)}
      <div class="node-core"><div class="b-ico">${view.icon}</div><div class="b-iv">${inventoryText(view)}</div></div>
      ${outputQueueHtml(view)}
    </div>`;
}

function statusLabel(status) {
  return {
    working: 'READY',
    starved: 'WAITING',
    blocked: 'BLOCKED',
    idle: 'IDLE'
  }[status] || status.toUpperCase();
}

function renderPlacementGhost(context) {
  const { state, ui } = context;
  const drag = state.interaction.placementDrag;
  if (!drag?.active || !drag.overGrid) return;
  const definition = BUILDINGS[drag.type];
  const ghost = document.createElement('div');
  ghost.className = `placement-ghost ${drag.valid ? 'valid' : 'invalid'}`;
  ghost.style.cssText = `left:${drag.gx * CELL + 2}px;top:${drag.gy * CELL + 2}px;width:${definition.w * CELL - 4}px;height:${definition.h * CELL - 4}px;background:${definition.color};`;
  ghost.innerHTML = `<div class="placement-ghost-label">${definition.icon} ${definition.label}</div>`;
  ui.bl.appendChild(ghost);
}

export function renderBuildings(context) {
  const { state, ui, geometry, actions } = context;
  ui.bl.innerHTML = '';
  for (const [id, building] of state.buildings) {
    const view = nodeViewState(building, state.connections, state.techs);
    const definition = view.definition;
    const el = document.createElement('div');
    el.className = `bld node--${definition.kind} ${id === state.selectedId ? 'sel' : ''} ${state.interaction.moving?.id === id ? 'moving' : ''} ${state.interaction.moving?.id === id && state.interaction.movingInvalid ? 'invalid' : ''} ${view.status}`;
    el.style.cssText = `left:${building.gx * CELL + 2}px;top:${building.gy * CELL + 2}px;width:${definition.w * CELL - 4}px;height:${definition.h * CELL - 4}px;background:${definition.color};`;
    el.innerHTML = `
      <div class="node-header"><span class="node-title">${view.icon} ${view.label}</span><span class="node-status">${statusLabel(view.status)}</span></div>
      ${recipeControlHtml(view, building)}
      ${nodeBodyHtml(view)}
      ${actionControlHtml(view, building)}
      <div class="prog"><span data-bid="${id}" style="width:${view.progressPct}%"></span></div>`;
    el.querySelectorAll('.node-work').forEach(button => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        actions.workNode(id);
      });
    });
    el.querySelectorAll('.recipe-step').forEach(button => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const recipes = Object.keys(definition.recipes);
        const currentIndex = recipes.indexOf(building.recipe);
        const dir = Number(event.currentTarget.dataset.dir);
        const nextIndex = (currentIndex + dir + recipes.length) % recipes.length;
        actions.changeRecipe(id, recipes[nextIndex]);
      });
    });
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.interaction.suppressNextGridClick) {
        state.interaction.suppressNextGridClick = false;
        return;
      }
      state.selectedId = id;
      renderAll(context);
    });
    el.addEventListener('pointerdown', (event) => actions.startMoveBuilding(event, id));
    el.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      actions.deleteBuilding(id);
    });

    inputPorts(building).forEach((port, portIndex) => {
      const pos = geometry.portPx(building, port);
      const portEl = document.createElement('div');
      portEl.className = 'port in';
      portEl.style.left = `${pos.x - building.gx * CELL}px`;
      portEl.style.top = `${pos.y - building.gy * CELL}px`;
      portEl.dataset.bid = id;
      portEl.dataset.pi = portIndex;
      portEl.dataset.kind = 'in';
      portEl.title = port.acceptsAll ? 'Input: Any resource' : `Input: ${itemLabel(port.res)}`;
      portEl.addEventListener('click', context.actions.onPort);
      el.appendChild(portEl);
    });
    const output = outputPort(building);
    if (output) {
      const pos = geometry.portPx(building, output);
      const portEl = document.createElement('div');
      portEl.className = 'port out';
      portEl.style.left = `${pos.x - building.gx * CELL}px`;
      portEl.style.top = `${pos.y - building.gy * CELL}px`;
      portEl.dataset.bid = id;
      portEl.dataset.pi = 0;
      portEl.dataset.kind = 'out';
      portEl.title = `Output: ${itemLabel(output.res)}`;
      portEl.addEventListener('click', context.actions.onPort);
      el.appendChild(portEl);
    }
    ui.bl.appendChild(el);
  }
  renderPlacementGhost(context);
}

export function renderConnections(context) {
  const { state, ui, geometry, actions } = context;
  const temp = ui.sl.querySelector('#tp');
  ui.sl.innerHTML = '';
  if (temp) ui.sl.appendChild(temp);
  for (const connection of state.connections) {
    const fromBuilding = state.buildings.get(connection.fb);
    const toBuilding = state.buildings.get(connection.tb);
    if (!fromBuilding || !toBuilding) continue;
    const p1 = geometry.portPx(fromBuilding, outputPort(fromBuilding));
    const p2 = geometry.portPx(toBuilding, inputPorts(toBuilding)[connection.tpi]);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', geometry.bez(p1, p2));
    path.setAttribute('class', `cpath ${connectionStatus(connection, state.buildings, state.techs)}`);
    path.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      state.connections = state.connections.filter(item => item.id !== connection.id);
      renderAll(context);
      actions.toast('Connection deleted');
    });
    ui.sl.appendChild(path);
  }
}

export function renderInspector(context) {
  const { state, ui } = context;
  const building = state.buildings.get(state.selectedId);
  if (!building) {
    ui.inspectEmpty.classList.remove('hidden');
    ui.inspectContent.classList.add('hidden');
    ui.inspectContent.innerHTML = '';
    return;
  }
  const definition = BUILDINGS[building.type];
  const recipe = activeRecipe(building);
  ui.inspectEmpty.classList.add('hidden');
  ui.inspectContent.classList.remove('hidden');
  const isSeller = definition.kind === 'seller';
  const inputPills = isSeller
    ? Object.keys(definition.sellPrices).map(res => `<span class="pill">${itemIcon(res)} ${itemLabel(res)} → ${salePriceFor(building.type, res, state.techs)} gold</span>`).join('')
    : Object.entries(recipe.inputs).map(([res, amount]) => `<span class="pill">${itemIcon(res)} ${amount} ${itemLabel(res)}</span>`).join('') || '<span class="pill">No inputs</span>';
  const outputText = isSeller ? 'Sells stocked goods for gold' : `${itemIcon(recipe.output.res)} ${recipe.output.amount} ${itemLabel(recipe.output.res)}`;
  const outputTitle = isSeller ? 'Sale Output' : 'Single Output';
  const invRows = Object.keys({ ...definition.capacity, ...building.inv }).map(res => `<div class="inv-row"><span>${itemIcon(res)} ${itemLabel(res)}</span><span>${building.inv[res] || 0}/${storageCapFor(building, res, state.techs)}</span></div>`).join('');
  ui.inspectContent.innerHTML = `
    <div class="field"><div class="field-title">${definition.icon} ${definition.label}</div><div class="field-sub">${definition.desc}</div></div>
    <div class="field"><div class="field-title">${isSeller ? 'Accepted Goods' : 'Inputs'}</div><div>${inputPills}</div></div>
    <div class="field"><div class="field-title">${outputTitle}</div><div class="field-sub">${outputText}</div></div>
    <div class="field"><div class="field-title">Inventory</div>${invRows || '<div class="field-sub">Empty</div>'}</div>`;
}

export function renderSidebar(context) {
  const { state, actions } = context;
  const cards = document.getElementById('buildingCards');
  cards.innerHTML = '';
  for (const [type, definition] of Object.entries(BUILDINGS)) {
    const unlocked = isBuildingUnlocked(state, type);
    if (!unlocked) continue;
    const card = document.createElement('div');
    card.className = `bcard ${state.placeType === type ? 'sel' : ''} ${state.gold < definition.cost ? 'locked' : ''}`;
    card.innerHTML = `<div class="bcard-n"><span>${definition.icon} ${definition.label}</span><span>${definition.cost}g</span></div><div class="bcard-d">${definition.desc}</div>`;
    card.addEventListener('click', () => actions.selectBuildingType(type, card));
    card.addEventListener('pointerdown', (event) => actions.startPlacementDrag(event, type));
    cards.appendChild(card);
  }
}

export function renderTechTree(context) {
  const { state, actions } = context;
  const cards = document.getElementById('techCards');
  cards.innerHTML = '';
  const visibleTechs = Object.entries(state.techs).filter(([, tech]) => isTechVisible(state, tech));
  for (const tree of ['technology', 'science']) {
    const entries = visibleTechs.filter(([, tech]) => (tech.tree || 'technology') === tree);
    if (!entries.length) continue;
    const header = document.createElement('div');
    header.className = 'tech-group';
    header.textContent = tree === 'science' ? 'Science' : 'Technology';
    cards.appendChild(header);
    for (const [key, tech] of entries) {
      const card = document.createElement('div');
      card.className = `tech-card ${tech.bought ? 'bought' : ''}`;
      const canBuy = canPayCost(state, tech.cost) && !tech.bought;
      card.innerHTML = `
        <div class="tech-head"><span>${tech.label}</span><span>${tech.bought ? 'Bought' : formatCost(tech.cost)}</span></div>
        <div class="tech-desc">${tech.desc}</div>
        <button class="tech-buy" ${canBuy ? '' : 'disabled'}>${tech.bought ? 'Purchased' : 'Buy'}</button>`;
      card.querySelector('button').addEventListener('click', () => actions.buyTech(key));
      cards.appendChild(card);
    }
  }
}

export function renderWorld(context) {
  renderBuildings(context);
  renderConnections(context);
  updateProgressBars(context);
}

export function renderPanels(context) {
  renderSidebar(context);
  renderInspector(context);
  renderTechTree(context);
}

export function renderTopbar(context) {
  const { state, ui } = context;
  ui.goldEl.textContent = `💰 ${state.gold} gold`;
  ui.tstat.textContent = `t=${state.ticks}`;
}

export function renderAll(context) {
  renderPanels(context);
  renderWorld(context);
  renderTopbar(context);
}

export function updateProgressBars(context) {
  const { state, ui } = context;
  ui.bl.querySelectorAll('.prog > span[data-bid]').forEach(bar => {
    const building = state.buildings.get(Number(bar.dataset.bid));
    if (!building) return;
    const view = nodeViewState(building, state.connections, state.techs);
    bar.style.width = `${view.progressPct}%`;
  });
}
