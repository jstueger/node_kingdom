import { applyPan as applyCameraPan, applyZoom as applyCameraZoom, localPoint as cameraLocalPoint, setZoom as setCameraZoom } from './camera.js?v=camera-1';
import { BUILDINGS, CELL, COLS, ROWS, STARTING_GOLD, firstRecipe, inputPorts, itemLabel, outputPort } from './data.js?v=camera-1';
import { inputAccepts, inputAlreadyConnected } from './rules.js?v=camera-1';
import { renderAll as renderAllView, renderBuildings as renderBuildingsView, renderConnections as renderConnectionsView, renderTechTree as renderTechTreeView } from './render.js?v=camera-1';
import { tickGame } from './simulation.js?v=camera-1';
import { createGrid, createTechs, state } from './state.js?v=camera-1';
import { applyWorldSize as applyWorldSizeToUi, bez, clampGridPos as clampGridPosition, drawBg as drawWorldBg, gridFree as isGridFree, gridSet as setGridCells, portPx } from './world.js?v=camera-1';

const bg = document.getElementById('bg');
const gameEl = document.getElementById('game');
const zoomStage = document.getElementById('zoomStage');
const gc = document.getElementById('gc');
const bl = document.getElementById('bl');
const sl = document.getElementById('sl');
const hint = document.getElementById('hint');
const goldEl = document.getElementById('gold');
const tstat = document.getElementById('tstat');
const zoomLabel = document.getElementById('zoomLabel');
const inspectEmpty = document.getElementById('inspectEmpty');
const inspectContent = document.getElementById('inspectContent');
const toastEl = document.getElementById('toast');
const techWindow = document.getElementById('techWindow');
const ui = { bg, gameEl, zoomStage, gc, bl, sl, hint, goldEl, tstat, zoomLabel, inspectEmpty, inspectContent, toastEl, techWindow };
let renderContext;

function renderAll() { renderAllView(renderContext); }
function renderBuildings() { renderBuildingsView(renderContext); }
function renderConnections() { renderConnectionsView(renderContext); }
function renderTechTree() { renderTechTreeView(renderContext); }

function applyWorldSize() { applyWorldSizeToUi(state, ui); }
function applyZoom() { applyCameraZoom(state, ui); }
function applyPan() { applyCameraPan(state, ui); }
function setZoom(nextZoom, anchorEvent = null) { setCameraZoom(state, ui, nextZoom, anchorEvent); }
function localPoint(event) { return cameraLocalPoint(state, ui, event); }

function isGridDragTarget(target) {
  return !target.closest('.bld') && !target.closest('.port');
}

function setHint(message) { hint.textContent = message; }
function toast(message) { toastEl.textContent = message; toastEl.style.opacity = '1'; setTimeout(() => toastEl.style.opacity = '0', 1100); }

function drawBg() { drawWorldBg(state, ui); }
function gridFree(gx, gy, w, h) { return isGridFree(state, gx, gy, w, h); }
function gridSet(gx, gy, w, h, value) { setGridCells(state, gx, gy, w, h, value); }
function clampGridPos(gx, gy, w, h) { return clampGridPosition(state, gx, gy, w, h); }

function nearbyInputPort(point, outRes, sourceId) {
  let closest = null;
  const snapDistance = 28;
  for (const [id, b] of state.buildings) {
    if (id === sourceId) continue;
    inputPorts(b).forEach((port, pi) => {
      if (!inputAccepts(port, outRes) || inputAlreadyConnected(state.connections, id, pi)) return;
      const pos = portPx(b, port);
      const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
      if (dist <= snapDistance && (!closest || dist < closest.dist)) closest = { pos, dist };
    });
  }
  return closest?.pos || point;
}

function changeRecipe(id, recipe) {
  const b = state.buildings.get(id); if (!b) return;
  b.recipe = recipe; b.ptimer = 0;
  state.connections = state.connections.filter(c => c.fb !== id && c.tb !== id); // active ports changed, so old links are invalidated intentionally
  renderAll(); toast('Recipe changed; links reset');
}

function onPort(e) {
  e.stopPropagation();
  if (state.mode === 'placing') return;
  const bid = Number(e.currentTarget.dataset.bid);
  const pi = Number(e.currentTarget.dataset.pi);
  const kind = e.currentTarget.dataset.kind;
  if (kind === 'out' && state.mode !== 'connecting') {
    state.mode = 'connecting'; state.connFrom = { bid };
    setHint('Click a blue input port to connect · Esc to cancel'); ensureTempPath(); return;
  }
  if (kind === 'in' && state.mode === 'connecting') {
    const fb = state.buildings.get(state.connFrom.bid), tb = state.buildings.get(bid);
    if (state.connFrom.bid === bid) return failConnect('Cannot connect a building to itself');
    const op = outputPort(fb), ip = inputPorts(tb)[pi];
    if (!op || !ip) return failConnect('Missing port');
    if (!inputAccepts(ip, op.res)) return failConnect(`${itemLabel(op.res)} does not match ${itemLabel(ip.res)}`);
    if (inputAlreadyConnected(state.connections, bid, pi)) return failConnect('Input already connected');
    state.connections = state.connections.filter(c => c.fb !== state.connFrom.bid);
    state.connections.push({ id: state.nextId++, fb: state.connFrom.bid, tb: bid, tpi: pi });
    cancelConnection(); renderAll(); setHint('Connected. Click another green output to connect more.'); return;
  }
}
function failConnect(message) { setHint(`❌ ${message}`); cancelConnection(); }
function ensureTempPath() { if (!sl.querySelector('#tp')) { const t = document.createElementNS('http://www.w3.org/2000/svg', 'path'); t.id = 'tp'; t.setAttribute('class', 'tpath'); sl.appendChild(t); } }
function cancelConnection() { state.mode = 'idle'; state.connFrom = null; const t = sl.querySelector('#tp'); if (t) t.remove(); }

gameEl.addEventListener('mousemove', (e) => {
  if (state.mode !== 'connecting') return;
  const fb = state.buildings.get(state.connFrom.bid); const out = outputPort(fb); if (!fb || !out) return;
  const p1 = portPx(fb, out); const p2 = nearbyInputPort(localPoint(e), out.res, state.connFrom.bid);
  ensureTempPath(); sl.querySelector('#tp').setAttribute('d', bez(p1, p2));
});

gc.addEventListener('click', (e) => {
  if (state.interaction.suppressNextGridClick) {
    state.interaction.suppressNextGridClick = false;
    return;
  }
  if (state.mode !== 'placing') { state.selectedId = null; renderAll(); return; }
  if (e.target.closest('.bld') || e.target.closest('.port')) return;
  const point = localPoint(e);
  const gx = Math.floor(point.x / CELL); const gy = Math.floor(point.y / CELL);
  const d = BUILDINGS[state.placeType];
  if (!gridFree(gx, gy, d.w, d.h)) { setHint('❌ Space occupied — try another cell'); return; }
  if (state.gold < d.cost) { setHint(`❌ Need ${d.cost} gold to build ${d.label}`); toast('Not enough gold'); return; }
  const id = state.nextId++;
  state.gold -= d.cost;
  state.buildings.set(id, { id, type: state.placeType, gx, gy, recipe: firstRecipe(state.placeType), inv: {}, ptimer: 0 });
  gridSet(gx, gy, d.w, d.h, id);
  state.selectedId = id;
  state.mode = 'idle';
  state.placeType = null;
  document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel'));
  setHint('Building placed');
  renderAll();
});

function startMoveBuilding(e, id) {
  if (e.button !== 0 || state.mode !== 'idle' || e.target.closest('.port')) return;
  const b = state.buildings.get(id); if (!b) return;
  const point = localPoint(e);
  state.interaction.moving = {
    id,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    oldGx: b.gx,
    oldGy: b.gy,
    offsetX: point.x - b.gx * CELL,
    offsetY: point.y - b.gy * CELL,
    active: false
  };
  state.interaction.movingInvalid = false;
}

function moveBuilding(e) {
  if (!state.interaction.moving || state.interaction.moving.pointerId !== e.pointerId) return;
  const b = state.buildings.get(state.interaction.moving.id); if (!b) return;
  const d = BUILDINGS[b.type];
  const dx = e.clientX - state.interaction.moving.startX;
  const dy = e.clientY - state.interaction.moving.startY;
  if (!state.interaction.moving.active && Math.hypot(dx, dy) < 4) return;
  if (!state.interaction.moving.active) {
    state.interaction.moving.active = true;
    state.selectedId = state.interaction.moving.id;
    gridSet(state.interaction.moving.oldGx, state.interaction.moving.oldGy, d.w, d.h, 0);
  }
  const point = localPoint(e);
  const next = clampGridPos(Math.round((point.x - state.interaction.moving.offsetX) / CELL), Math.round((point.y - state.interaction.moving.offsetY) / CELL), d.w, d.h);
  b.gx = next.gx;
  b.gy = next.gy;
  state.interaction.movingInvalid = !gridFree(b.gx, b.gy, d.w, d.h);
  state.interaction.suppressNextGridClick = true;
  renderBuildings();
  renderConnections();
}

function endMoveBuilding(e) {
  if (!state.interaction.moving || state.interaction.moving.pointerId !== e.pointerId) return;
  const b = state.buildings.get(state.interaction.moving.id);
  if (b) {
    const d = BUILDINGS[b.type];
    if (!state.interaction.moving.active) {
      state.selectedId = state.interaction.moving.id;
    } else if (state.interaction.movingInvalid) {
      b.gx = state.interaction.moving.oldGx;
      b.gy = state.interaction.moving.oldGy;
      gridSet(b.gx, b.gy, d.w, d.h, state.interaction.moving.id);
      toast('Move blocked');
    } else {
      gridSet(b.gx, b.gy, d.w, d.h, state.interaction.moving.id);
      toast('Building moved');
    }
  }
  if (state.interaction.moving.active) state.interaction.suppressNextGridClick = true;
  state.interaction.moving = null;
  state.interaction.movingInvalid = false;
  renderAll();
}

function deleteBuilding(id) {
  const b = state.buildings.get(id); if (!b) return;
  const refund = Math.floor((BUILDINGS[b.type].cost || 0) / 2);
  gridSet(b.gx, b.gy, BUILDINGS[b.type].w, BUILDINGS[b.type].h, 0);
  state.buildings.delete(id); state.connections = state.connections.filter(c => c.fb !== id && c.tb !== id);
  state.gold += refund;
  if (state.selectedId === id) state.selectedId = null;
  renderAll(); toast(`Building sold +${refund} gold`);
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (state.mode === 'connecting') { cancelConnection(); setHint('Cancelled'); }
  if (state.mode === 'placing') { state.mode = 'idle'; state.placeType = null; document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); setHint('Select a building from the sidebar to place it'); }
});
document.addEventListener('pointermove', moveBuilding);
document.addEventListener('pointerup', endMoveBuilding);
document.addEventListener('pointercancel', endMoveBuilding);

function buyTech(key) {
  const tech = state.techs[key];
  if (!tech || tech.bought) return;
  if (state.gold < tech.cost) { toast('Not enough gold'); return; }
  state.gold -= tech.cost;
  tech.bought = true;
  if (key === 'grid_expansion') expandGrid(16, 8);
  setHint(`${tech.label} purchased`);
  renderAll();
  toast('Tech purchased');
}

function selectBuildingType(type, card) {
  document.querySelectorAll('.bcard').forEach(item => item.classList.remove('sel'));
  card.classList.add('sel');
  if (state.mode === 'connecting') cancelConnection();
  state.mode = 'placing';
  state.placeType = type;
  setHint(`Placing ${BUILDINGS[type].label} — click the grid · Esc to cancel`);
}

function expandGrid(extraCols, extraRows) {
  state.world.cols += extraCols;
  state.world.rows += extraRows;
  for (const row of state.grid) for (let i = 0; i < extraCols; i++) row.push(0);
  for (let i = 0; i < extraRows; i++) state.grid.push(new Array(state.world.cols).fill(0));
  applyWorldSize();
  drawBg();
}

function tick() {
  tickGame(state);
  renderAll();
}

function saveGame() {
  const payload = {
    nextId: state.nextId,
    gold: state.gold,
    ticks: state.ticks,
    worldCols: state.world.cols,
    worldRows: state.world.rows,
    techs: state.techs,
    buildings: [...state.buildings.values()],
    conns: state.connections
  };
  localStorage.setItem('factory-node-prototype-save', JSON.stringify(payload)); toast('Saved');
}
function loadGame() {
  const raw = localStorage.getItem('factory-node-prototype-save'); if (!raw) return toast('No save found');
  const payload = JSON.parse(raw); resetWorld(false);
  state.nextId = payload.nextId; state.gold = payload.gold ?? STARTING_GOLD; state.ticks = payload.ticks || 0; state.connections = payload.conns || [];
  state.world.cols = Math.max(payload.worldCols || COLS, COLS); state.world.rows = Math.max(payload.worldRows || ROWS, ROWS); state.grid = createGrid(state.world.cols, state.world.rows);
  for (const [key, saved] of Object.entries(payload.techs || {})) if (state.techs[key]) state.techs[key].bought = Boolean(saved.bought);
  applyWorldSize(); drawBg();
  for (const b of payload.buildings || []) { state.buildings.set(b.id, b); gridSet(b.gx, b.gy, BUILDINGS[b.type].w, BUILDINGS[b.type].h, b.id); }
  renderAll(); toast('Loaded');
}
function resetWorld(confirmFirst = true) {
  if (confirmFirst && !confirm('Reset the prototype?')) return;
  state.nextId = 1; state.gold = STARTING_GOLD; state.ticks = 0; state.selectedId = null; state.mode = 'idle'; state.placeType = null; state.connFrom = null; state.connections = []; state.buildings.clear(); state.world.cols = COLS; state.world.rows = ROWS; state.camera.panOffset = { x: 0, y: 0 }; state.grid = createGrid(state.world.cols, state.world.rows); state.techs = createTechs();
  applyWorldSize(); applyPan(); drawBg();
  document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); setHint('Select a building from the sidebar to place it'); renderAll();
}

document.getElementById('saveBtn').addEventListener('click', saveGame);
document.getElementById('loadBtn').addEventListener('click', loadGame);
document.getElementById('resetBtn').addEventListener('click', () => resetWorld(true));
document.getElementById('techBtn').addEventListener('click', () => { techWindow.classList.toggle('hidden'); renderTechTree(); });
document.getElementById('techCloseBtn').addEventListener('click', () => techWindow.classList.add('hidden'));
document.getElementById('zoomOutBtn').addEventListener('click', () => setZoom(state.camera.zoom - 0.25));
document.getElementById('zoomInBtn').addEventListener('click', () => setZoom(state.camera.zoom + 0.25));
gameEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  setZoom(state.camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1), e);
}, { passive: false });
gameEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || state.mode === 'connecting' || !isGridDragTarget(e.target)) return;
  state.interaction.pan = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    offsetX: state.camera.panOffset.x,
    offsetY: state.camera.panOffset.y,
    active: false,
    captured: false
  };
});
gameEl.addEventListener('pointermove', (e) => {
  if (!state.interaction.pan || state.interaction.pan.id !== e.pointerId) return;
  const dx = e.clientX - state.interaction.pan.x;
  const dy = e.clientY - state.interaction.pan.y;
  if (!state.interaction.pan.active && Math.hypot(dx, dy) < 4) return;
  if (!state.interaction.pan.captured) {
    gameEl.setPointerCapture(e.pointerId);
    state.interaction.pan.captured = true;
  }
  state.interaction.pan.active = true;
  state.interaction.suppressNextGridClick = true;
  gameEl.classList.add('panning');
  state.camera.panOffset.x = state.interaction.pan.offsetX + dx;
  state.camera.panOffset.y = state.interaction.pan.offsetY + dy;
  applyPan();
});
gameEl.addEventListener('pointerup', (e) => {
  if (!state.interaction.pan || state.interaction.pan.id !== e.pointerId) return;
  if (state.interaction.pan.active) state.interaction.suppressNextGridClick = true;
  if (state.interaction.pan.captured) gameEl.releasePointerCapture(e.pointerId);
  state.interaction.pan = null;
  gameEl.classList.remove('panning');
});
gameEl.addEventListener('pointercancel', (e) => {
  if (!state.interaction.pan || state.interaction.pan.id !== e.pointerId) return;
  state.interaction.pan = null;
  gameEl.classList.remove('panning');
});

renderContext = {
  state,
  ui,
  geometry: { portPx, bez },
  actions: { onPort, startMoveBuilding, deleteBuilding, changeRecipe, buyTech, selectBuildingType, toast }
};

applyWorldSize(); applyZoom(); applyPan(); drawBg(); renderAll(); setInterval(tick, 1000);
