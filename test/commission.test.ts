import { describe, expect, it } from 'vitest';

import { calculatePrice, commissionProgress, formatMoney, statusLabel } from '../src/lib/commission';

describe('commission helpers', () => {
  it('calculates a local maker estimate without charging a fee on shipping', () => {
    expect(calculatePrice(1800, [200, 50], 75, 5)).toEqual({
      total: 2125,
      deposit: 1062.5,
      estimatedFee: 102.5,
      makerPayout: 1947.5,
    });
  });

  it('keeps progress stable for an empty or partially complete timeline', () => {
    expect(commissionProgress([])).toBe(0);
    expect(
      commissionProgress([
        { id: '1', title: 'One', position: 0, status: 'complete', paymentAmount: 10, updates: [] },
        { id: '2', title: 'Two', position: 1, status: 'active', paymentAmount: 10, updates: [] },
        { id: '3', title: 'Three', position: 2, status: 'locked', paymentAmount: 10, updates: [] },
      ]),
    ).toBe(33);
  });

  it('renders user-facing labels and GBP values', () => {
    expect(statusLabel('price_proposed')).toBe('Price proposed');
    expect(formatMoney(1234.5)).toContain('1,234.50');
  });
});
