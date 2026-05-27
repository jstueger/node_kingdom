The Kingdom inc. pacing is much faster and more directed than where our current opening seems to be heading. The important insight is not the exact numbers, but the **sequence of moments**.

Kingdom Inc gives the player, within about five minutes:

```text
1. A working production node already placed.
2. Immediate manual action.
3. First crafted good.
4. Build menu unlock.
5. Tech tree unlock.
6. First producer placed.
7. First connector created.
8. First seller placed.
9. First full chain completed.
10. First automation path revealed.
11. First next-production node visible: Blacksmith.
```

That is a very dense onboarding loop.

## The key pacing lesson

Kingdom Inc does **not** start with “build a producer.”

It starts with:

```text
Here is a Forge.
Here is stored input.
Click it.
You made something valuable.
Now build the system that supports this.
```

That is clever because the player experiences the *purpose* of production before having to build the production infrastructure.

Your current opening starts more bottom-up:

```text
Build Lumber Camp
Produce wood
Unlock Market
Sell wood
Unlock more
```

That is coherent, but it risks feeling flatter because wood is not yet exciting. Kingdom Inc starts with transformation: ore becomes iron bar. Transformation feels more meaningful than raw gathering.

## What I would borrow

I would seriously consider starting your game with **one placed node and starter inventory**, not an empty grid.

For Node Kingdom, the closest equivalent could be:

```text
Start with one Lumber Camp already placed
or
Start with one Workshop / Sawmill already placed with stored wood
```

But I think the better version is:

```text
Start with one Sawmill already placed
Sawmill has 4 wood stored
Player starts first plank action
First plank unlocks Build Menu + Tech Tree
Lumber Camp is available in Build Menu
Market Access is free in Tech Tree
```

That mirrors the Kingdom Inc structure while fitting your own resource chain.

## Possible Node Kingdom first 5 minutes

A strong version:

```text
Start:
- Sawmill already placed
- Sawmill contains 4 wood
- Only recipe: Plank
- Player clicks once to start production
- After 5 ticks: 1 plank produced

Unlock:
- Build menu
- Tech tree

Build menu:
- Lumber Camp available

Tech tree:
- Market Access available for free

Player then:
- places Lumber Camp
- selects Wood recipe automatically or explicitly
- connects Lumber Camp → Sawmill
- places Market
- connects Sawmill → Market
- starts Lumber
- starts Sawmill
- starts Market sale
```

This gives you the first complete chain quickly:

```text
wood → plank → gold
```

And it teaches the core loop better than raw wood selling.

## Alternative: keep Lumber first, but add starter context

If you want to preserve “Lumber Camp is first,” then I would still avoid an empty start.

Example:

```text
Start with Lumber Camp already placed.
Player clicks once to start cutting wood.
After first wood:
- Build menu unlocks
After 5 wood:
- Tech tree unlocks
Market Access is free or costs 3 wood.
```

But this is less exciting than starting with a transformation node.

## Important design difference: Kingdom Inc makes the Shop free

That matters.

The shop is not a strategic purchase. It is part of onboarding. The player should not have to grind for the right to complete the first loop.

So for your game:

```text
Market Access should probably be free once discovered.
Market building may still cost gold/wood.
```

Or even:

```text
Market Access is free.
First Market is cheap.
```

The first sale loop should arrive very quickly.

## Worker slots as the first real economy goal

Kingdom Inc reveals automation almost immediately but prices it out of reach:

```text
Mine worker slot: 17S
Forge worker slot: 15S
Shop worker slot: 46S
Workers: around 9–10S each
```

That is good pacing. It says:

```text
You now understand the loop.
Here is how you escape manual operation.
Earn toward it.
```

For Node Kingdom, I would copy the structure:

```text
Early visible automation:
- Lumber Camp manager slot
- Sawmill manager slot
- Market manager slot

But only the first one is realistically affordable soon.
```

Example:

```text
Lumber Camp Manager Slot: 20 gold
Sawmill Manager Slot: 25 gold
Market Manager Slot: 50 gold

Lumber Manager: 10 gold
Sawmill Manager: 12 gold
Market Manager: 15 gold
```

The numbers are placeholders, but the relationship matters:

```text
first producer automation: cheapest
first crafter automation: slightly more
seller automation: expensive
```

That creates a first automation strategy.

## What I would change in your current direction

Based on this Kingdom Inc pacing, I would shift your first five minutes toward:

```text
1. Start with one placed transformation node.
2. Give it enough stored input for one action.
3. First action unlocks UI systems.
4. First producer is bought from Build Menu.
5. First seller is unlocked cheaply/free via Tech Tree.
6. Player creates a complete chain by minute 3–5.
7. Automation is visible by minute 5, but not yet bought.
```

This is stronger than making the player produce 5 wood before anything interesting happens.

## Suggested Node Kingdom opening

### Minute 0

```text
Placed node:
Sawmill

Stored inventory:
Wood: 2

Available recipe:
Plank
```

Player clicks:

```text
Start Plank
```

After timer completes:

```text
Produced 1 Plank
```

### Minute 1

Unlock:

```text
Build Menu
Tech Tree
```

Build Menu shows:

```text
Lumber Camp
```

Tech Tree shows:

```text
Market Access — Free
```

### Minute 2

Player buys Market Access.

Build Menu now shows:

```text
Lumber Camp
Market
```

Player places Lumber Camp and Market.

### Minute 3–5

Player connects:

```text
Lumber Camp → Sawmill
Sawmill → Market
```

Player runs:

```text
Cut Wood
Make Plank
Sell Plank
```

Now they have completed the first economic loop.

## First available upgrades

At that point, show:

```text
Lumber Management
Unlocks Lumber Camp manager slot

Workshop Routine
Unlocks Sawmill manager slot

Market Clerk
Unlocks Market manager slot

Mining
Unlocks Iron Mine
```

This mirrors Kingdom Inc:

```text
automation paths + next production branch
```

The player now has a meaningful choice:

```text
Automate current chain
or expand into mining
```

That is exactly the kind of early decision you want.

## First five-minute target for your game

By minute 5, the player should have seen:

```text
A node working
A resource transformed
A build menu
A tech tree
A producer placed
A seller placed
Two connectors
One sale
At least one visible automation upgrade
At least one visible next-node unlock
```

If your current version does not reach that by minute 5, Kingdom Inc is pacing faster.

## My recommendation

Borrow the **structure**, not the content.

Kingdom Inc’s first five minutes are strong because they establish:

```text
manual work
production chain
selling
automation aspiration
next expansion node
```

For Node Kingdom, I would tune toward:

```text
Sawmill-first tutorial
wood → plank → gold
then unlock lumber/market/mining/automation
```

That will probably feel better than starting purely from raw wood. It gives the player a taste of the full game immediately.
