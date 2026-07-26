import type { Commission, Milestone } from '../types';

export function formatMoney(value: number | undefined): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value ?? 0);
}

export function commissionProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const complete = milestones.filter((milestone) => milestone.status === 'complete').length;
  return Math.round((complete / milestones.length) * 100);
}

export function statusLabel(status: Commission['status']): string {
  const labels: Record<Commission['status'], string> = {
    pending: 'Awaiting maker',
    negotiating: 'Negotiating',
    price_proposed: 'Price proposed',
    accepted: 'Deposit due',
    active: 'In progress',
    shipping: 'On its way',
    complete: 'Complete',
    cancelled: 'Cancelled',
    disputed: 'In dispute',
  };
  return labels[status];
}

export interface PriceCalculation {
  total: number;
  deposit: number;
  estimatedFee: number;
  makerPayout: number;
}

export function calculatePrice(
  basePrice: number,
  addOns: number[],
  shipping: number,
  platformFeePercent = 5,
): PriceCalculation {
  const subtotal = Math.max(0, basePrice) + addOns.reduce((sum, value) => sum + Math.max(0, value), 0);
  const total = subtotal + Math.max(0, shipping);
  const estimatedFee = Math.round(subtotal * (platformFeePercent / 100) * 100) / 100;
  return {
    total,
    deposit: Math.round(total * 50) / 100,
    estimatedFee,
    makerPayout: Math.round((subtotal - estimatedFee) * 100) / 100,
  };
}
