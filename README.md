# Factory Node Prototype

A small browser-based factory/city-builder prototype focused on free grid placement and direct output-to-input connectors.

The key design rule is:

> Every node has one active output, while crafters may require multiple inputs depending on the selected recipe.

## How to run

No build step is required.

Because the project uses ES modules, open it through a local web server rather than by double-clicking `index.html`.

### Option 1: Python

```bash
cd node_kingdom
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: VS Code

Use the Live Server extension and open `index.html`.

## Current features

- Free grid placement
- Different building sizes
- Producers, crafters, and sellers
- Recipe-dependent input ports
- Recipe-less market with one universal input that sells any current resource it receives
- One active output per node
- Direct output-to-input connectors
- Typed resource compatibility checks
- Simple storage capacities
- Connector status colors
- Production progress bars
- Building inspector
- Recipe switching
- Right-click sell for buildings and delete for connections
- Save/load via browser localStorage
- Starting gold and building placement costs
- Toggleable tech tree window with simple upgrades

## Suggested next steps

1. Add unlocks.
2. Add a proper research/contracts screen.
3. Add clearer bottleneck summaries.
4. Add building movement after placement.
5. Add recipe categories and better balancing.
6. Add persistent project save files beyond localStorage.

## File structure

```text
factory-node-prototype/
├── index.html
├── styles.css
├── README.md
├── docs/
│   └── design-notes.md
└── src/
    ├── data.js
    └── main.js
```
