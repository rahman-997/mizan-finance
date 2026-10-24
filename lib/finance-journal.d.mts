export type FinanceJournal<T> = {
  get(): T;
  replace(next: T): T;
  commit(transition: (current: T) => T): T;
};
export function createFinanceJournal<T>(initial: T): FinanceJournal<T>;
