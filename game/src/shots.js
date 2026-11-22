// The staged screenshot scenes behind ?shot=title|play|win|loss. Each one
// plays the real rules forward from a fresh duel with a fixed seed, steered
// by the same autopilot both sides use in a live game, so every frame is
// what a short duel really looks like — and the same seed always gives the
// same frame.
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { autopilotTurn } from './ai.js';
import { createDuel, endTurn, startDuel } from './state.js';
import { createRandom } from './random.js';

/** Play `turns` full rounds (both sides) of autopilot duel. */
function playRounds(state, turns) {
  for (let turn = 0; turn < turns; turn += 1) {
    if (state.screen !== 'play') break;
    autopilotTurn(state, 0);
    if (state.screen !== 'play') break;
    endTurn(state);
    if (state.screen !== 'play') break;
    autopilotTurn(state, 1);
    if (state.screen !== 'play') break;
    endTurn(state);
  }
}

/** How good a frame is as the mid-game shot: full boards on both sides and
 *  life totals that have moved. */
function frameScore(state) {
  if (state.screen !== 'play') return -1;
  const [me, foe] = state.players;
  const damage = (20 - me.life) + (20 - foe.life);
  return Math.min(me.board.length, 3) + Math.min(foe.board.length, 3) + Math.min(damage, 6) / 3;
}

/** The best mid-game frame among a few fixed seeds: the same seeds always
 *  give the same frame. */
function bestMidGame() {
  let best = null;
  let bestScore = -1;
  for (const seed of [123, 2026, 42, 999, 7, 31337]) {
    const duel = createDuel(createRandom(seed));
    startDuel(duel);
    playRounds(duel, 6);
    if (duel.screen === 'play' && duel.active !== 0) endTurn(duel);
    const score = frameScore(duel);
    if (score > bestScore) { bestScore = score; best = duel; }
    if (bestScore >= 7) break;
  }
  return best;
}

/**
 * Set `state` to the named scene and return the screen to draw over it.
 * title: a fresh table behind the title overlay. play: a mid-duel table with
 * both boards full and life totals moved. win: the Warden at 0 life.
 * loss: you at 0 life. Any other name is the title.
 */
export function stageShot(name, state) {
  if (name === 'play') {
    const frame = bestMidGame();
    Object.assign(state, frame);
    return { screen: SCREEN_PLAY };
  }
  startDuel(state);
  if (name === 'win') {
    playRounds(state, 5);
    state.players[1].life = 0;
    state.screen = 'win';
    state.winner = 0;
    state.wins += 1;
    return { screen: SCREEN_WIN };
  }
  if (name === 'loss') {
    playRounds(state, 5);
    state.players[0].life = 0;
    state.screen = 'loss';
    state.winner = 1;
    state.losses += 1;
    return { screen: SCREEN_LOSS };
  }
  return { screen: SCREEN_TITLE };
}

/** The title overlay's rules, shared by the live game and the title shot. */
export function titleRulesHtml() {
  return `<b>Reduce the Ashen Warden from 20 life to 0 to win.</b><br>
    Each turn you gain mana (1, then 2, up to 10) and draw a card. Play creatures
    and tricks from your hand, then attack with creatures that are ready.<br>
    <b>Guard</b> creatures must be struck first · <b>Swift</b> creatures attack the
    turn they arrive · <b>Drain</b> heals you for the damage it deals ·
    <b>Scorch</b> burns every enemy creature on arrival.<br>
    <span class="court-key">
      <span><b style="color:#ff6b4a">▲ Ember</b></span>
      <span><b style="color:#5ec8f2">● Tide</b></span>
      <span><b style="color:#7ed491">◆ Thorn</b></span>
      <span><b style="color:#ffd94d">✦ Gale</b></span>
    </span>`;
}

/** A duel played out by both autopilots — used by the win/loss shots to put
 *  a real game behind the overlay. (Kept small: the shot scenes above do the
 *  work; this is the shared helper they call through playRounds.) */
export function demoDuel(state, turns) {
  startDuel(state);
  playRounds(state, turns);
  return state;
}
