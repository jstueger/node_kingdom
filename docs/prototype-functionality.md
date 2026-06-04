# Prototype Functionality

This document is the current behavior spec for the playable prototype. Update it whenever player-facing behavior, simulation rules, UI controls, persistence, or known limitations change.

For project setup, use `README.md`. For product intent and design principles, use `design-notes.md`.

## Core Concept

The prototype is a browser-based factory/city-builder experiment built around free grid placement and direct resource connections.

Players place buildings, connect compatible output ports to input ports, and let the simulation move resources through the resulting production graph.

The main rule is:

> Each recipe-based building has one active output at a time. Crafters may have multiple possible recipes, but only one recipe is active.

Market buildings are sink nodes. They do not use recipes and instead sell all stocked supported goods when manually worked.

## Interface Layout

The interface has two exclusive top-level screens:

- Main: production graph, goals, inspector, camera, and node operation.
- Tech Tree: building unlocks, techs, and permanent node-type upgrades.

Only one top-level screen is visible at a time. The Buildings catalog is a button-triggered pop-out menu on the Main screen. The top bar remains global for money, elapsed time, navigation, save/load/reset, and the current hint.

The Main frame has three areas:

- Left sidebar: active goals and port legend.
- Center game area: centered grid, buildings, ports, placement preview, and connector paths.
- Right inspector: selected-building details.

## Grid And Placement

The world starts as a 40 by 40 grid with 18 pixel cells.

Buildings are placed freely on this grid. Current producer and market buildings occupy 8 by 8 cells, while crafting buildings occupy 16 by 8 cells.

Placement controls:

- Open the Buildings pop-out menu and click a building card to enter placement mode.
- Drag a building card from the pop-out menu onto the grid to place it directly.
- Click an empty valid grid location to place the selected building.
- Press `Escape` to cancel click placement.

Placement rules:

- The player starts with 10S.
- Placement costs money.
- Buildings cannot overlap.
- Buildings cannot be placed outside the grid.
- If placement fails, no money is spent.
- Successful click placement automatically exits placement mode.

Placement mode shows a snapped placement ghost while over the grid. Valid targets are highlighted as valid; occupied, out-of-bounds, or unaffordable targets are invalid.

Money is stored internally as Copper and displayed compactly as Gold, Silver, and Copper:

- 1G = 100S = 1000C.
- 1S = 10C.
- Early prices are intentionally tuned mostly in Silver so they stay readable in compact UI.

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
- Carpenter: crafts beams and furniture.
- Hunters: produce hides or game meat.
- Leather Worker: crafts leather or armor.
- Tailor: crafts garments.
- Blacksmith: crafts swords.
- Barracks: crafts guard kits.
- Outfitter: crafts expedition gear.
- School: produces Knowledge.
- Market: sells goods for money.

The game starts with one Sawmill already placed and stocked with enough Wood for the first Plank. The Buildings and Tech buttons are hidden at new-game start.

Progression UI reveals:

- Producing the first Plank reveals the Buildings button with a short pulse.
- The Buildings button opens the Buildings pop-out menu.
- The Buildings pop-out initially offers Lumber Camp and Sawmill.
- Buying a Lumber Camp, connecting it to the starting Sawmill, and producing a second Plank reveals the Tech button with a short pulse.
- The Tech button opens the exclusive Tech Tree screen.

No building cards are visible until the Buildings button is revealed. The Buildings pop-out only shows currently unlocked building types.

Each building has:

- label and icon
- grid size
- description
- money cost
- kind: producer, crafter, or seller
- inventory
- storage capacities
- manual work progress
- recipes, except for Markets

Current placement costs:

- Iron Mine: 5S.
- Coal Mine: 5S.
- Lumber Camp: 5S.
- Forge: 12S.
- Sawmill: 10S.
- Carpenter: 16S.
- Hunters: 12S.
- Leather Worker: 18S.
- Tailor: 22S.
- Blacksmith: 18S.
- Barracks: 30S.
- Outfitter: 36S.
- School: 25S.
- Market: 5S.

Unaffordable building cards are dimmed. They can still be selected, but placement fails until the player has enough money.

## Node Display

Placed buildings show operational state directly on the grid.

All nodes show:

- building identity
- current status
- manual work progress at the bottom, when applicable
- a node-local work button
- border/status styling for ready, waiting, blocked, or idle state

Crafter nodes show:

- in-node recipe switching controls
- current active recipe label
- input queue rows
- output queue row
- inventory summary

Producer nodes use a compact output-focused layout with produced resource, stored amount, capacity, and output meter.

Market nodes use a sink-focused layout that emphasizes selling goods into money, stocked goods, and sale value.

## Recipes

The active recipe determines:

- visible input ports
- required input resources
- visible output port
- produced output resource
- completed action result

Producers have recipes with no inputs. Crafters consume inputs and create output resources.

Markets do not use recipes. A Market accepts supported trade goods through one universal input and sells all stocked goods for money when worked. Knowledge is reserved for Science and is not accepted by Markets.

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

The Market exposes one universal input port that accepts every current sellable trade good, but it still accepts only one incoming connection.

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
- Output and input resources must match unless the input accepts any supported trade good.
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
- Moving a building does not cost money.

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

Goals are not contracts. They do not require delivery, consume resources, or create a separate reputation economy. They are simple milestones that guide the current production chain and award small amounts of money when claimed.

Current goals:

- First Plank: produce 1 lifetime Plank, rewards 3S.
- Open Trade: appears after 2 lifetime Planks produced; activate the free Market unlock, rewards 5S.
- Place A Lumber Camp: produce 1 lifetime Wood with a Lumber Camp, rewards 3S.
- Feed The Sawmill: produce 2 lifetime Planks by connecting Lumber Camp to Sawmill, rewards 3S.
- First Sale: earn 3S from Markets, rewards 5S.
- Steady Trade: earn 6S total from Markets, rewards 5S.
- Strike Ore: produce 6 lifetime Iron Ore, rewards 5S.
- Plank Supply: produce 3 lifetime Planks, rewards 6S.
- First Bars: produce 2 lifetime Iron Bars, rewards 8S.
- First Outpost: appears after Sawmill Methods are researched and Iron Mines are unlocked; requires 30 lifetime Wood, 10 lifetime Planks, 10 lifetime Iron Ore, 3 lifetime Iron Bars, and 50S earned; rewards 20S.
- Armed Trade: produce 1 lifetime Sword, rewards 10S.
- Written Records: produce 5 lifetime Knowledge, rewards 10S.

The sidebar shows up to three visible unclaimed goals. Completed goals show a claim button. Claimed goals are hidden.

## Progression Model

The current progression model is deliberately simple and bootstrap-focused:

- A stocked Sawmill starts placed on the grid.
- The first manual action creates a Plank before the player builds the supply chain.
- Markets convert stocked trade goods into money.
- Lifetime thresholds reveal interface frames and techs; current opening purchases are paid with money.
- The Building Tree unlocks early production buildings, while Technology techs unlock grid space, storage, crafting methods, later buildings, and trade improvements.
- Science techs use Knowledge milestones and unlock later systems such as Manager slots.
- Manager slots allow specific placed nodes to hire Managers.
- Managers automate work after their node type has an unlocked Manager slot.
- Addons improve node types through storage, work speed, manager pace, input efficiency, output bonuses, or sale value.

The intended early loop is: start the Sawmill, produce the first Plank, place a Lumber Camp, connect Lumber Camp to Sawmill, produce the second Plank, activate the free Market unlock, place a Market, connect goods to it, then sell the first stocked item for money.

## Content Model

Game content is authored in JSON files under `content/`.

Current content files:

- `items.json`: item labels and icons.
- `buildings.json`: building definitions, sizes, costs, capacities, recipes, and Market sale prices.
- `techs.json`: Technology and Science tech definitions.
- `goals.json`: early milestone goals and rewards.
- `addons.json`: node-type addon definitions and effects.
- `managers.json`: Manager slot defaults and Manager purchase costs.
- `unlock-tree.json`: building-unlock map content for the opening Tech Tree building map.
- `start-state.json`: starting grid size, starting money, start hint, initially unlocked buildings, and pre-placed starting buildings.

Authoring fields use stable content names such as `description`, `size`, and recipe output `resource`. The content loader normalizes those fields into the current runtime shape before state creation.

Content validation runs before the game starts. It checks building, recipe, tech, goal, addon, manager, unlock-tree, and start-state references so content edits fail clearly instead of silently breaking the prototype.

## Tech Tree

The prototype has an exclusive Tech Tree frame.

Tech controls:

- Click `Tech` in the top bar to open the Tech Tree frame.
- Click `Main`, press `Escape`, or click `Main` inside the Tech Tree frame to return to the Main frame.

Each tech can currently be bought once. Buying a tech spends its cost, marks the tech as purchased, and applies its effect. Current tech costs are money-only, while the content model still supports resource costs for future phases.

Techs may have visibility thresholds and prerequisite techs. A hidden tech appears once its threshold is met and its prerequisites are purchased. Visibility thresholds are separate from purchase costs.

The opening building map is rendered from `unlock-tree.json`. It shows hidden identities, locked nodes, available nodes, and unlocked nodes while the migration toward unlock-tree purchasing is in progress.

Visible non-building techs are grouped under Technology or Science headings. The tech window also shows a compact lifetime progress summary for important resources and earned money.

Tech cards can be:

- Available: all prerequisites and milestones are met, and the player can pay the cost.
- Need money: all prerequisites and milestones are met, but the player cannot currently pay the cost.
- Requires tech or Needs milestone: the tech is discovered, but not yet buyable.
- Purchased: the tech was already bought.

Discovered techs may be shown before they are buyable when doing so clarifies a prerequisite or near-term milestone.

The opening tech tree includes a Building Tree section that starts with Lumber Camp, Sawmill, Market, and a hidden future production branch. The map uses branch labels such as Wood, Trade, Metal, Leather, and Military, with connector lines between parent and child unlocks. Hidden nodes can show content-authored hint descriptions before their true identity is revealed. Market is activated for free from this tree. After early Market sales, the hidden branch is revealed as the Mine unlock.

The current expanded Building Tree also contains future-shape branches for Carpenter, Hunters, Leather Worker, Tailor, Forge, Coal Mine, Blacksmith, Barracks, and Outfitter. These entries use the existing unlock and recipe systems, but do not add Quality, contracts, reputation, or external demand yet.

Unlocked building entries can open a focused building detail view. The detail view shows permanent node-type upgrades for that building, plus a Back control to return to the Building Tree. Later unlocked buildings that are not part of the opening chain still appear in a separate Building Upgrades section when they have available upgrade content.

Current techs:

- Sawmill Methods: appears after 6S earned and 2 lifetime Planks produced, costs 6S, and unlocks Sawmill-focused upgrades.
- Smelting: appears once Iron Mines are unlocked and 6 lifetime Iron Ore has been produced, costs 12S, and establishes Forge-focused upgrade progression.
- Coal Processing: requires Smelting, appears after 1 lifetime Iron Bar produced, costs 14S, and establishes advanced metal fuel progression.
- Blacksmithing: requires Sawmill Methods and Smelting, appears after 3 lifetime Planks and 2 lifetime Iron Bars produced, costs 22S, and establishes Blacksmith-focused upgrade progression.
- Knowledge Production: requires Blacksmithing, appears after 1 lifetime Sword produced and 60S earned, costs 35S, and unlocks School buildings.
- Basic Accounting: requires Knowledge Production, appears after 5 lifetime Knowledge produced, costs 10S, and makes Market sale timers 2 seconds shorter.
- Lumber Management: appears after 20 lifetime Wood produced and 15S earned, costs 20S, and unlocks one Lumber Camp Manager slot.
- Market Management: requires Basic Accounting, appears after 10 lifetime Knowledge produced and 80S earned, costs 35S, and unlocks one Market Manager slot.
- Grid Expansion: appears after 25S earned, costs 50S, and adds 16 columns and 8 rows to the playable grid.
- Storage Bins: appears after 12 lifetime Wood produced, costs 12S, and adds 5 storage capacity to every resource slot.
- Workshop Tuning: requires Sawmill Methods, appears once Sawmills are unlocked, costs 35S, and makes crafter action timers 2 seconds shorter.
- Market Bargaining: requires Sawmill Methods, appears after 40S earned and Market unlock, costs 35S, and increases Market sale prices by 25%, rounded down.

Grid Expansion preserves existing buildings, inventories, and connections while resizing the background canvas, SVG connection layer, and placement area.

## Production Simulation

Nodes do not initially produce, craft, or sell automatically.

Manual work:

- Producer, crafter, and Market nodes have a work button inside the node.
- One click starts a timed action on that node.
- One completed action normally takes 10 seconds, but building content may override this. Lumber Camps currently take 5 seconds.
- The progress bar fills as the timer advances.
- When the timer fills, the node performs one action: mining, crafting, or selling.
- If the node is missing inputs, has full output storage, or has nothing to sell, work cannot start.
- Workshop Tuning reduces crafter action timers to 8 seconds.
- Basic Accounting reduces Market sale timers to 8 seconds.

Lifetime production and sale stats are tracked separately from current inventory. They are used for tech visibility thresholds, while current money pays opening tech costs.

The global simulation tick still advances once per second.

On each tick:

1. The global tick counter increases.
2. Resource transfer runs across all connections.
3. Active manual work and managed work advance.
4. The world and topbar re-render.

Work progress bars animate smoothly between timed progress states for readability. The animation does not change simulation timing.

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
- current efficiency summary, including work time, manager pace, effective inputs, and effective output
- Manager slots and Manager hire controls for the selected building

Recipe changes are made directly on crafter nodes, not in the inspector.

## Manager Slots

Manager slots are node-type capabilities unlocked through techs. They are shown in the inspector for matching selected buildings.

Current Manager slot techs:

- Lumber Management is an early Technology tech that unlocks one Manager slot for Lumber Camps.
- Market Management unlocks one Manager slot for Markets.

Managers are bought per placed node from the inspector after the matching node type has an unlocked Manager slot. A hired Manager occupies one slot on that node, starts work when possible, and advances that node's normal work action automatically. This means managed Producers produce, managed Crafters craft, and managed Markets sell without manual starts when their normal inputs, inventory, and output constraints allow it.

Current Manager costs:

- Lumber Camp Manager: 30S.
- Market Manager: 35S.
- Other future node Managers use the default 40S cost unless given a specific cost.

## Node Addons

Addons are permanent node-type upgrades bought from building detail views in the tech tree. They apply to every building of that node type. Building detail views group addons into Manager, Speed, Quality, Recipes, Storage, Efficiency, and Sale Value tracks; empty tracks are shown as placeholders for planned upgrade branches.

Current addons:

- Lumber Camp, Sharper Axes: costs 10S; Lumber Camp action timers are 2 seconds shorter.
- Lumber Camp, Wood Yard: costs 8S; Lumber Camps store 8 more Wood.
- Lumber Camp, Foreman Routine: requires Lumber Management, costs 45S; managed Lumber Camps work twice as fast.
- Sawmill, Thin Kerf Blades: requires Sawmill Methods, costs 30S; Sawmills need 1 less Wood when making Planks.
- Forge, Paired Molds: requires Smelting and Knowledge Production, costs 55S; Forges produce 1 extra Iron Bar per Iron Bar craft.
- Market, Larger Stall: costs 15S; Markets store 5 more of every good.
- Market, Better Rates: requires Sawmill Methods, costs 25S; Markets earn 15% more money from sales.
- Market, Shift Lead: requires Market Management, costs 50S; managed Markets work twice as fast.

Addon effects stack with tech effects where both apply. Efficiency addons change the effective recipe shown in the inspector and the actual simulation result.

## Save, Load, And Reset

The prototype supports browser `localStorage` persistence.

The saved payload includes:

- next building/connection id
- money
- elapsed seconds
- current grid size
- lifetime production/sale stats
- claimed goal state
- purchased addon state
- unlocked Manager slot state
- unlocked building types
- purchased tech state
- buildings, including hired Manager counts
- connections

The Save button writes the current state to `localStorage`.

The Load button restores the saved state, rebuilds the occupancy grid, and re-renders the interface.

The Reset button clears the current world after confirmation. Reset also clears transient interaction state, resets zoom and pan, resets the progress clock, and redraws the world.

## Current Building Recipes

Each recipe action normally takes 10 seconds after it is started. Techs and addons can reduce action time, reduce input requirements, increase output amounts, or improve manager work speed.

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

### Carpenter

- Beam: consumes 2 Planks, produces 1 Beam.
- Furniture: consumes 3 Planks, produces 1 Furniture.

### Hunters

- Gather Hides: produces 1 Hide.
- Hunt Game: produces 1 Game Meat.

### Leather Worker

- Leather: consumes 2 Hides, produces 1 Leather.
- Armor: consumes 3 Leather, produces 1 Armor.

### Tailor

- Garment: consumes 2 Leather, produces 1 Garment.

### Blacksmith

- Sword: consumes 2 Iron Bars and 1 Plank, produces 1 Sword.
- Steel Sword: consumes 2 Steel Bars and 1 Plank, produces 2 Swords.

### Barracks

- Guard Kit: consumes 1 Sword, 1 Armor, and 1 Plank, produces 1 Guard Kit.

### Outfitter

- Expedition Gear: consumes 1 Garment, 1 Guard Kit, and 1 Furniture, produces 1 Expedition Gear.

### School

- Study: produces 1 Knowledge.

### Market

The Market has no recipes. It accepts all current sellable trade goods through one universal input and sells all stocked sellable goods when its manual work action completes. Knowledge is not sellable.

Current sell prices:

- Iron Ore: 1S.
- Wood: 1S.
- Coal: 2S.
- Iron Bar: 5S.
- Plank: 3S.
- Beam: 8S.
- Furniture: 14S.
- Steel Bar: 12S.
- Hide: 2S.
- Game Meat: 2S.
- Leather: 7S.
- Garment: 16S.
- Armor: 18S.
- Sword: 25S.
- Guard Kit: 42S.
- Expedition Gear: 65S.

## Current Limitations

The current prototype does not include:

- contracts
- pathfinding, roads, belts, pipes, or transport infrastructure
- save files outside browser `localStorage`
- pause/resume controls
- detailed bottleneck reports
- undo/redo
- mobile-specific interaction design
