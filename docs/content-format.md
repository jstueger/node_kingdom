# Content Format

The JSON files in `content/` are the source of truth for game content. Runtime code should use `src/data.js`, `src/progression-data.js`, and rules helpers instead of importing JSON directly.

## Loading Pipeline

Content follows this path:

```text
content/*.json
-> src/content-loader.js
-> src/content-validation.js
-> normalized runtime content
-> src/data.js / src/progression-data.js
```

Validation runs before normalization. Invalid content should fail before state is created.

## Authoring Shape

Authoring fields are meant to be readable and stable for editing:

- Items use `label`, `icon`, and optional `tags`.
- Buildings use `description`, `size`, `cost`, `capacity`, optional `actionTicks`, `recipes`, and optional `sellPrices`.
- Building `cost` is always an object, even when it is only `{ "gold": 5 }`.
- Recipes use `inputs` and `output`.
- Recipe outputs use `resource` and `amount`.
- Techs use `description`, `visibleWhen`, `requires`, `cost`, and `unlocks`.
- Goals use `description`, `visibleWhen`, `completeWhen`, and `reward`.
- Addons use `description`, `visibleWhen`, `cost`, and `effects`.
- Managers use `slots` and `costs`.
- Start state uses `grid`, `startingGold`, and `unlockedBuildings`.

Example recipe output:

```json
{
  "output": {
    "resource": "wood",
    "amount": 1
  }
}
```

## Runtime Shape

The loader currently normalizes authoring content into the older runtime shape so existing systems can keep working.

Important mappings:

```text
description       -> desc
size.w / size.h   -> w / h
actionTicks       -> actionTicks
cost.gold         -> cost
cost              -> costResources
output.resource   -> output.res
```

The `cost` runtime field is kept for compatibility with older UI/refund behavior. New placement affordability and spending should use `costResources`.

## Validation

Run validation with:

```bash
node scripts/validate-content.mjs
```

Or:

```bash
npm run validate:content
```

Validation checks:

- item labels and icons
- building labels, descriptions, kind, size, work-time overrides, costs, capacities, and recipes
- recipe input/output resources
- seller prices
- tech prerequisites, visibility conditions, unlock targets, and cycles
- goal visibility/completion references
- addon targets and effect references
- manager slot/cost targets
- start-state grid, gold, and unlocked building ids
- buildings that are neither in start state nor unlocked by any tech

Some checks are errors and stop startup. Reachability checks are warnings unless they would break references.

## Known Limits

- Runtime code still uses normalized fields in many places.
- `state.js` creates runtime state from already-loaded content via `createState()`.
- Save data is best-effort compatible with content changes; unknown saved buildings are skipped on load.
- There is no GUI editor yet. Edit JSON directly and run validation.
