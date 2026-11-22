[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Richat1801/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Richat1801/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Court — a duelling card battler

A complete original card game for the
[best-card-game-20261122-1826](https://make.fun/bounty/best-card-game-20261122-1826)
bounty on [make.fun](https://make.fun). It runs offline in a desktop browser from its own static
files — no network, no external assets. Referral: https://make.fun/r/dss38k9p

You sit across the green felt from the **Ashen Warden**. Twenty life each, one deck each,
mana that grows every turn — play creatures and tricks from your hand, then attack with the
creatures that are ready. First to reduce the rival to 0 life takes the Court.

## How to play

- **Click a card** in your hand to play it (if you can pay its mana cost).
- **Click one of your ready creatures**, then click an enemy creature — or the Warden's
  portrait — to attack. **Guard** creatures must be struck first.
- **End Turn** button or **Space**. **1–7** play a hand card. **R** starts a fresh duel.
  **Esc** cancels a selection.

## The four courts

Every card belongs to a court, told apart by colour **and** shape: **▲ Ember** (fire),
**● Tide** (water), **◆ Thorn** (leaf), **✦ Gale** (wind).

- **Guard** — foes must strike it first. **Swift** — attacks the turn it is played.
- **Drain** — heals you for the damage it deals. **Scorch** — 1 damage to every enemy
  creature on arrival.
- Tricks: **Cinder Burst** (3 damage to a creature), **Mend the Hearth** (restore 6 life),
  **Sudden Gale** (draw 2), **Quench** (2 damage to every enemy creature).

The Warden plays its biggest cards first, trades up when a creature can kill something
worth more than itself, and goes for your face when the board is clear — so you can read
it: guards stop it cold, and a big creature on your side makes it think twice.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

Or open `game/index.html` from any static server. `?seed=N` fixes the shuffle;
`?shot=title|play|win|loss` stages a screenshot scene.
