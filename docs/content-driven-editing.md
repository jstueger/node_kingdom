# Proposal: Content-Driven Editing for Buildings and Tech Trees

## Purpose

We want to make it easier to add, adjust, and balance game content without changing core game logic every time. This mainly concerns buildings, recipes, resources, technologies, goals, addons, and manager-related progression.

The direction should be: **the code defines how the game works; content files define what exists in the game.**

This would allow us to edit the available buildings and tech tree through structured data first, and potentially through a GUI later.

---

# Core principle

The game should separate **rules** from **content**.

## Code should own behavior

The code should define:

```text
how production works
how resources are stored and transferred
how costs are paid
how unlocks are applied
how tech visibility is evaluated
how managers automate work
how addons modify node behavior
how the UI renders state
```

## Content should own game data

Content files should define:

```text
which resources exist
which buildings exist
which recipes exist
which techs exist
which milestones reveal techs
which techs unlock buildings or systems
which goals guide the player
which addons exist
which manager slots and manager costs exist
```

This means adding a new building or technology should not require touching `simulation.js`, `rules.js`, or `render.js` unless the new content requires a completely new mechanic.

---

# Recommended source of truth: JSON

The best long-term source format is **JSON**.

Markdown is good for discussion and design notes. Excel is useful later for balancing. But JSON fits the current project best because our game data is already object-shaped and nested.

Buildings have recipes. Techs have prerequisites, costs, milestones, and unlocks. Addons have effect definitions. This is much more natural in JSON than in spreadsheets.

Recommended structure:

```text
content/
├── items.json
├── buildings.json
├── techs.json
├── goals.json
├── addons.json
├── managers.json
└── start-state.json
```

The game would load these files, validate them, then initialize the runtime state.

---

# Example: buildings as content

A building definition could look like this:

```json
{
  "lumber": {
    "label": "Lumber Camp",
    "icon": "🌲",
    "color": "#0c1c08",
    "kind": "producer",
    "size": { "w": 8, "h": 8 },
    "cost": { "gold": 5 },
    "description": "Produces wood.",
    "capacity": {
      "wood": 12
    },
    "recipes": {
      "wood": {
        "label": "Cut Wood",
        "inputs": {},
        "output": {
          "resource": "wood",
          "amount": 1
        }
      }
    }
  }
}
```

A crafter would use the same structure, but with recipe inputs:

```json
{
  "forge": {
    "label": "Forge",
    "icon": "🔥",
    "color": "#281208",
    "kind": "crafter",
    "size": { "w": 16, "h": 8 },
    "cost": { "gold": 12 },
    "description": "Turns ore and fuel into metal bars.",
    "capacity": {
      "iron_ore": 9,
      "wood": 6,
      "coal": 8,
      "iron_bar": 8,
      "steel_bar": 6
    },
    "recipes": {
      "iron_bar_charcoal": {
        "label": "Iron Bar",
        "inputs": {
          "iron_ore": 3,
          "wood": 1
        },
        "output": {
          "resource": "iron_bar",
          "amount": 1
        }
      }
    }
  }
}
```

---

# Example: techs as content

A tech definition could look like this:

```json
{
  "storage_bins": {
    "tree": "technology",
    "label": "Storage Bins",
    "description": "Adds storage capacity to every resource slot.",
    "visibleWhen": {
      "lifetimeProduced": {
        "wood": 12
      }
    },
    "requires": [],
    "cost": {
      "gold": 120
    }
  }
}
```

A science tech could use the same format:

```json
{
  "basic_accounting": {
    "tree": "science",
    "label": "Basic Accounting",
    "description": "Market sale timers are shorter.",
    "visibleWhen": {
      "lifetimeProduced": {
        "knowledge": 5
      }
    },
    "requires": ["knowledge_production"],
    "cost": {
      "knowledge": 5
    },
    "unlocks": {}
  }
}
```

This gives us one consistent model for technology and science.

---

# Example: addons as content

Node-specific addons could also be data-driven:

```json
{
  "lumber_sharper_axes": {
    "node": "lumber",
    "track": "speed",
    "label": "Sharper Axes",
    "description": "Lumber Camp action timers are 2 seconds shorter.",
    "cost": {
      "gold": 10,
      "wood": 8
    },
    "effects": {
      "actionTicks": -2
    }
  }
}
```

For manager-based automation:

```json
{
  "lumber_foreman": {
    "node": "lumber",
    "track": "manager",
    "label": "Foreman Routine",
    "description": "Managed Lumber Camps work twice as fast.",
    "visibleWhen": {
      "techs": ["lumber_management"]
    },
    "cost": {
      "gold": 45,
      "knowledge": 4,
      "wood": 20
    },
    "effects": {
      "managerWork": 1
    }
  }
}
```

---

# Why JSON first, not a GUI first?

A GUI editor is attractive, but we should not start there.

If we build a GUI before the content model is stable, we risk building the wrong editor. The better path is:

```text
1. Define stable JSON content files.
2. Add validation.
3. Use JSON manually for a while.
4. Only then build a GUI that reads and writes the same JSON.
```

The JSON format should become the source of truth. The GUI should only be an editor for that source of truth.

---

# Why not Excel as the source of truth?

Excel is useful for balancing costs and numbers, but it is awkward for nested structures.

Our data is not flat:

```text
buildings contain recipes
recipes contain inputs and outputs
techs contain prerequisites, visibility conditions, costs, and unlocks
addons contain effect definitions
```

This structure fits JSON naturally. In Excel, it would require many sheets and conversion rules.

Excel can still be useful later for balancing, but it should not be the main runtime format.

---

# Validation is essential

If we move content out of code, we need validation.

The validator should detect content mistakes before the game starts.

Examples:

```text
unknown resource IDs
unknown building IDs
unknown tech prerequisites
unknown recipe outputs
missing building labels
missing capacities for produced resources
tech costs using resources that do not exist
addons targeting buildings that do not exist
market sell prices for unknown resources
unreachable techs
circular tech dependencies
```

This is the key safety mechanism. Without validation, content-driven editing becomes fragile.

A validation screen or console output could show:

```text
✓ All recipe outputs are known items
✓ All tech prerequisites exist
✓ All building unlocks reference existing buildings
✗ Tech "steelmaking" requires unknown tech "coal_processing"
✗ Building "forge" produces "steel_bar" but has no capacity for it
```

---

# Future GUI concept

Once the JSON model is stable, we can build a local editor page:

```text
/editor.html
```

It could have tabs:

```text
Items | Buildings | Recipes | Techs | Goals | Addons | Managers | Validation
```

## Buildings tab

The building editor could show:

```text
Building list           Building form

Lumber Camp             ID: lumber
Market                  Label: Lumber Camp
Iron Mine               Kind: producer
Sawmill                 Cost: gold 5
Forge                   Size: 8 x 8
                        Capacity:
                        wood 12

                        Recipes:
                        Cut Wood
                        output wood x1
```

## Techs tab

The tech editor could show:

```text
Technology / Science

Storage Bins
Sawmill Methods
Smelting
Knowledge Production

Selected Tech:
ID: storage_bins
Visible when:
  lifetimeProduced wood >= 12
Cost:
  wood 5
Unlocks:
  building market
```

## Validation tab

The editor should always show whether the content is valid.

This would make it safe to add and change content without accidentally breaking the game.

---

# Recommended implementation path

## Step 1: Extract content into JSON

Create:

```text
content/items.json
content/buildings.json
content/techs.json
content/goals.json
content/addons.json
content/managers.json
content/start-state.json
```

Then adapt the current game to load these definitions.

## Step 2: Add a content loader

Create:

```text
src/content-loader.js
```

Its job:

```text
load JSON files
normalize field names
provide content to the game
fail clearly if loading fails
```

## Step 3: Add validation

Create:

```text
src/content-validation.js
```

Its job:

```text
validate references
validate required fields
validate recipe consistency
validate tech dependencies
validate addon targets
validate startup state
```

## Step 4: Keep Markdown templates for discussion

Add planning templates:

```text
docs/templates/building-template.md
docs/templates/tech-template.md
docs/templates/addon-template.md
```

These are for design discussion, not runtime loading.

## Step 5: Build GUI editor later

Only after the content format has stabilized.

The GUI should read and write the same JSON files.

---

# Suggested decision

Adopt the following principle:

> JSON is the source of truth. Markdown is for discussion. A GUI editor may come later. The game code should consume validated content, not hardcoded content definitions.

This gives us a clean growth path:

```text
current prototype
→ data-driven content files
→ validation
→ easier balancing
→ optional GUI editor
```

This also keeps the project small enough for now while preparing it for much easier content expansion later.
