import { BUILDINGS, CELL, firstRecipe, inputPorts, itemLabel, outputPort } from './data.js';
import { applyGoalReward, applyTechUnlocks, buyManager as purchaseManager, canPayCost, formatCost, inputAccepts, inputAlreadyConnected, isAddonVisible, isBuildingUnlocked, isGoalComplete, isTechVisible, spendCost } from './rules.js';
import { workBuilding } from './simulation.js';

export function setupInput(context) {
  const { state, ui, geometry } = context;

  function nearbyInputPort(point, outRes, sourceId) {
    let closest = null;
    const snapDistance = 28;
    for (const [id, building] of state.buildings) {
      if (id === sourceId) continue;
      inputPorts(building).forEach((port, portIndex) => {
        if (!inputAccepts(port, outRes) || inputAlreadyConnected(state.connections, id, portIndex)) return;
        const pos = geometry.portPx(building, port);
        const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
        if (dist <= snapDistance && (!closest || dist < closest.dist)) closest = { pos, dist };
      });
    }
    return closest?.pos || point;
  }

  function changeRecipe(id, recipe) {
    const building = state.buildings.get(id);
    if (!building) return;
    building.recipe = recipe;
    building.ptimer = 0;
    building.active = false;
    state.connections = state.connections.filter(connection => connection.fb !== id && connection.tb !== id);
    context.renderAll();
    context.toast('Recipe changed; links reset');
  }

  function workNode(id) {
    const building = state.buildings.get(id);
    if (!building) return;
    const result = workBuilding(state, building);
    state.selectedId = id;
    if (!result.worked) {
      context.setHint(BUILDINGS[building.type].kind === 'seller' ? 'Nothing to sell' : 'Cannot work: missing inputs or output full');
      context.renderAll();
      return;
    }
    if (result.reason === 'started') building.displayProgressStartedAt = performance.now();
    context.setHint(result.reason === 'active' ? 'Already working' : 'Work started');
    context.renderAll();
  }

  function placeBuilding(type, gx, gy) {
    const definition = BUILDINGS[type];
    if (!definition) return false;
    if (!isBuildingUnlocked(state, type)) {
      context.setHint(`${definition.label} is locked`);
      return false;
    }
    if (!context.gridFree(gx, gy, definition.w, definition.h)) {
      context.setHint('❌ Space occupied — try another cell');
      return false;
    }
    if (!canPayCost(state, definition.costResources)) {
      context.setHint(`❌ Need ${formatCost(definition.costResources)} to build ${definition.label}`);
      context.toast('Not enough resources');
      return false;
    }
    const id = state.nextId++;
    spendCost(state, definition.costResources);
    state.buildings.set(id, { id, type, gx, gy, recipe: firstRecipe(type), inv: {}, ptimer: 0, managers: 0, active: false });
    context.gridSet(gx, gy, definition.w, definition.h, id);
    state.selectedId = id;
    context.setHint('Building placed');
    return true;
  }

  function onPort(event) {
    event.stopPropagation();
    if (state.mode === 'placing') return;
    const bid = Number(event.currentTarget.dataset.bid);
    const portIndex = Number(event.currentTarget.dataset.pi);
    const kind = event.currentTarget.dataset.kind;
    if (kind === 'out' && state.mode !== 'connecting') {
      state.mode = 'connecting';
      state.connFrom = { bid };
      context.setHint('Click a blue input port to connect · Esc to cancel');
      ensureTempPath();
      return;
    }
    if (kind === 'in' && state.mode === 'connecting') {
      const fromBuilding = state.buildings.get(state.connFrom.bid);
      const toBuilding = state.buildings.get(bid);
      if (state.connFrom.bid === bid) return failConnect('Cannot connect a building to itself');
      const output = outputPort(fromBuilding);
      const input = inputPorts(toBuilding)[portIndex];
      if (!output || !input) return failConnect('Missing port');
      if (!inputAccepts(input, output.res)) return failConnect(`${itemLabel(output.res)} does not match ${itemLabel(input.res)}`);
      if (inputAlreadyConnected(state.connections, bid, portIndex)) return failConnect('Input already connected');
      state.connections = state.connections.filter(connection => connection.fb !== state.connFrom.bid);
      state.connections.push({ id: state.nextId++, fb: state.connFrom.bid, tb: bid, tpi: portIndex });
      cancelConnection();
      context.renderAll();
      context.setHint('Connected. Click another green output to connect more.');
    }
  }

  function failConnect(message) {
    context.setHint(`❌ ${message}`);
    cancelConnection();
  }

  function ensureTempPath() {
    if (ui.sl.querySelector('#tp')) return;
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.id = 'tp';
    tempPath.setAttribute('class', 'tpath');
    ui.sl.appendChild(tempPath);
  }

  function cancelConnection() {
    state.mode = 'idle';
    state.connFrom = null;
    const tempPath = ui.sl.querySelector('#tp');
    if (tempPath) tempPath.remove();
  }

  function startMoveBuilding(event, id) {
    if (event.button !== 0 || state.mode !== 'idle' || event.target.closest('.port') || event.target.closest('.node-recipe-control') || event.target.closest('.node-action-control')) return;
    const building = state.buildings.get(id);
    if (!building) return;
    const point = context.localPoint(event);
    state.interaction.moving = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      oldGx: building.gx,
      oldGy: building.gy,
      offsetX: point.x - building.gx * CELL,
      offsetY: point.y - building.gy * CELL,
      active: false
    };
    state.interaction.movingInvalid = false;
  }

  function moveBuilding(event) {
    const moving = state.interaction.moving;
    if (!moving || moving.pointerId !== event.pointerId) return;
    const building = state.buildings.get(moving.id);
    if (!building) return;
    const definition = BUILDINGS[building.type];
    const dx = event.clientX - moving.startX;
    const dy = event.clientY - moving.startY;
    if (!moving.active && Math.hypot(dx, dy) < 4) return;
    if (!moving.active) {
      moving.active = true;
      state.selectedId = moving.id;
      context.gridSet(moving.oldGx, moving.oldGy, definition.w, definition.h, 0);
    }
    const point = context.localPoint(event);
    const next = context.clampGridPos(
      Math.round((point.x - moving.offsetX) / CELL),
      Math.round((point.y - moving.offsetY) / CELL),
      definition.w,
      definition.h
    );
    building.gx = next.gx;
    building.gy = next.gy;
    state.interaction.movingInvalid = !context.gridFree(building.gx, building.gy, definition.w, definition.h);
    state.interaction.suppressNextGridClick = true;
    context.renderBuildings();
    context.renderConnections();
  }

  function endMoveBuilding(event) {
    const moving = state.interaction.moving;
    if (!moving || moving.pointerId !== event.pointerId) return;
    const building = state.buildings.get(moving.id);
    if (building) {
      const definition = BUILDINGS[building.type];
      if (!moving.active) {
        state.selectedId = moving.id;
      } else if (state.interaction.movingInvalid) {
        building.gx = moving.oldGx;
        building.gy = moving.oldGy;
        context.gridSet(building.gx, building.gy, definition.w, definition.h, moving.id);
        context.toast('Move blocked');
      } else {
        context.gridSet(building.gx, building.gy, definition.w, definition.h, moving.id);
        context.toast('Building moved');
      }
    }
    if (moving.active) state.interaction.suppressNextGridClick = true;
    state.interaction.moving = null;
    state.interaction.movingInvalid = false;
    context.renderAll();
  }

  function deleteBuilding(id) {
    const building = state.buildings.get(id);
    if (!building) return;
    const definition = BUILDINGS[building.type];
    const refund = Math.floor((definition.cost || 0) / 2);
    context.gridSet(building.gx, building.gy, definition.w, definition.h, 0);
    state.buildings.delete(id);
    state.connections = state.connections.filter(connection => connection.fb !== id && connection.tb !== id);
    state.gold += refund;
    if (state.selectedId === id) state.selectedId = null;
    context.renderAll();
    context.toast(`Building sold +${refund} gold`);
  }

  function buyTech(key) {
    const tech = state.techs[key];
    if (!tech || tech.bought || !isTechVisible(state, tech)) return;
    if (!spendCost(state, tech.cost)) {
      context.toast('Not enough resources');
      return;
    }
    tech.bought = true;
    applyTechUnlocks(state, tech);
    if (key === 'grid_expansion') expandGrid(16, 8);
    context.setHint(`${tech.label} purchased`);
    context.renderAll();
    context.toast('Tech purchased');
  }

  function claimGoal(key) {
    const goal = state.goals[key];
    if (!goal || goal.claimed || !isGoalComplete(state, goal)) return;
    applyGoalReward(state, goal);
    goal.claimed = true;
    context.setHint(`${goal.label} complete`);
    context.renderAll();
    context.toast('Goal reward claimed');
  }

  function buyAddon(key) {
    const addon = state.addons[key];
    if (!addon || addon.bought || !isAddonVisible(state, addon)) return;
    if (!spendCost(state, addon.cost)) {
      context.toast('Not enough resources');
      return;
    }
    addon.bought = true;
    context.setHint(`${addon.label} purchased`);
    context.renderAll();
    context.toast('Addon purchased');
  }

  function buyManager(id) {
    const building = state.buildings.get(id);
    if (!building) return;
    if (!purchaseManager(state, building)) {
      context.toast('Manager unavailable');
      return;
    }
    context.setHint('Manager hired');
    context.renderAll();
    context.toast('Manager hired');
  }

  function selectBuildingType(type, card) {
    if (state.interaction.suppressNextSidebarClick) {
      state.interaction.suppressNextSidebarClick = false;
      return;
    }
    if (!isBuildingUnlocked(state, type)) {
      context.setHint(`${BUILDINGS[type].label} is locked`);
      return;
    }
    document.querySelectorAll('.bcard').forEach(item => item.classList.remove('sel'));
    card.classList.add('sel');
    if (state.mode === 'connecting') cancelConnection();
    state.mode = 'placing';
    state.placeType = type;
    context.setHint(`Placing ${BUILDINGS[type].label} — click the grid · Esc to cancel`);
  }

  function startPlacementDrag(event, type) {
    if (event.button !== 0 || state.interaction.moving || state.interaction.pan) return;
    if (!isBuildingUnlocked(state, type)) return;
    if (state.mode === 'connecting') cancelConnection();
    state.interaction.placementDrag = {
      type,
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      gx: 0,
      gy: 0,
      active: false,
      overGrid: false,
      valid: false,
      captured: false
    };
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
      state.interaction.placementDrag.captured = true;
    }
  }

  function expandGrid(extraCols, extraRows) {
    state.world.cols += extraCols;
    state.world.rows += extraRows;
    for (const row of state.grid) for (let i = 0; i < extraCols; i++) row.push(0);
    for (let i = 0; i < extraRows; i++) state.grid.push(new Array(state.world.cols).fill(0));
    context.applyWorldSize();
    context.drawBg();
  }

  function isGridDragTarget(target) {
    return !target.closest('.bld') && !target.closest('.port');
  }

  function updatePlacementDrag(event) {
    const drag = state.interaction.placementDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const definition = BUILDINGS[drag.type];
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.active && Math.hypot(dx, dy) < 4) return;
    if (!drag.active) {
      drag.active = true;
      state.interaction.suppressNextSidebarClick = true;
      state.mode = 'dragging-placement';
      state.placeType = drag.type;
      context.setHint(`Drop ${definition.label} onto the grid`);
    }
    const point = context.localPoint(event);
    drag.overGrid = point.x >= 0 && point.y >= 0 && point.x < state.world.cols * CELL && point.y < state.world.rows * CELL;
    drag.gx = Math.floor(point.x / CELL);
    drag.gy = Math.floor(point.y / CELL);
    drag.valid = drag.overGrid && isBuildingUnlocked(state, drag.type) && canPayCost(state, definition.costResources) && context.gridFree(drag.gx, drag.gy, definition.w, definition.h);
    context.renderBuildings();
  }

  function endPlacementDrag(event) {
    const drag = state.interaction.placementDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.captured && drag.captureTarget?.hasPointerCapture?.(event.pointerId)) {
      drag.captureTarget.releasePointerCapture(event.pointerId);
    }
    const didDrag = drag.active;
    const placed = didDrag && drag.valid && placeBuilding(drag.type, drag.gx, drag.gy);
    state.interaction.placementDrag = null;
    if (didDrag) {
      state.mode = 'idle';
      state.placeType = null;
      state.interaction.suppressNextGridClick = true;
      document.querySelectorAll('.bcard').forEach(card => card.classList.remove('sel'));
      if (!placed) context.setHint('Placement cancelled');
      context.renderAll();
    }
  }

  ui.gameEl.addEventListener('mousemove', (event) => {
    if (state.mode !== 'connecting') return;
    const fromBuilding = state.buildings.get(state.connFrom.bid);
    if (!fromBuilding) return;
    const output = outputPort(fromBuilding);
    if (!output) return;
    const p1 = geometry.portPx(fromBuilding, output);
    const p2 = nearbyInputPort(context.localPoint(event), output.res, state.connFrom.bid);
    ensureTempPath();
    ui.sl.querySelector('#tp').setAttribute('d', geometry.bez(p1, p2));
  });

  ui.gc.addEventListener('click', (event) => {
    if (state.interaction.suppressNextGridClick) {
      state.interaction.suppressNextGridClick = false;
      return;
    }
    if (state.mode !== 'placing') {
      state.selectedId = null;
      context.renderAll();
      return;
    }
    if (event.target.closest('.bld') || event.target.closest('.port')) return;
    const point = context.localPoint(event);
    const gx = Math.floor(point.x / CELL);
    const gy = Math.floor(point.y / CELL);
    if (!placeBuilding(state.placeType, gx, gy)) return;
    state.mode = 'idle';
    state.placeType = null;
    document.querySelectorAll('.bcard').forEach(card => card.classList.remove('sel'));
    context.renderAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (state.mode === 'connecting') {
      cancelConnection();
      context.setHint('Cancelled');
    }
    if (state.mode === 'placing') {
      state.mode = 'idle';
      state.placeType = null;
      document.querySelectorAll('.bcard').forEach(card => card.classList.remove('sel'));
      context.setHint('Select a building from the sidebar to place it');
    }
  });
  document.addEventListener('pointermove', moveBuilding);
  document.addEventListener('pointermove', updatePlacementDrag);
  document.addEventListener('pointerup', endMoveBuilding);
  document.addEventListener('pointerup', endPlacementDrag);
  document.addEventListener('pointercancel', endMoveBuilding);
  document.addEventListener('pointercancel', endPlacementDrag);

  document.getElementById('saveBtn').addEventListener('click', context.saveGame);
  document.getElementById('loadBtn').addEventListener('click', context.loadGame);
  document.getElementById('resetBtn').addEventListener('click', () => context.resetWorld(true));
  document.getElementById('techBtn').addEventListener('click', () => {
    ui.techWindow.classList.toggle('hidden');
    context.renderTechTree();
  });
  document.getElementById('techCloseBtn').addEventListener('click', () => ui.techWindow.classList.add('hidden'));
  document.getElementById('zoomOutBtn').addEventListener('click', () => context.setZoom(state.camera.zoom - 0.25));
  document.getElementById('zoomInBtn').addEventListener('click', () => context.setZoom(state.camera.zoom + 0.25));

  ui.gameEl.addEventListener('wheel', (event) => {
    event.preventDefault();
    context.setZoom(state.camera.zoom + (event.deltaY < 0 ? 0.1 : -0.1), event);
  }, { passive: false });

  ui.gameEl.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || state.mode !== 'idle' || !isGridDragTarget(event.target)) return;
    state.interaction.pan = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: state.camera.panOffset.x,
      offsetY: state.camera.panOffset.y,
      active: false,
      captured: false
    };
  });

  ui.gameEl.addEventListener('pointermove', (event) => {
    const pan = state.interaction.pan;
    if (!pan || pan.id !== event.pointerId) return;
    const dx = event.clientX - pan.x;
    const dy = event.clientY - pan.y;
    if (!pan.active && Math.hypot(dx, dy) < 4) return;
    if (!pan.captured) {
      ui.gameEl.setPointerCapture(event.pointerId);
      pan.captured = true;
    }
    pan.active = true;
    state.interaction.suppressNextGridClick = true;
    ui.gameEl.classList.add('panning');
    state.camera.panOffset.x = pan.offsetX + dx;
    state.camera.panOffset.y = pan.offsetY + dy;
    context.applyPan();
  });

  ui.gameEl.addEventListener('pointerup', (event) => {
    const pan = state.interaction.pan;
    if (!pan || pan.id !== event.pointerId) return;
    if (pan.active) state.interaction.suppressNextGridClick = true;
    if (pan.captured) ui.gameEl.releasePointerCapture(event.pointerId);
    state.interaction.pan = null;
    ui.gameEl.classList.remove('panning');
  });

  ui.gameEl.addEventListener('pointercancel', (event) => {
    const pan = state.interaction.pan;
    if (!pan || pan.id !== event.pointerId) return;
    state.interaction.pan = null;
    ui.gameEl.classList.remove('panning');
  });

  return { onPort, startMoveBuilding, startPlacementDrag, workNode, deleteBuilding, changeRecipe, buyTech, buyAddon, buyManager, claimGoal, selectBuildingType, toast: context.toast };
}
