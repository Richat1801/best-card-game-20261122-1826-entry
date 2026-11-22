// Deck building, shuffling and drawing for Ember Court.
import { DECK_LIST, defById } from './cards.js';

let nextUid = 1;

/** At most this many cards in a hand; a draw past it burns the card. */
export const MAX_HAND = 7;

/** A live card in a hand, on a board or in a deck: a definition plus its
 *  current attack/health, whether it may attack, and a stable uid. */
export function makeCard(defId) {
  const def = defById(defId);
  return {
    uid: nextUid++,
    def,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    maxHp: def.hp ?? 0,
    canAttack: false,
    justPlayed: false,
  };
}

/** A fresh shuffled 30-card deck from the shared list. */
export function buildDeck(random) {
  const deck = DECK_LIST.map((id) => makeCard(id));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = random.int(i + 1);
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

/** Draw `count` cards from `deck` into `hand`; an empty deck deals fatigue
 *  (1 damage to its owner) instead of a card. Returns the fatigue taken. */
export function drawCards(deck, hand, count) {
  let fatigue = 0;
  for (let i = 0; i < count; i += 1) {
    const card = deck.pop();
    if (!card) { fatigue += 1; continue; }
    if (hand.length < MAX_HAND) hand.push(card);
  }
  return fatigue;
}

/** The next uid, so replays of one seed keep the same card identities. */
export function resetUids() {
  nextUid = 1;
}
