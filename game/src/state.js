// The duel itself: turns, mana, playing cards, combat, and the win/loss.
// Pure state logic — no DOM here — so the AI, the screenshot stager and the
// live game all play the same rules.
import { buildDeck, drawCards, resetUids } from './deck.js';

export const START_LIFE = 20;
export const MAX_MANA = 10;
export const MAX_BOARD = 6;

/** A fresh duel in its title state. */
export function createDuel(random) {
  resetUids();
  const players = [0, 1].map((index) => ({
    index,
    name: index === 0 ? 'You' : 'Ashen Warden',
    life: START_LIFE,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(random),
    hand: [],
    board: [],
  }));
  return {
    random,
    screen: 'title',
    turn: 0,
    active: 0,
    players,
    log: [],
    winner: null,
    wins: 0,
    losses: 0,
    round: 1,
  };
}

/** Log a line for the battle log (foe lines render in the Warden's colour). */
export function logLine(state, text, foe) {
  state.log.push({ text, foe: !!foe });
  if (state.log.length > 40) state.log.shift();
}

function heal(state, player, amount) {
  player.life = Math.min(START_LIFE, player.life + amount);
}

function damageCreature(state, owner, creature, amount) {
  creature.hp -= amount;
  if (creature.hp <= 0) {
    owner.board = owner.board.filter((c) => c.uid !== creature.uid);
    logLine(state, `☠ ${creature.def.name} falls.`, owner.index === 1);
  }
}

/** Deal with the dead on both boards after any damage step. */
function sweepDead(state) {
  for (const player of state.players) {
    for (const creature of [...player.board]) {
      if (creature.hp <= 0) damageCreature(state, player, creature, 0);
    }
  }
}

/** Deal the opening hands and start turn 1. */
export function startDuel(state) {
  state.screen = 'play';
  state.turn = 1;
  state.active = 0;
  state.winner = null;
  state.log = [];
  for (const player of state.players) {
    player.life = START_LIFE;
    player.mana = 0;
    player.maxMana = 0;
    player.deck = buildDeck(state.random);
    player.hand = [];
    player.board = [];
    drawCards(player.deck, player.hand, 3);
  }
  beginTurn(state, 0);
  logLine(state, 'The duel begins — the Ember Court is watching.');
}

/** Open a player's turn: mana grows, a card is drawn, creatures ready. */
export function beginTurn(state, playerIndex) {
  const player = state.players[playerIndex];
  state.active = playerIndex;
  player.maxMana = Math.min(MAX_MANA, state.turn);
  player.mana = player.maxMana;
  for (const creature of player.board) creature.canAttack = true;
  const fatigue = drawCards(player.deck, player.hand, 1);
  if (fatigue > 0) {
    player.life -= fatigue;
    logLine(state, `📜 ${player.name} draws from an empty deck and takes ${fatigue} fatigue.`, playerIndex === 1);
  }
  logLine(state, `${player.name} begins turn ${state.turn} — ${player.mana} mana.`, playerIndex === 1);
  checkEnd(state);
}

/** End the active player's turn and open the next player's. */
export function endTurn(state) {
  if (state.screen !== 'play') return;
  const next = 1 - state.active;
  if (next === 0) state.turn += 1;
  beginTurn(state, next);
}

function isGuard(creature) {
  return creature.def.ability === 'guard';
}

/** The enemy creatures the attacker is allowed to strike (guards first). */
export function legalTargets(state, attackerIndex) {
  const foe = state.players[1 - attackerIndex];
  const guards = foe.board.filter(isGuard);
  return guards.length > 0 ? guards : foe.board;
}

/** Play the card at `handIndex` from a player's hand. `targetUid` names a
 *  creature for tricks that need one. Returns true when the card was played. */
export function playCard(state, playerIndex, handIndex, targetUid) {
  const player = state.players[playerIndex];
  const foe = state.players[1 - playerIndex];
  const card = player.hand[handIndex];
  if (!card || state.screen !== 'play' || state.active !== playerIndex) return false;
  if (card.def.cost > player.mana) return false;
  if (card.def.kind === 'creature' && player.board.length >= MAX_BOARD) return false;
  if (card.def.id === 'cinder-burst' && targetUid == null) return false;
  if (card.def.id === 'cinder-burst') {
    const target = [...player.board, ...foe.board].find((c) => c.uid === targetUid);
    if (!target) return false;
  }
  player.hand.splice(handIndex, 1);
  player.mana -= card.def.cost;
  if (card.def.kind === 'creature') {
    card.canAttack = card.def.ability === 'swift';
    card.justPlayed = true;
    player.board.push(card);
    logLine(state, `${player.name} summons <b>${card.def.name}</b> (${card.atk}/${card.hp}).`, playerIndex === 1);
    if (card.def.ability === 'scorch') {
      for (const enemy of [...foe.board]) damageCreature(state, foe, enemy, 1);
      logLine(state, `🔥 ${card.def.name} scorches every enemy creature for 1.`, playerIndex === 1);
    }
  } else {
    resolveTrick(state, player, foe, card, targetUid);
  }
  sweepDead(state);
  checkEnd(state);
  return true;
}

function resolveTrick(state, player, foe, card, targetUid) {
  if (card.def.id === 'cinder-burst') {
    const target = [...player.board, ...foe.board].find((c) => c.uid === targetUid);
    const owner = foe.board.includes(target) ? foe : player;
    logLine(state, `💥 ${player.name} hurls Cinder Burst at <b>${target.def.name}</b> for 3.`, player.index === 1);
    damageCreature(state, owner, target, 3);
  } else if (card.def.id === 'mend-hearth') {
    heal(state, player, 6);
    logLine(state, `❤️ ${player.name} mends the hearth and restores 6 life.`, player.index === 1);
  } else if (card.def.id === 'sudden-gale') {
    drawCards(player.deck, player.hand, 2);
    logLine(state, `🌬️ ${player.name} catches a Sudden Gale and draws 2 cards.`, player.index === 1);
  } else if (card.def.id === 'quench') {
    for (const enemy of [...foe.board]) damageCreature(state, foe, enemy, 2);
    logLine(state, `🌊 ${player.name} quenches every enemy creature for 2.`, player.index === 1);
  }
}

/** One creature strikes another creature or the enemy hero ('face'). */
export function attack(state, playerIndex, attackerUid, target) {
  const player = state.players[playerIndex];
  const foe = state.players[1 - playerIndex];
  const attacker = player.board.find((c) => c.uid === attackerUid);
  if (!attacker || !attacker.canAttack || state.screen !== 'play' || state.active !== playerIndex) return false;
  if (target === 'face') {
    const guards = foe.board.filter(isGuard);
    if (guards.length > 0) return false;
    foe.life -= attacker.atk;
    if (attacker.def.ability === 'drain') heal(state, player, attacker.atk);
    logLine(state, `⚔️ <b>${attacker.def.name}</b> strikes ${foe.name} for ${attacker.atk}.`, playerIndex === 1);
  } else {
    const defender = foe.board.find((c) => c.uid === target);
    if (!defender) return false;
    const guards = foe.board.filter(isGuard);
    if (guards.length > 0 && !isGuard(defender)) return false;
    defender.hp -= attacker.atk;
    attacker.hp -= defender.atk;
    if (attacker.def.ability === 'drain') heal(state, player, attacker.atk);
    logLine(state, `⚔️ <b>${attacker.def.name}</b> (${attacker.atk}) trades with <b>${defender.def.name}</b> (${defender.atk}).`, playerIndex === 1);
    sweepDead(state);
  }
  attacker.canAttack = false;
  sweepDead(state);
  checkEnd(state);
  return true;
}

/** Settle the duel when a life total reaches zero. */
export function checkEnd(state) {
  if (state.screen !== 'play') return;
  const [me, foe] = state.players;
  if (foe.life <= 0 && me.life <= 0) {
    state.winner = 0;
    state.screen = 'win';
  } else if (foe.life <= 0) {
    state.winner = 0;
    state.screen = 'win';
    state.wins += 1;
    logLine(state, '🏆 The Ashen Warden bows. The Court is yours!');
  } else if (me.life <= 0) {
    state.winner = 1;
    state.screen = 'loss';
    state.losses += 1;
    logLine(state, '💀 The Ashen Warden takes the Court… this time.');
  }
}
