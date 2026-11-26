/** A tiny synchronous transaction journal to prevent React render batching from dropping writes. */
export function createFinanceJournal(initial) {
  let snapshot = initial;
  return {
    get: () => snapshot,
    replace(next) { snapshot = next; return snapshot; },
    commit(transition) {
      // Do not mutate the snapshot when validation or capacity checks fail.
      const next = transition(snapshot);
      snapshot = next;
      return snapshot;
    },
  };
}
