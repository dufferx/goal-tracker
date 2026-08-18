import type {
  CreateFinancialTransactionRequest,
  FinancialHistory,
  FinancialMutationResponse,
  PurchaseItemRequest,
  UndoPurchaseRequest,
  UpdateFinancialTransactionRequest,
} from '@goal-tracker/contracts';
import type {
  FinancialRepository,
  FinancialSnapshot,
  FinancialTransactionRecord,
} from '@goal-tracker/database';
import { newFinancialTransactionId } from '@goal-tracker/database';
import {
  calculateTarget,
  LedgerError,
  MoneyError,
  parseMoneyString,
  replayLedger,
  resolveFixedOverage,
  serializeMoney,
} from '@goal-tracker/domain';

export class FinancialServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'FinancialServiceError';
  }
}

export function createFinancialService(
  repository: FinancialRepository,
  options: { now?: () => Date } = {},
) {
  const now = options.now ?? (() => new Date());
  const today = () => now().toISOString().slice(0, 10);

  function parseAmount(value: string) {
    try {
      return parseMoneyString(value, 'amount');
    } catch (error) {
      if (error instanceof MoneyError) {
        throw new FinancialServiceError('INVALID_AMOUNT', error.message, 400, {
          amount: [error.message],
        });
      }
      throw error;
    }
  }

  function requireNotFuture(value: string) {
    if (value > today())
      throw new FinancialServiceError(
        'FUTURE_EFFECTIVE_DATE',
        'Real financial activity cannot be dated in the future.',
        400,
        { effectiveDate: ['Choose today or a past date.'] },
      );
  }

  function ledger(snapshot: FinancialSnapshot, transactions = snapshot.transactions) {
    try {
      return replayLedger(transactions.map((row) => ({ ...row })));
    } catch (error) {
      if (error instanceof LedgerError) {
        const status = error.code === 'ITEM_ALREADY_PURCHASED' ? 409 : 422;
        throw new FinancialServiceError(error.code, error.message, status);
      }
      throw error;
    }
  }

  function currentTarget(snapshot: FinancialSnapshot) {
    const replay = ledger(snapshot);
    return calculateTarget({
      targetMode: snapshot.goal.targetMode,
      fixedTargetMinor: snapshot.goal.fixedTargetMinor,
      items: snapshot.items.map((item) => ({
        expectedPriceMinor: item.expectedPriceMinor,
        actualPriceMinor: replay.activePurchases.get(item.id)?.amountMinor,
      })),
    });
  }

  function totals(snapshot: FinancialSnapshot) {
    const result = ledger(snapshot);
    const target = currentTarget(snapshot).currentTargetMinor;
    return {
      funded: serializeMoney(result.totals.fundedMinor),
      spent: serializeMoney(result.totals.spentMinor),
      available: serializeMoney(result.totals.availableMinor),
      remaining:
        target == null
          ? null
          : serializeMoney(
              target > result.totals.fundedMinor ? target - result.totals.fundedMinor : 0n,
            ),
    };
  }

  function transactionDto(
    snapshot: FinancialSnapshot,
    row: FinancialTransactionRecord,
    balance: { fundedMinor: bigint; spentMinor: bigint; availableMinor: bigint },
  ) {
    return {
      id: row.id,
      goalId: row.goalId,
      kind: row.kind,
      amount: serializeMoney(row.amountMinor),
      effectiveDate: row.effectiveDate,
      itemId: row.itemId,
      itemName: row.itemId
        ? (snapshot.items.find((item) => item.id === row.itemId)?.name ?? null)
        : null,
      reversesTransactionId: row.reversesTransactionId,
      edited: row.updatedAt.getTime() > row.createdAt.getTime() + 1,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      balanceAfter: {
        funded: serializeMoney(balance.fundedMinor),
        spent: serializeMoney(balance.spentMinor),
        available: serializeMoney(balance.availableMinor),
      },
    };
  }

  function history(
    snapshot: FinancialSnapshot,
    filters?: { kind?: string; month?: string },
  ): FinancialHistory {
    const result = ledger(snapshot);
    const byId = new Map(result.entries.map((entry) => [entry.id, entry]));
    const rows = snapshot.transactions
      .filter((row) => !filters?.kind || row.kind === filters.kind)
      .filter((row) => !filters?.month || row.effectiveDate.startsWith(`${filters.month}-`))
      .map((row) => transactionDto(snapshot, row, byId.get(row.id)!.balance))
      .sort(
        (a, b) =>
          b.effectiveDate.localeCompare(a.effectiveDate) ||
          b.createdAt.localeCompare(a.createdAt) ||
          b.id.localeCompare(a.id),
      );
    return { totals: totals(snapshot), transactions: rows };
  }

  function assertActive(snapshot: FinancialSnapshot) {
    if (snapshot.goal.status === 'archived')
      throw new FinancialServiceError(
        'GOAL_ARCHIVED',
        'Restore this goal before recording money.',
        409,
      );
  }

  function proposed(
    snapshot: FinancialSnapshot,
    next: FinancialTransactionRecord[],
    fixedTargetMinor?: bigint,
  ) {
    const proposal = {
      ...snapshot,
      goal: fixedTargetMinor === undefined ? snapshot.goal : { ...snapshot.goal, fixedTargetMinor },
      transactions: next,
    };
    ledger(proposal);
    return proposal;
  }

  function nextCreatedAt(snapshot: FinancialSnapshot) {
    const requested = now().getTime();
    const latest = snapshot.transactions.reduce(
      (maximum, transaction) => Math.max(maximum, transaction.createdAt.getTime()),
      Number.NEGATIVE_INFINITY,
    );
    return new Date(Math.max(requested, latest + 1));
  }

  function fixedTargetAfterPurchase(
    snapshot: FinancialSnapshot,
    nextRows: FinancialTransactionRecord[],
    decision?: 'keep_target' | 'increase_target',
  ) {
    if (snapshot.goal.targetMode !== 'fixed') return undefined;
    const replay = ledger({ ...snapshot, transactions: nextRows });
    const itemsTotal = snapshot.items.reduce(
      (sum, item) =>
        sum + (replay.activePurchases.get(item.id)?.amountMinor ?? item.expectedPriceMinor),
      0n,
    );
    try {
      return resolveFixedOverage({
        fixedTargetMinor: snapshot.goal.fixedTargetMinor!,
        itemsTotalMinor: itemsTotal,
        decision,
      }).resultingFixedTargetMinor;
    } catch {
      throw new FinancialServiceError(
        'OVERAGE_DECISION_REQUIRED',
        'This price exceeds the fixed target. Choose whether to keep or increase the target.',
        409,
      );
    }
  }

  async function getSnapshot(ownerId: string, goalId: string) {
    const snapshot = await repository.findSnapshot(ownerId, goalId);
    if (!snapshot) throw new FinancialServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
    return snapshot;
  }

  async function result(
    ownerId: string,
    goalId: string,
    transactionId: string | null,
  ): Promise<FinancialMutationResponse> {
    const snapshot = await getSnapshot(ownerId, goalId);
    const replay = ledger(snapshot);
    const row = transactionId
      ? snapshot.transactions.find((item) => item.id === transactionId)
      : undefined;
    const replayed = row ? replay.entries.find((item) => item.id === row.id) : undefined;
    return {
      totals: totals(snapshot),
      transaction: row && replayed ? transactionDto(snapshot, row, replayed.balance) : null,
    };
  }

  return {
    async history(ownerId: string, goalId: string, filters?: { kind?: string; month?: string }) {
      return history(await getSnapshot(ownerId, goalId), filters);
    },
    async create(ownerId: string, goalId: string, request: CreateFinancialTransactionRequest) {
      requireNotFuture(request.effectiveDate);
      const id = newFinancialTransactionId();
      const amountMinor = parseAmount(request.amount);
      const next = await repository.runLockedMutation(ownerId, goalId, (snapshot) => {
        assertActive(snapshot);
        const created = nextCreatedAt(snapshot);
        const row: FinancialTransactionRecord = {
          id,
          ownerId,
          goalId,
          kind: request.kind,
          amountMinor,
          effectiveDate: request.effectiveDate,
          itemId: null,
          reversesTransactionId: null,
          createdAt: created,
          updatedAt: created,
        };
        proposed(snapshot, [...snapshot.transactions, row]);
        return {
          type: 'insert',
          createdAt: created,
          transaction: {
            id,
            kind: request.kind,
            amountMinor,
            effectiveDate: request.effectiveDate,
            itemId: null,
            reversesTransactionId: null,
          },
        };
      });
      if (!next) throw new FinancialServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      return result(ownerId, goalId, id);
    },
    async update(
      ownerId: string,
      goalId: string,
      transactionId: string,
      request: UpdateFinancialTransactionRequest,
    ) {
      if (request.effectiveDate) requireNotFuture(request.effectiveDate);
      const next = await repository.runLockedMutation(ownerId, goalId, (snapshot) => {
        assertActive(snapshot);
        const row = snapshot.transactions.find((item) => item.id === transactionId);
        if (!row)
          throw new FinancialServiceError('TRANSACTION_NOT_FOUND', 'Transaction not found.', 404);
        if (row.kind === 'purchase_undo')
          throw new FinancialServiceError(
            'TRANSACTION_NOT_EDITABLE',
            'Purchase undo entries cannot be edited.',
            409,
          );
        const changed = {
          ...row,
          amountMinor: request.amount ? parseAmount(request.amount) : row.amountMinor,
          effectiveDate: request.effectiveDate ?? row.effectiveDate,
          updatedAt: now(),
        };
        const rows = snapshot.transactions.map((item) => (item.id === row.id ? changed : item));
        const fixedTargetMinor =
          row.kind === 'purchase'
            ? fixedTargetAfterPurchase(snapshot, rows, request.overageDecision)
            : undefined;
        proposed(snapshot, rows, fixedTargetMinor);
        return {
          type: 'update',
          transactionId,
          amountMinor: changed.amountMinor,
          effectiveDate: changed.effectiveDate,
          ...(fixedTargetMinor !== undefined ? { fixedTargetMinor } : {}),
        };
      });
      if (!next) throw new FinancialServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      return result(ownerId, goalId, transactionId);
    },
    async delete(ownerId: string, goalId: string, transactionId: string) {
      const next = await repository.runLockedMutation(ownerId, goalId, (snapshot) => {
        assertActive(snapshot);
        const row = snapshot.transactions.find((item) => item.id === transactionId);
        if (!row)
          throw new FinancialServiceError('TRANSACTION_NOT_FOUND', 'Transaction not found.', 404);
        if (row.kind !== 'contribution' && row.kind !== 'withdrawal')
          throw new FinancialServiceError(
            'TRANSACTION_NOT_DELETABLE',
            'Purchases must be undone, not deleted.',
            409,
          );
        proposed(
          snapshot,
          snapshot.transactions.filter((item) => item.id !== row.id),
        );
        return { type: 'delete', transactionId };
      });
      if (!next) throw new FinancialServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      return result(ownerId, goalId, null);
    },
    async purchase(ownerId: string, goalId: string, itemId: string, request: PurchaseItemRequest) {
      requireNotFuture(request.effectiveDate);
      const id = newFinancialTransactionId();
      const amountMinor = parseAmount(request.amount);
      const next = await repository.runLockedMutation(ownerId, goalId, (snapshot) => {
        assertActive(snapshot);
        const created = nextCreatedAt(snapshot);
        if (!snapshot.items.some((item) => item.id === itemId))
          throw new FinancialServiceError('ITEM_NOT_FOUND', 'Item not found.', 404);
        const row: FinancialTransactionRecord = {
          id,
          ownerId,
          goalId,
          kind: 'purchase',
          amountMinor,
          effectiveDate: request.effectiveDate,
          itemId,
          reversesTransactionId: null,
          createdAt: created,
          updatedAt: created,
        };
        const rows = [...snapshot.transactions, row];
        const fixedTargetMinor = fixedTargetAfterPurchase(snapshot, rows, request.overageDecision);
        proposed(snapshot, rows, fixedTargetMinor);
        return {
          type: 'insert',
          createdAt: created,
          transaction: {
            id,
            kind: 'purchase',
            amountMinor,
            effectiveDate: request.effectiveDate,
            itemId,
            reversesTransactionId: null,
          },
          ...(fixedTargetMinor !== undefined ? { fixedTargetMinor } : {}),
        };
      });
      if (!next) throw new FinancialServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      return result(ownerId, goalId, id);
    },
    async undo(ownerId: string, goalId: string, purchaseId: string, request: UndoPurchaseRequest) {
      requireNotFuture(request.effectiveDate);
      const id = newFinancialTransactionId();
      const next = await repository.runLockedMutation(ownerId, goalId, (snapshot) => {
        assertActive(snapshot);
        const created = nextCreatedAt(snapshot);
        const purchase = snapshot.transactions.find(
          (item) => item.id === purchaseId && item.kind === 'purchase',
        );
        if (!purchase?.itemId)
          throw new FinancialServiceError('PURCHASE_NOT_FOUND', 'Purchase not found.', 404);
        const row: FinancialTransactionRecord = {
          id,
          ownerId,
          goalId,
          kind: 'purchase_undo',
          amountMinor: purchase.amountMinor,
          effectiveDate: request.effectiveDate,
          itemId: purchase.itemId,
          reversesTransactionId: purchase.id,
          createdAt: created,
          updatedAt: created,
        };
        proposed(snapshot, [...snapshot.transactions, row]);
        return {
          type: 'insert',
          createdAt: created,
          transaction: {
            id,
            kind: 'purchase_undo',
            amountMinor: purchase.amountMinor,
            effectiveDate: request.effectiveDate,
            itemId: purchase.itemId,
            reversesTransactionId: purchase.id,
          },
        };
      });
      if (!next) throw new FinancialServiceError('GOAL_NOT_FOUND', 'Goal not found.', 404);
      return result(ownerId, goalId, id);
    },
  };
}

export type FinancialService = ReturnType<typeof createFinancialService>;
