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

- Grid placement by selecting a building from the Buildings frame, then placing it on the Main frame.
- Movable placed buildings.
- A stocked Sawmill starts on the grid so the first action creates a Plank before the support chain is built.
- Main, Buildings, and Tech Tree are exclusive top-level frames; only one is visible at a time.
- Lumber Camp and Market unlock through free early Market Access after the first Plank.
- In-node recipe switching for crafters.
- One outgoing connection per output and one incoming connection per input.
- Universal single-input Market that sells stocked goods when worked.
- Lifetime production thresholds that reveal new tech.
- Resource storage, manual node work, and work progress meters.
- Money-only opening costs with compact Gold/Silver/Copper display.
- Early milestone goals with small money rewards.
- Node-type upgrades bought from building subviews in the tech tree, including storage, speed, manager pace, input efficiency, output, and market value upgrades.
- Science-unlocked Manager slots with buyable Managers that automate assigned nodes.
- Tech Tree frame with building unlocks, Knowledge, grid, storage, crafting, and market upgrades.
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
│   ├── unlock-tree.json
│   └── start-state.json
├── docs/
│   ├── design-notes.md
│   ├── content-driven-editing.md
│   ├── content-format.md
│   ├── phase-plan.md
│   └── prototype-functionality.md
├── scripts/
│   ├── check-unlock-tree-state.mjs
│   ├── run-hardening-tests.mjs
│   ├── test-helpers.mjs
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

Run the focused hardening checks with:

```bash
npm run test:hardening
```

Production, crafting, and selling begin as manual work. The current opening starts from a pre-placed Sawmill with stored Wood so the player sees transformation before building the supply chain. Researched Manager slots and hired Managers then create the first automation layer for individual nodes. Addons can improve existing nodes through lower work requirements, faster manager progress, better inputs, extra output, storage, or sale value.

Good next engineering steps are expanding test coverage as new systems land, then continuing to split `input.js` or `render.js` only when interaction or UI complexity makes that worthwhile.
