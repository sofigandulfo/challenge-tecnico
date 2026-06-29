import type { SupabaseClient } from '@supabase/supabase-js';

import type { BillingHistory, Category, Subscription } from '@/types';

export type SubscriptionWithCategory = Subscription & {
  category: Category | null;
};

type SubscriptionRow = Omit<SubscriptionWithCategory, 'category'> & {
  category: Category | Category[] | null;
};

type BillingHistoryRow = Omit<BillingHistory, 'monto'> & {
  monto: number | string;
};

type SupabaseError = Error & {
  code?: string;
  message: string;
};

const USER_SUBSCRIPTIONS_SELECT = `
  id,
  user_id,
  nombre,
  costo,
  frecuencia,
  categoria_id,
  fecha_inicio,
  proximo_cobro,
  estado,
  notas,
  created_at,
  category:categories (
    id,
    nombre,
    color
  )
`;

function normalizeCategory(category: Category | Category[] | null): Category | null {
  if (Array.isArray(category)) {
    return category[0] ?? null;
  }

  return category;
}

function normalizeSubscription(row: SubscriptionRow): SubscriptionWithCategory {
  return {
    ...row,
    costo: Number(row.costo),
    category: normalizeCategory(row.category),
  };
}

function normalizeBillingHistory(row: BillingHistoryRow): BillingHistory {
  return {
    ...row,
    monto: Number(row.monto),
  };
}

function isInvalidUuidSyntaxError(error: SupabaseError): boolean {
  return (
    error.code === '22P02' &&
    error.message.toLowerCase().includes('invalid input syntax')
  );
}

export async function getUserSubscriptions(
  supabase: SupabaseClient,
): Promise<SubscriptionWithCategory[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(USER_SUBSCRIPTIONS_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SubscriptionRow[]).map(normalizeSubscription);
}

export async function getSubscriptionById(
  supabase: SupabaseClient,
  id: string,
): Promise<SubscriptionWithCategory | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(USER_SUBSCRIPTIONS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (isInvalidUuidSyntaxError(error)) {
      return null;
    }

    throw error;
  }

  if (!data) {
    return null;
  }

  return normalizeSubscription(data as SubscriptionRow);
}

export async function getBillingHistoryBySubscriptionId(
  supabase: SupabaseClient,
  subscriptionId: string,
): Promise<BillingHistory[]> {
  const { data, error } = await supabase
    .from('billing_history')
    .select('id, subscription_id, fecha, monto')
    .eq('subscription_id', subscriptionId)
    .order('fecha', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BillingHistoryRow[]).map(normalizeBillingHistory);
}

export async function getCategories(
  supabase: SupabaseClient,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, nombre, color')
    .order('nombre', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Category[];
}
