import { BUILDINGS, CELL, COLS, ROWS, W, H, activeRecipe, capFor, firstRecipe, inputPorts, itemIcon, itemLabel, outputPort } from './data.js';

let nextId = 1;
let gold = 0;
let ticks = 0;
let selectedId = null;
let mode = 'idle';
let placeType = null;
let connFrom = null;
let conns = [];
const blds = new Map();
let grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

const bg = document.getElementById('bg');
const gc = document.getElementById('gc');
const bl = document.getElementById('bl');
const sl = document.getElementById('sl');
const hint = document.getElementById('hint');
const goldEl = document.getElementById('gold');
const tstat = document.getElementById('tstat');
const inspectEmpty = document.getElementById('inspectEmpty');
const inspectContent = document.getElementById('inspectContent');
const toastEl = document.getElementById('toast');

gc.style.cssText = `width:${W}px;height:${H}px;`;
sl.setAttribute('width', W);
sl.setAttribute('height', H);
sl.setAttribute('viewBox', `0 0 ${W} ${H}`);

function setHint(message) { hint.textContent = message; }
function toast(message) { toastEl.textContent = message; toastEl.style.opacity = '1'; setTimeout(() => toastEl.style.opacity = '0', 1100); }

function drawBg() {
  bg.width = W; bg.height = H;
  const ctx = bg.getContext('2d');
  ctx.fillStyle = '#0c0c1e'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#141428'; ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke(); }
  for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke(); }
  ctx.fillStyle = '#1c1c38';
  for (let ci = 0; ci <= COLS; ci++) for (let ri = 0; ri <= ROWS; ri++) { ctx.beginPath(); ctx.arc(ci * CELL, ri * CELL, 2, 0, Math.PI * 2); ctx.fill(); }
}

function gridFree(gx, gy, w, h) {
  for (let r = gy; r < gy + h; r++) for (let c = gx; c < gx + w; c++) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
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

function renderBuildings() {
  bl.innerHTML = '';
  for (const [id, b] of blds) {
    const d = BUILDINGS[b.type];
    const rec = activeRecipe(b);
    const el = document.createElement('div');
    el.className = `bld ${id === selectedId ? 'sel' : ''}`;
    el.style.cssText = `left:${b.gx * CELL + 2}px;top:${b.gy * CELL + 2}px;width:${d.w * CELL - 4}px;height:${d.h * CELL - 4}px;background:${d.color};`;
    const pct = Math.min(100, Math.floor(((b.ptimer || 0) / rec.time) * 100));
    el.innerHTML = `<div class="b-ico">${d.icon}</div><div class="b-nm">${d.label}</div><div class="b-rec">${rec.label}</div><div class="b-iv">${inventoryText(b)}</div><div class="prog"><span style="width:${pct}%"></span></div>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); selectedId = id; renderAll(); });
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); deleteBuilding(id); });

    inputPorts(b).forEach((p, pi) => {
      const pos = portPx(b, p);
      const pe = document.createElement('div');
      pe.className = 'port in'; pe.style.left = `${pos.x - b.gx * CELL}px`; pe.style.top = `${pos.y - b.gy * CELL}px`;
      pe.dataset.bid = id; pe.dataset.pi = pi; pe.dataset.kind = 'in'; pe.title = `Input: ${itemLabel(p.res)}`; pe.addEventListener('click', onPort);
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
  if (!out || !ip || out.res !== ip.res) return 'blocked';
  if ((tb.inv[ip.res] || 0) >= capFor(tb, ip.res)) return 'blocked';
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
  const recipeOptions = Object.entries(d.recipes).map(([key, r]) => `<option value="${key}" ${b.recipe === key ? 'selected' : ''}>${r.label}</option>`).join('');
  const inputPills = Object.entries(rec.inputs).map(([res, amt]) => `<span class="pill">${itemIcon(res)} ${amt} ${itemLabel(res)}</span>`).join('') || '<span class="pill">No inputs</span>';
  const outputText = rec.output.res === 'gold' ? `💰 ${rec.output.amount} gold` : `${itemIcon(rec.output.res)} ${rec.output.amount} ${itemLabel(rec.output.res)}`;
  const invRows = Object.keys({ ...d.capacity, ...b.inv }).map(res => `<div class="inv-row"><span>${itemIcon(res)} ${itemLabel(res)}</span><span>${b.inv[res] || 0}/${capFor(b, res)}</span></div>`).join('');
  inspectContent.innerHTML = `
    <div class="field"><div class="field-title">${d.icon} ${d.label}</div><div class="field-sub">${d.desc}</div></div>
    <div class="field"><div class="field-title">Active Recipe</div><select id="recipeSelect" class="recipe-select">${recipeOptions}</select></div>
    <div class="field"><div class="field-title">Inputs</div><div>${inputPills}</div></div>
    <div class="field"><div class="field-title">Single Output</div><div class="field-sub">${outputText}</div></div>
    <div class="field"><div class="field-title">Inventory</div>${invRows || '<div class="field-sub">Empty</div>'}</div>`;
  document.getElementById('recipeSelect').addEventListener('change', (e) => changeRecipe(selectedId, e.target.value));
}

function renderAll() { renderBuildings(); renderConnections(); renderInspector(); goldEl.textContent = `💰 ${gold} gold`; tstat.textContent = `t=${ticks}`; }

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
    if (op.res !== ip.res) return failConnect(`${itemLabel(op.res)} does not match ${itemLabel(ip.res)}`);
    if (conns.find(c => c.tb === bid && c.tpi === pi)) return failConnect('Input already connected');
    // Intentional design rule: one active output per node, but it may feed multiple compatible inputs.
    conns.push({ id: nextId++, fb: connFrom.bid, tb: bid, tpi: pi });
    cancelConnection(); renderAll(); setHint('Connected. Click another green output to connect more.'); return;
  }
}
function failConnect(message) { setHint(`❌ ${message}`); cancelConnection(); }
function ensureTempPath() { if (!sl.querySelector('#tp')) { const t = document.createElementNS('http://www.w3.org/2000/svg', 'path'); t.id = 'tp'; t.setAttribute('class', 'tpath'); sl.appendChild(t); } }
function cancelConnection() { mode = 'idle'; connFrom = null; const t = sl.querySelector('#tp'); if (t) t.remove(); }

document.getElementById('game').addEventListener('mousemove', (e) => {
  if (mode !== 'connecting') return;
  const fb = blds.get(connFrom.bid); const out = outputPort(fb); if (!fb || !out) return;
  const p1 = portPx(fb, out); const rect = gc.getBoundingClientRect(); const p2 = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  ensureTempPath(); sl.querySelector('#tp').setAttribute('d', bez(p1, p2));
});

gc.addEventListener('click', (e) => {
  if (mode !== 'placing') { selectedId = null; renderAll(); return; }
  if (e.target.closest('.bld') || e.target.closest('.port')) return;
  const rect = gc.getBoundingClientRect();
  const gx = Math.floor((e.clientX - rect.left) / CELL); const gy = Math.floor((e.clientY - rect.top) / CELL);
  const d = BUILDINGS[placeType];
  if (!gridFree(gx, gy, d.w, d.h)) { setHint('❌ Space occupied — try another cell'); return; }
  const id = nextId++;
  blds.set(id, { id, type: placeType, gx, gy, recipe: firstRecipe(placeType), inv: {}, ptimer: 0 });
  gridSet(gx, gy, d.w, d.h, id); selectedId = id; renderAll();
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
  const rec = activeRecipe(b);
  for (const [res, amt] of Object.entries(rec.inputs)) if ((b.inv[res] || 0) < amt) return false;
  if (rec.output.res !== 'gold' && (b.inv[rec.output.res] || 0) + rec.output.amount > capFor(b, rec.output.res)) return false;
  return true;
}

function produce(b) {
  const rec = activeRecipe(b);
  for (const [res, amt] of Object.entries(rec.inputs)) b.inv[res] = (b.inv[res] || 0) - amt;
  if (rec.output.res === 'gold') gold += rec.output.amount;
  else b.inv[rec.output.res] = (b.inv[rec.output.res] || 0) + rec.output.amount;
}

function transferResources() {
  // Each connection can move one unit per tick if source has output and target has capacity.
  for (const cn of conns) {
    const fb = blds.get(cn.fb), tb = blds.get(cn.tb); if (!fb || !tb) continue;
    const out = outputPort(fb); const ip = inputPorts(tb)[cn.tpi];
    if (!out || !ip || out.res !== ip.res) continue;
    const res = out.res;
    if ((fb.inv[res] || 0) > 0 && (tb.inv[res] || 0) < capFor(tb, res)) { fb.inv[res]--; tb.inv[res] = (tb.inv[res] || 0) + 1; }
  }
}

function tick() {
  ticks++;
  for (const [, b] of blds) {
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
  const payload = { nextId, gold, ticks, buildings: [...blds.values()], conns };
  localStorage.setItem('factory-node-prototype-save', JSON.stringify(payload)); toast('Saved');
}
function loadGame() {
  const raw = localStorage.getItem('factory-node-prototype-save'); if (!raw) return toast('No save found');
  const payload = JSON.parse(raw); resetWorld(false);
  nextId = payload.nextId; gold = payload.gold; ticks = payload.ticks; conns = payload.conns || [];
  for (const b of payload.buildings || []) { blds.set(b.id, b); gridSet(b.gx, b.gy, BUILDINGS[b.type].w, BUILDINGS[b.type].h, b.id); }
  renderAll(); toast('Loaded');
}
function resetWorld(confirmFirst = true) {
  if (confirmFirst && !confirm('Reset the prototype?')) return;
  nextId = 1; gold = 0; ticks = 0; selectedId = null; mode = 'idle'; placeType = null; connFrom = null; conns = []; blds.clear(); grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); setHint('Select a building from the sidebar to place it'); renderAll();
}

document.getElementById('saveBtn').addEventListener('click', saveGame);
document.getElementById('loadBtn').addEventListener('click', loadGame);
document.getElementById('resetBtn').addEventListener('click', () => resetWorld(true));

function renderSidebar() {
  const cards = document.getElementById('buildingCards'); cards.innerHTML = '';
  for (const [type, d] of Object.entries(BUILDINGS)) {
    const card = document.createElement('div'); card.className = 'bcard';
    card.innerHTML = `<div class="bcard-n">${d.icon} ${d.label}</div><div class="bcard-d">${d.desc}</div>`;
    card.addEventListener('click', () => { document.querySelectorAll('.bcard').forEach(c => c.classList.remove('sel')); card.classList.add('sel'); if (mode === 'connecting') cancelConnection(); mode = 'placing'; placeType = type; setHint(`Placing ${d.label} — click the grid · Esc to cancel`); });
    cards.appendChild(card);
  }
}

renderSidebar(); drawBg(); renderAll(); setInterval(tick, 1000);
