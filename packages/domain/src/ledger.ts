import { MAX_MONEY_MINOR } from './money.js';

export type FinancialKind = 'contribution' | 'withdrawal' | 'purchase' | 'purchase_undo';

export interface LedgerTransaction {
  id: string;
  kind: FinancialKind;
  amountMinor: bigint;
  effectiveDate: string;
  createdAt: Date;
  updatedAt: Date;
  itemId: string | null;
  reversesTransactionId: string | null;
}

export interface LedgerBalance {
  fundedMinor: bigint;
  spentMinor: bigint;
  availableMinor: bigint;
}

export interface ReplayedTransaction extends LedgerTransaction {
  balance: LedgerBalance;
}

export interface LedgerReplay {
  totals: LedgerBalance;
  entries: ReplayedTransaction[];
  activePurchases: ReadonlyMap<string, LedgerTransaction>;
}

export type LedgerErrorCode =
  | 'INVALID_AMOUNT'
  | 'INVALID_REFERENCE'
  | 'NEGATIVE_FUNDED'
  | 'NEGATIVE_SPENT'
  | 'NEGATIVE_AVAILABLE'
  | 'ITEM_ALREADY_PURCHASED';

export class LedgerError extends Error {
  constructor(
    readonly code: LedgerErrorCode,
    message: string,
    readonly transactionId?: string,
  ) {
    super(message);
    this.name = 'LedgerError';
  }
}

export function compareLedgerTransactions(a: LedgerTransaction, b: LedgerTransaction): number {
  return (
    a.effectiveDate.localeCompare(b.effectiveDate) ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

export function replayLedger(transactions: readonly LedgerTransaction[]): LedgerReplay {
  const ordered = [...transactions].sort(compareLedgerTransactions);
  let fundedMinor = 0n;
  let spentMinor = 0n;
  const entries: ReplayedTransaction[] = [];
  const purchasesById = new Map<string, LedgerTransaction>();
  const activePurchases = new Map<string, LedgerTransaction>();
  const reversedPurchases = new Set<string>();

  for (const transaction of ordered) {
    if (transaction.amountMinor <= 0n || transaction.amountMinor > MAX_MONEY_MINOR) {
      throw new LedgerError(
        'INVALID_AMOUNT',
        'Financial amounts must be positive.',
        transaction.id,
      );
    }
    switch (transaction.kind) {
      case 'contribution':
        assertNoItemReference(transaction);
        fundedMinor += transaction.amountMinor;
        break;
      case 'withdrawal':
        assertNoItemReference(transaction);
        fundedMinor -= transaction.amountMinor;
        break;
      case 'purchase':
        if (!transaction.itemId || transaction.reversesTransactionId) {
          throw invalidReference(transaction, 'A purchase must reference one item only.');
        }
        if (activePurchases.has(transaction.itemId)) {
          throw new LedgerError(
            'ITEM_ALREADY_PURCHASED',
            'This item already has an active purchase.',
            transaction.id,
          );
        }
        spentMinor += transaction.amountMinor;
        purchasesById.set(transaction.id, transaction);
        activePurchases.set(transaction.itemId, transaction);
        break;
      case 'purchase_undo': {
        const purchaseId = transaction.reversesTransactionId;
        const purchase = purchaseId ? purchasesById.get(purchaseId) : undefined;
        if (
          !transaction.itemId ||
          !purchaseId ||
          !purchase ||
          purchase.itemId !== transaction.itemId ||
          purchase.amountMinor !== transaction.amountMinor ||
          reversedPurchases.has(purchaseId)
        ) {
          throw invalidReference(transaction, 'An undo must fully reverse one active purchase.');
        }
        spentMinor -= transaction.amountMinor;
        reversedPurchases.add(purchaseId);
        activePurchases.delete(transaction.itemId);
        break;
      }
    }

    const availableMinor = fundedMinor - spentMinor;
    if (
      fundedMinor > MAX_MONEY_MINOR ||
      spentMinor > MAX_MONEY_MINOR ||
      availableMinor > MAX_MONEY_MINOR
    ) {
      throw new LedgerError(
        'INVALID_AMOUNT',
        'Financial history exceeds the supported integer minor-unit range.',
        transaction.id,
      );
    }
    if (fundedMinor < 0n)
      throw new LedgerError(
        'NEGATIVE_FUNDED',
        'This change would make funded money negative.',
        transaction.id,
      );
    if (spentMinor < 0n)
      throw new LedgerError(
        'NEGATIVE_SPENT',
        'This change would make spent money negative.',
        transaction.id,
      );
    if (availableMinor < 0n)
      throw new LedgerError(
        'NEGATIVE_AVAILABLE',
        'This change would leave insufficient available money.',
        transaction.id,
      );
    entries.push({ ...transaction, balance: { fundedMinor, spentMinor, availableMinor } });
  }
  return {
    totals: { fundedMinor, spentMinor, availableMinor: fundedMinor - spentMinor },
    entries,
    activePurchases,
  };
}

function assertNoItemReference(transaction: LedgerTransaction) {
  if (transaction.itemId || transaction.reversesTransactionId) {
    throw invalidReference(
      transaction,
      `${transaction.kind} cannot reference an item or purchase.`,
    );
  }
}

function invalidReference(transaction: LedgerTransaction, message: string) {
  return new LedgerError('INVALID_REFERENCE', message, transaction.id);
}
