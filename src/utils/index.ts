import {
  differenceInDays,
  format,
  parseISO,
  addMonths,
  addWeeks,
  addYears,
  isBefore,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import type { Subscription, BillingCycle } from '../models/subscription';

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}

export function formatDateShort(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d');
}

export function daysUntil(isoDate: string): number {
  return differenceInDays(parseISO(isoDate), new Date());
}

export function getMonthlyEquivalent(cents: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return Math.round(cents * (52 / 12));
    case 'yearly':
      return Math.round(cents / 12);
    case 'monthly':
    default:
      return cents;
  }
}

export function getYearlyEquivalent(cents: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return Math.round(cents * 52);
    case 'monthly':
      return cents * 12;
    case 'yearly':
    default:
      return cents;
  }
}

export function getNextRenewalDate(currentDate: string, cycle: BillingCycle): string {
  const date = parseISO(currentDate);
  let next: Date;
  if (isBefore(date, new Date())) {
    // Already passed — calculate next occurrence
    next = date;
    while (isBefore(next, new Date())) {
      switch (cycle) {
        case 'weekly':
          next = addWeeks(next, 1);
          break;
        case 'yearly':
          next = addYears(next, 1);
          break;
        case 'monthly':
        default:
          next = addMonths(next, 1);
          break;
      }
    }
  } else {
    switch (cycle) {
      case 'weekly':
        next = addWeeks(date, 1);
        break;
      case 'yearly':
        next = addYears(date, 1);
        break;
      case 'monthly':
      default:
        next = addMonths(date, 1);
        break;
    }
  }
  return next.toISOString();
}

export function getMonthKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

export function getMonthLabel(monthKey: string): string {
  return format(parseISO(`${monthKey}-01`), 'MMM yyyy');
}

export function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
}

export function getSubscriptionsInMonth(
  subscriptions: Subscription[],
  year: number,
  month: number // 0-indexed
): Subscription[] {
  const start = startOfMonth(new Date(year, month, 1));
  const end = endOfMonth(start);
  return subscriptions.filter((s) => {
    const renewal = parseISO(s.renewalDate);
    return renewal >= start && renewal <= end && s.status === 'active';
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}
