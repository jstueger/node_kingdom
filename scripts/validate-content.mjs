import { readFile } from 'node:fs/promises';
import { initializeContent } from '../src/content-loader.js';

const files = {
  items: 'content/items.json',
  buildings: 'content/buildings.json',
  techs: 'content/techs.json',
  goals: 'content/goals.json',
  addons: 'content/addons.json',
  managers: 'content/managers.json',
  unlockTree: 'content/unlock-tree.json',
  startState: 'content/start-state.json'
};

const raw = {};
for (const [key, path] of Object.entries(files)) {
  raw[key] = JSON.parse(await readFile(path, 'utf8'));
}

const { validation } = initializeContent(raw);
for (const warning of validation.warnings) console.warn(`warning: ${warning}`);
console.log('content validation ok');
