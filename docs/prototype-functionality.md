# Prototype Functionality

This document is the current behavior spec for the playable prototype. Update it whenever player-facing behavior, simulation rules, UI controls, persistence, or known limitations change.

For project setup, use `README.md`. For product intent and design principles, use `design-notes.md`.

## Core Concept

The prototype is a browser-based factory/city-builder experiment built around free grid placement and direct resource connections.

Players place buildings, connect compatible output ports to input ports, and let the simulation move resources through the resulting production graph.

The main rule is:

> Each recipe-based building has one active output at a time. Crafters may have multiple possible recipes, but only one recipe is active.

Market buildings are sink nodes. They do not use recipes and instead sell supported goods they receive.

## Interface Layout

The interface has five main areas:

- Top bar: gold, simulation tick, zoom controls, Tech button, save/load/reset buttons, and current hint.
- Left sidebar: placeable building cards with gold costs.
- Center game area: centered grid, buildings, ports, placement preview, and connector paths.
- Right inspector: selected-building details.
- Tech window: toggleable upgrade window.

## Grid And Placement

The world starts as a 40 by 40 grid with 18 pixel cells.

Buildings are placed freely on this grid. Current producer and market buildings occupy 8 by 8 cells, while crafting buildings occupy 16 by 8 cells.

Placement controls:

- Click a building card, then click an empty valid grid location.
- Drag a building card from the sidebar and drop it on the grid.
- Press `Escape` to cancel click placement.

Placement rules:

- The player starts with 25 gold.
- Placement costs gold.
- Buildings cannot overlap.
- Buildings cannot be placed outside the grid.
- If placement fails, no gold is spent.
- Successful click placement automatically exits placement mode.
- Successful drag placement immediately places the building on drop.

Drag placement shows a snapped placement ghost while over the grid. Valid targets are highlighted as valid; occupied, out-of-bounds, or unaffordable targets are invalid.

The playable grid has a golden frame attached to the grid container, so it grows when grid expansion upgrades increase the world size.

## Camera

The game area supports zooming and panning.

Zoom controls:

- Click `-` in the top bar to zoom out.
- Click `+` in the top bar to zoom in.
- Use the mouse wheel over the game area to zoom around the cursor.

Zoom range is 50% to 200%. Zoom scales the grid, buildings, ports, connection paths, and placement previews together.

Panning:

- Hold the left mouse button and drag on empty grid space.
- Panning uses a camera offset, so it works even when the grid is smaller than the visible pane.
- Panning does not start from buildings or ports.

## Buildings

Current building types:

- Iron Mine: produces iron ore.
- Coal Mine: produces coal.
- Lumber Camp: produces wood.
- Forge: crafts iron bars or steel bars.
- Sawmill: crafts planks.
- Blacksmith: crafts swords.
- Market: sells goods for gold.

Each building has:

- label and icon
- grid size
- description
- gold cost
- kind: producer, crafter, or seller
- inventory
- storage capacities
- production timer
- recipes, except for Markets

Current placement costs:

- Iron Mine: 5 gold.
- Coal Mine: 5 gold.
- Lumber Camp: 5 gold.
- Forge: 12 gold.
- Sawmill: 10 gold.
- Blacksmith: 18 gold.
- Market: 5 gold.

Unaffordable building cards are dimmed. They can still be selected or dragged, but placement fails until the player has enough gold.

## Node Display

Placed buildings show operational state directly on the grid.

All nodes show:

- building identity
- current status
- production progress at the bottom, when applicable
- border/status styling for working, waiting, blocked, or idle state

Crafter nodes show:

- in-node recipe switching controls
- current active recipe label
- input queue rows
- output queue row
- inventory summary

Producer nodes use a compact output-focused layout with produced resource, stored amount, capacity, and output meter.

Market nodes use a sink-focused layout that emphasizes selling goods into gold, stocked goods, and sale value.

## Recipes

The active recipe determines:

- visible input ports
- required input resources
- visible output port
- produced output resource
- production duration

Producers have recipes with no inputs. Crafters consume inputs and create output resources.

Markets do not use recipes. A Market accepts sellable goods through one universal input and automatically sells stocked goods for gold.

Changing a crafter recipe:

- is done with the controls inside the node
- updates visible ports
- resets the building production timer
- deletes all existing connections to and from that building

Connections are removed on recipe change because old ports may no longer exist or may no longer accept the same resources.

## Ports And Connections

Recipe-based buildings expose ports based on their active recipe.

Input ports:

- appear on the left side
- are resource-specific for recipe buildings
- accept at most one incoming connection

The Market exposes one universal input port that accepts every current sellable resource, but it still accepts only one incoming connection.

Output ports:

- appear on the right side
- represent the active recipe output
- are resource-specific
- may feed one compatible input port
- are not shown for Markets

To create a connection:

1. Click a green output port.
2. Click a compatible blue input port.
3. Press `Escape` to cancel while connecting.

Connection rules:

- A building cannot connect to itself.
- Output and input resources must match unless the input accepts any resource.
- Each input port accepts only one connection.
- Each output port accepts only one outgoing connection.
- Connecting an already-connected output to a different valid input rewires that output to the new input.
- Right-click a connection to delete it.

While creating a connection, a temporary dashed path follows the pointer from the selected output port. When the pointer gets close to a compatible input port, the temporary path snaps to that port's center.

Connection status colors:

- Flowing: source has the resource and target has capacity.
- Starved: source does not currently have the output resource.
- Blocked: target storage is full, ports are invalid, or resource types no longer match.

Each connection can move one unit of its resource per simulation tick.

## Movement, Selling, And Deletion

Placed buildings can be moved by dragging them.

Movement behavior:

- Buildings snap to the grid while dragged.
- Existing connections remain attached while a building moves.
- If the destination is occupied or invalid, the building snaps back to its original position.
- Moving a building does not cost gold.

Right-click a building to sell it.

Selling a building:

- frees its occupied grid cells
- removes the building
- deletes all connections to and from that building
- clears selection if the sold building was selected
- refunds half of the building's original placement cost, rounded down

Right-click a connection to delete it.

## Tech Tree

The prototype has a toggleable tech tree window.

Tech controls:

- Click `Tech` in the top bar to show or hide the tech window.
- Click `Hide` in the tech window to close it.

Each tech can currently be bought once. Buying a tech spends gold, marks the tech as purchased, and applies its effect.

Current techs:

- Grid Expansion: costs 50 gold and adds 16 columns and 8 rows to the playable grid.
- Storage Bins: costs 35 gold and adds 5 storage capacity to every resource slot.
- Workshop Tuning: costs 60 gold and makes crafters finish recipes 1 tick faster, with a minimum recipe time of 1 tick.
- Market Bargaining: costs 75 gold and increases Market sale prices by 25%, rounded down.

Grid Expansion preserves existing buildings, inventories, and connections while resizing the background canvas, SVG connection layer, and placement area.

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
9. The world and topbar re-render.

If a building cannot produce, its production timer resets to zero.

Production progress bars are visually interpolated between simulation ticks for smoother display. The interpolation does not change simulation timing.

## Inventory And Capacity

Each building stores resources in a local inventory.

Capacity is defined per building type and resource. If no explicit capacity exists for a resource, the fallback capacity is 10.

The Storage Bins tech adds 5 capacity to every resource slot.

Buildings cannot produce a physical output if doing so would exceed their output capacity.

Connections cannot transfer a resource into a target building if that target resource inventory is already at capacity.

## Inspector

Selecting a building opens its details in the inspector.

The inspector shows:

- building name and description
- current recipe inputs or accepted Market goods
- current recipe output or Market sale behavior
- current inventory and capacity for known resources

Recipe changes are made directly on crafter nodes, not in the inspector.

## Save, Load, And Reset

The prototype supports browser `localStorage` persistence.

The saved payload includes:

- next building/connection id
- gold
- tick count
- current grid size
- purchased tech state
- buildings
- connections

The Save button writes the current state to `localStorage`.

The Load button restores the saved state, rebuilds the occupancy grid, and re-renders the interface.

The Reset button clears the current world after confirmation. Reset also clears transient interaction state, resets zoom and pan, resets the progress clock, and redraws the world.

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

The Market has no recipes. It accepts all current resources through one universal input and automatically sells one stocked good per tick.

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

- multi-step unlock dependencies
- contracts or goals
- pathfinding, roads, belts, pipes, or transport infrastructure
- save files outside browser `localStorage`
- production speed controls
- pause/resume controls
- detailed bottleneck reports
- undo/redo
- mobile-specific interaction design
