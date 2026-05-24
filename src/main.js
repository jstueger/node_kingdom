import { BUILDINGS, CELL, COLS, ROWS, STARTING_GOLD, activeRecipe, firstRecipe, inputPorts, itemIcon, itemLabel, outputPort } from './data.js?v=simulation-1';
import { inputAccepts, inputAlreadyConnected, connectionStatus, salePriceFor, storageCapFor } from './rules.js?v=simulation-1';
import { tickGame } from './simulation.js?v=simulation-1';
import { createGrid, createTechs, state } from './state.js?v=simulation-1';
import { nodeViewState } from './view-models.js?v=simulation-1';

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

function worldW() { return state.world.cols * CELL; }
function worldH() { return state.world.rows * CELL; }
function applyWorldSize() {
  const w = worldW();
  const h = worldH();
  gc.style.width = `${w}px`;
  gc.style.height = `${h}px`;
  zoomStage.style.width = `${w * state.camera.zoom}px`;
  zoomStage.style.height = `${h * state.camera.zoom}px`;
  sl.setAttribute('width', w);
  sl.setAttribute('height', h);
  sl.setAttribute('viewBox', `0 0 ${w} ${h}`);
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function applyZoom() {
  state.camera.zoom = clamp(state.camera.zoom, 0.5, 2);
  gc.style.transform = `scale(${state.camera.zoom})`;
  zoomStage.style.width = `${worldW() * state.camera.zoom}px`;
  zoomStage.style.height = `${worldH() * state.camera.zoom}px`;
  zoomLabel.textContent = `${Math.round(state.camera.zoom * 100)}%`;
}
function applyPan() {
  zoomStage.style.transform = `translate(${state.camera.panOffset.x}px, ${state.camera.panOffset.y}px)`;
}
function setZoom(nextZoom, anchorEvent = null) {
  const prevZoom = state.camera.zoom;
  const anchor = anchorEvent ? {
    clientX: anchorEvent.clientX,
    clientY: anchorEvent.clientY,
    world: localPoint(anchorEvent)
  } : null;
  state.camera.zoom = nextZoom;
  applyZoom();
  if (!anchor || state.camera.zoom === prevZoom) return;
  const rect = gc.getBoundingClientRect();
  state.camera.panOffset.x += anchor.clientX - (rect.left + anchor.world.x * state.camera.zoom);
  state.camera.panOffset.y += anchor.clientY - (rect.top + anchor.world.y * state.camera.zoom);
  applyPan();
}
function localPoint(e) {
  const rect = gc.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / state.camera.zoom, y: (e.clientY - rect.top) / state.camera.zoom };
}

function isGridDragTarget(target) {
  return !target.closest('.bld') && !target.closest('.port');
}

function setHint(message) { hint.textContent = message; }
function toast(message) { toastEl.textContent = message; toastEl.style.opacity = '1'; setTimeout(() => toastEl.style.opacity = '0', 1100); }

function drawBg() {
  const w = worldW();
  const h = worldH();
  bg.width = w; bg.height = h;
  const ctx = bg.getContext('2d');
  ctx.fillStyle = '#0c0c1e'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#181832'; ctx.lineWidth = 1;
  for (let i = 0; i <= state.world.cols; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, h); ctx.stroke(); }
  for (let i = 0; i <= state.world.rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(w, i * CELL); ctx.stroke(); }
  ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 1.25;
  for (let i = 0; i <= state.world.cols; i += 4) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, h); ctx.stroke(); }
  for (let i = 0; i <= state.world.rows; i += 4) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(w, i * CELL); ctx.stroke(); }
  ctx.fillStyle = '#242448';
  for (let ci = 0; ci <= state.world.cols; ci++) for (let ri = 0; ri <= state.world.rows; ri++) { ctx.beginPath(); ctx.arc(ci * CELL, ri * CELL, 2, 0, Math.PI * 2); ctx.fill(); }
}

function gridFree(gx, gy, w, h) {
  for (let r = gy; r < gy + h; r++) for (let c = gx; c < gx + w; c++) {
    if (r < 0 || r >= state.world.rows || c < 0 || c >= state.world.cols) return false;
    if (state.grid[r][c]) return false;
  }
  return true;
}
function gridSet(gx, gy, w, h, value) { for (let r = gy; r < gy + h; r++) for (let c = gx; c < gx + w; c++) state.grid[r][c] = value; }
function clampGridPos(gx, gy, w, h) {
  return {
    gx: clamp(gx, 0, state.world.cols - w),
    gy: clamp(gy, 0, state.world.rows - h)
  };
}

function portPx(b, pd) {
  const d = BUILDINGS[b.type];
  const px = b.gx * CELL, py = b.gy * CELL, bw = d.w * CELL, bh = d.h * CELL;
  switch (pd.side) {
    case 'left': return { x: px, y: py + bh * pd.t };
    case 'right': return { x: px + bw, y: py + bh * pd.t };
    case 'top': return { x: px + bw * pd.t, y: py };
    case 'bottom': return { x: px + bw * pd.t, y: py + bh };
  }
}
function bez(p1, p2) {
  const dx = Math.max(Math.abs(p2.x - p1.x) * 0.5, 48);
  return `M${p1.x},${p1.y}C${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`;
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
    starved: 'WAITING',
    blocked: 'BLOCKED',
    idle: 'IDLE'
  }[status] || status.toUpperCase();
}

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

function renderBuildings() {
  bl.innerHTML = '';
  for (const [id, b] of state.buildings) {
    const view = nodeViewState(b, state.connections, state.techs);
    const d = view.definition;
    const el = document.createElement('div');
    el.className = `bld node--${d.kind} ${id === state.selectedId ? 'sel' : ''} ${state.interaction.moving?.id === id ? 'moving' : ''} ${state.interaction.moving?.id === id && state.interaction.movingInvalid ? 'invalid' : ''} ${view.status}`;
    el.style.cssText = `left:${b.gx * CELL + 2}px;top:${b.gy * CELL + 2}px;width:${d.w * CELL - 4}px;height:${d.h * CELL - 4}px;background:${d.color};`;
    const subtitle = d.kind === 'crafter' ? `<div class="node-subtitle">${view.recipeLabel}</div>` : '';
    el.innerHTML = `
      <div class="node-header"><span class="node-title">${view.icon} ${view.label}</span><span class="node-status">${statusLabel(view.status)}</span></div>
      ${subtitle}
      ${nodeBodyHtml(view)}
      <div class="prog"><span style="width:${view.progressPct}%"></span></div>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.interaction.suppressNextGridClick) { state.interaction.suppressNextGridClick = false; return; }
      state.selectedId = id; renderAll();
    });
    el.addEventListener('pointerdown', (e) => startMoveBuilding(e, id));
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); deleteBuilding(id); });

    inputPorts(b).forEach((p, pi) => {
      const pos = portPx(b, p);
      const pe = document.createElement('div');
      pe.className = 'port in'; pe.style.left = `${pos.x - b.gx * CELL}px`; pe.style.top = `${pos.y - b.gy * CELL}px`;
      pe.dataset.bid = id; pe.dataset.pi = pi; pe.dataset.kind = 'in'; pe.title = p.acceptsAll ? 'Input: Any resource' : `Input: ${itemLabel(p.res)}`; pe.addEventListener('click', onPort);
      el.appendChild(pe);
    });
    const out = outputPort(b);
    if (out) {
      const pos = portPx(b, out);
      const pe = document.createElement('div');
      pe.className = 'port out'; pe.style.left = `${pos.x - b.gx * CELL}px`; pe.style.top = `${pos.y - b.gy * CELL}px`;
      pe.dataset.bid = id; pe.dataset.pi = 0; pe.dataset.kind = 'out'; pe.title = `Output: ${itemLabel(out.res)}`; pe.addEventListener('click', onPort);
      el.appendChild(pe);
    }
    bl.appendChild(el);
  }
}

function renderConnections() {
  const temp = sl.querySelector('#tp');
  sl.innerHTML = '';
  if (temp) sl.appendChild(temp);
  for (const cn of state.connections) {
    const fb = state.buildings.get(cn.fb), tb = state.buildings.get(cn.tb);
    if (!fb || !tb) continue;
    const p1 = portPx(fb, outputPort(fb));
    const p2 = portPx(tb, inputPorts(tb)[cn.tpi]);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', bez(p1, p2));
    path.setAttribute('class', `cpath ${connectionStatus(cn, state.buildings, state.techs)}`);
    path.addEventListener('contextmenu', (e) => { e.preventDefault(); state.connections = state.connections.filter(c => c.id !== cn.id); renderAll(); toast('Connection deleted'); });
    sl.appendChild(path);
  }
}

function renderInspector() {
  const b = state.buildings.get(state.selectedId);
  if (!b) { inspectEmpty.classList.remove('hidden'); inspectContent.classList.add('hidden'); inspectContent.innerHTML = ''; return; }
  const d = BUILDINGS[b.type];
  const rec = activeRecipe(b);
  inspectEmpty.classList.add('hidden'); inspectContent.classList.remove('hidden');
  const isSeller = d.kind === 'seller';
  const recipeField = isSeller ? '' : `<div class="field"><div class="field-title">Active Recipe</div><select id="recipeSelect" class="recipe-select">${Object.entries(d.recipes).map(([key, r]) => `<option value="${key}" ${b.recipe === key ? 'selected' : ''}>${r.label}</option>`).join('')}</select></div>`;
  const inputPills = isSeller
    ? Object.keys(d.sellPrices).map(res => `<span class="pill">${itemIcon(res)} ${itemLabel(res)} → ${salePriceFor(b.type, res, state.techs)} gold</span>`).join('')
    : Object.entries(rec.inputs).map(([res, amt]) => `<span class="pill">${itemIcon(res)} ${amt} ${itemLabel(res)}</span>`).join('') || '<span class="pill">No inputs</span>';
  const outputText = isSeller ? 'Sells stocked goods for gold' : `${itemIcon(rec.output.res)} ${rec.output.amount} ${itemLabel(rec.output.res)}`;
  const outputTitle = isSeller ? 'Sale Output' : 'Single Output';
  const invRows = Object.keys({ ...d.capacity, ...b.inv }).map(res => `<div class="inv-row"><span>${itemIcon(res)} ${itemLabel(res)}</span><span>${b.inv[res] || 0}/${storageCapFor(b, res, state.techs)}</span></div>`).join('');
  inspectContent.innerHTML = `
    <div class="field"><div class="field-title">${d.icon} ${d.label}</div><div class="field-sub">${d.desc}</div></div>
    ${recipeField}
    <div class="field"><div class="field-title">${isSeller ? 'Accepted Goods' : 'Inputs'}</div><div>${inputPills}</div></div>
    <div class="field"><div class="field-title">${outputTitle}</div><div class="field-sub">${outputText}</div></div>
    <div class="field"><div class="field-title">Inventory</div>${invRows || '<div class="field-sub">Empty</div>'}</div>`;
  if (!isSeller) document.getElementById('recipeSelect').addEventListener('change', (e) => changeRecipe(state.selectedId, e.target.value));
}

function renderAll() { renderSidebar(); renderBuildings(); renderConnections(); renderInspector(); renderTechTree(); goldEl.textContent = `💰 ${state.gold} gold`; tstat.textContent = `t=${state.ticks}`; }

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

function renderSidebar() {
  const cards = document.getElementById('buildingCards'); cards.innerHTML = '';
  for (const [type, d] of Object.entries(BUILDINGS)) {
    const card = document.createElement('div');
    card.className = `bcard ${state.placeType === type ? 'sel' : ''} ${state.gold < d.cost ? 'locked' : ''}`;
    card.innerHTML = `<div class="bcard-n"><span>${d.icon} ${d.label}</span><span>${d.cost}g</span></div><div class="bcard-d">${d.desc}</div>`;
    card.addEventListener('click', () => { document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); card.classList.add('sel'); if (state.mode === 'connecting') cancelConnection(); state.mode = 'placing'; state.placeType = type; setHint(`Placing ${d.label} — click the grid · Esc to cancel`); });
    cards.appendChild(card);
  }
}

function renderTechTree() {
  const cards = document.getElementById('techCards'); cards.innerHTML = '';
  for (const [key, tech] of Object.entries(state.techs)) {
    const card = document.createElement('div');
    card.className = `tech-card ${tech.bought ? 'bought' : ''}`;
    const canBuy = state.gold >= tech.cost && !tech.bought;
    card.innerHTML = `
      <div class="tech-head"><span>${tech.label}</span><span>${tech.bought ? 'Bought' : `${tech.cost} gold`}</span></div>
      <div class="tech-desc">${tech.desc}</div>
      <button class="tech-buy" ${canBuy ? '' : 'disabled'}>${tech.bought ? 'Purchased' : 'Buy'}</button>`;
    card.querySelector('button').addEventListener('click', () => buyTech(key));
    cards.appendChild(card);
  }
}

applyWorldSize(); applyZoom(); applyPan(); drawBg(); renderAll(); setInterval(tick, 1000);
