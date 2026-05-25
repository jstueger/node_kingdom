# Factory Node Prototype

A small browser-based factory/city-builder prototype focused on free grid placement, node recipes, and direct output-to-input resource connectors.

The core rule is:

> Every recipe-based node has one active output at a time. Crafters may have multiple recipes, but only one recipe is active.

Markets are the exception: they do not use recipes and sell supported trade goods they receive.

## Purpose Of This File

This README is the project entry point. It explains how to run the prototype, what it currently is at a glance, and where to find the deeper documents.

- `docs/prototype-functionality.md`: current behavior spec for the playable prototype.
- `docs/design-notes.md`: design intent, constraints, and near-term product direction.
- `docs/phase-plan.md`: agreed phase roadmap for upcoming work.

## How To Run

No build step is required.

Because the project uses ES modules, open it through a local web server rather than by double-clicking `index.html`.

```bash
cd node_kingdom
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

VS Code Live Server also works.

## Feature Snapshot

- Grid placement by click or drag-and-drop from the building menu.
- Movable placed buildings.
- Lumber Camp starts unlocked; additional buildings unlock through an early resource-and-gold tech spine.
- In-node recipe switching for crafters.
- One outgoing connection per output and one incoming connection per input.
- Universal single-input Market that sells stocked goods when worked.
- Lifetime production thresholds that reveal new tech.
- Resource storage, manual node work, and work progress meters.
- Early milestone goals with small gold rewards.
- Node-type addons bought from the selected building inspector, including storage, speed, manager pace, input efficiency, output, and market value upgrades.
- Science-unlocked Manager slots with buyable Managers that automate assigned nodes.
- Toggleable tech tree with building unlocks, Knowledge, grid, storage, crafting, and market upgrades.
- Save/load/reset through browser `localStorage`.

## Source Layout

```text
node_kingdom/
├── index.html
├── styles.css
├── README.md
├── package.json
├── content/
│   ├── items.json
│   ├── buildings.json
│   ├── techs.json
│   ├── goals.json
│   ├── addons.json
│   ├── managers.json
│   └── start-state.json
├── docs/
│   ├── design-notes.md
│   ├── content-driven-editing.md
│   ├── content-format.md
│   ├── phase-plan.md
│   └── prototype-functionality.md
├── scripts/
│   └── validate-content.mjs
└── src/
    ├── data.js
    ├── content-loader.js
    ├── content-validation.js
    ├── progression-data.js
    ├── state.js
    ├── rules.js
    ├── simulation.js
    ├── render.js
    ├── world.js
    ├── camera.js
    ├── save.js
    ├── input.js
    ├── view-models.js
    └── main.js
```

## Development Notes

The project intentionally stays dependency-free for now. The browser is the runtime, content is loaded from JSON, and source files are loaded directly as ES modules.

The `content/` JSON files are now the source of truth for items, buildings, recipes, techs, goals, addons, manager definitions, and start state. `src/content-loader.js` normalizes those authoring-friendly fields into the runtime shape, and `src/content-validation.js` checks references before the game starts.

Run content validation with:

```bash
node scripts/validate-content.mjs
```

The same check is also available as `npm run validate:content`.

Production, crafting, and selling begin as manual work. That is intentional early-game bootstrap friction; researched Manager slots and hired Managers now create the first automation layer for individual nodes. Addons can then improve existing nodes through lower work requirements, faster manager progress, better inputs, extra output, storage, or sale value.

Good next engineering steps are adding tests for `rules.js`, `simulation.js`, and `world.js`, then continuing to split `input.js` only when interaction complexity makes that worthwhile.
