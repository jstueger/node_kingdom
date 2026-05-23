import { BUILDINGS, CELL, COLS, ROWS, STARTING_GOLD, activeRecipe, capFor, firstRecipe, inputPorts, itemIcon, itemLabel, outputPort } from './data.js';

let nextId = 1;
let gold = STARTING_GOLD;
let ticks = 0;
let selectedId = null;
let mode = 'idle';
let placeType = null;
let connFrom = null;
let conns = [];
let worldCols = COLS;
let worldRows = ROWS;
let zoom = 1;
let panOffset = { x: 0, y: 0 };
let pan = null;
let suppressNextGridClick = false;
const blds = new Map();
let grid = createGrid(worldCols, worldRows);
const techs = {
  grid_expansion: {
    label: 'Grid Expansion',
    desc: 'Adds 4 columns and 2 rows to the build grid.',
    cost: 50,
    bought: false
  }
};

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

function worldW() { return worldCols * CELL; }
function worldH() { return worldRows * CELL; }
function createGrid(cols, rows) { return Array.from({ length: rows }, () => new Array(cols).fill(0)); }
function applyWorldSize() {
  const w = worldW();
  const h = worldH();
  gc.style.width = `${w}px`;
  gc.style.height = `${h}px`;
  zoomStage.style.width = `${w * zoom}px`;
  zoomStage.style.height = `${h * zoom}px`;
  sl.setAttribute('width', w);
  sl.setAttribute('height', h);
  sl.setAttribute('viewBox', `0 0 ${w} ${h}`);
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function applyZoom() {
  zoom = clamp(zoom, 0.5, 2);
  gc.style.transform = `scale(${zoom})`;
  zoomStage.style.width = `${worldW() * zoom}px`;
  zoomStage.style.height = `${worldH() * zoom}px`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}
function applyPan() {
  zoomStage.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px)`;
}
function setZoom(nextZoom, anchorEvent = null) {
  const prevZoom = zoom;
  const anchor = anchorEvent ? {
    clientX: anchorEvent.clientX,
    clientY: anchorEvent.clientY,
    world: localPoint(anchorEvent)
  } : null;
  zoom = nextZoom;
  applyZoom();
  if (!anchor || zoom === prevZoom) return;
  const rect = gc.getBoundingClientRect();
  panOffset.x += anchor.clientX - (rect.left + anchor.world.x * zoom);
  panOffset.y += anchor.clientY - (rect.top + anchor.world.y * zoom);
  applyPan();
}
function localPoint(e) {
  const rect = gc.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
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
  ctx.strokeStyle = '#141428'; ctx.lineWidth = 1;
  for (let i = 0; i <= worldCols; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, h); ctx.stroke(); }
  for (let i = 0; i <= worldRows; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(w, i * CELL); ctx.stroke(); }
  ctx.fillStyle = '#1c1c38';
  for (let ci = 0; ci <= worldCols; ci++) for (let ri = 0; ri <= worldRows; ri++) { ctx.beginPath(); ctx.arc(ci * CELL, ri * CELL, 2, 0, Math.PI * 2); ctx.fill(); }
}

function gridFree(gx, gy, w, h) {
  for (let r = gy; r < gy + h; r++) for (let c = gx; c < gx + w; c++) {
    if (r < 0 || r >= worldRows || c < 0 || c >= worldCols) return false;
    if (grid[r][c]) return false;
  }
  return true;
}
function gridSet(gx, gy, w, h, value) { for (let r = gy; r < gy + h; r++) for (let c = gx; c < gx + w; c++) grid[r][c] = value; }

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

function inventoryText(b) {
  return Object.entries(b.inv).filter(([, v]) => v > 0).map(([k, v]) => `${itemIcon(k)}${v}`).join(' ');
}

function inputAccepts(ip, res) {
  return Boolean(ip && (ip.acceptsAll || ip.res === res));
}

function inputResourceForStorage(ip, outRes) {
  return ip.acceptsAll ? outRes : ip.res;
}

function renderBuildings() {
  bl.innerHTML = '';
  for (const [id, b] of blds) {
    const d = BUILDINGS[b.type];
    const rec = activeRecipe(b);
    const el = document.createElement('div');
    el.className = `bld ${id === selectedId ? 'sel' : ''}`;
    el.style.cssText = `left:${b.gx * CELL + 2}px;top:${b.gy * CELL + 2}px;width:${d.w * CELL - 4}px;height:${d.h * CELL - 4}px;background:${d.color};`;
    const pct = rec ? Math.min(100, Math.floor(((b.ptimer || 0) / rec.time) * 100)) : 0;
    const statusLabel = rec ? rec.label : 'Auto Sell';
    el.innerHTML = `<div class="b-ico">${d.icon}</div><div class="b-nm">${d.label}</div><div class="b-rec">${statusLabel}</div><div class="b-iv">${inventoryText(b)}</div><div class="prog"><span style="width:${pct}%"></span></div>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); selectedId = id; renderAll(); });
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

function connectionStatus(cn) {
  const fb = blds.get(cn.fb), tb = blds.get(cn.tb);
  if (!fb || !tb) return 'blocked';
  const out = outputPort(fb);
  const ip = inputPorts(tb)[cn.tpi];
  if (!out || !inputAccepts(ip, out.res)) return 'blocked';
  const targetRes = inputResourceForStorage(ip, out.res);
  if ((tb.inv[targetRes] || 0) >= capFor(tb, targetRes)) return 'blocked';
  if ((fb.inv[out.res] || 0) <= 0) return 'starved';
  return 'flowing';
}

function renderConnections() {
  const temp = sl.querySelector('#tp');
  sl.innerHTML = '';
  if (temp) sl.appendChild(temp);
  for (const cn of conns) {
    const fb = blds.get(cn.fb), tb = blds.get(cn.tb);
    if (!fb || !tb) continue;
    const p1 = portPx(fb, outputPort(fb));
    const p2 = portPx(tb, inputPorts(tb)[cn.tpi]);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', bez(p1, p2));
    path.setAttribute('class', `cpath ${connectionStatus(cn)}`);
    path.addEventListener('contextmenu', (e) => { e.preventDefault(); conns = conns.filter(c => c.id !== cn.id); renderAll(); toast('Connection deleted'); });
    sl.appendChild(path);
  }
}

function renderInspector() {
  const b = blds.get(selectedId);
  if (!b) { inspectEmpty.classList.remove('hidden'); inspectContent.classList.add('hidden'); inspectContent.innerHTML = ''; return; }
  const d = BUILDINGS[b.type];
  const rec = activeRecipe(b);
  inspectEmpty.classList.add('hidden'); inspectContent.classList.remove('hidden');
  const isSeller = d.kind === 'seller';
  const recipeField = isSeller ? '' : `<div class="field"><div class="field-title">Active Recipe</div><select id="recipeSelect" class="recipe-select">${Object.entries(d.recipes).map(([key, r]) => `<option value="${key}" ${b.recipe === key ? 'selected' : ''}>${r.label}</option>`).join('')}</select></div>`;
  const inputPills = isSeller
    ? Object.entries(d.sellPrices).map(([res, price]) => `<span class="pill">${itemIcon(res)} ${itemLabel(res)} → ${price} gold</span>`).join('')
    : Object.entries(rec.inputs).map(([res, amt]) => `<span class="pill">${itemIcon(res)} ${amt} ${itemLabel(res)}</span>`).join('') || '<span class="pill">No inputs</span>';
  const outputText = isSeller ? 'Sells stocked goods for gold' : `${itemIcon(rec.output.res)} ${rec.output.amount} ${itemLabel(rec.output.res)}`;
  const outputTitle = isSeller ? 'Sale Output' : 'Single Output';
  const invRows = Object.keys({ ...d.capacity, ...b.inv }).map(res => `<div class="inv-row"><span>${itemIcon(res)} ${itemLabel(res)}</span><span>${b.inv[res] || 0}/${capFor(b, res)}</span></div>`).join('');
  inspectContent.innerHTML = `
    <div class="field"><div class="field-title">${d.icon} ${d.label}</div><div class="field-sub">${d.desc}</div></div>
    ${recipeField}
    <div class="field"><div class="field-title">${isSeller ? 'Accepted Goods' : 'Inputs'}</div><div>${inputPills}</div></div>
    <div class="field"><div class="field-title">${outputTitle}</div><div class="field-sub">${outputText}</div></div>
    <div class="field"><div class="field-title">Inventory</div>${invRows || '<div class="field-sub">Empty</div>'}</div>`;
  if (!isSeller) document.getElementById('recipeSelect').addEventListener('change', (e) => changeRecipe(selectedId, e.target.value));
}

function renderAll() { renderSidebar(); renderBuildings(); renderConnections(); renderInspector(); renderTechTree(); goldEl.textContent = `💰 ${gold} gold`; tstat.textContent = `t=${ticks}`; }

function changeRecipe(id, recipe) {
  const b = blds.get(id); if (!b) return;
  b.recipe = recipe; b.ptimer = 0;
  conns = conns.filter(c => c.fb !== id && c.tb !== id); // active ports changed, so old links are invalidated intentionally
  renderAll(); toast('Recipe changed; links reset');
}

function onPort(e) {
  e.stopPropagation();
  if (mode === 'placing') return;
  const bid = Number(e.currentTarget.dataset.bid);
  const pi = Number(e.currentTarget.dataset.pi);
  const kind = e.currentTarget.dataset.kind;
  if (kind === 'out' && mode !== 'connecting') {
    mode = 'connecting'; connFrom = { bid };
    setHint('Click a blue input port to connect · Esc to cancel'); ensureTempPath(); return;
  }
  if (kind === 'in' && mode === 'connecting') {
    const fb = blds.get(connFrom.bid), tb = blds.get(bid);
    if (connFrom.bid === bid) return failConnect('Cannot connect a building to itself');
    const op = outputPort(fb), ip = inputPorts(tb)[pi];
    if (!op || !ip) return failConnect('Missing port');
    if (!inputAccepts(ip, op.res)) return failConnect(`${itemLabel(op.res)} does not match ${itemLabel(ip.res)}`);
    if (!ip.acceptsAll && conns.find(c => c.tb === bid && c.tpi === pi)) return failConnect('Input already connected');
    // Intentional design rule: one active output per node, but it may feed multiple compatible inputs.
    conns.push({ id: nextId++, fb: connFrom.bid, tb: bid, tpi: pi });
    cancelConnection(); renderAll(); setHint('Connected. Click another green output to connect more.'); return;
  }
}
function failConnect(message) { setHint(`❌ ${message}`); cancelConnection(); }
function ensureTempPath() { if (!sl.querySelector('#tp')) { const t = document.createElementNS('http://www.w3.org/2000/svg', 'path'); t.id = 'tp'; t.setAttribute('class', 'tpath'); sl.appendChild(t); } }
function cancelConnection() { mode = 'idle'; connFrom = null; const t = sl.querySelector('#tp'); if (t) t.remove(); }

gameEl.addEventListener('mousemove', (e) => {
  if (mode !== 'connecting') return;
  const fb = blds.get(connFrom.bid); const out = outputPort(fb); if (!fb || !out) return;
  const p1 = portPx(fb, out); const p2 = localPoint(e);
  ensureTempPath(); sl.querySelector('#tp').setAttribute('d', bez(p1, p2));
});

gc.addEventListener('click', (e) => {
  if (suppressNextGridClick) {
    suppressNextGridClick = false;
    return;
  }
  if (mode !== 'placing') { selectedId = null; renderAll(); return; }
  if (e.target.closest('.bld') || e.target.closest('.port')) return;
  const point = localPoint(e);
  const gx = Math.floor(point.x / CELL); const gy = Math.floor(point.y / CELL);
  const d = BUILDINGS[placeType];
  if (!gridFree(gx, gy, d.w, d.h)) { setHint('❌ Space occupied — try another cell'); return; }
  if (gold < d.cost) { setHint(`❌ Need ${d.cost} gold to build ${d.label}`); toast('Not enough gold'); return; }
  const id = nextId++;
  gold -= d.cost;
  blds.set(id, { id, type: placeType, gx, gy, recipe: firstRecipe(placeType), inv: {}, ptimer: 0 });
  gridSet(gx, gy, d.w, d.h, id);
  selectedId = id;
  mode = 'idle';
  placeType = null;
  document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel'));
  setHint('Building placed');
  renderAll();
});

function deleteBuilding(id) {
  const b = blds.get(id); if (!b) return;
  gridSet(b.gx, b.gy, BUILDINGS[b.type].w, BUILDINGS[b.type].h, 0);
  blds.delete(id); conns = conns.filter(c => c.fb !== id && c.tb !== id);
  if (selectedId === id) selectedId = null;
  renderAll(); toast('Building deleted');
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (mode === 'connecting') { cancelConnection(); setHint('Cancelled'); }
  if (mode === 'placing') { mode = 'idle'; placeType = null; document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); setHint('Select a building from the sidebar to place it'); }
});

function canProduce(b) {
  if (BUILDINGS[b.type].kind === 'seller') return canSell(b);
  const rec = activeRecipe(b);
  for (const [res, amt] of Object.entries(rec.inputs)) if ((b.inv[res] || 0) < amt) return false;
  if (rec.output.res !== 'gold' && (b.inv[rec.output.res] || 0) + rec.output.amount > capFor(b, rec.output.res)) return false;
  return true;
}

function produce(b) {
  if (BUILDINGS[b.type].kind === 'seller') { sellGoods(b); return; }
  const rec = activeRecipe(b);
  for (const [res, amt] of Object.entries(rec.inputs)) b.inv[res] = (b.inv[res] || 0) - amt;
  if (rec.output.res === 'gold') gold += rec.output.amount;
  else b.inv[rec.output.res] = (b.inv[rec.output.res] || 0) + rec.output.amount;
}

function canSell(b) {
  const prices = BUILDINGS[b.type].sellPrices || {};
  return Object.keys(prices).some(res => (b.inv[res] || 0) > 0);
}

function sellGoods(b) {
  const prices = BUILDINGS[b.type].sellPrices || {};
  const res = Object.keys(prices).find(key => (b.inv[key] || 0) > 0);
  if (!res) return;
  b.inv[res]--;
  gold += prices[res];
}

function transferResources() {
  // Each connection can move one unit per tick if source has output and target has capacity.
  for (const cn of conns) {
    const fb = blds.get(cn.fb), tb = blds.get(cn.tb); if (!fb || !tb) continue;
    const out = outputPort(fb); const ip = inputPorts(tb)[cn.tpi];
    if (!out || !inputAccepts(ip, out.res)) continue;
    const res = out.res;
    const targetRes = inputResourceForStorage(ip, res);
    if ((fb.inv[res] || 0) > 0 && (tb.inv[targetRes] || 0) < capFor(tb, targetRes)) { fb.inv[res]--; tb.inv[targetRes] = (tb.inv[targetRes] || 0) + 1; }
  }
}

function buyTech(key) {
  const tech = techs[key];
  if (!tech || tech.bought) return;
  if (gold < tech.cost) { toast('Not enough gold'); return; }
  gold -= tech.cost;
  tech.bought = true;
  expandGrid(4, 2);
  setHint('Grid expanded');
  renderAll();
  toast('Tech purchased');
}

function expandGrid(extraCols, extraRows) {
  worldCols += extraCols;
  worldRows += extraRows;
  for (const row of grid) for (let i = 0; i < extraCols; i++) row.push(0);
  for (let i = 0; i < extraRows; i++) grid.push(new Array(worldCols).fill(0));
  applyWorldSize();
  drawBg();
}

function tick() {
  ticks++;
  for (const [, b] of blds) {
    if (BUILDINGS[b.type].kind === 'seller') {
      if (canSell(b)) sellGoods(b);
      continue;
    }
    const rec = activeRecipe(b);
    if (canProduce(b)) {
      b.ptimer = (b.ptimer || 0) + 1;
      if (b.ptimer >= rec.time) { produce(b); b.ptimer = 0; }
    } else {
      b.ptimer = 0;
    }
  }
  transferResources();
  renderAll();
}

function saveGame() {
  const payload = { nextId, gold, ticks, worldCols, worldRows, techs, buildings: [...blds.values()], conns };
  localStorage.setItem('factory-node-prototype-save', JSON.stringify(payload)); toast('Saved');
}
function loadGame() {
  const raw = localStorage.getItem('factory-node-prototype-save'); if (!raw) return toast('No save found');
  const payload = JSON.parse(raw); resetWorld(false);
  nextId = payload.nextId; gold = payload.gold ?? STARTING_GOLD; ticks = payload.ticks || 0; conns = payload.conns || [];
  worldCols = payload.worldCols || COLS; worldRows = payload.worldRows || ROWS; grid = createGrid(worldCols, worldRows);
  for (const [key, saved] of Object.entries(payload.techs || {})) if (techs[key]) techs[key].bought = Boolean(saved.bought);
  applyWorldSize(); drawBg();
  for (const b of payload.buildings || []) { blds.set(b.id, b); gridSet(b.gx, b.gy, BUILDINGS[b.type].w, BUILDINGS[b.type].h, b.id); }
  renderAll(); toast('Loaded');
}
function resetWorld(confirmFirst = true) {
  if (confirmFirst && !confirm('Reset the prototype?')) return;
  nextId = 1; gold = STARTING_GOLD; ticks = 0; selectedId = null; mode = 'idle'; placeType = null; connFrom = null; conns = []; blds.clear(); worldCols = COLS; worldRows = ROWS; panOffset = { x: 0, y: 0 }; grid = createGrid(worldCols, worldRows);
  for (const tech of Object.values(techs)) tech.bought = false;
  applyWorldSize(); applyPan(); drawBg();
  document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); setHint('Select a building from the sidebar to place it'); renderAll();
}

document.getElementById('saveBtn').addEventListener('click', saveGame);
document.getElementById('loadBtn').addEventListener('click', loadGame);
document.getElementById('resetBtn').addEventListener('click', () => resetWorld(true));
document.getElementById('zoomOutBtn').addEventListener('click', () => setZoom(zoom - 0.25));
document.getElementById('zoomInBtn').addEventListener('click', () => setZoom(zoom + 0.25));
gameEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1), e);
}, { passive: false });
gameEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || mode === 'connecting' || !isGridDragTarget(e.target)) return;
  pan = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    offsetX: panOffset.x,
    offsetY: panOffset.y,
    active: false,
    captured: false
  };
});
gameEl.addEventListener('pointermove', (e) => {
  if (!pan || pan.id !== e.pointerId) return;
  const dx = e.clientX - pan.x;
  const dy = e.clientY - pan.y;
  if (!pan.active && Math.hypot(dx, dy) < 4) return;
  if (!pan.captured) {
    gameEl.setPointerCapture(e.pointerId);
    pan.captured = true;
  }
  pan.active = true;
  suppressNextGridClick = true;
  gameEl.classList.add('panning');
  panOffset.x = pan.offsetX + dx;
  panOffset.y = pan.offsetY + dy;
  applyPan();
});
gameEl.addEventListener('pointerup', (e) => {
  if (!pan || pan.id !== e.pointerId) return;
  if (pan.active) suppressNextGridClick = true;
  if (pan.captured) gameEl.releasePointerCapture(e.pointerId);
  pan = null;
  gameEl.classList.remove('panning');
});
gameEl.addEventListener('pointercancel', (e) => {
  if (!pan || pan.id !== e.pointerId) return;
  pan = null;
  gameEl.classList.remove('panning');
});

function renderSidebar() {
  const cards = document.getElementById('buildingCards'); cards.innerHTML = '';
  for (const [type, d] of Object.entries(BUILDINGS)) {
    const card = document.createElement('div');
    card.className = `bcard ${placeType === type ? 'sel' : ''} ${gold < d.cost ? 'locked' : ''}`;
    card.innerHTML = `<div class="bcard-n"><span>${d.icon} ${d.label}</span><span>${d.cost}g</span></div><div class="bcard-d">${d.desc}</div>`;
    card.addEventListener('click', () => { document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); card.classList.add('sel'); if (mode === 'connecting') cancelConnection(); mode = 'placing'; placeType = type; setHint(`Placing ${d.label} — click the grid · Esc to cancel`); });
    cards.appendChild(card);
  }
}

function renderTechTree() {
  const cards = document.getElementById('techCards'); cards.innerHTML = '';
  for (const [key, tech] of Object.entries(techs)) {
    const card = document.createElement('div');
    card.className = `tech-card ${tech.bought ? 'bought' : ''}`;
    const canBuy = gold >= tech.cost && !tech.bought;
    card.innerHTML = `
      <div class="tech-head"><span>${tech.label}</span><span>${tech.bought ? 'Bought' : `${tech.cost} gold`}</span></div>
      <div class="tech-desc">${tech.desc}</div>
      <button class="tech-buy" ${canBuy ? '' : 'disabled'}>${tech.bought ? 'Purchased' : 'Buy'}</button>`;
    card.querySelector('button').addEventListener('click', () => buyTech(key));
    cards.appendChild(card);
  }
}

applyWorldSize(); applyZoom(); applyPan(); drawBg(); renderAll(); setInterval(tick, 1000);
