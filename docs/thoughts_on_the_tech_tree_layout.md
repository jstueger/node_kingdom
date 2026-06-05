The flatness comes from a mismatch between **your vision** and the current **rendering grammar**.

Your vision is closer to:

```text
a navigable kingdom capability map
with domains, mystery, direction, and progression pressure
```

The current render is closer to:

```text
a positioned list of database rows
connected by dependency lines
```

The data model is mostly fine. The problem is visual hierarchy and spatial language.

## Main issue

Right now every unlock node has roughly equal visual weight:

```text
Sawmill
Lumber Camp
Carpenter
Market
Mine
Forge
Blacksmith
School
Hunters
Leather Worker
Tailor
Barracks
Outfitter
```

They all look like cards in a grid. That makes the tree feel like Excel because the UI says:

```text
these are entries
```

not:

```text
this is a kingdom growing through production domains
```

## What to change conceptually

You need three visual layers:

```text
1. Main spine
   The central progression path.

2. Domain branches
   Wood, Trade, Metal, Leather, Science, Military.

3. Mystery/future horizon
   Future nodes shown as silhouettes or faint destination markers.
```

Currently all three are rendered with the same visual importance.

---

# 1. Make the main progression spine visually dominant

The spine should be obvious at a glance.

For example:

```text
Sawmill → Market → Mine → Forge → Blacksmith → Barracks → Outfitter
```

Even if there are side branches, the player should immediately see the “main road.”

Current layout:

```text
Sawmill      Carpenter       Coal Mine      School
Lumber       Market Mine     Forge Blacksmith Barracks Outfitter
Hunters      Leather Tailor
```

This is too tabular.

Better layout:

```text
                      Carpenter
                         │
Sawmill ── Market ── Mine ── Forge ── Blacksmith ── Barracks ── Outfitter
   │                               │          │
Lumber Camp                     Coal Mine    School
   │
Hunters ── Leather Worker ── Tailor ───────────────┘
```

That already feels more like a map.

## Data implication

Add an optional visual role:

```json
"visual": {
  "role": "spine"
}
```

or:

```json
"path": "main"
```

Then render spine nodes larger/brighter and side branches smaller.

---

# 2. Stop using branch labels like column headers

The current branch labels behave like table headings: Wood, Trade, Metal, Leather, Military. That reinforces the Excel feel.

Instead, branches should feel like **regions** or **lanes**.

Use background bands:

```text
Wood domain      soft green/brown background
Trade domain     muted gold background
Metal domain     blue/grey background
Leather domain   dark green/brown background
Military domain  red/steel background
Science domain   teal/purple background
```

Not strong colors, just subtle territory.

The tree should look like it has areas, not columns.

## Data implication

Keep `branch`, but render it as a domain region, not just a text label.

For example:

```text
Woodland
Trade Road
Ore Fields
Workshops
Garrison
```

Even the naming can become more world-like:

```text
Wood → Woodland
Trade → Market Road
Metal → Ore & Flame
Leather → Wilds & Hide
Science → Records
Military → Muster Yard
```

Those labels carry more fiction.

---

# 3. Use node shape/size to communicate meaning

Currently every card is basically the same.

Use different visual weights:

```text
Starter node       medium, already lit
Main unlock        large card
Side unlock        smaller card
Future mystery     silhouette / marker
Endpoint           large destination card
```

Example:

```text
Sawmill       medium
Market        large
Mine          large
Forge         large
Blacksmith    large
Barracks      large
Outfitter     large endpoint

Carpenter     side card
Coal Mine     side card
Hunters       side card
Leather       side chain
School        side card
```

That would immediately make the tree feel designed rather than listed.

## Data implication

Add:

```json
"visual": {
  "weight": "major | normal | minor | endpoint"
}
```

Or infer from branch/path, but explicit is better.

---

# 4. Mystery nodes should not look like disabled cards

A hidden future node currently still looks like a card with dashed border. That reads as “disabled spreadsheet row.”

Instead, mystery nodes should look like **landmarks in fog**.

For hidden identity:

```text
?
Unknown Metal Source
Cost: hidden or rough
```

But visually:

```text
low opacity
blurred/silhouette icon
darker background
no normal button area
short hint text
```

A mystery node should not look like “a locked form field.” It should look like “something is out there.”

Possible states:

```text
Unknown
A vague silhouette. No cost.

Revealed
Name and cost visible.

Unlockable
Bright border, clear action.

Unlocked
Solid, colored, opens detail view.
```

Current implementation supports hidden/revealed/unlockable/unlocked logically. It just needs a stronger visual difference.

---

# 5. Don’t show full card detail for every future node

A complete tree can be visible without every node being a full card.

For far-future locked nodes, use compact markers:

```text
[ ? ]
Unknown Workshop
```

For near-future revealed nodes, use full cards.

This avoids visual overload.

Suggested rendering rule:

```text
Unlocked / unlockable / next locked:
full card

Hidden future:
compact silhouette marker

Far future:
small landmark marker
```

This creates depth.

---

# 6. Add a “current frontier” effect

The player should feel where the current edge of progress is.

At start:

```text
Sawmill and Lumber Camp are lit.
Market/Carpenter are nearby but not yet reached.
Everything else fades into fog.
```

After first plank:

```text
Lumber is active/known.
Market becomes visible.
```

After first sales:

```text
Mine emerges.
```

The tree should visually say:

```text
this is where your kingdom currently ends
```

Concrete UI idea:

```text
unlocked nodes: saturated
unlockable nodes: glowing
revealed locked nodes: normal but dim
hidden nodes: fogged
branches beyond hidden nodes: faint
```

---

# 7. Reconsider the current starting unlocks

Right now `lumber` and `sawmill` are both unlocked in start state. That causes both to appear unlocked immediately.

From your pacing idea, that may be okay mechanically, but visually it weakens the first reveal.

If you want the onboarding to feel like Kingdom Inc:

```text
Start with Sawmill placed.
Sawmill exists but build menu is not open yet.
After first Plank, Lumber Camp and Sawmill become purchasable.
```

Then maybe `sawmill` should be “known” but not globally build-unlocked at start.

You may need separate concepts:

```text
known building
buildable building
placed tutorial building
```

Currently `unlockedBuildings` collapses these.

That makes the tree less dramatic because starter content is already “unlocked.”

## Better model

```json
"startState": {
  "knownBuildings": ["sawmill"],
  "buildableBuildings": [],
  "startingBuildings": [...]
}
```

Then:

```text
Placed Sawmill exists.
Sawmill unlock node appears as active/tutorial.
But build menu does not allow more Sawmills until unlock.
```

This would better match your vision.

---

# 8. Make the unlock tree more like a map, less like a tech panel

Current UI likely lives inside a narrow tech panel with card styling. That makes it feel administrative.

For the main unlock tree, treat it as its own screen:

```text
full-width canvas-like area
pannable/zoomable if needed
large branch regions
map-like connectors
distinct landmarks
```

The node detail view can remain card-like. The map should not.

Main tree:

```text
visual / spatial / navigable
```

Detail view:

```text
structured / card-based / upgrade purchasing
```

That separation matters.

---

# Concrete design direction

## Current style

```text
[Card] -- [Card] -- [Card]
```

## Target style

```text
A kingdom map of capability domains:

Woodland Start
  Sawmill
  Lumber Camp
  Carpenter

Market Road
  Market

Ore & Flame
  Mine
  Forge
  Coal Mine
  Blacksmith

Wilds & Hide
  Hunters
  Leather Worker
  Tailor

Muster Yard
  Barracks
  Outfitter
```

Same data. Different visual language.

---

# Suggested JSON additions

Minimal additions:

```json
"visual": {
  "role": "spine",
  "weight": "major",
  "region": "woodland"
}
```

Example:

```json
"market_unlock": {
  "kind": "buildingUnlock",
  "building": "market",
  "parent": "sawmill_unlock",
  "branch": "Trade",
  "position": { "x": 1, "y": 1 },
  "visual": {
    "role": "spine",
    "weight": "major",
    "region": "market_road"
  }
}
```

For side nodes:

```json
"carpenter_unlock": {
  "visual": {
    "role": "side",
    "weight": "normal",
    "region": "woodland"
  }
}
```

For endpoints:

```json
"outfitter_unlock": {
  "visual": {
    "role": "endpoint",
    "weight": "major",
    "region": "muster_yard"
  }
}
```

---

# Suggested render changes

## First pass, no data changes

You can already improve a lot with CSS and layout:

```text
1. Make nodes smaller by default.
2. Make main horizontal path visually stronger.
3. Add background domain regions manually from branch positions.
4. Render hidden nodes as compact silhouettes.
5. Use thicker brighter connectors between unlocked / next nodes.
6. Remove full descriptions from hidden nodes.
```

## Better pass, small data changes

Add `visual.role` and `visual.weight`.

Then render:

```text
spine nodes larger
side nodes smaller
endpoint nodes distinct
hidden nodes compact
```

---

# Specific layout recommendation for your current tree

I would re-layout it like this:

```text
                              School
                                │
Sawmill ── Market ── Mine ── Forge ── Blacksmith ── Barracks ── Outfitter
   │         │                  │          │             ▲          ▲
   │         │                  │          │             │          │
Lumber       └────────────── Coal Mine     │             │          │
   │                                      │             │          │
Hunters ── Leather Worker ── Tailor ──────┘             │          │
                                                           Carpenter ┘
```

Or, more cleanly:

```text
        Carpenter ───────────────────────────────┐
                                                  │
Sawmill ── Market ── Mine ── Forge ── Blacksmith ── Barracks ── Outfitter
   │                         │                    │
Lumber Camp              Coal Mine              School
   │
Hunters ── Leather Worker ── Tailor ──────────────┘
```

This makes Outfitter feel like a convergence point, which matches your intended pre-fighting economy.

---

# Strongest recommendation

Do not render this as “tech cards in a panel.”

Render it as a **capability map**.

The difference:

```text
Tech card panel:
Good for buying upgrades.

Capability map:
Good for showing a kingdom unfolding.
```

Your main unlock tree should be the second. Node detail screens can be the first.

## Practical next step

Create a new render mode for unlock tree nodes:

```text
compact map nodes
domain regions
spine emphasis
mystery silhouettes
convergence endpoint
```

Keep the existing card renderer for building detail views and addons.

That will align much better with your vision.
