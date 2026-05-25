Yes. The first 10 and 25 minutes should be designed as **a transition from manual survival to the first controlled automation**, while preparing the player for later military production without exposing the fighting loop too early.

## Core framing

The opening should teach three things:

```text
1. Nodes produce, store, and transfer resources.
2. Tech unlocks new economic capability.
3. Automation is earned, not given.
```

The later fighting loop should not feel like a different game. It should feel like the same production-and-connector system applied to military output:

```text
wood → planks → weapons / gear
people → conscripts
conscripts + equipment → fighting force
fighting force → battle node
battle node → rewards / risk / territory / prestige
```

So the foundation now should be: **everything is a node, and every system consumes and outputs something.**

---

# First 10 minutes

## Goal of the first 10 minutes

The player should understand the basic economy and unlock the Market.

The first 10 minutes should feel like:

```text
I start with manual wood production.
I discover trade.
I build a Market.
I connect Lumber Camp to Market.
I sell wood slowly.
I see the next economy opening.
```

## Available at start

Only:

```text
Lumber Camp
```

The player starts with enough gold to place one or two Lumber Camps, but not enough to ignore the economy.

Recommended starting state:

```text
Gold: 10–15
Unlocked: Lumber Camp only
No Market yet
No tech tree overload
```

If starting gold is 25, the early game may feel too loose unless later costs are tuned around it.

## First actions

The player places a Lumber Camp and manually works it.

Manual work should not feel like grinding yet. It should be short and tactile.

Recommended early value:

```text
Base manual work required: 5 clicks, not 10
```

You can later increase complexity, but for minute 1–3, 10 clicks per wood may feel punishing.

Alternative:

```text
Lumber Camp starts at 5 clicks.
Other nodes use 10 clicks.
```

That makes the opening smoother without weakening later progression.

## First threshold

After producing 5 wood:

```text
Goal completed: First Timber
Tech revealed: Market Access
```

The player should immediately understand:

```text
Wood is not only a product.
Wood is also a progression resource.
```

## Market Access

Market Access should cost wood, not gold:

```text
Cost: 5 wood
Unlocks: Market
```

This reinforces the idea that production unlocks progression.

## Market moment

The Market is the first major “aha” moment:

```text
I can now turn goods into gold.
```

But selling should still require manual work at this stage:

```text
Lumber Camp produces wood manually.
Connection transfers wood automatically.
Market sells wood manually.
```

This teaches that transfer is automatic, but production/selling are initially labor-bound.

## Engagement until automation

Before automation, engagement comes from **short visible milestones**, not from waiting.

Use three early goals:

```text
First Timber
Produce 5 wood.
Reward: small gold bonus.

Open Trade
Research Market Access.
Reward: small gold bonus.

First Sales
Earn 10 lifetime gold through Market sales.
Reward: unlock hint toward Mining / Woodworking.
```

The player should always see one achievable next step.

---

# First 25 minutes

## Goal of the first 25 minutes

The player should move from a simple wood economy into a branching production economy and approach the first automation.

A good first 25-minute arc:

```text
0–5 min: Wood production
5–10 min: Market and gold
10–18 min: Mining / Woodworking branch
18–25 min: First automation unlock
```

## Suggested progression

### Minute 0–5: Manual wood economy

```text
Place Lumber Camp
Work Lumber Camp
Produce 5 wood
Unlock Market Access
```

### Minute 5–10: Trade economy

```text
Place Market
Connect Lumber → Market
Sell wood
Earn first gold
Reveal Mining and Woodworking
```

### Minute 10–18: First branching decision

After earning some gold, reveal:

```text
Mining
Woodworking
Storage Bins
```

This creates the first real choice:

```text
Mining = new raw resource path
Woodworking = process wood into planks
Storage Bins = improve flow stability
```

The choice does not need to be deeply strategic yet. It only needs to show that the game is opening.

### Minute 18–25: First automation

This is when I would make the **first automation available**.

Not at minute 5. That is too early; the player has not yet felt the manual constraint.

Not at minute 45. That is too late; manual clicking will become fatigue.

Best target:

```text
First automation becomes reachable around minute 20.
```

## What should the first automation be?

I would not start with full automation. Start with a **manager slot for one node type** or one node instance.

Example:

```text
Tech: Lumber Management
Unlocks: 1 Manager Slot for Lumber Camps
Cost: gold + wood
```

Then the player can hire a manager on one Lumber Camp.

The first manager should do:

```text
+1 work progress per tick
```

This means the node becomes slowly automatic, but manual clicking can still accelerate it.

That is excellent for engagement because it creates a hybrid phase:

```text
The manager keeps production moving.
The player can still intervene to speed things up.
```

## First automation unlock requirements

I would make it require demonstrated use of the first economy:

```text
Visible when:
- lifetimeProduced wood >= 20
- lifetimeEarned gold >= 15

Cost:
- 20 wood
- 20 gold
```

Or if you want it slightly later:

```text
Requires:
- Market Access
- Woodworking

Visible when:
- lifetimeProduced plank >= 3

Cost:
- 25 gold
- 10 plank
```

My recommendation: first automation should be after Market + before Blacksmith.

That means automation arrives when the player has understood manual work, but before the economy becomes too wide.

---

# First big goal, without contracts

The first big goal should not be “earn X gold.” That is too abstract.

It should be a **milestone object** that proves the player has built a functioning economy.

Best candidate:

```text
Build the First Outpost
```

## First Big Goal: Build the First Outpost

The Outpost does not need to be a full gameplay system yet. It can be a milestone / special unlock.

Requirements:

```text
Produce:
- 30 wood
- 10 planks
- 10 iron ore
- 3 iron bars

Have earned:
- 50 lifetime gold

Unlock:
- School / Knowledge Production
or
- Conscription Camp teaser
or
- larger map expansion
```

This goal is better than a contract because it is internally motivated:

```text
We are not fulfilling an external order.
We are developing the kingdom.
```

It also prepares the future fighting loop. An Outpost can later become the first military-adjacent node.

Alternative names:

```text
First Outpost
Village Hall
Trade Post
Guard Post
Frontier Camp
Kingdom Foundation
```

I like **First Outpost** because it naturally leads toward fighting later.

---

# Preparing now for fighting

Your fighting idea fits the current system very well if you treat military as another production graph.

The key is: **do not make fighting a separate interface with separate rules.**

Use the same node logic:

```text
output node → input node
resource queues
work progress
storage
recipes
tech unlocks
addons
managers
```

## Military production loop

Future chain:

```text
Conscription Camp
→ produces Conscripts

Blacksmith
→ produces Swords

Armorer
→ produces Armor

Apothecary
→ produces Tonics

Training Yard
→ consumes Conscripts + Equipment
→ produces Equipped Soldiers

Battle Node
→ consumes Equipped Soldiers
→ produces Victory / Loot / Reputation / Territory
```

This is elegant because the same connector logic works.

## Important distinction: people vs goods

Conscripts are “resources,” but conceptually they are people. Mechanically, I would still model them as resources:

```json
"conscript": {
  "label": "Conscript",
  "icon": "🧍"
}
```

But design-wise, do not sell conscripts in the Market. The Market should only accept trade goods.

This means your current correction — seller accepts only `sellPrices` resources — is exactly the right preparation.

## Future military node types

### Conscription Camp

```text
Kind: producer
Output: conscript
Input: maybe gold or food later
Manual/managed work required
```

Early version:

```text
No inputs
Produces 1 conscript
Slow work
```

Later version:

```text
Consumes gold / bread / reputation
Produces conscripts
```

### Training Yard

```text
Kind: crafter
Inputs:
- conscript
- sword
Output:
- armed_conscript
```

Later recipes:

```text
conscript + sword → armed_conscript
conscript + sword + armor → soldier
conscript + steel_sword + armor + tonic → veteran
```

### Battle Camp / Battle Node

```text
Kind: seller-like sink, but not market
Consumes fighting units
Produces rewards
```

It should not be called seller internally unless the behavior is truly the same. Conceptually it is a **converter/sink**:

```text
input: soldier
output: loot / reputation / territory progress
```

For now, the engine may model it like a crafter:

```text
soldier → victory_points
```

But long-term, battle probably needs special behavior:

```text
chance of loss
enemy strength
duration
reward table
```

So prepare for a new kind later:

```text
kind: "encounter" or "battle"
```

Do not implement it yet. Just avoid assumptions that all sinks are markets.

---

# Design preparation now

To prepare for fighting without implementing it, add these principles to the content model mentally now:

## 1. Not every resource is sellable

You already support this through Market `sellPrices`.

Good.

## 2. Not every sink is a Market

Later you will need:

```text
seller = converts goods to gold
battle = converts units/equipment to combat outcome
contract = consumes requested goods for reward
```

They are all sinks, but with different rules.

So avoid coding “sink = seller.”

## 3. Resources need categories later

Eventually items may need tags:

```json
{
  "sword": {
    "label": "Sword",
    "icon": "🗡️",
    "tags": ["trade_good", "weapon"]
  },
  "conscript": {
    "label": "Conscript",
    "icon": "🧍",
    "tags": ["unit"]
  },
  "knowledge": {
    "label": "Knowledge",
    "icon": "📜",
    "tags": ["currency", "science"]
  }
}
```

No need to implement this now, but it will help later.

## 4. Recipe outputs should support “unit resources”

No special system needed at first. Conscripts, soldiers, armor, tonics can all be resources.

The important part is whether a node accepts/sells/uses them.

---

# Recommended first-25-minute structure

```text
0 min
Only Lumber Camp available.

1–3 min
Place Lumber Camp. Manually produce wood.

3–5 min
First Timber goal. Market Access revealed.

5–8 min
Research Market Access. Place Market.

8–12 min
Connect Lumber → Market. Sell wood. Earn first gold.

12–18 min
Mining and Woodworking become available.
Player unlocks at least one new production branch.

18–22 min
First processed good appears: Plank or Iron Ore.

22–25 min
First automation becomes available:
Lumber Management / Manager Slot.
Player hires first manager or sees it as the next clear target.
```

## First big goal by minute 25

The player should see, but not necessarily complete:

```text
First Outpost
Requires wood, planks, ore, iron bars, and gold.
```

This goal becomes the bridge to the next phase.

Completion later unlocks one of:

```text
School
or Conscription Camp teaser
or Guard Post
or Territory map
```

My preferred chain:

```text
First Outpost
→ unlocks School
→ Knowledge
→ Management
→ later unlocks Conscription
```

This makes fighting feel like kingdom development, not a random combat minigame.

---

# Practical decision recommendations

## First automation timing

```text
Reveal around minute 18–20.
Affordable around minute 22–25.
```

## First automation type

```text
One manager slot for Lumber Camp.
Manager adds passive work progress per tick.
Manual clicking still helps.
```

## Engagement before automation

Use:

```text
small goals
visible thresholds
short manual cycles
new node unlocks
first connection
first sale
first branch choice
```

Do not rely on long waiting.

## First big goal

```text
Build the First Outpost
```

It should require multiple early production chains, but no contracts.

## Fighting preparation

Do not implement fighting yet. Prepare by keeping the model general:

```text
resources can be goods, knowledge, or units
sinks can be markets, battles, or contracts
nodes can consume units and equipment through recipes
battle should later be another node type, not a separate screen-first system
```

## Immediate next design move

Before coding fighting, add only one concept to the long-term content vocabulary:

```text
resource tags
```

Not necessarily implemented now, but planned.

Examples:

```text
trade_good
currency
science
unit
weapon
armor
consumable
military
```

That will make the later combat loop much easier to integrate cleanly.
