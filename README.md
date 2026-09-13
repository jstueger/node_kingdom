# Node Kingdom

A playable, dependency-free browser prototype about building factory and city systems from directly connected production nodes.

[Project page](https://juppstueger.com/projects/node-kingdom/) · [Licence](LICENSE)

**Status:** Playable prototype. The opening progression, production network, technology tree, upgrades, managers, goals and local save system are implemented; balancing and further systems remain under development.

The central rule is:

> Every recipe-based node has one active output at a time. Crafters may have multiple recipes, but only one recipe is active.

Markets are the exception: they do not use recipes and sell supported trade goods they receive.

## Run locally

No build step or package installation is required. Because the project uses ES modules, serve it through a local web server instead of opening `index.html` directly.

```bash
git clone https://github.com/jstueger/node_kingdom.git
cd node_kingdom
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). VS Code Live Server also works.

## Current features

- Free grid placement using the Buildings pop-out menu.
- Movable buildings and direct output-to-input resource connections.
- A stocked starting Sawmill that introduces transformation before supply-chain construction.
- In-node recipe switching for crafting buildings.
- Manual production, crafting and selling with visible work progress.
- Resource storage and a compact Gold/Silver/Copper currency display.
- A progression-driven technology tree with building, Knowledge, grid, storage, crafting and market unlocks.
- Building-specific storage, speed, manager pace, input efficiency, output and market-value upgrades.
- Buyable Managers that automate assigned production nodes.
- Early milestone goals with small currency rewards.
- Content-driven items, buildings, recipes, technology, goals, addons, managers and starting state.
- Save, load and reset through browser `localStorage`.

For the complete description of implemented behaviour, see [the prototype functionality document](docs/prototype-functionality.md).

## Design documentation

The repository contains both the playable prototype and the reasoning behind it:

- [Prototype functionality](docs/prototype-functionality.md) describes current behaviour.
- [Design notes](docs/design-notes.md) explain the design intent and constraints.
- [Phase plan](docs/phase-plan.md) records the development roadmap.
- [Content-driven editing](docs/content-driven-editing.md) explains how game data is authored.
- [Content format](docs/content-format.md) documents the JSON structures.

Additional documents in `docs/` preserve focused thinking about pacing, technology and the evolving game loop.

## Architecture

The browser is the runtime. The project deliberately has no production dependencies and loads its JavaScript directly as ES modules.

The `content/` JSON files are the source of truth for authored game data. `src/content-loader.js` converts that data into the runtime shape, while `src/content-validation.js` checks references before the game begins.

```text
node_kingdom/
├── content/       # Authored game data
├── docs/          # Design and implementation documentation
├── scripts/       # Validation and hardening checks
├── src/           # Game logic, state, input and rendering
├── index.html     # Browser entry point
├── styles.css     # Interface styling
└── package.json   # Development commands
```

The source is separated into state, rules, simulation, rendering, input, camera, persistence and content-loading modules so that future systems can be added without rebuilding the core.

## Validation

Run the available project checks with:

```bash
npm run validate:content
npm run check:unlock-tree
npm run test:hardening
```

These validate the content model, unlock-tree state and focused hardening scenarios.

## Contributing

Bug reports and focused feedback are welcome through [GitHub Issues](https://github.com/jstueger/node_kingdom/issues).

Node Kingdom is a personal experimental project. Please open an issue before submitting a substantial pull request so the proposed change can be discussed first. No particular response or release schedule is promised.

## Licence

Node Kingdom is available under the [MIT Licence](LICENSE).
