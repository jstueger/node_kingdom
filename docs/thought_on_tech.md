The structure you describe is strong

Your intended interaction model is clear:

Main tree node locked
→ player sees placeholder / mystery / cost / conditions

Main tree node unlockable
→ player clicks and pays cost

Main tree node unlocked
→ player clicks and enters node detail view

Node detail view
→ player buys node-specific upgrades
→ speed, quality, manager slot, recipes, specializations

That is a clean two-level tech system:

Level 1: unlock new node types
Level 2: improve known node types

This is probably better than putting everything into one giant tech tree.

I would formalize the distinction

Use these terms internally:

Unlock Tree
The main navigable map of node availability.

Node Detail Tree
The per-node upgrade screen.

Recipe Unlocks
Specific outputs or production options inside a node.

Node Upgrades
Speed, quality, manager slots, storage, efficiency, etc.

This avoids confusion later when discussing “tech tree,” because you really have multiple progression layers.

Complete tree with hidden future names

Showing the whole tree while hiding future node names is a good compromise.

It gives the player:

a sense of scale
a visible long-term path
mystery about future capabilities
clear short-term goals

A locked future node could show:

???
Cost: 250S
Requires: Produce 3 Iron Bars

or even less:

Unknown Workshop
Cost: 250S

Then once the player reaches the reveal condition:

Blacksmith
Cost: 250S
Requires: Forge unlocked

This is better than hiding the whole future tree, because it creates aspiration without overwhelming the player with every future system name immediately.

I would separate three states for main tree nodes

For implementation and UX, I would use:

Hidden identity
The position exists, but the real name/details are concealed.

Revealed but locked
The node name is visible, but conditions/cost are not yet met.

Unlockable
Conditions are met and the player can pay the cost.

Unlocked
Clicking opens the node detail view.

So a node can progress like this:

??? → Blacksmith locked → Blacksmith unlockable → Blacksmith detail view

This supports your idea well.

Cost-only future nodes

Showing only cost can work, but I would be careful. Cost alone may be too abstract.

Better:

???
Cost: 220S
Branch: Metalwork

or:

Unknown Metal Workshop
Cost: 220S

That keeps mystery while preserving direction. The player should know whether they are pursuing wood, metal, leather, trade, or military capability.

Node detail view

This is exactly where manager/speed/quality should live.

For example:

Sawmill
├─ Manager Slot
├─ Speed 0/5
├─ Quality 0/5
├─ Plank Recipe
├─ Beam Recipe
└─ Carpenter Link / advanced woodworking

This keeps the main unlock tree readable. The main tree answers:

What new capability can I unlock next?

The detail view answers:

How do I improve this capability?

That is a strong separation.

One implementation implication

Your current content model should probably start distinguishing main unlock nodes from building definitions.

Right now a building and its unlock tech are close together conceptually. But with this model, you likely want something like:

{
  "id": "blacksmith_unlock",
  "kind": "buildingUnlock",
  "building": "blacksmith",
  "parent": "forge_unlock",
  "position": { "x": 8, "y": 4 },
  "identity": {
    "hiddenLabel": "Unknown Metal Workshop",
    "revealedLabel": "Blacksmith"
  },
  "visibleWhen": {
    "lifetimeProduced": { "iron_bar": 2 }
  },
  "cost": {
    "gold": 220
  }
}

Then the building itself remains in buildings.json, while the unlock tree controls visibility, cost, and navigation.

That may be a later refinement, but it fits your desired UI better than treating every unlock as a generic tech.

Removing Combiner is the right call

Until its role is clear, remove it.

If the idea returns later, it should probably become one of these:

Outfitter
Combines recruits and equipment into units.

Quartermaster
Bundles goods into military supply packages.

Assembly Yard
Combines components into complex items.

Provisioner
Combines food, tonics, and gear into campaign supplies.

But “Combiner” as a node label should not stay.

Revised assessment

With your clarification, the tree direction is stronger than I initially read it.

I would now describe the intended system as:

A complete navigable unlock map that reveals the kingdom’s production domains over time. Locked nodes can be inspected only as future opportunities; unlocked nodes become entry points into detailed node-specific upgrade screens.

That is a good product structure.

The key next design task is to define the state model for tree nodes:

unknown
revealed
unlockable
unlocked
detail-view

Once that is clear, the implementation will be much easier.