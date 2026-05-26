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
- Manual actions are started with one click and complete after a visible timer.
- Node-type addons for Lumber Camp and Market, bought from the inspector.
- Progression definitions split into `progression-data.js`; Knowledge reserved for Science.
- Science techs can unlock Manager slots for specific node types.
- Managers can be hired per placed node and automate that node's work action once per tick.
- Node addons can improve existing production lines through work-time reduction, faster manager progress, input efficiency, extra output, storage, or sale value.
- Content is authored in JSON and validated before runtime state is created.

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

## Phase 4.5: Progression Data Cleanup

Goal: keep progression content separate from runtime state before manager systems add more data.

Status: complete.

Scope:

- Move tech, goal, addon, and starting unlock definitions into `progression-data.js`.
- Keep `state.js` focused on runtime state creation.
- Reserve Knowledge for Science instead of Market sale.
- Document manual work as early-game bootstrap friction.

Exit criteria:

- Runtime state imports progression definitions from a dedicated data module.
- Markets do not accept or sell Knowledge.
- The docs describe manual work as temporary friction that later automation should reduce.

## Phase 5: Manager Slot Unlocks

Goal: unlock manager slots through Science, but do not automate everything by default.

Status: complete.

Scope:

- Add manager slot capability per node type.
- Add Science techs that unlock one manager slot for specific node types.
- Show empty manager slots on eligible nodes.
- No buyable managers yet unless the slot model is solid.

Exit criteria:

- A researched node type can display and save an empty manager slot.

## Phase 6: Buyable Managers And Automation

Goal: make managers the first automation layer.

Status: complete.

Scope:

- Add manager purchase costs.
- Allow assigning a manager to an unlocked manager slot.
- Automate only the assigned node's manual work action.
- Keep manager speed modest so manually started timers still matter early.

Exit criteria:

- A node with an assigned manager can produce, craft, or sell without manual starts.

## Phase 7: Production Speed And Efficiency Upgrades

Goal: deepen optimization after automation exists.

Status: complete.

Scope:

- Add upgrades that reduce required work time or manager cycle time.
- Add input efficiency or output amount upgrades where they are readable.
- Keep effects visible on the node or in a focused detail panel.

Exit criteria:

- A player can meaningfully improve an existing production line without only adding more nodes.

## Phase 7.5: Content Model Preparation

Goal: make future content expansion safer and more data-driven.

Status: complete.

Scope:

- Move items, buildings, techs, goals, addons, manager definitions, and start state into `content/*.json`.
- Use stable authoring field names such as `description`, `size`, and recipe output `resource`.
- Add a content loader that normalizes JSON into the current runtime shape.
- Add content validation before runtime state creation.
- Validate building, recipe, tech, goal, addon, manager, and start-state references.

Exit criteria:

- The game starts from validated JSON content.
- Content validation can be run directly with `node scripts/validate-content.mjs`.

## Phase 7.6: Content Layer Hardening

Goal: remove fragile edges from the new JSON content pipeline.

Status: complete.

Scope:

- Replace singleton state initialization with a `createState()` factory.
- Document authoring JSON fields and normalized runtime fields.
- Route building placement through generalized resource costs.
- Add defensive save/load handling for content ids that no longer exist.
- Add validation warnings for buildings that are not reachable from start state or tech unlocks.

Exit criteria:

- Runtime state is created only after content loading.
- Building placement can use non-gold costs from content.
- Validation and save/load are more tolerant of content evolution.

## Phase 7.7: First 25-Minute Progression Retune

Goal: make the opening arc move from manual wood production to trade, branching production, and first controlled automation.

Status: complete.

Scope:

- Lower starting gold so early placement choices matter.
- Add item tags for future goods, science, and military vocabulary.
- Add per-building work-time overrides and make Lumber Camps faster than the global default.
- Move Lumber Management into early Technology so first automation can arrive before Knowledge.
- Add First Outpost as the first medium-term kingdom-development objective.

Exit criteria:

- The first 10 minutes reach Market Access and Market selling with less manual-work fatigue.
- First automation is visible after demonstrated wood production and Market sales.
- The player can see a larger First Outpost goal before combat systems exist.

## Phase 7.9: Sawmill-First Opening

Goal: end Phase 7 with a sharper first-five-minute hook.

Status: complete.

Scope:

- Start new games with a placed Sawmill stocked with Wood.
- Make the first action produce a Plank before the player builds support infrastructure.
- Reveal free Market Access from the first Plank.
- Unlock Lumber Camp and Market together through Market Access.
- Shift early goals and tech thresholds toward Plank sales.

Exit criteria:

- A new player sees transformation before raw gathering.
- The first complete chain is Wood to Plank to Gold.
- Automation and Mining remain near-term aspirations after the first sale loop.

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

The next phase to implement is Phase 8: Contracts And Reputation, unless playtesting the sawmill-first opening shows another pacing issue first.
