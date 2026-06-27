import type { SupabaseClient } from '@supabase/supabase-js';

import type { Category, Subscription } from '@/types';

export type SubscriptionWithCategory = Subscription & {
  category: Category | null;
};

type SubscriptionRow = Omit<SubscriptionWithCategory, 'category'> & {
  category: Category | Category[] | null;
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
