# Design Notes

## Core production rule

A node has exactly one active output type at a time.

A crafter may have multiple possible recipes, but only one recipe is active. The active recipe determines:

- which input ports are shown
- which input resources are required
- which single output port is shown
- what the node produces

This keeps the graph readable while still allowing deeper recipes.

## Current intentional constraints

- Buildings are freely placed on a grid.
- Buildings cannot overlap.
- Transport infrastructure is abstracted away.
- Resources move through direct output-to-input connectors.
- A connector transports one unit per tick.
- Output ports may feed multiple compatible inputs.
- Each input port accepts one connection.
- Recipe changes reset the building's connections because ports may have changed.
- Inventories have simple capacity limits.
- Gold is an abstract sink, so sellers have inputs but no physical output port.

## Why this shape is useful

The player optimizes the production graph, not roads, belts, pipes, or pathfinding. Spatial layout still matters visually and cognitively, but the design pressure comes from recipes, bottlenecks, capacities, and routing.
