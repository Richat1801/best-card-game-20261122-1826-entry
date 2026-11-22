// Boot and the one loop: input is read from clicks and keys, the duel
// advances through the state machine, and the renderer paints what is there.
// The Warden takes its turn action by action, with a short pause between
// each, so you can watch it think.
//
// ?seed=N fixes the duel's shuffle. ?shot=title|play|win|loss (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { createRandom } from './random.js';
import { attack, checkEnd, createDuel, endTurn, playCard, startDuel } from './state.js';
import { planTurn, runAction } from './ai.js';
import { createRenderer, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot, titleRulesHtml } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const state = createDuel(createRandom(seed));
const renderer = createRenderer();
const els = renderer.els;

let selection = null; // { handIndex, needsTarget } | { attackerUid } | null
let wardenTimer = null;

/** Tiny synthesized blips (WebAudio, no assets): a tick on a play, a low
 *  thud on damage, a bright arpeggio on the win. */
let audio = null;
function beep(frequency, seconds, type, gain) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(gain || 0.04, audio.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
    oscillator.connect(envelope);
    envelope.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + seconds);
  } catch {
    // Sound is garnish: a browser without audio still plays the duel.
  }
}

function paint() {
  renderer.draw(state, selection);
}

function showTitle() {
  state.screen = 'title';
  renderer.showOverlay(
    'title',
    'A duelling card battler',
    'EMBER COURT',
    'You sit across the green felt from the <b>Ashen Warden</b>. Twenty life each, one deck each, and the Court is watching.',
    titleRulesHtml(),
    'Take your seat ▶',
  );
  paint();
}

function showEnd() {
  const won = state.screen === 'win';
  const foeLife = Math.max(0, state.players[1].life);
  const myLife = Math.max(0, state.players[0].life);
  renderer.showOverlay(
    won ? 'win' : 'loss',
    won ? 'Victory · the Court is yours' : 'Defeat · the Warden holds the Court',
    won ? 'VICTORY!' : 'DEFEAT',
    won
      ? `The Ashen Warden bows at <b>${foeLife} life</b> — you still stand at <b>${myLife}</b>. The Ember Court applauds a duellist who reads the board.`
      : `The Warden leaves you at <b>${myLife} life</b> with <b>${foeLife}</b> of its own to spare. Study its guards, then deal again.`,
    `<b>Wins ${state.wins} · Losses ${state.losses}</b> — press <b>R</b> or the button below for a fresh duel.`,
    won ? 'Duel again ▶' : 'Demand a rematch ▶',
  );
  if (won) { beep(523, 0.18, 'triangle', 0.06); setTimeout(() => beep(659, 0.18, 'triangle', 0.06), 140); setTimeout(() => beep(784, 0.3, 'triangle', 0.06), 280); }
  paint();
}

function newDuel() {
  selection = null;
  clearTimeout(wardenTimer);
  state.round += 1;
  startDuel(state);
  renderer.hideOverlay();
  paint();
}

function maybeEnd() {
  checkEnd(state);
  if (state.screen === 'win' || state.screen === 'loss') showEnd();
}

/** The Warden's turn, one planned action at a time so the player sees it. */
function runWardenTurn() {
  if (state.screen !== 'play' || state.active !== 1) return;
  const actions = planTurn(state, 1);
  let index = 0;
  function step() {
    if (state.screen !== 'play' || state.active !== 1) return;
    if (index >= actions.length) {
      endTurn(state);
      paint();
      return;
    }
    const action = actions[index];
    index += 1;
    if (runAction(state, 1, action)) beep(action.type === 'attack' ? 180 : 320, 0.1, 'square', 0.03);
    paint();
    maybeEnd();
    if (state.screen === 'play' && state.active === 1) wardenTimer = setTimeout(step, 650);
  }
  wardenTimer = setTimeout(step, 700);
}

function endMyTurn() {
  if (state.screen !== 'play' || state.active !== 0) return;
  selection = null;
  endTurn(state);
  paint();
  maybeEnd();
  if (state.screen === 'play' && state.active === 1) runWardenTurn();
}

/** A click on one of my hand cards. */
function pickHand(index) {
  if (state.screen !== 'play' || state.active !== 0) return;
  const card = state.players[0].hand[index];
  if (!card) return;
  if (card.def.cost > state.players[0].mana) return;
  if (card.def.id === 'cinder-burst') {
    selection = { handIndex: index, needsTarget: true };
    paint();
    return;
  }
  if (card.def.kind === 'trick') {
    if (playCard(state, 0, index)) { beep(440, 0.12, 'triangle', 0.05); paint(); maybeEnd(); }
    return;
  }
  if (playCard(state, 0, index)) { beep(520, 0.1, 'triangle', 0.05); paint(); maybeEnd(); }
}

/** A click on a board creature (mine or the Warden's) or a trick target. */
function pickBoard(uid, mine) {
  if (state.screen !== 'play' || state.active !== 0) return;
  if (selection && selection.handIndex != null && selection.needsTarget) {
    const target = [...state.players[0].board, ...state.players[1].board].find((c) => c.uid === uid);
    if (target && playCard(state, 0, selection.handIndex, uid)) {
      beep(300, 0.15, 'sawtooth', 0.04);
      selection = null;
      paint();
      maybeEnd();
    }
    return;
  }
  if (mine) {
    const creature = state.players[0].board.find((c) => c.uid === uid);
    if (creature && creature.canAttack) {
      selection = selection && selection.attackerUid === uid ? null : { attackerUid: uid };
      paint();
    }
    return;
  }
  if (selection && selection.attackerUid != null) {
    if (attack(state, 0, selection.attackerUid, uid)) {
      beep(160, 0.15, 'square', 0.05);
      selection = null;
      paint();
      maybeEnd();
    }
  }
}

/** A click on the Warden's portrait: attack the face. */
function pickFace() {
  if (state.screen !== 'play' || state.active !== 0) return;
  if (selection && selection.attackerUid != null) {
    if (attack(state, 0, selection.attackerUid, 'face')) {
      beep(160, 0.15, 'square', 0.05);
      selection = null;
      paint();
      maybeEnd();
    }
  }
}

window.__emberPickHand = pickHand;
window.__emberPickBoard = pickBoard;

els.endTurn.addEventListener('click', endMyTurn);
els.foePortrait.addEventListener('click', pickFace);
els.overlayButton.addEventListener('click', () => {
  if (state.screen === 'title') {
    startDuel(state);
    renderer.hideOverlay();
    paint();
  } else {
    newDuel();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { selection = null; paint(); return; }
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (state.screen === 'title') { startDuel(state); renderer.hideOverlay(); paint(); }
    else if (state.screen === 'play') endMyTurn();
    return;
  }
  if (event.key === 'r' || event.key === 'R') {
    if (state.screen !== 'title') newDuel();
    return;
  }
  const digit = Number.parseInt(event.key, 10);
  if (digit >= 1 && digit <= 7) pickHand(digit - 1);
});

function runShot(name) {
  try {
    const scene = stageShot(name, state);
    if (name === 'title') {
      renderer.showOverlay(
        'title',
        'A duelling card battler',
        'EMBER COURT',
        'You sit across the green felt from the <b>Ashen Warden</b>. Twenty life each, one deck each, and the Court is watching.',
        titleRulesHtml(),
        'Take your seat ▶',
      );
    } else if (name === 'win') {
      showEnd();
    } else if (name === 'loss') {
      showEnd();
    }
    let painted = 0;
    (function paintTwice() {
      renderer.draw(state, null);
      painted += 1;
      if (painted < 2) requestAnimationFrame(paintTwice);
      else window.__shotReady = true;
    }());
  } catch (error) {
    const diag = document.getElementById('diag');
    if (diag) diag.textContent = `SHOT ERROR: ${error.message}`;
    window.__shotReady = true;
  }
}

window.addEventListener('error', (event) => {
  const diag = document.getElementById('diag');
  if (diag) diag.textContent = `PAGE ERROR: ${event.message}`;
});

if (shot) runShot(shot);
else showTitle();
