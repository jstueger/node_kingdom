import { loadContent } from './content-loader.js';

await loadContent();

const { CONTENT } = await import('./data.js');
const { applyPan, applyTechCamera, applyZoom, focusTechMapOnNode, localPoint, setTechZoom, setZoom } = await import('./camera.js');
const { setupInput } = await import('./input.js');
const { renderAll, renderBuildings, renderConnections, renderGoals, renderPanels, renderSidebar, renderTechTree, renderTopbar, renderWorld, updateProgressBars } = await import('./render.js');
const { loadGame, resetWorld, saveGame } = await import('./save.js');
const { tickGame } = await import('./simulation.js');
const { createState } = await import('./state.js');
const { applyWorldSize, bez, drawBg, gridFree, gridSet, clampGridPos, portPx } = await import('./world.js');

const state = createState();

const ui = {
  bg: document.getElementById('bg'),
  body: document.getElementById('body'),
  gameEl: document.getElementById('game'),
  zoomStage: document.getElementById('zoomStage'),
  gc: document.getElementById('gc'),
  bl: document.getElementById('bl'),
  sl: document.getElementById('sl'),
  hint: document.getElementById('hint'),
  goldEl: document.getElementById('gold'),
  tstat: document.getElementById('tstat'),
  mainBtn: document.getElementById('mainBtn'),
  buildingsBtn: document.getElementById('buildingsBtn'),
  buildingWindow: document.getElementById('buildingWindow'),
  techBtn: document.getElementById('techBtn'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  zoomInBtn: document.getElementById('zoomInBtn'),
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
  applyTechCamera: () => applyTechCamera(state, ui),
  setZoom: (nextZoom, anchorEvent = null) => setZoom(state, ui, nextZoom, anchorEvent),
  setTechZoom: (nextZoom, anchorEvent = null) => setTechZoom(state, ui, nextZoom, anchorEvent),
  syncTechMapCamera: () => {
    if (!state.techCamera.initialized) focusTechMapOnNode(state, ui);
    else applyTechCamera(state, ui);
  },
  localPoint: (event) => localPoint(state, ui, event),
  drawBg: () => drawBg(state, ui),
  gridFree: (gx, gy, w, h) => gridFree(state, gx, gy, w, h),
  gridSet: (gx, gy, w, h, value) => gridSet(state, gx, gy, w, h, value),
  clampGridPos: (gx, gy, w, h) => clampGridPos(state, gx, gy, w, h),

  renderAll: () => renderAll(context),
  renderWorld: () => renderWorld(context),
  renderPanels: () => renderPanels(context),
  renderSidebar: () => renderSidebar(context),
  renderTopbar: () => renderTopbar(context),
  renderBuildings: () => renderBuildings(context),
  renderConnections: () => renderConnections(context),
  renderGoals: () => renderGoals(context),
  renderTechTree: () => renderTechTree(context),
  updateProgressBars: () => updateProgressBars(context),
  saveGame: () => saveGame(context),
  loadGame: () => loadGame(context),
  resetWorld: (confirmFirst = true) => resetWorld(context, confirmFirst),
  setHint,
  toast
};

context.actions = setupInput(context);

function tick() {
  tickGame(state);
  state.clock.lastTickAt = performance.now();
  context.renderWorld();
  context.renderGoals();
  context.renderSidebar();
  if (state.view === 'tech') context.renderTechTree();
  context.renderTopbar();
}

function animate() {
  context.updateProgressBars();
  requestAnimationFrame(animate);
}

context.applyWorldSize();
context.applyZoom();
context.applyPan();
context.drawBg();
state.clock.lastTickAt = performance.now();
context.setHint(CONTENT.startState.hint || 'Select a building from the sidebar to place it');
context.renderAll();
requestAnimationFrame(animate);
setInterval(tick, 1000);
