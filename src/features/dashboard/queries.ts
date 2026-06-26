import type { SupabaseClient } from '@supabase/supabase-js';

import type { DashboardSubscription } from './calculations';

type SubscriptionRow = DashboardSubscription & {
  category:
    | {
        nombre: string;
        color: string;
      }
    | {
        nombre: string;
        color: string;
      }[]
    | null;
};

const SUBSCRIPTIONS_SELECT = `
  id,
  nombre,
  costo,
  frecuencia,
  estado,
  proximo_cobro,
  category:categories (
    nombre,
    color
  )
`;

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizeSubscription(row: SubscriptionRow): DashboardSubscription {
  const category = Array.isArray(row.category)
    ? row.category[0] ?? null
    : row.category;

  return {
    ...row,
    costo: Number(row.costo),
    category,
  };
}

export async function getSubscriptions(
  supabase: SupabaseClient,
): Promise<DashboardSubscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTIONS_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SubscriptionRow[]).map(normalizeSubscription);
}

export async function getUpcomingSubscriptions(
  supabase: SupabaseClient,
): Promise<DashboardSubscription[]> {
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);

  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTIONS_SELECT)
    .eq('estado', 'activa')
    .gte('proximo_cobro', toDateString(today))
    .lte('proximo_cobro', toDateString(sevenDaysFromNow))
    .order('proximo_cobro', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SubscriptionRow[]).map(normalizeSubscription);
}
