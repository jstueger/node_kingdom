import { worldH, worldW } from './world.js?v=camera-1';

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
