import { BUILDINGS, CELL } from './data.js';

export function worldW(state) {
  return state.world.cols * CELL;
}

export function worldH(state) {
  return state.world.rows * CELL;
}

export function applyWorldSize(state, ui) {
  const w = worldW(state);
  const h = worldH(state);
  ui.gc.style.width = `${w}px`;
  ui.gc.style.height = `${h}px`;
  ui.zoomStage.style.width = `${w * state.camera.zoom}px`;
  ui.zoomStage.style.height = `${h * state.camera.zoom}px`;
  ui.sl.setAttribute('width', w);
  ui.sl.setAttribute('height', h);
  ui.sl.setAttribute('viewBox', `0 0 ${w} ${h}`);
}

export function drawBg(state, ui) {
  const w = worldW(state);
  const h = worldH(state);
  ui.bg.width = w;
  ui.bg.height = h;
  const ctx = ui.bg.getContext('2d');
  ctx.fillStyle = '#0c0c1e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#181832';
  ctx.lineWidth = 1;
  for (let i = 0; i <= state.world.cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, h);
    ctx.stroke();
  }
  for (let i = 0; i <= state.world.rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(w, i * CELL);
    ctx.stroke();
  }
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 1.25;
  for (let i = 0; i <= state.world.cols; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, h);
    ctx.stroke();
  }
  for (let i = 0; i <= state.world.rows; i += 4) {
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(w, i * CELL);
    ctx.stroke();
  }
  ctx.fillStyle = '#242448';
  for (let col = 0; col <= state.world.cols; col++) {
    for (let row = 0; row <= state.world.rows; row++) {
      ctx.beginPath();
      ctx.arc(col * CELL, row * CELL, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function gridFree(state, gx, gy, w, h) {
  for (let row = gy; row < gy + h; row++) {
    for (let col = gx; col < gx + w; col++) {
      if (row < 0 || row >= state.world.rows || col < 0 || col >= state.world.cols) return false;
      if (state.grid[row][col]) return false;
    }
  }
  return true;
}

export function gridSet(state, gx, gy, w, h, value) {
  for (let row = gy; row < gy + h; row++) {
    for (let col = gx; col < gx + w; col++) state.grid[row][col] = value;
  }
}

export function clampGridPos(state, gx, gy, w, h) {
  return {
    gx: clamp(gx, 0, state.world.cols - w),
    gy: clamp(gy, 0, state.world.rows - h)
  };
}

export function portPx(building, port) {
  const definition = BUILDINGS[building.type];
  const px = building.gx * CELL;
  const py = building.gy * CELL;
  const bw = definition.w * CELL;
  const bh = definition.h * CELL;
  switch (port.side) {
    case 'left': return { x: px, y: py + bh * port.t };
    case 'right': return { x: px + bw, y: py + bh * port.t };
    case 'top': return { x: px + bw * port.t, y: py };
    case 'bottom': return { x: px + bw * port.t, y: py + bh };
  }
}

export function bez(p1, p2) {
  const dx = Math.max(Math.abs(p2.x - p1.x) * 0.5, 48);
  return `M${p1.x},${p1.y}C${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
