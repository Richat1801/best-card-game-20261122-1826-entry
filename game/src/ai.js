// The Ashen Warden's brain: a readable, counterable opponent. It plays its
// biggest affordable cards first, spends its mana, trades up when a creature
// can kill something worth more than itself, and goes for the face when the
// board is clear — so a player can read it: guards stop it cold, and a big
// creature on your side makes it think twice about attacking face.
import { legalTargets, playCard, attack } from './state.js';

/** Value a creature by its stats, so the Warden trades up, not down. */
export function creatureValue(creature) {
  let value = creature.atk + creature.hp;
  if (creature.def.ability === 'guard') value += 1.5;
  if (creature.def.ability === 'drain') value += 1;
  if (creature.def.ability === 'swift') value += 0.5;
  if (creature.def.ability === 'scorch') value += 1;
  return value;
}

/** The Warden's whole turn as a list of actions the live game (or the
 *  screenshot stager) can run one by one: plays, then attacks. */
export function planTurn(state, playerIndex) {
  const actions = [];
  const player = state.players[playerIndex];
  const foe = state.players[1 - playerIndex];
  const hand = [...player.hand];
  // Play cards: tricks first when they are clearly good, then creatures
  // biggest-first, while the mana lasts.
  for (const card of hand) {
    if (card.def.id === 'mend-hearth' && player.life <= 12) {
      actions.push({ type: 'play', cardUid: card.uid });
    }
  }
  for (const card of hand) {
    if (card.def.id === 'sudden-gale') actions.push({ type: 'play', cardUid: card.uid });
  }
  for (const card of hand) {
    if (card.def.id === 'cinder-burst') {
      const prey = [...foe.board].sort((a, b) => creatureValue(b) - creatureValue(a))[0];
      if (prey && prey.hp <= 3) actions.push({ type: 'play', cardUid: card.uid, targetUid: prey.uid });
    }
  }
  for (const card of hand) {
    if (card.def.id === 'quench' && foe.board.length >= 2) {
      actions.push({ type: 'play', cardUid: card.uid });
    }
  }
  const creatures = hand
    .filter((card) => card.def.kind === 'creature')
    .sort((a, b) => b.def.cost - a.def.cost);
  for (const card of creatures) actions.push({ type: 'play', cardUid: card.uid });
  // Attacks: each ready creature trades up against a weaker foe, or goes
  // face when the board is clear of guards.
  const ready = [...player.board].filter((c) => c.canAttack);
  for (const creature of ready) {
    const targets = legalTargets(state, playerIndex);
    if (targets.length === 0) {
      actions.push({ type: 'attack', attackerUid: creature.uid, target: 'face' });
      continue;
    }
    const prey = targets
      .filter((t) => t.hp <= creature.atk && creatureValue(t) >= creatureValue(creature) - 1)
      .sort((a, b) => creatureValue(b) - creatureValue(a))[0];
    if (prey) actions.push({ type: 'attack', attackerUid: creature.uid, target: prey.uid });
    else if (creature.atk >= 4 && !targets.some((t) => t.def.ability === 'guard')) {
      actions.push({ type: 'attack', attackerUid: creature.uid, target: 'face' });
    } else if (foe.board.length === 0) {
      actions.push({ type: 'attack', attackerUid: creature.uid, target: 'face' });
    }
  }
  return actions;
}

/** Run one planned action against the live state. Returns false when the
 *  action no longer applies (a card already spent, a creature already dead). */
export function runAction(state, playerIndex, action) {
  if (action.type === 'play') {
    const handIndex = state.players[playerIndex].hand.findIndex((c) => c.uid === action.cardUid);
    if (handIndex < 0) return false;
    return playCard(state, playerIndex, handIndex, action.targetUid);
  }
  if (action.type === 'attack') {
    return attack(state, playerIndex, action.attackerUid, action.target);
  }
  return false;
}

/** A quick autopilot for both sides, used only to stage screenshot scenes:
 *  play and attack with the same plan, no delays. */
export function autopilotTurn(state, playerIndex) {
  for (const action of planTurn(state, playerIndex)) {
    runAction(state, playerIndex, action);
    if (state.screen !== 'play') break;
  }
}
