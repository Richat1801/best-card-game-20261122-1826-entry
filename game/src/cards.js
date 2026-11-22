// The card catalogue of Ember Court: every creature and trick the duel can
// draw. Four courts, each told apart by colour AND shape glyph:
//   Ember ▲ (fire red) · Tide ● (water blue) · Thorn ◆ (leaf green) · Gale ✦ (wind gold)
// Abilities: guard (must be attacked first), swift (attacks the turn it is
// played), drain (heals its owner for the damage it deals), scorch (1 damage
// to every enemy creature when played).
export const COURT = {
  ember: { name: 'Ember', glyph: '▲', art: '♨' },
  tide: { name: 'Tide', glyph: '●', art: '≋' },
  thorn: { name: 'Thorn', glyph: '◆', art: '❦' },
  gale: { name: 'Gale', glyph: '✦', art: '🜁' },
};

/** Creature and trick definitions. `kind` is 'creature' or 'trick'. */
export const CARD_DEFS = [
  { id: 'cinder-imp', kind: 'creature', court: 'ember', name: 'Cinder Imp', cost: 1, atk: 2, hp: 1, ability: 'swift', abilityText: 'Swift — attacks the turn played.', art: '👺' },
  { id: 'ash-hound', kind: 'creature', court: 'ember', name: 'Ash Hound', cost: 2, atk: 3, hp: 2, ability: null, abilityText: 'A hound of hot cinders.', art: '🐺' },
  { id: 'flame-warden', kind: 'creature', court: 'ember', name: 'Flame Warden', cost: 4, atk: 4, hp: 5, ability: 'guard', abilityText: 'Guard — foes must strike it first.', art: '🛡️' },
  { id: 'pyre-drake', kind: 'creature', court: 'ember', name: 'Pyre Drake', cost: 6, atk: 6, hp: 5, ability: 'scorch', abilityText: 'Scorch — 1 damage to every foe.', art: '🐉' },
  { id: 'tidecaller', kind: 'creature', court: 'tide', name: 'Tidecaller', cost: 2, atk: 2, hp: 3, ability: 'drain', abilityText: 'Drain — heals you for damage dealt.', art: '🧜' },
  { id: 'reef-turtle', kind: 'creature', court: 'tide', name: 'Reef Turtle', cost: 3, atk: 1, hp: 6, ability: 'guard', abilityText: 'Guard — foes must strike it first.', art: '🐢' },
  { id: 'storm-eel', kind: 'creature', court: 'tide', name: 'Storm Eel', cost: 3, atk: 4, hp: 2, ability: 'swift', abilityText: 'Swift — attacks the turn played.', art: '🐍' },
  { id: 'deep-leviathan', kind: 'creature', court: 'tide', name: 'Deep Leviathan', cost: 7, atk: 7, hp: 7, ability: null, abilityText: 'The tide itself, given teeth.', art: '🐋' },
  { id: 'thorn-sprout', kind: 'creature', court: 'thorn', name: 'Thorn Sprout', cost: 1, atk: 1, hp: 3, ability: 'guard', abilityText: 'Guard — foes must strike it first.', art: '🌱' },
  { id: 'bramble-wolf', kind: 'creature', court: 'thorn', name: 'Bramble Wolf', cost: 3, atk: 4, hp: 3, ability: null, abilityText: 'Thorns ride where it runs.', art: '🐺' },
  { id: 'grove-guardian', kind: 'creature', court: 'thorn', name: 'Grove Guardian', cost: 5, atk: 3, hp: 7, ability: 'guard', abilityText: 'Guard — foes must strike it first.', art: '🌳' },
  { id: 'thorn-matriarch', kind: 'creature', court: 'thorn', name: 'Thorn Matriarch', cost: 6, atk: 5, hp: 6, ability: 'drain', abilityText: 'Drain — heals you for damage dealt.', art: '👸' },
  { id: 'gale-scout', kind: 'creature', court: 'gale', name: 'Gale Scout', cost: 1, atk: 2, hp: 2, ability: 'swift', abilityText: 'Swift — attacks the turn played.', art: '🦅' },
  { id: 'sky-kite', kind: 'creature', court: 'gale', name: 'Sky Kite', cost: 2, atk: 3, hp: 1, ability: 'swift', abilityText: 'Swift — attacks the turn played.', art: '🪁' },
  { id: 'cloud-serpent', kind: 'creature', court: 'gale', name: 'Cloud Serpent', cost: 5, atk: 5, hp: 4, ability: null, abilityText: 'It rides the storm, not the ground.', art: '🐍' },
  { id: 'tempest-roc', kind: 'creature', court: 'gale', name: 'Tempest Roc', cost: 7, atk: 8, hp: 6, ability: 'swift', abilityText: 'Swift — attacks the turn played.', art: '🦅' },
  { id: 'cinder-burst', kind: 'trick', court: 'ember', name: 'Cinder Burst', cost: 2, abilityText: 'Deal 3 damage to a creature.', art: '💥' },
  { id: 'mend-hearth', kind: 'trick', court: 'ember', name: 'Mend the Hearth', cost: 2, abilityText: 'Restore 6 life to yourself.', art: '❤️' },
  { id: 'sudden-gale', kind: 'trick', court: 'gale', name: 'Sudden Gale', cost: 1, abilityText: 'Draw 2 cards.', art: '🌬️' },
  { id: 'quench', kind: 'trick', court: 'tide', name: 'Quench', cost: 4, abilityText: 'Deal 2 damage to every enemy creature.', art: '🌊' },
];

/** The 30-card deck every duellist shuffles: two copies of the small cards,
 *  one of the great ones. Both players draw from the same list. */
export const DECK_LIST = [
  'cinder-imp', 'cinder-imp', 'ash-hound', 'ash-hound', 'flame-warden', 'pyre-drake',
  'tidecaller', 'tidecaller', 'reef-turtle', 'storm-eel', 'deep-leviathan',
  'thorn-sprout', 'thorn-sprout', 'bramble-wolf', 'grove-guardian', 'thorn-matriarch',
  'gale-scout', 'gale-scout', 'sky-kite', 'cloud-serpent', 'tempest-roc',
  'cinder-burst', 'cinder-burst', 'mend-hearth', 'mend-hearth', 'sudden-gale', 'sudden-gale',
  'quench', 'quench', 'ash-hound',
];

/** Look a card definition up by id. */
export function defById(id) {
  return CARD_DEFS.find((def) => def.id === id);
}
