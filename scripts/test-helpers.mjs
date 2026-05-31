import { readFile } from 'node:fs/promises';
import { initializeContent } from '../src/content-loader.js';

export const CONTENT_FILES = {
  items: 'content/items.json',
  buildings: 'content/buildings.json',
  techs: 'content/techs.json',
  goals: 'content/goals.json',
  addons: 'content/addons.json',
  managers: 'content/managers.json',
  unlockTree: 'content/unlock-tree.json',
  startState: 'content/start-state.json'
};

export async function loadTestContent(overrides = {}) {
  const raw = {};
  for (const [key, path] of Object.entries(CONTENT_FILES)) {
    raw[key] = JSON.parse(await readFile(path, 'utf8'));
  }
  const result = initializeContent({ ...raw, ...overrides });
  return { raw, ...result };
}

export function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear()
  };
}

export function createDomStub() {
  return {
    querySelectorAll: () => []
  };
}

export function createContext(state) {
  const context = {
    state,
    toasts: [],
    hints: [],
    applyWorldSize() {},
    applyZoom() {},
    applyPan() {},
    drawBg() {},
    renderAll() {},
    gridSet(gx, gy, w, h, value) {
      for (let row = gy; row < gy + h; row++) {
        for (let col = gx; col < gx + w; col++) state.grid[row][col] = value;
      }
    },
    setHint(message) {
      context.hints.push(message);
    },
    toast(message) {
      context.toasts.push(message);
    }
  };
  return context;
}
