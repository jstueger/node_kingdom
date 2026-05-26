import { BUILDINGS, CELL, inputPorts, itemIcon, itemLabel, outputPort } from './data.js';
import { areTechMilestonesMet, areTechPrerequisitesMet, canBuyManager, canPayCost, connectionStatus, formatCost, isAddonVisible, isBuildingUnlocked, isGoalComplete, isGoalVisible, isTechDiscovered, managerCostFor, managerCountFor, managerSlotsFor, recipeInputsFor, recipeOutputFor, salePriceFor, storageCapFor } from './rules.js';
import { nodeViewState } from './view-models.js';

const TICK_SECONDS = 1;

function formatSeconds(seconds) {
  const clamped = Math.max(0, seconds);
  if (clamped >= 10 || Number.isInteger(clamped)) return `${Math.ceil(clamped)}s`;
  return `${Math.ceil(clamped * 10) / 10}s`;
}

function progressTicksForDisplay(state, view, building) {
  if (!view.active || !view.actionTicks) return view.progressTicks;
  const baseline = view.progressTicks === 0 && building.displayProgressStartedAt
    ? building.displayProgressStartedAt
    : state.clock.lastTickAt;
  const elapsedSeconds = Math.min(TICK_SECONDS, (performance.now() - baseline) / 1000);
  const progressPerSecond = view.managers ? view.managerWork : 1;
  return Math.min(view.actionTicks, view.progressTicks + elapsedSeconds * progressPerSecond);
}

function progressPctForDisplay(state, view, building) {
  if (!view.actionTicks) return 0;
  return (progressTicksForDisplay(state, view, building) / view.actionTicks) * 100;
}

function workTimeLabel(view, displayProgressTicks = view.progressTicks) {
  if (!view.actionTicks) return '';
  const seconds = view.active ? view.actionTicks - displayProgressTicks : view.actionTicks;
  return formatSeconds(seconds);
}

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

function actionControlHtml(state, view, building) {
  const labels = {
    producer: view.recipeLabel,
    crafter: 'Work',
    seller: 'Sell'
  };
  const disabled = view.status !== 'ready';
  const buttonLabel = view.active ? 'Working' : labels[view.definition.kind];
  return `
    <div class="node-action-control">
      <button class="node-work" data-bid="${building.id}" title="${labels[view.definition.kind]} this node" ${disabled ? 'disabled' : ''}>${buttonLabel}</button>
      <span class="node-time" data-time-bid="${building.id}" title="${view.managers ? 'Managed automation active' : 'Timed work progress'}">${workTimeLabel(view, progressTicksForDisplay(state, view, building))}${view.managerWork > 1 ? ` x${view.managerWork}` : view.managers ? ' A' : ''}</span>
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
    working: 'WORKING',
    ready: 'READY',
    waiting: 'WAITING',
    blocked: 'BLOCKED',
    idle: 'IDLE'
  }[status] || status.toUpperCase();
}

function amountLabel(resource, amount) {
  return resource === 'gold' ? `${amount} gold` : `${itemIcon(resource)} ${amount} ${itemLabel(resource)}`;
}

function lifetimeSummaryHtml(state) {
  const produced = state.stats.lifetimeProduced;
  const earned = state.stats.lifetimeEarned;
  const rows = [
    ['gold', earned.gold || 0, 'earned'],
    ['wood', produced.wood || 0, 'produced'],
    ['iron_ore', produced.iron_ore || 0, 'produced'],
    ['plank', produced.plank || 0, 'produced'],
    ['iron_bar', produced.iron_bar || 0, 'produced'],
    ['sword', produced.sword || 0, 'produced'],
    ['knowledge', produced.knowledge || 0, 'produced']
  ];
  return `
    <div class="tech-summary">
      ${rows.map(([resource, amount, mode]) => `<span>${resource === 'gold' ? '💰' : itemIcon(resource)} ${amount} ${mode}</span>`).join('')}
    </div>`;
}

function techMetaHtml(state, tech) {
  const visibleWhen = tech.visibleWhen || {};
  const milestones = [];
  for (const [resource, amount] of Object.entries(visibleWhen.lifetimeProduced || {})) {
    const current = state.stats.lifetimeProduced[resource] || 0;
    milestones.push(`${current >= amount ? '✓' : '·'} ${itemIcon(resource)} ${current}/${amount} ${itemLabel(resource)} produced`);
  }
  for (const [resource, amount] of Object.entries(visibleWhen.lifetimeEarned || {})) {
    const current = state.stats.lifetimeEarned[resource] || 0;
    milestones.push(`${current >= amount ? '✓' : '·'} ${current}/${amount} ${resource} earned`);
  }
  for (const type of visibleWhen.unlockedBuildings || []) {
    milestones.push(`${isBuildingUnlocked(state, type) ? '✓' : '·'} ${BUILDINGS[type].label} unlocked`);
  }

  const prerequisites = (tech.requires || []).map(key => `${state.techs[key]?.bought ? '✓' : '·'} ${state.techs[key]?.label || key}`);
  const unlocks = (tech.unlocks?.buildings || []).map(type => BUILDINGS[type]?.label || type);
  const managerUnlocks = Object.entries(tech.unlocks?.managerSlots || {}).map(([type, amount]) => `${amount} ${BUILDINGS[type]?.label || type} Manager slot`);
  const rows = [];
  if (prerequisites.length) rows.push(`<div><span>Requires</span><b>${prerequisites.join(', ')}</b></div>`);
  if (milestones.length) rows.push(`<div><span>Milestone</span><b>${milestones.join(', ')}</b></div>`);
  if (unlocks.length) rows.push(`<div><span>Unlocks</span><b>${unlocks.join(', ')}</b></div>`);
  if (managerUnlocks.length) rows.push(`<div><span>Unlocks</span><b>${managerUnlocks.join(', ')}</b></div>`);
  if (Object.keys(tech.cost || {}).length) rows.push(`<div><span>Cost</span><b>${Object.entries(tech.cost).map(([resource, amount]) => amountLabel(resource, amount)).join(', ')}</b></div>`);
  return rows.length ? `<div class="tech-meta">${rows.join('')}</div>` : '';
}

function techStatus(state, tech) {
  if (tech.bought) return { key: 'bought', label: 'Purchased', button: 'Purchased', disabled: true };
  if (!areTechPrerequisitesMet(state, tech)) return { key: 'gated', label: 'Requires tech', button: 'Locked', disabled: true };
  if (!areTechMilestonesMet(state, tech)) return { key: 'gated', label: 'Needs milestone', button: 'Locked', disabled: true };
  if (!canPayCost(state, tech.cost)) return { key: 'unaffordable', label: 'Need resources', button: 'Need resources', disabled: true };
  return { key: 'available', label: 'Available', button: 'Buy', disabled: false };
}

function rewardText(reward = {}) {
  const parts = [];
  if (reward.gold) parts.push(`+${reward.gold} gold`);
  return parts.join(', ');
}

function addonHtml(state, building) {
  const addons = Object.entries(state.addons).filter(([, addon]) => addon.node === building.type && isAddonVisible(state, addon));
  if (!addons.length) return '<div class="field-sub">No addons available for this node type.</div>';
  return addons.map(([key, addon]) => {
    const affordable = canPayCost(state, addon.cost);
    const status = addon.bought ? 'Purchased' : affordable ? formatCost(addon.cost) : `Need ${formatCost(addon.cost)}`;
    return `
      <div class="addon-card ${addon.bought ? 'bought' : ''}">
        <div class="addon-head"><span>${addon.label}</span><span>${status}</span></div>
        <div class="addon-desc">${addon.desc}</div>
        <button class="addon-buy" data-addon="${key}" ${addon.bought || !affordable ? 'disabled' : ''}>${addon.bought ? 'Purchased' : 'Buy'}</button>
      </div>`;
  }).join('');
}

function managerSlotsHtml(state, building) {
  const slots = managerSlotsFor(state, building.type);
  if (!slots) return '<div class="field-sub">No Manager slot unlocked for this node type.</div>';
  const managers = managerCountFor(building);
  const firstOpenIndex = managers;
  const cost = managerCostFor(building.type);
  return Array.from({ length: slots }, (_, index) => `
    <div class="manager-slot ${index < managers ? 'filled' : ''}">
      <span>Manager Slot ${index + 1}</span>
      ${index < managers
        ? '<span>Active</span>'
        : `<button class="manager-buy" data-bid="${building.id}" ${index !== firstOpenIndex || !canBuyManager(state, building) ? 'disabled' : ''}>Hire ${formatCost(cost)}</button>`}
    </div>`).join('');
}

function efficiencyHtml(state, building) {
  const view = nodeViewState(building, state.connections, state.techs, state.addons);
  const rows = [`<div class="inv-row"><span>Work Time</span><span>${formatSeconds(view.actionTicks)}</span></div>`];
  if (view.managers) rows.push(`<div class="inv-row"><span>Manager Pace</span><span>x${view.managerWork}</span></div>`);
  if (view.definition.kind !== 'seller' && view.effectiveOutput) {
    const inputText = Object.entries(view.effectiveInputs)
      .map(([res, amount]) => `${itemIcon(res)} ${amount}`)
      .join(' ') || 'No inputs';
    rows.push(`<div class="inv-row"><span>Effective Inputs</span><span>${inputText}</span></div>`);
    rows.push(`<div class="inv-row"><span>Effective Output</span><span>${itemIcon(view.effectiveOutput.res)} ${view.effectiveOutput.amount}</span></div>`);
  }
  return rows.join('');
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
    const view = nodeViewState(building, state.connections, state.techs, state.addons);
    const definition = view.definition;
    const el = document.createElement('div');
    el.className = `bld node--${definition.kind} ${id === state.selectedId ? 'sel' : ''} ${state.interaction.moving?.id === id ? 'moving' : ''} ${state.interaction.moving?.id === id && state.interaction.movingInvalid ? 'invalid' : ''} ${view.managers ? 'managed' : ''} ${view.status}`;
    el.style.cssText = `left:${building.gx * CELL + 2}px;top:${building.gy * CELL + 2}px;width:${definition.w * CELL - 4}px;height:${definition.h * CELL - 4}px;background:${definition.color};`;
    el.innerHTML = `
      <div class="node-header"><span class="node-title">${view.icon} ${view.label}</span><span class="node-status">${statusLabel(view.status)}</span></div>
      ${recipeControlHtml(view, building)}
      ${nodeBodyHtml(view)}
      ${actionControlHtml(state, view, building)}
      <div class="prog"><span data-bid="${id}" style="width:${progressPctForDisplay(state, view, building)}%"></span></div>`;
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
    path.setAttribute('class', `cpath ${connectionStatus(connection, state.buildings, state.techs, state.addons)}`);
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
  const { state, ui, actions } = context;
  const building = state.buildings.get(state.selectedId);
  if (!building) {
    ui.inspectEmpty.classList.remove('hidden');
    ui.inspectContent.classList.add('hidden');
    ui.inspectContent.innerHTML = '';
    return;
  }
  const definition = BUILDINGS[building.type];
  const effectiveInputs = recipeInputsFor(building, state.addons);
  const effectiveOutput = recipeOutputFor(building, state.addons);
  ui.inspectEmpty.classList.add('hidden');
  ui.inspectContent.classList.remove('hidden');
  const isSeller = definition.kind === 'seller';
  const inputPills = isSeller
    ? Object.keys(definition.sellPrices).map(res => `<span class="pill">${itemIcon(res)} ${itemLabel(res)} → ${salePriceFor(building.type, res, state.techs, state.addons)} gold</span>`).join('')
    : Object.entries(effectiveInputs).map(([res, amount]) => `<span class="pill">${itemIcon(res)} ${amount} ${itemLabel(res)}</span>`).join('') || '<span class="pill">No inputs</span>';
  const outputText = isSeller ? 'Sells stocked goods for gold' : `${itemIcon(effectiveOutput.res)} ${effectiveOutput.amount} ${itemLabel(effectiveOutput.res)}`;
  const outputTitle = isSeller ? 'Sale Output' : 'Single Output';
  const invRows = Object.keys({ ...definition.capacity, ...building.inv }).map(res => `<div class="inv-row"><span>${itemIcon(res)} ${itemLabel(res)}</span><span>${building.inv[res] || 0}/${storageCapFor(building, res, state.techs, state.addons)}</span></div>`).join('');
  ui.inspectContent.innerHTML = `
    <div class="field"><div class="field-title">${definition.icon} ${definition.label}</div><div class="field-sub">${definition.desc}</div></div>
    <div class="field"><div class="field-title">${isSeller ? 'Accepted Goods' : 'Inputs'}</div><div>${inputPills}</div></div>
    <div class="field"><div class="field-title">${outputTitle}</div><div class="field-sub">${outputText}</div></div>
    <div class="field"><div class="field-title">Inventory</div>${invRows || '<div class="field-sub">Empty</div>'}</div>
    <div class="field"><div class="field-title">Efficiency</div>${efficiencyHtml(state, building)}</div>
    <div class="field"><div class="field-title">Managers</div>${managerSlotsHtml(state, building)}</div>
    <div class="field"><div class="field-title">Addons</div>${addonHtml(state, building)}</div>`;
  ui.inspectContent.querySelectorAll('.addon-buy').forEach(button => {
    button.addEventListener('click', () => actions.buyAddon(button.dataset.addon));
  });
  ui.inspectContent.querySelectorAll('.manager-buy').forEach(button => {
    button.addEventListener('click', () => actions.buyManager(Number(button.dataset.bid)));
  });
}

export function renderSidebar(context) {
  const { state, actions } = context;
  const cards = document.getElementById('buildingCards');
  cards.innerHTML = '';
  for (const [type, definition] of Object.entries(BUILDINGS)) {
    const unlocked = isBuildingUnlocked(state, type);
    if (!unlocked) continue;
    const card = document.createElement('div');
    card.className = `bcard ${state.placeType === type ? 'sel' : ''} ${!canPayCost(state, definition.costResources) ? 'locked' : ''}`;
    card.innerHTML = `<div class="bcard-n"><span>${definition.icon} ${definition.label}</span><span>${formatCost(definition.costResources)}</span></div><div class="bcard-d">${definition.desc}</div>`;
    card.addEventListener('click', () => actions.selectBuildingType(type, card));
    card.addEventListener('pointerdown', (event) => actions.startPlacementDrag(event, type));
    cards.appendChild(card);
  }
}

export function renderGoals(context) {
  const { state, actions } = context;
  const cards = document.getElementById('goalCards');
  cards.innerHTML = '';
  const visibleGoals = Object.entries(state.goals).filter(([, goal]) => isGoalVisible(state, goal) && !goal.claimed);
  for (const [key, goal] of visibleGoals.slice(0, 3)) {
    const complete = isGoalComplete(state, goal);
    const card = document.createElement('div');
    card.className = `goal-card ${complete ? 'complete' : ''}`;
    card.innerHTML = `
      <div class="goal-head"><span>${goal.label}</span><span>${complete ? 'Done' : rewardText(goal.reward)}</span></div>
      <div class="goal-desc">${goal.desc}</div>
      <button class="goal-claim" ${complete ? '' : 'disabled'}>${complete ? `Claim ${rewardText(goal.reward)}` : 'In progress'}</button>`;
    card.querySelector('button').addEventListener('click', () => actions.claimGoal(key));
    cards.appendChild(card);
  }
  if (!visibleGoals.length) {
    cards.innerHTML = '<div class="goal-empty">No active goals.</div>';
  }
}

export function renderTechTree(context) {
  const { state, actions } = context;
  const cards = document.getElementById('techCards');
  cards.innerHTML = lifetimeSummaryHtml(state);
  const visibleTechs = Object.entries(state.techs).filter(([, tech]) => isTechDiscovered(state, tech));
  for (const tree of ['technology', 'science']) {
    const entries = visibleTechs.filter(([, tech]) => (tech.tree || 'technology') === tree);
    if (!entries.length) continue;
    const header = document.createElement('div');
    header.className = 'tech-group';
    header.textContent = tree === 'science' ? 'Science' : 'Technology';
    cards.appendChild(header);
    for (const [key, tech] of entries) {
      const card = document.createElement('div');
      const status = techStatus(state, tech);
      card.className = `tech-card ${status.key}`;
      card.innerHTML = `
        <div class="tech-head"><span>${tech.label}</span><span>${status.label}</span></div>
        <div class="tech-desc">${tech.desc}</div>
        ${techMetaHtml(state, tech)}
        <button class="tech-buy" ${status.disabled ? 'disabled' : ''}>${status.button}</button>`;
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
  renderGoals(context);
  renderInspector(context);
  renderTechTree(context);
}

export function renderTopbar(context) {
  const { state, ui } = context;
  ui.goldEl.textContent = `💰 ${state.gold} gold`;
  ui.tstat.textContent = `⏱ ${state.ticks}s`;
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
    const view = nodeViewState(building, state.connections, state.techs, state.addons);
    const displayProgressTicks = progressTicksForDisplay(state, view, building);
    bar.style.width = `${progressPctForDisplay(state, view, building)}%`;
    const time = ui.bl.querySelector(`.node-time[data-time-bid="${building.id}"]`);
    if (time) time.textContent = `${workTimeLabel(view, displayProgressTicks)}${view.managerWork > 1 ? ` x${view.managerWork}` : view.managers ? ' A' : ''}`;
  });
}
