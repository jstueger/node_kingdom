import { worldH, worldW } from './world.js';

export function applyZoom(state, ui) {
  state.camera.zoom = clamp(state.camera.zoom, 0.5, 2);
  ui.gc.style.transform = `scale(${state.camera.zoom})`;
  ui.zoomStage.style.width = `${worldW(state) * state.camera.zoom}px`;
  ui.zoomStage.style.height = `${worldH(state) * state.camera.zoom}px`;
  ui.zoomLabel.textContent = `${Math.round(state.camera.zoom * 100)}%`;
}

export function applyPan(state, ui) {
  ui.zoomStage.style.transform = `translate(${state.camera.panOffset.x}px, ${state.camera.panOffset.y}px)`;
}

export function setZoom(state, ui, nextZoom, anchorEvent = null) {
  const prevZoom = state.camera.zoom;
  const anchor = anchorEvent ? {
    clientX: anchorEvent.clientX,
    clientY: anchorEvent.clientY,
    world: localPoint(state, ui, anchorEvent)
  } : null;
  state.camera.zoom = nextZoom;
  applyZoom(state, ui);
  if (!anchor || state.camera.zoom === prevZoom) return;
  const rect = ui.gc.getBoundingClientRect();
  state.camera.panOffset.x += anchor.clientX - (rect.left + anchor.world.x * state.camera.zoom);
  state.camera.panOffset.y += anchor.clientY - (rect.top + anchor.world.y * state.camera.zoom);
  applyPan(state, ui);
}

export function localPoint(state, ui, event) {
  const rect = ui.gc.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / state.camera.zoom,
    y: (event.clientY - rect.top) / state.camera.zoom
  };
}

export function applyTechCamera(state, ui) {
  state.techCamera.zoom = clamp(state.techCamera.zoom, 0.45, 2.25);
  const stage = document.getElementById('techMapStage');
  if (!stage) return;
  stage.style.transform = `translate(${state.techCamera.panOffset.x}px, ${state.techCamera.panOffset.y}px) scale(${state.techCamera.zoom})`;
  if (state.view === 'tech') ui.zoomLabel.textContent = `${Math.round(state.techCamera.zoom * 100)}%`;
}

export function setTechZoom(state, ui, nextZoom, anchorEvent = null) {
  const viewport = document.getElementById('techMapViewport');
  if (!viewport) return;
  const anchor = anchorEvent ? {
    clientX: anchorEvent.clientX,
    clientY: anchorEvent.clientY,
    local: techLocalPoint(state, viewport, anchorEvent)
  } : null;
  state.techCamera.zoom = clamp(nextZoom, 0.45, 2.25);
  if (anchor) {
    const rect = viewport.getBoundingClientRect();
    state.techCamera.panOffset.x = anchor.clientX - rect.left - anchor.local.x * state.techCamera.zoom;
    state.techCamera.panOffset.y = anchor.clientY - rect.top - anchor.local.y * state.techCamera.zoom;
  }
  applyTechCamera(state, ui);
}

export function focusTechMapOnNode(state, ui, nodeId = 'sawmill_unlock') {
  const viewport = document.getElementById('techMapViewport');
  const node = document.querySelector(`[data-unlock-node-id="${nodeId}"]`);
  if (!viewport || !node) return;
  state.techCamera.zoom = clamp(state.techCamera.zoom || 1.45, 0.45, 2.25);
  state.techCamera.panOffset.x = viewport.clientWidth / 2 - (node.offsetLeft + node.offsetWidth / 2) * state.techCamera.zoom;
  state.techCamera.panOffset.y = viewport.clientHeight / 2 - (node.offsetTop + node.offsetHeight / 2) * state.techCamera.zoom;
  state.techCamera.initialized = true;
  applyTechCamera(state, ui);
}

function techLocalPoint(state, viewport, event) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - state.techCamera.panOffset.x) / state.techCamera.zoom,
    y: (event.clientY - rect.top - state.techCamera.panOffset.y) / state.techCamera.zoom
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
