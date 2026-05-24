# Design Notes

This document records product and design intent. It is not the current behavior spec; use `prototype-functionality.md` for exact implemented behavior.

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
- how long production takes

This keeps each node readable while still allowing deeper production chains.

Markets are sink nodes. They do not use recipes, expose one universal input, and convert stocked goods into gold.

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
- Placed buildings can be moved without cost.
- Resources move through direct output-to-input connectors.
- A connector transports one unit per tick.
- Inventories have simple capacity limits.
- Gold is an abstract currency sink, not a physical transported item.
- Techs are simple one-time upgrades.

## UI Direction

Node information should live on the node whenever it helps direct manipulation:

- recipe choice belongs on crafter nodes
- production progress belongs on nodes
- port state belongs near ports
- inventory and capacity summaries can be split between node display and inspector

The inspector should support inspection and secondary detail. It should not become the primary control surface for common node actions.

## Near-Term Product Direction

The next useful product layer is goals:

1. Unlocks or contracts that ask for specific production outcomes.
2. Better bottleneck summaries.
3. Clearer upgrade choices in the tech tree.
4. Recipe balance passes once goals exist.

The next useful engineering layer is confidence:

1. Tests for rules and simulation.
2. More focused input modules if interaction state keeps growing.
3. Save format versioning before save data becomes important.
