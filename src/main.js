import { applyPan, applyZoom, localPoint, setZoom } from './camera.js';
import { setupInput } from './input.js';
import { renderAll, renderBuildings, renderConnections, renderTechTree } from './render.js';
import { loadGame, resetWorld, saveGame } from './save.js';
import { tickGame } from './simulation.js';
import { state } from './state.js';
import { applyWorldSize, bez, drawBg, gridFree, gridSet, clampGridPos, portPx } from './world.js';

const ui = {
  bg: document.getElementById('bg'),
  gameEl: document.getElementById('game'),
  zoomStage: document.getElementById('zoomStage'),
  gc: document.getElementById('gc'),
  bl: document.getElementById('bl'),
  sl: document.getElementById('sl'),
  hint: document.getElementById('hint'),
  goldEl: document.getElementById('gold'),
  tstat: document.getElementById('tstat'),
  zoomLabel: document.getElementById('zoomLabel'),
  inspectEmpty: document.getElementById('inspectEmpty'),
  inspectContent: document.getElementById('inspectContent'),
  toastEl: document.getElementById('toast'),
  techWindow: document.getElementById('techWindow')
};

function setHint(message) {
  ui.hint.textContent = message;
}

function toast(message) {
  ui.toastEl.textContent = message;
  ui.toastEl.style.opacity = '1';
  setTimeout(() => ui.toastEl.style.opacity = '0', 1100);
}

const context = {
  state,
  ui,

  geometry: {
    portPx,
    bez
  },

  applyWorldSize: () => applyWorldSize(state, ui),
  applyZoom: () => applyZoom(state, ui),
  applyPan: () => applyPan(state, ui),
  setZoom: (nextZoom, anchorEvent = null) => setZoom(state, ui, nextZoom, anchorEvent),
  localPoint: (event) => localPoint(state, ui, event),
  drawBg: () => drawBg(state, ui),
  gridFree: (gx, gy, w, h) => gridFree(state, gx, gy, w, h),
  gridSet: (gx, gy, w, h, value) => gridSet(state, gx, gy, w, h, value),
  clampGridPos: (gx, gy, w, h) => clampGridPos(state, gx, gy, w, h),

  renderAll: () => renderAll(context),
  renderBuildings: () => renderBuildings(context),
  renderConnections: () => renderConnections(context),
  renderTechTree: () => renderTechTree(context),
  saveGame: () => saveGame(context),
  loadGame: () => loadGame(context),
  resetWorld: (confirmFirst = true) => resetWorld(context, confirmFirst),
  setHint,
  toast
};

context.actions = setupInput(context);

function tick() {
  tickGame(state);
  context.renderAll();
}

context.applyWorldSize();
context.applyZoom();
context.applyPan();
context.drawBg();
context.renderAll();
setInterval(tick, 1000);
