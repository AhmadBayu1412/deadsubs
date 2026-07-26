export type Category =
  | 'streaming'
  | 'software'
  | 'fitness'
  | 'news'
  | 'gaming'
  | 'music'
  | 'cloud'
  | 'food'
  | 'other';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export type Status = 'active' | 'paused' | 'cancelled' | 'pending_cancel';

export interface Subscription {
  id: string;
  name: string;
  cost: number; // in cents
  billingCycle: BillingCycle;
  category: Category;
  renewalDate: string; // ISO date string
  status: Status;
  notes?: string;
  cancelTargetDate?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

export interface UserSettings {
  uid: string;
  displayName: string;
  email: string;
  renewalReminders: boolean;
  reminderDays: number[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  streaming: 'Streaming',
  software: 'Software',
  fitness: 'Fitness',
  news: 'News',
  gaming: 'Gaming',
  music: 'Music',
  cloud: 'Cloud',
  food: 'Food',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  streaming: '#E879F9',
  software: '#60A5FA',
  fitness: '#34D399',
  news: '#FBBF24',
  gaming: '#F87171',
  music: '#A78BFA',
  cloud: '#38BDF8',
  food: '#FB923C',
  other: '#94A3B8',
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  weekly: 'Weekly',
};

export const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  pending_cancel: 'Pending Cancellation',
};
