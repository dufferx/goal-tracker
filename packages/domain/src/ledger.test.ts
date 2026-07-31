import { describe, expect, it } from 'vitest';
import { replayLedger, type FinancialKind, type LedgerTransaction } from './ledger.js';
import { MAX_MONEY_MINOR } from './money.js';

function entry(
  id: string,
  kind: FinancialKind,
  amountMinor: bigint,
  effectiveDate: string,
  options: Partial<LedgerTransaction> = {},
): LedgerTransaction {
  return {
    id,
    kind,
    amountMinor,
    effectiveDate,
    createdAt: new Date(`2026-08-01T00:00:0${id}.000Z`),
    updatedAt: new Date(`2026-08-01T00:00:0${id}.000Z`),
    itemId: null,
    reversesTransactionId: null,
    ...options,
  };
}

describe('replayLedger', () => {
  it('orders deterministically and derives all balances and active purchases', () => {
    const result = replayLedger([
      entry('2', 'purchase', 56000n, '2026-08-08', { itemId: 'rack' }),
      entry('1', 'contribution', 60000n, '2026-08-01'),
      entry('3', 'contribution', 10000n, '2026-08-14'),
    ]);
    expect(result.entries.map((row) => row.id)).toEqual(['1', '2', '3']);
    expect(result.totals).toEqual({
      fundedMinor: 70000n,
      spentMinor: 56000n,
      availableMinor: 14000n,
    });
    expect(result.activePurchases.get('rack')?.id).toBe('2');
  });

  it('fully undoes a purchase', () => {
    const result = replayLedger([
      entry('1', 'contribution', 60000n, '2026-08-01'),
      entry('2', 'purchase', 56000n, '2026-08-08', { itemId: 'rack' }),
      entry('3', 'purchase_undo', 56000n, '2026-08-09', {
        itemId: 'rack',
        reversesTransactionId: '2',
      }),
    ]);
    expect(result.totals).toEqual({ fundedMinor: 60000n, spentMinor: 0n, availableMinor: 60000n });
    expect(result.activePurchases.size).toBe(0);
  });

  it.each([
    ['withdrawal before funding', [entry('1', 'withdrawal', 1n, '2026-08-01')], 'NEGATIVE_FUNDED'],
    [
      'purchase above available',
      [
        entry('1', 'contribution', 100n, '2026-08-01'),
        entry('2', 'purchase', 101n, '2026-08-02', { itemId: 'rack' }),
      ],
      'NEGATIVE_AVAILABLE',
    ],
    [
      'retroactive edit invalidates a later purchase',
      [
        entry('1', 'contribution', 500n, '2026-08-01'),
        entry('2', 'purchase', 600n, '2026-08-02', { itemId: 'rack' }),
      ],
      'NEGATIVE_AVAILABLE',
    ],
    [
      'a single amount exceeds the supported range',
      [entry('1', 'contribution', MAX_MONEY_MINOR + 1n, '2026-08-01')],
      'INVALID_AMOUNT',
    ],
    [
      'the funded total exceeds the supported range',
      [
        entry('1', 'contribution', MAX_MONEY_MINOR, '2026-08-01'),
        entry('2', 'contribution', 1n, '2026-08-02'),
      ],
      'INVALID_AMOUNT',
    ],
  ])('rejects %s', (_name, rows, code) => {
    expect(() => replayLedger(rows as LedgerTransaction[])).toThrowError(
      expect.objectContaining({ code }),
    );
  });

  it('rejects duplicate purchases and partial undo', () => {
    const base = [
      entry('1', 'contribution', 1000n, '2026-08-01'),
      entry('2', 'purchase', 400n, '2026-08-02', { itemId: 'rack' }),
    ];
    expect(() =>
      replayLedger([...base, entry('3', 'purchase', 300n, '2026-08-03', { itemId: 'rack' })]),
    ).toThrowError(expect.objectContaining({ code: 'ITEM_ALREADY_PURCHASED' }));
    expect(() =>
      replayLedger([
        ...base,
        entry('3', 'purchase_undo', 399n, '2026-08-03', {
          itemId: 'rack',
          reversesTransactionId: '2',
        }),
      ]),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_REFERENCE' }));
  });
});
