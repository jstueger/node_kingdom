# Phase Plan

This document is the shared roadmap for upcoming work. When we refer to a phase, this is the source of truth.

For exact implemented behavior, use `prototype-functionality.md`. For broader design intent, use `design-notes.md`.

## Current Alignment

The prototype already includes parts of the earlier progression direction:

- Manual node work instead of automatic production.
- Lifetime stats for production, sales, and gold earned.
- Building unlocks through tech.
- Multi-resource tech costs.
- Hidden locked buildings in the left building menu.
- A first Knowledge resource, School building, Science heading, and Knowledge-paid upgrade.
- Stabilized early tech costs, clearer tech card details, and a compact lifetime progress summary.
- Tech tree presentation states for available, unaffordable, gated, and purchased techs.
- Early milestone goals with claimable gold rewards.
- Node-type addons for Lumber Camp and Market, bought from the inspector.

This means the earlier broad phases 1 to 3 are partially implemented, but not in the clean incremental order we want going forward. The plan below resets the roadmap from the current codebase state.

## Phase 1: Stabilize Current Progression

Goal: make the current tech spine understandable, playable, and internally consistent.

Status: complete.

Scope:

- Review all current tech thresholds, costs, and unlock order.
- Make sure each unlock is reachable without awkward stockpiling traps.
- Decide whether Knowledge should be sellable or reserved for science only.
- Improve tech card copy so thresholds, costs, and rewards are clear.
- Add a compact visible summary for current lifetime milestones if needed.
- Keep locked buildings hidden in the left menu.

Exit criteria:

- A new player can move from Lumber Camp to School without unclear dead ends.
- The docs and implemented tech data match.

## Phase 2: Tech Tree Presentation

Goal: make the tech tree feel like a progression interface rather than a flat card list.

Status: complete.

Scope:

- Separate Technology and Science visually.
- Show unavailable-but-discovered prerequisites where useful.
- Add clearer purchased, affordable, and unaffordable states.
- Preserve the current toggleable tech window.
- Avoid adding node addon menus in this phase.

Exit criteria:

- The player can understand what is available now, what was bought, and what is probably next.

## Phase 3: Early Goals And Guidance

Goal: give the manual economy short-term targets without adding contracts yet.

Status: complete.

Scope:

- Add simple milestone goals tied to the current progression chain.
- Surface goals in a compact UI area.
- Reward completion with small amounts of gold, resources, or tech visibility.
- Keep goals deterministic and local to the existing economy.

Exit criteria:

- The player always has one or two clear next objectives during the early game.

## Phase 4: Node Addon Framework

Goal: introduce per-node upgrade slots as data and UI, without automation yet.

Status: complete.

Scope:

- Add a node addon data model.
- Add a node-specific addon panel or inspector section.
- Implement simple speed, storage, or sale-value addons for one or two node types.
- Keep addons separate from the main tech tree.

Exit criteria:

- At least Lumber Camp and Market have node-specific upgrades that can be bought and saved.

## Phase 5: Manager Slot Unlocks

Goal: unlock manager slots through Science, but do not automate everything by default.

Scope:

- Add manager slot capability per node type.
- Add Science techs that unlock one manager slot for specific node types.
- Show empty manager slots on eligible nodes.
- No buyable managers yet unless the slot model is solid.

Exit criteria:

- A researched node type can display and save an empty manager slot.

## Phase 6: Buyable Managers And Automation

Goal: make managers the first automation layer.

Scope:

- Add manager purchase costs.
- Allow assigning a manager to an unlocked manager slot.
- Automate only the assigned node's manual work action.
- Keep manager speed modest so manual clicking still matters early.

Exit criteria:

- A node with an assigned manager can produce, craft, or sell without clicks.

## Phase 7: Production Speed And Efficiency Upgrades

Goal: deepen optimization after automation exists.

Scope:

- Add upgrades that reduce required work clicks or manager cycle time.
- Add input efficiency or output amount upgrades where they are readable.
- Keep effects visible on the node or in a focused detail panel.

Exit criteria:

- A player can meaningfully improve an existing production line without only adding more nodes.

## Phase 8: Contracts And Reputation

Goal: add external demand and a longer-term progression pressure.

Scope:

- Add simple contracts that request delivered goods.
- Add Reputation or Prestige as a later reward currency if it proves useful.
- Use contracts to unlock advanced trade, science, or manager options.
- Keep contracts separate from direct Market selling.

Exit criteria:

- The player can choose between selling goods for gold and fulfilling a contract for a different reward.

## Near-Term Next Step

The next phase to implement is Phase 5: Manager Slot Unlocks.
