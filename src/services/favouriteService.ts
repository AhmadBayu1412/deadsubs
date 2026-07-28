// Phase 10 — Favourite / Subscription Service
// Wraps Dexie database operations with standardized ApiResult and error mapping.
// All store operations should go through this service.
import type { Subscription } from '../models/subscription';
import { AppError, type ApiResult } from './errors';
import * as db from './database';

// ── Internal mapper ────────────────────────────────────────────────────────────

function mapDbError(err: unknown, context: string): AppError {
  const msg = err instanceof Error ? err.message : String(err);
  return new AppError('server', `Failed to ${context}: ${msg}`);
}

// ── CRUD ────────────────────────────────────────────────────────────────────────

export async function getAllSubscriptions(userId: string): Promise<ApiResult<Subscription[]>> {
  try {
    const result = await db.getAllSubscriptions(userId);
    return AppError.ok(result);
  } catch (err) {
    return mapDbError(err, 'load subscriptions').toResult<Subscription[]>();
  }
}

export async function getSubscriptionById(
  id: string,
): Promise<ApiResult<Subscription>> {
  try {
    const result = await db.getSubscriptionById(id);
    if (!result) {
      return AppError.err('not_found', 'Subscription not found.');
    }
    return AppError.ok(result);
  } catch (err) {
    return mapDbError(err, 'load subscription').toResult<Subscription>();
  }
}

export async function addSubscription(
  userId: string,
  data: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<ApiResult<{ id: string }>> {
  try {
    const id = await db.addSubscription(userId, data);
    return AppError.ok({ id });
  } catch (err) {
    return mapDbError(err, 'add subscription').toResult<{ id: string }>();
  }
}

export async function updateSubscription(
  id: string,
  data: Partial<Subscription>,
): Promise<ApiResult<void>> {
  try {
    await db.updateSubscription(id, data);
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'update subscription').toResult<void>();
  }
}

export async function deleteSubscription(
  id: string,
): Promise<ApiResult<void>> {
  try {
    await db.deleteSubscription(id);
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'delete subscription').toResult<void>();
  }
}

export async function clearAllSubscriptions(): Promise<ApiResult<void>> {
  try {
    await db.clearAllSubscriptions();
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'clear subscriptions').toResult<void>();
  }
}

export async function importSubscriptions(
  userId: string,
  data: Subscription[],
): Promise<ApiResult<void>> {
  try {
    await db.importData(userId, data);
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'import subscriptions').toResult<void>();
  }
}

export async function toggleFavourite(
  id: string,
  isFavourited: boolean,
): Promise<ApiResult<void>> {
  return updateSubscription(id, { isFavourited });
}
