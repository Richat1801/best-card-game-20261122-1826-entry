// A seeded random source: the same seed always deals the same duel, so a
// screenshot scene can be replayed exactly.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  return {
    /** Next float in [0, 1). */
    next() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    },
    /** An integer in [0, bound). */
    int(bound) {
      return Math.floor(this.next() * bound);
    },
  };
}
