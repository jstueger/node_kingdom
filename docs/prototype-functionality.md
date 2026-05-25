# Prototype Functionality

This document is the current behavior spec for the playable prototype. Update it whenever player-facing behavior, simulation rules, UI controls, persistence, or known limitations change.

For project setup, use `README.md`. For product intent and design principles, use `design-notes.md`.

## Core Concept

The prototype is a browser-based factory/city-builder experiment built around free grid placement and direct resource connections.

Players place buildings, connect compatible output ports to input ports, and let the simulation move resources through the resulting production graph.

The main rule is:

> Each recipe-based building has one active output at a time. Crafters may have multiple possible recipes, but only one recipe is active.

Market buildings are sink nodes. They do not use recipes and instead sell supported goods when manually worked.

## Interface Layout

The interface has five main areas:

- Top bar: gold, simulation tick, zoom controls, Tech button, save/load/reset buttons, and current hint.
- Left sidebar: placeable building cards with gold costs, active goals, and port legend.
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
- School: produces Knowledge.
- Market: sells goods for gold.

Only Lumber Camp is unlocked at the start of a new game. The left building menu only shows currently unlocked building types.

Each building has:

- label and icon
- grid size
- description
- gold cost
- kind: producer, crafter, or seller
- inventory
- storage capacities
- manual work progress
- recipes, except for Markets

Current placement costs:

- Iron Mine: 5 gold.
- Coal Mine: 5 gold.
- Lumber Camp: 5 gold.
- Forge: 12 gold.
- Sawmill: 10 gold.
- Blacksmith: 18 gold.
- School: 25 gold.
- Market: 5 gold.

Unaffordable building cards are dimmed. They can still be selected or dragged, but placement fails until the player has enough gold.

## Node Display

Placed buildings show operational state directly on the grid.

All nodes show:

- building identity
- current status
- manual work progress at the bottom, when applicable
- a node-local work button
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
- completed action result

Producers have recipes with no inputs. Crafters consume inputs and create output resources.

Markets do not use recipes. A Market accepts any resource through one universal input and sells stocked goods for gold when worked.

Changing a crafter recipe:

- is done with the controls inside the node
- updates visible ports
- resets the building work progress
- deletes all existing connections to and from that building

Connections are removed on recipe change because old ports may no longer exist or may no longer accept the same resources.

## Ports And Connections

Recipe-based buildings expose ports based on their active recipe.

Input ports:

- appear on the left side
- are resource-specific for recipe buildings
- accept at most one incoming connection

The Market exposes one universal input port that accepts every current resource, but it still accepts only one incoming connection.

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

## Goals

The prototype has a compact early-goal panel in the left sidebar.

Goals are not contracts. They do not require delivery, consume resources, or create a separate reputation economy. They are simple milestones that guide the current production chain and award small amounts of gold when claimed.

Current goals:

- First Timber: produce 5 lifetime Wood, rewards 3 gold.
- Open Trade: research Market Access, rewards 5 gold.
- First Sales: earn 10 lifetime gold from Markets, rewards 5 gold.
- Strike Ore: produce 6 lifetime Iron Ore, rewards 5 gold.
- Cut Planks: produce 3 lifetime Planks, rewards 6 gold.
- First Bars: produce 2 lifetime Iron Bars, rewards 8 gold.
- Armed Trade: produce 1 lifetime Sword, rewards 10 gold.
- Written Records: produce 5 lifetime Knowledge, rewards 10 gold.

The sidebar shows up to three visible unclaimed goals. Completed goals show a claim button. Claimed goals are hidden.

## Tech Tree

The prototype has a toggleable tech tree window.

Tech controls:

- Click `Tech` in the top bar to show or hide the tech window.
- Click `Hide` in the tech window to close it.

Each tech can currently be bought once. Buying a tech spends its resource cost, marks the tech as purchased, and applies its effect.

Techs may have visibility thresholds and prerequisite techs. A hidden tech appears once its threshold is met and its prerequisites are purchased. Visibility thresholds are separate from purchase costs.

Visible techs are grouped under Technology or Science headings. The tech window also shows a compact lifetime progress summary for important resources and earned gold.

Tech cards can be:

- Available: all prerequisites and milestones are met, and the player can pay the cost.
- Need resources: all prerequisites and milestones are met, but the player cannot currently pay the cost.
- Requires tech or Needs milestone: the tech is discovered, but not yet buyable.
- Purchased: the tech was already bought.

Discovered techs may be shown before they are buyable when doing so clarifies a prerequisite or near-term milestone.

Current techs:

- Market Access: appears after 5 lifetime Wood produced, costs 5 Wood, and unlocks Market buildings.
- Mining: requires Market Access, appears after 8 lifetime gold earned, costs 5 gold and 5 Wood, and unlocks Iron Mine buildings.
- Woodworking: requires Market Access, appears after 10 lifetime gold earned and 12 lifetime Wood produced, costs 6 gold and 8 Wood, and unlocks Sawmill buildings.
- Smelting: requires Mining, appears after 6 lifetime Iron Ore produced, costs 8 gold, 6 Iron Ore, and 3 Wood, and unlocks Forge buildings.
- Coal Processing: requires Smelting, appears after 1 lifetime Iron Bar produced, costs 10 gold and 1 Iron Bar, and unlocks Coal Mine buildings.
- Blacksmithing: requires Woodworking and Smelting, appears after 3 lifetime Planks and 2 lifetime Iron Bars produced, costs 15 gold, 3 Planks, and 2 Iron Bars, and unlocks Blacksmith buildings.
- Knowledge Production: requires Blacksmithing, appears after 1 lifetime Sword produced and 60 lifetime gold earned, costs 25 gold, 3 Planks, and 1 Sword, and unlocks School buildings.
- Basic Accounting: requires Knowledge Production, appears after 5 lifetime Knowledge produced, costs 5 Knowledge, and makes Markets need 2 fewer work clicks per sale.
- Grid Expansion: requires Market Access, appears after 25 lifetime gold earned, costs 50 gold, and adds 16 columns and 8 rows to the playable grid.
- Storage Bins: requires Market Access, appears after 12 lifetime Wood produced, costs 12 gold and 8 Wood, and adds 5 storage capacity to every resource slot.
- Workshop Tuning: requires Woodworking, appears once Sawmills are unlocked, costs 35 gold, and makes crafters need 2 fewer work clicks per action.
- Market Bargaining: requires Market Access and Woodworking, appears after 40 lifetime gold earned, costs 35 gold and 2 Planks, and increases Market sale prices by 25%, rounded down.

Grid Expansion preserves existing buildings, inventories, and connections while resizing the background canvas, SVG connection layer, and placement area.

## Production Simulation

Nodes do not initially produce, craft, or sell automatically.

Manual work:

- Producer, crafter, and Market nodes have a work button inside the node.
- One completed action normally requires 10 work clicks.
- Each valid click advances the node work meter.
- When the meter fills, the node performs one action: mining, crafting, or selling.
- If the node is missing inputs, has full output storage, or has nothing to sell, work does not advance.
- Workshop Tuning reduces crafter actions to 8 clicks.
- Basic Accounting reduces Market sale actions to 8 clicks.

Lifetime production and sale stats are tracked separately from current inventory. They are used for tech visibility thresholds, while current stored resources and gold are used to pay tech costs.

The global simulation tick still advances once per second.

On each tick:

1. The global tick counter increases.
2. Resource transfer runs across all connections.
3. The world and topbar re-render.

Work progress bars animate between click states for readability. The animation does not change simulation timing.

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
- lifetime production/sale stats
- claimed goal state
- unlocked building types
- purchased tech state
- buildings
- connections

The Save button writes the current state to `localStorage`.

The Load button restores the saved state, rebuilds the occupancy grid, and re-renders the interface.

The Reset button clears the current world after confirmation. Reset also clears transient interaction state, resets zoom and pan, resets the progress clock, and redraws the world.

## Current Building Recipes

Each recipe action normally requires 10 work clicks before it completes.

### Iron Mine

- Mine Iron Ore: produces 1 Iron Ore.

### Coal Mine

- Mine Coal: produces 1 Coal.

### Lumber Camp

- Cut Wood: produces 1 Wood.

### Forge

- Iron Bar: consumes 3 Iron Ore and 1 Wood, produces 1 Iron Bar.
- Steel Bar: consumes 2 Iron Ore and 2 Coal, produces 1 Steel Bar.

### Sawmill

- Plank: consumes 2 Wood, produces 1 Plank.

### Blacksmith

- Sword: consumes 2 Iron Bars and 1 Plank, produces 1 Sword.
- Steel Sword: consumes 2 Steel Bars and 1 Plank, produces 2 Swords.

### School

- Study: produces 1 Knowledge.

### Market

The Market has no recipes. It accepts all current resources through one universal input and sells one stocked good when its manual work action completes. Knowledge remains sellable so the universal Market input has no hidden exceptions.

Current sell prices:

- Iron Ore: 1 gold.
- Wood: 1 gold.
- Coal: 2 gold.
- Iron Bar: 5 gold.
- Plank: 3 gold.
- Steel Bar: 12 gold.
- Sword: 25 gold.
- Knowledge: 8 gold.

## Current Limitations

The current prototype does not include:

- contracts or goals
- Manager slots and buyable Managers for node automation
- pathfinding, roads, belts, pipes, or transport infrastructure
- save files outside browser `localStorage`
- production speed controls
- pause/resume controls
- detailed bottleneck reports
- undo/redo
- mobile-specific interaction design
