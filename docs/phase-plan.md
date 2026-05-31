# Phase Plan

This document is the shared roadmap for upcoming work. When we refer to a phase, this is the source of truth.

For exact implemented behavior, use `prototype-functionality.md`. For broader design intent, use `design-notes.md`.

## Current Alignment

The prototype has completed the current opening-progression foundation through Phase 12:

- Manual node work instead of automatic production.
- Lifetime stats for production, sales, and money earned.
- Building unlocks through the current tech-tree presentation.
- Money-only opening tech costs, with resource costs still supported by the content model.
- Hidden locked buildings in the progression-gated Buildings frame.
- A first Knowledge resource, School building, and Science heading.
- Stabilized early tech costs, clearer tech card details, and a compact lifetime progress summary.
- Tech tree presentation states for available, unaffordable, gated, and purchased techs.
- Main, Buildings, and Tech Tree are exclusive top-level frames.
- Early milestone goals with claimable money rewards.
- Manual actions are started with one click and complete after a visible timer.
- Node-type addons bought from building subviews in the tech tree.
- Progression definitions split into `progression-data.js`; Knowledge reserved for Science.
- Science techs can unlock Manager slots for specific node types.
- Managers can be hired per placed node and automate that node's work action once per tick.
- Node addons can improve existing production lines through work-time reduction, faster manager progress, input efficiency, extra output, storage, or sale value.
- Content is authored in JSON and validated before runtime state is created.

The next roadmap step is to make the tech tree capable of representing the larger unlock-map design without losing the stable opening flow.

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
- Improve the current tech view without changing the simulation model.
- Avoid adding node addon menus in this phase.

Exit criteria:

- The player can understand what is available now, what was bought, and what is probably next.

## Phase 3: Early Goals And Guidance

Goal: give the manual economy short-term targets without adding contracts yet.

Status: complete.

Scope:

- Add simple milestone goals tied to the current progression chain.
- Surface goals in a compact UI area.
- Reward completion with small amounts of money, resources, or tech visibility.
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
- The first complete chain is Wood to Plank to money.
- Automation and Mining remain near-term aspirations after the first sale loop.

## Phase 8: Progressive Interface Frames

Goal: make the first minutes focused by revealing major interface systems only after the player earns them.

Status: complete.

Scope:

- Move the building menu out of the side panel into its own window/frame.
- Open the building menu from a dedicated top-level button.
- Keep the tech tree in its own window/frame opened from a second top-level button.
- Hide both buttons at new-game start.
- Reveal the building-menu button after the first Plank is produced, with Lumber Camp and Sawmill available in the menu.
- Reveal the tech-tree button after the player buys a Lumber Camp, connects it to the starting Sawmill, and produces the second Plank.
- Make new button reveals visually noticeable, such as a brief flash/pulse.

Exit criteria:

- New games begin with only the Sawmill interaction visible as the obvious next action.
- The Buildings button appears as a reward for producing the first Plank.
- The Tech button appears only after the player has demonstrated the basic Wood to Plank supply loop.
- Existing building placement and tech-tree behavior still work inside their new frames.

Implemented notes:

- Main, Buildings, and Tech Tree are now exclusive top-level frames; only one is visible at a time.

## Phase 9: Opening Tech Tree Rewrite

Goal: turn the early tech tree into a readable chain of building activations and near-future reveals.

Status: complete.

Scope:

- Rework the early tech tree around entries for Lumber Camp, Sawmill, Market, and one initially unnamed future entry.
- Make the tree layout communicate prerequisite chains rather than only showing flat cards.
- Show that Market can be activated for free once its prerequisite is met.
- Keep Market locked out of the building menu until its tech entry is activated.
- After the first Market sale, pulse the Tech button again and reveal the unnamed entry as the Mine.
- Keep locked and unknown entries readable enough to create curiosity without overwhelming the opening.

Exit criteria:

- The player can understand that buildings are activated through the tech tree.
- Market activation is clearly free and leads directly to Market purchase availability.
- The first sale creates a visible next-step reveal toward Mining.

## Phase 10: Money-Only Opening Economy

Goal: simplify early purchasing so the first progression layer is about production flow, not mixed-cost accounting.

Status: complete.

Scope:

- Convert early building costs to money-only.
- Convert early tech and building-upgrade costs to money-only.
- Keep the content model capable of resource costs for later phases, but avoid using them in the opening.
- Tune early sale values and prices around the Sawmill-first loop.
- Introduce money display as Gold, Silver, and Copper, where 1 Gold equals 100 Silver equals 1000 Copper.
- Use compact formatting so early prices remain readable.

Exit criteria:

- The player can buy early buildings and upgrades using only money.
- Production resources matter because they create goods to sell, not because they are immediate tech payment chores.
- Money display is understandable at a glance and does not clutter small UI surfaces.

Implemented notes:

- Runtime money is stored as Copper and displayed as compact `G`, `S`, and `C` units.
- Current building, tech, addon, and manager purchases are money-only.
- Resource costs remain supported by content validation and payment rules for later phases, but they are not used by the current opening progression.

## Phase 11: Building Upgrade Subviews

Goal: move building-specific upgrade decisions into the tech tree so progression has one coherent home.

Status: complete.

Scope:

- Give each building tech-tree entry a focused sub-view.
- Move current node-type addons out of the inspector and into those building sub-views.
- Show available, locked, affordable, unaffordable, and purchased upgrade states inside each building entry.
- Preserve per-building flavor: Lumber Camp, Sawmill, Market, and Mine should each feel like a small progression branch.
- Keep direct node controls on the node itself; the tech tree owns permanent upgrades.

Exit criteria:

- Building upgrades are purchased from the tech tree view.
- The inspector returns to inspection and per-node operational details rather than permanent upgrade shopping.
- The player can see upgrade prerequisites as chains inside building sub-views.

Implemented notes:

- Opening-chain building entries now show upgrade subviews for their node-type addons.
- Later unlocked buildings with addon content appear in a generated Building Upgrades section.
- The inspector no longer renders permanent addon purchase controls.

## Phase 12: Opening Balance Pass

Goal: tune the full revised opening after the interface, tech, economy, and upgrade structure changes are in place.

Status: complete.

Scope:

- Playtest the first 5 minutes against the target sequence: Sawmill, first Plank, Buildings reveal, Lumber Camp, second Plank, Tech reveal, Market activation, Market purchase, first sale, Mine reveal.
- Tune production times, early prices, sale values, and reveal timing.
- Keep Sawmill purchasable immediately when Buildings unlock; Sawmill Methods is an upgrade prerequisite, not a building unlock.
- Check that the first 10 minutes naturally create an automation aspiration without requiring it too soon.
- Update `prototype-functionality.md`, `design-notes.md`, and README to match the new player-facing flow.

Exit criteria:

- A new player can complete the first sale loop quickly without needing instructions outside the game.
- The Mine reveal feels like the next natural goal.
- The game has a clearer foundation for expanding beyond the first 10 to 25 minutes.

Implemented notes:

- Woodworking is now Sawmill Methods and no longer unlocks Sawmill buildings.
- Early goals now script the opening spine from first Plank through Lumber Camp, second Plank, Market Access, first sale, and steady trade.
- First sale happens at 3S earned; the 6S steady-trade threshold remains the reveal pressure for Mining and Sawmill Methods.

## Phase 13: Unlock Tree State Model

Goal: define explicit unlock-node states before changing the tech tree UI heavily.

Status: complete.

Scope:

- Add helper functions for unlock-node state:
  - `hiddenIdentity`
  - `revealedLocked`
  - `unlockable`
  - `unlocked`
- Keep the current tech tree UI unchanged.
- Add focused smoke checks for state transitions.

Exit criteria:

- The game can ask what state an unlock node is in without relying on render logic.
- Existing opening behavior is unchanged.

Implemented notes:

- Added `src/unlock-tree.js` with explicit unlock-node state helpers.
- Unlock nodes can now evaluate hidden identity, revealed locked, unlockable, and unlocked states.
- Added `npm run check:unlock-tree` as a focused smoke check for state transitions.
- No player-visible tech tree behavior changed in this phase.

## Phase 14: Unlock Tree Content

Goal: separate building unlock map data from generic tech data.

Status: complete.

Scope:

- Add `content/unlock-tree.json`.
- Define unlock nodes with ids, building refs, parent refs, positions, hidden/revealed labels, reveal rules, costs, and unlock effects.
- Represent the current opening chain first: Lumber Camp, Sawmill, Market, and Mine.
- Keep existing `techs.json` compatibility during the migration.

Exit criteria:

- Current opening building unlocks can be represented in data without changing player-visible behavior.
- Content validation checks unlock-tree references.

Implemented notes:

- Added `content/unlock-tree.json` with Sawmill, Lumber Camp, Market, and Mine unlock nodes.
- Content loading now includes the unlock tree.
- Content validation checks unlock-node building refs, parent refs, position, identity labels, conditions, costs, and unlock effects.
- Runtime state and save/load now carry unlock-tree progress, but no rendering or purchasing behavior has been switched over yet.

## Phase 15: Unlock Tree Renderer

Goal: render the main building tree from `unlock-tree.json`.

Status: complete.

Scope:

- Replace the hardcoded opening building-chain renderer with content-driven unlock nodes.
- Render hidden identity, revealed locked, unlockable, and unlocked states.
- Keep the current compact card layout initially.
- Preserve Market free activation and Mine reveal behavior.

Exit criteria:

- The opening tree looks roughly the same but is content-driven.

Implemented notes:

- The Tech Tree frame now renders its opening building map from `state.unlockTree`, which is loaded from `content/unlock-tree.json`.
- Unlock nodes display hidden identity, locked, available, and unlocked states through the shared unlock-tree state helpers.
- Parent checks now treat already-unlocked backing buildings as unlocked parents, so the starting Sawmill can anchor the map safely.
- Generic tech cards that duplicate unlock-tree building unlocks are hidden from the lower tech list during the migration.

## Phase 16: Unlock Purchasing

Goal: make building unlock nodes the source of truth for building availability.

Status: complete.

Scope:

- Buying an unlock-tree node applies building unlocks.
- Remove duplicated building-unlock behavior from generic techs.
- Keep global upgrades such as Storage Bins, Workshop Tuning, and Market Bargaining in `techs.json`.
- Keep saves loading safely through the migration.

Exit criteria:

- Building availability comes from unlock-tree nodes rather than generic tech cards.

Implemented notes:

- Unlock-tree nodes now have purchase buttons and apply their `unlocks` payload when activated.
- Building menu availability now follows `state.unlockedBuildings` directly.
- Market Access and Mining were removed from generic tech content; opening Market and Mine availability now comes from `unlock-tree.json`.
- Goals and downstream tech prerequisites that depended on those generic techs now use unlocked-building conditions or direct milestones.
- Save loading reapplies bought unlock-tree effects so older and current saves keep building availability consistent.

## Phase 17: Node Detail View Routing

Goal: make unlocked tree nodes open focused building detail screens.

Status: complete.

Scope:

- Add tech-tree navigation state for unlock map versus building detail.
- Clicking an unlocked building node opens its detail view.
- Detail view shows current node-type upgrades.
- Add a Back control to return to the unlock map.
- Do not change upgrade effects yet.

Exit criteria:

- The main tree answers what can be unlocked next.
- The detail view answers how to improve a known building type.

Implemented notes:

- Added Tech Tree routing state for map and building-detail modes.
- Unlocked Building Tree nodes now show a Details action instead of inline upgrade lists.
- Building detail screens show current node-type upgrades and a Back control.
- Upgrade effects and purchase behavior are unchanged.

## Phase 18: Upgrade Track Shape

Goal: turn addon lists into structured building upgrade tracks.

Status: complete.

Scope:

- Add track metadata for manager, speed, quality, recipes, storage, efficiency, and sale value.
- Display current addons inside those groups.
- Implement Speed using existing `actionTicks` effects first.
- Keep Quality as a placeholder or omit it until demand/contracts give it purpose.

Exit criteria:

- Sawmill, Lumber Camp, Market, and Mine detail screens read as coherent upgrade branches rather than loose cards.

Implemented notes:

- Addons now carry explicit `track` metadata.
- Content validation checks addon track names.
- Building detail views group addons into Manager, Speed, Quality, Recipes, Storage, Efficiency, and Sale Value tracks.
- Empty tracks render as placeholders so future upgrade branches have visible homes.
- Existing upgrade effects and costs are unchanged.

## Phase 18.5: Hardening Before Playtest

Goal: protect the current progression skeleton before intensive playtesting.

Status: complete.

Scope:

- Add focused tests for rules, simulation, save/load migration, and unlock-tree progression.
- Add a small test runner script using Node's built-in assertions.
- Fix any low-risk bugs found while writing those tests.
- Do not expand gameplay content in this phase.

Exit criteria:

- Core production, selling, unlock purchasing, save migration, and addon effects have automated coverage.
- The prototype is ready for an intensive manual playtest pass.

Implemented notes:

- Added `npm run test:hardening` with focused Node assertion coverage for production, selling, managed automation, unlock-tree application, addon effects, world occupancy, save/load, legacy unlock migration, and corrupted save handling.
- Shared content-loading helpers now support validation and test scripts.
- Save loading now reports corrupted JSON without resetting the current game state.
- The next milestone is intensive manual playtesting against the stabilized progression skeleton.

## Phase 19: Main Tree Layout

Goal: move the main unlock tree toward the diagrammed production map.

Status: planned.

Scope:

- Use unlock-node position data.
- Draw connector lines between parent and child nodes.
- Show hidden identity labels for future branches.
- Add optional branch language such as Wood, Trade, Metal, Leather, and Military where useful.

Exit criteria:

- The main tech tree visually communicates production domains and long-term direction.

## Phase 20: Content Expansion Pass

Goal: add the next production domains safely.

Status: planned.

Scope:

- Add the Carpenter branch.
- Add Hunters to Leather Worker to Tailor.
- Add Forge to Blacksmith to Barracks to Outfitter.
- Add placeholder unlocks where mechanics are not ready.
- Avoid implementing Quality or contracts in this phase.

Exit criteria:

- The tree shows the future kingdom shape without requiring all future mechanics to exist.

## Phase 21: Quality And Demand Prep

Goal: introduce Quality only once it has a clear gameplay purpose.

Status: planned.

Scope:

- Decide whether Quality affects sale value, contracts, premium outputs, recipe tiers, or another demand system.
- Prefer tying Quality to contracts or external demand.
- Add validation for quality effects once the mechanic is defined.
- Add UI only after the loop exists.

Exit criteria:

- Quality is a real gameplay axis rather than decorative progress.

## Future Outlook: Contracts And Reputation

Goal: add external demand and a longer-term progression pressure after the unlock tree and opening flow are stronger.

Possible scope:

- Add simple contracts that request delivered goods.
- Add Reputation or Prestige as a later reward currency if it proves useful.
- Use contracts to unlock advanced trade, science, quality, or manager options.
- Keep contracts separate from direct Market selling.

Possible exit criteria:

- The player can choose between selling goods for money and fulfilling a contract for a different reward.

## Near-Term Next Step

The next phase to implement is Phase 13: Unlock Tree State Model.
