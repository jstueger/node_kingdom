# Prototype Functionality

This document describes the current behavior of the Factory Node Prototype. It is intended to become the ongoing project record for what the prototype does now and what changes over time.

## Core Concept

The prototype is a browser-based factory and city-builder experiment built around free grid placement and direct resource connections.

The main design rule is:

> Each recipe-based building has one active output at a time. Crafters may have multiple possible recipes, but only one recipe is active.

Market buildings are the exception: they do not use recipes and instead sell any accepted goods they receive.

Players place buildings on a fixed grid, connect compatible output ports to input ports, and let the simulation move resources through the resulting production graph.

## Running The Prototype

The project has no build step.

Because it uses JavaScript ES modules, it should be served through a local web server instead of opened directly from the filesystem.

Example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Layout

The interface has three main areas:

- Top bar: shows gold, simulation ticks, save/load/reset buttons, and the current hint.
- Top bar: also includes zoom out and zoom in buttons with the current zoom percentage.
- Left sidebar: lists placeable buildings, tech tree purchases, and port/connection states.
- Center game area: contains the centered placement grid, buildings, ports, and connector paths.
- Right inspector: shows details for the selected building.

## Grid And Placement

The world uses a fixed grid:

- Cell size: 72 pixels.
- Starting columns: 10.
- Starting rows: 10.
- Starting play area: 720 by 720 pixels.

Buildings are placed freely on this grid:

- Select a building from the sidebar.
- Click an empty grid location to place it.
- After a successful placement, placement mode ends automatically.
- Placement costs gold.
- The player starts with 25 gold.
- Buildings cannot overlap.
- Buildings cannot be placed outside the grid.
- A building is not placed and no gold is spent if the target cell is occupied, out of bounds, or the player cannot afford the building.
- Press `Escape` to cancel placement.
- Right-click a building to delete it.

Buildings may occupy different grid sizes. Current producer and market buildings occupy one cell, while crafting buildings occupy two cells horizontally.

The grid can be expanded through the tech tree.

## Zooming

The game area supports zooming.

Zoom controls:

- Click `-` in the top bar to zoom out.
- Click `+` in the top bar to zoom in.
- Use the mouse wheel over the game area to zoom.

Current zoom is shown as a percentage in the top bar.

Zoom range:

- Minimum: 50%.
- Maximum: 200%.

Zooming scales the grid, buildings, ports, and connection paths together. Mouse-wheel zoom anchors around the cursor. Placement and connection preview coordinates account for the current zoom level.

## Panning

The game area can be panned by holding the left mouse button and dragging on empty grid space.

Panning uses a camera offset, so it works even when the grid is smaller than the visible game pane. Panning does not start from buildings or ports. During connection mode, mouse movement is reserved for the temporary connection preview.

## Buildings

The current building types are:

- Iron Mine: produces iron ore.
- Coal Mine: produces coal.
- Lumber Camp: produces wood.
- Forge: crafts iron bars or steel bars.
- Sawmill: crafts planks.
- Blacksmith: crafts swords.
- Market: sells goods for gold.

Each building has:

- A label and icon.
- A type-specific grid size.
- A description.
- A gold cost.
- A building kind: producer, crafter, or seller.
- One or more recipes, except for Markets.
- Resource storage capacities.
- A production progress timer.
- An inventory.

Market buildings do not have recipes. They have accepted goods and sell prices instead.

## Building Costs

Building cards show their gold cost in the left sidebar.

Current placement costs:

- Iron Mine: 5 gold.
- Coal Mine: 5 gold.
- Lumber Camp: 5 gold.
- Forge: 12 gold.
- Sawmill: 10 gold.
- Blacksmith: 18 gold.
- Market: 5 gold.

Unaffordable building cards are dimmed. They can still be selected, but placement fails until the player has enough gold.

## Items

The current resource items are:

- Iron Ore.
- Iron Bar.
- Wood.
- Plank.
- Coal.
- Steel Bar.
- Sword.

Gold is treated as an abstract currency sink rather than a physical item that can be transported through ports.

## Recipes

Most buildings have one active recipe.

The active recipe determines:

- Which input ports are displayed.
- Which input resources are required.
- Which single output is produced.
- How long production takes.
- Which output port is displayed, if any.

Producers have recipes with no inputs. Crafters consume inputs and create output resources.

Markets do not use recipes. A Market accepts all sellable goods at the same time and sells stocked goods for gold automatically.

Changing a building recipe:

- Updates the visible ports.
- Resets the building production timer.
- Deletes all existing connections to and from that building.

Connections are removed on recipe change because the old ports may no longer exist or may no longer accept the same resources.

## Ports

Recipe-based buildings expose ports based on their active recipe.

Markets expose one universal input port that accepts every current resource.

Input ports:

- Appear on the left side of a building.
- Are shown only for resources required by the active recipe.
- Are resource-specific.
- Accept at most one incoming connection.

The Market input port is not resource-specific, may accept multiple incoming connections, and replaces recipe requirements.

Output ports:

- Appear on the right side of a building.
- Represent the active recipe output.
- Are resource-specific.
- May feed multiple compatible input ports.
- Are not shown for Markets.

The Market has inputs but no output port because gold is not transported as a physical resource.

## Connections

Connections move resources directly from one building output to another building input.

To create a connection:

- Click a green output port.
- Click a compatible blue input port.
- Press `Escape` to cancel while connecting.

Connection rules:

- A building cannot connect to itself.
- Output and input resources must match.
- Each input port accepts only one connection.
- The Market's universal input is the exception: any resource may connect to it, and multiple outputs may feed it.
- One output port may feed multiple compatible inputs.
- Right-click a connection to delete it.

While creating a connection, a temporary dashed path follows the pointer from the selected output port.

## Connection Status

Connections are drawn with status colors:

- Flowing: source has the resource and target has capacity.
- Starved: source does not currently have the output resource.
- Blocked: target storage is full, ports are invalid, or resource types no longer match.

Each connection can move one unit of its resource per simulation tick.

## Tech Tree

The prototype has a simple tech tree in the left sidebar.

The current available tech is:

- Grid Expansion: costs 50 gold and adds 4 columns and 2 rows to the playable grid.

Grid Expansion can currently be bought once.

Buying the tech:

- Spends the required gold.
- Marks the tech as purchased.
- Expands the grid from 10 by 10 cells to 14 by 12 cells.
- Resizes the background canvas, SVG connection layer, and placement area.
- Preserves existing buildings, inventories, and connections.

The tech buy button is disabled while the player does not have enough gold or after the tech has already been purchased.

## Production Simulation

The simulation advances once per second.

On each tick:

1. The global tick counter increases.
2. Markets sell one stocked good for gold if they have any accepted goods in inventory.
3. Each recipe-based building checks whether it can produce.
4. Buildings with enough inputs and output capacity advance their production timer.
5. When a building timer reaches the active recipe time, production completes.
6. Completed recipes consume their inputs.
7. Completed recipes create their output resource.
8. Resource transfer runs across all connections.
9. The interface re-renders.

If a building cannot produce, its production timer resets to zero.

## Inventory And Capacity

Each building stores resources in a local inventory.

Capacity is defined per building type and resource. If no explicit capacity exists for a resource, the fallback capacity is 10.

Buildings cannot produce a physical output if doing so would exceed their output capacity.

Connections cannot transfer a resource into a target building if that target resource inventory is already at capacity.

## Inspector

Selecting a building opens its details in the inspector.

The inspector shows:

- Building name and description.
- Active recipe selector for recipe-based buildings.
- Current recipe inputs or accepted Market goods.
- Current recipe output or Market sale behavior.
- Current inventory and capacity for known resources.

Recipe changes are made from the inspector.

## Save And Load

The prototype supports browser `localStorage` persistence.

The saved payload includes:

- Next building/connection id.
- Gold.
- Tick count.
- Current grid size.
- Purchased tech state.
- Buildings.
- Connections.

The Save button writes the current state to `localStorage`.

The Load button restores the saved state, rebuilds the occupancy grid, and re-renders the interface.

The Reset button clears the current world after confirmation.

## Deletion

Buildings can be deleted with right-click.

Deleting a building:

- Frees its occupied grid cells.
- Removes the building.
- Deletes all connections to and from that building.
- Clears selection if the deleted building was selected.

Connections can also be deleted directly with right-click.

## Current Building Recipes

### Iron Mine

- Mine Iron Ore: produces 1 Iron Ore every 2 ticks.

### Coal Mine

- Mine Coal: produces 1 Coal every 2 ticks.

### Lumber Camp

- Cut Wood: produces 1 Wood every 2 ticks.

### Forge

- Iron Bar: consumes 3 Iron Ore and 1 Wood, produces 1 Iron Bar every 3 ticks.
- Steel Bar: consumes 2 Iron Ore and 2 Coal, produces 1 Steel Bar every 5 ticks.

### Sawmill

- Plank: consumes 2 Wood, produces 1 Plank every 2 ticks.

### Blacksmith

- Sword: consumes 2 Iron Bars and 1 Plank, produces 1 Sword every 4 ticks.
- Steel Sword: consumes 2 Steel Bars and 1 Plank, produces 2 Swords every 6 ticks.

### Market

The Market has no recipes. It accepts all current resources at once and automatically sells one stocked good per tick.

Current sell prices:

- Iron Ore: 1 gold.
- Wood: 1 gold.
- Coal: 2 gold.
- Iron Bar: 5 gold.
- Plank: 3 gold.
- Steel Bar: 12 gold.
- Sword: 25 gold.

## Current Limitations

The current prototype does not include:

- Multi-step unlocks or research dependencies.
- Contracts or goals.
- Movement of placed buildings.
- Pathfinding, roads, belts, pipes, or transport infrastructure.
- Save files outside browser `localStorage`.
- Production speed controls.
- Pause/resume controls.
- Detailed bottleneck reports.
- Undo/redo.
- Mobile-specific interaction handling.

## Documentation Practice

Going forward, this file should be updated whenever prototype behavior changes.

Useful additions include:

- New buildings and recipes.
- Changed production rules.
- Changed connection rules.
- UI control changes.
- Persistence format changes.
- Known limitations that become intentional design decisions.
