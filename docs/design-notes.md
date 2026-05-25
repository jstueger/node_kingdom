# Design Notes

This document records product and design intent. It is not the current behavior spec; use `prototype-functionality.md` for exact implemented behavior. For the agreed implementation roadmap, use `phase-plan.md`.

## Core Shape

The game is about building and tuning a production graph.

The player places nodes on a grid, chooses what each recipe-capable node is making, and connects compatible outputs to inputs. The interesting pressure should come from recipe choice, bottlenecks, storage limits, layout readability, and upgrade decisions.

The game is not currently about belts, roads, pipes, pathfinding, or transport distance. Those may become future systems, but they are intentionally outside the current prototype.

## Production Rule

A recipe-based node has exactly one active output type at a time.

A crafter may have multiple possible recipes, but only one recipe is active. The active recipe determines:

- which input ports are shown
- which input resources are required
- which single output port is shown
- what the node produces
- what one completed manual work action produces

This keeps each node readable while still allowing deeper production chains.

Markets are sink nodes. They do not use recipes, expose one universal input, and convert stocked goods into gold when worked.

## Connection Rule

Connections are intentionally direct and strict:

- one output may feed one input
- one input may receive one output
- resource types must match unless the input explicitly accepts any resource
- changing a recipe clears that node's connections because the ports may no longer mean the same thing

This avoids hidden many-to-many routing behavior and makes graph state easier to understand.

## Current Intentional Constraints

- Buildings are freely placed on a grid.
- Buildings cost gold to place.
- Buildings cannot overlap.
- Building types can be locked until researched.
- Placed buildings can be moved without cost.
- Nodes start as manual workstations and do not produce automatically.
- Mining, crafting, and selling advance by clicking the node's work control.
- Resources move through direct output-to-input connectors.
- A connector transports one unit per tick.
- Inventories have simple capacity limits.
- Gold is an abstract currency sink, not a physical transported item.
- Techs are simple one-time upgrades.

## UI Direction

Node information should live on the node whenever it helps direct manipulation:

- recipe choice belongs on crafter nodes
- manual work progress belongs on nodes
- port state belongs near ports
- inventory and capacity summaries can be split between node display and inspector

The inspector should support inspection and secondary detail. It should not become the primary control surface for common node actions.

## Near-Term Product Direction

The current implementation roadmap lives in `phase-plan.md`.

The next useful product layer is goals:

1. Unlocks or contracts that ask for specific production outcomes.
2. Node-specific Manager slot upgrades.
3. Buyable Managers that automate individual nodes after a slot is unlocked.
4. Later speed upgrades that reduce required work or manager cycle time.
5. Better bottleneck summaries.
6. Clearer upgrade choices in the tech tree.

The current progression spine is deliberately modest:

1. Wood production reveals Market Access.
2. Selling goods creates enough gold pressure to reveal Mining and Woodworking.
3. Ore, planks, and bars then become explicit tech costs for later buildings.
4. Sword production and earned gold reveal the first Knowledge-producing building.
5. Knowledge pays for early science upgrades, while managers, contracts, and node addon menus remain later systems.

Knowledge remains sellable at the Market for now. This preserves the rule that Markets accept anything they are fed, and it avoids hidden resource exceptions during the prototype stage.

The next useful engineering layer is confidence:

1. Tests for rules and simulation.
2. Save format versioning before save data becomes important.
3. More focused input modules if interaction state keeps growing.
