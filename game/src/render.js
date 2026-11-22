// Painting the duel: hands, boards, life and mana totals, the log, and the
// title / win / loss overlays. Everything is DOM — cards are real elements,
// so they stay legible at thumbnail size.
import { COURT } from './cards.js';
import { legalTargets } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const $ = (id) => document.getElementById(id);

function manaPips(element, mana, maxMana) {
  let html = '';
  for (let i = 0; i < maxMana; i += 1) {
    html += `<span class="pip${i < mana ? '' : ' spent'}">◆</span>`;
  }
  html += `<span class="mana-num">${mana}/${maxMana}</span>`;
  element.innerHTML = html;
}

/** One card element: cost gem, court mark (colour AND shape), art, name,
 *  ability text, attack and health pips. */
export function cardElement(card, options) {
  const def = card.def;
  const court = COURT[def.court];
  const el = document.createElement('div');
  el.className = `card court-${def.court}${def.kind === 'trick' ? ' spell' : ''}`;
  if (options) {
    if (options.playable) el.classList.add('playable');
    if (options.selected) el.classList.add('selected');
    if (options.ready) el.classList.add('ready', 'can-attack');
    if (options.attackable) el.classList.add('attackable');
    if (options.exhausted) el.classList.add('exhausted');
    if (options.justPlayed) el.classList.add('just-played');
  }
  el.dataset.uid = String(card.uid);
  const stats = def.kind === 'creature'
    ? `<div class="stats"><span class="atk">⚔${card.atk}</span><span class="hp${card.hp < card.maxHp ? ' hurt' : ''}">♥${card.hp}</span></div>`
    : '';
  el.innerHTML = `<span class="cost">${def.cost}</span>`
    + `<span class="court-mark" title="${court.name}">${court.glyph}</span>`
    + `<span class="court-name">${court.name} ${def.kind === 'trick' ? '· Trick' : ''}</span>`
    + `<div class="art">${def.art}</div>`
    + `<div class="name">${def.name}</div>`
    + `<div class="ability">${def.abilityText}</div>`
    + stats;
  return el;
}

function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card-back';
  el.textContent = '♜';
  return el;
}

export function createRenderer() {
  const els = {
    foeLife: $('foe-life'), myLife: $('my-life'),
    foeMana: $('foe-mana'), myMana: $('my-mana'),
    foeDeck: $('foe-deck-count'), myDeck: $('my-deck-count'),
    foeHand: $('foe-hand'), myHand: $('my-hand'),
    foeBoard: $('foe-board'), myBoard: $('my-board'),
    log: $('log'), turnLabel: $('turn-label'), endTurn: $('end-turn'),
    hint: $('hint'), wins: $('wins'), losses: $('losses'), round: $('round-label'),
    overlay: $('overlay'), overlayKicker: $('overlay-kicker'),
    overlayTitle: $('overlay-title'), overlayText: $('overlay-text'),
    overlayRules: $('overlay-rules'), overlayButton: $('overlay-button'),
    foePortrait: $('foe-portrait'), myPortrait: $('my-portrait'),
  };

  /** Paint the whole table for `state`, given the player's current selection
   *  ({attackerUid} or {handIndex, needsTarget}) and whose turn it is. */
  function draw(state, selection) {
    const [me, foe] = state.players;
    els.foeLife.textContent = String(Math.max(0, foe.life));
    els.myLife.textContent = String(Math.max(0, me.life));
    els.foeLife.classList.toggle('low', foe.life <= 6);
    els.myLife.classList.toggle('low', me.life <= 6);
    manaPips(els.foeMana, foe.mana, foe.maxMana);
    manaPips(els.myMana, me.mana, me.maxMana);
    els.foeDeck.textContent = String(foe.deck.length);
    els.myDeck.textContent = String(me.deck.length);
    els.wins.textContent = `Wins ${state.wins}`;
    els.losses.textContent = `Losses ${state.losses}`;
    els.round.textContent = `Round ${state.round} · Turn ${Math.max(1, state.turn)}`;

    const myTurn = state.screen === 'play' && state.active === 0;
    els.turnLabel.textContent = state.screen === 'play'
      ? (myTurn ? 'YOUR TURN' : 'WARDEN’S TURN…') : 'EMBER COURT';
    els.turnLabel.classList.toggle('foe', !myTurn);
    els.endTurn.disabled = !myTurn;

    // Opponent hand: face-down backs only — you read the Warden by its board.
    els.foeHand.replaceChildren();
    for (let i = 0; i < foe.hand.length; i += 1) els.foeHand.appendChild(cardBackElement());

    // Boards, with empty slots so the table keeps its shape.
    paintBoard(els.foeBoard, foe.board, state, selection, false);
    paintBoard(els.myBoard, me.board, state, selection, true);

    // Your hand: playable cards glow; a selected card lifts.
    els.myHand.replaceChildren();
    me.hand.forEach((card, index) => {
      const playable = myTurn && card.def.cost <= me.mana
        && (card.def.kind !== 'creature' || me.board.length < 6)
        && !(card.def.id === 'cinder-burst' && state.players[0].board.length + foe.board.length === 0);
      const el = cardElement(card, {
        playable,
        selected: selection && selection.handIndex === index,
      });
      el.addEventListener('click', () => window.__emberPickHand(index));
      els.myHand.appendChild(el);
    });

    // Portraits are attack targets (the face) when a creature is selected.
    const guards = foe.board.filter((c) => c.def.ability === 'guard');
    els.foePortrait.classList.toggle('targetable', !!(selection && selection.attackerUid && guards.length === 0));
    els.foePortrait.classList.toggle('guard-blocked', !!(selection && selection.attackerUid && guards.length > 0));

    // Log, newest at the bottom.
    els.log.innerHTML = state.log.slice(-4).map((line) => `<div class="${line.foe ? 'foe-line' : ''}">${line.text}</div>`).join('');
    els.hint.textContent = selection && selection.attackerUid
      ? 'Now click an enemy creature — or the Warden’s portrait — to strike.'
      : selection && selection.handIndex != null && selection.needsTarget
        ? 'Cinder Burst needs a target — click any creature.'
        : myTurn ? 'Click a card to play it · click a creature, then a target, to attack'
        : 'The Warden is thinking…';
  }

  function paintBoard(container, board, state, selection, mine) {
    container.replaceChildren();
    const attackable = selection && selection.attackerUid && !mine
      ? legalTargets(state, 0).map((c) => c.uid) : [];
    const myTurn = state.screen === 'play' && state.active === 0;
    for (const card of board) {
      const el = cardElement(card, {
        ready: mine && myTurn && card.canAttack,
        selected: selection && selection.attackerUid === card.uid,
        attackable: attackable.includes(card.uid),
        exhausted: mine && myTurn && !card.canAttack,
        justPlayed: card.justPlayed,
      });
      el.addEventListener('click', () => window.__emberPickBoard(card.uid, mine));
      container.appendChild(el);
    }
    for (let i = board.length; i < 3; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'board-slot';
      slot.textContent = mine ? 'YOUR CREATURES' : 'WARDEN’S CREATURES';
      container.appendChild(slot);
    }
  }

  function showOverlay(kind, kicker, title, text, rulesHtml, buttonLabel) {
    els.overlay.className = kind === 'title' ? '' : kind;
    els.overlay.classList.remove('hidden');
    els.overlayKicker.textContent = kicker;
    els.overlayTitle.textContent = title;
    els.overlayText.innerHTML = text;
    els.overlayRules.innerHTML = rulesHtml;
    els.overlayButton.textContent = buttonLabel;
  }

  function hideOverlay() {
    els.overlay.classList.add('hidden');
  }

  return { draw, showOverlay, hideOverlay, els };
}
