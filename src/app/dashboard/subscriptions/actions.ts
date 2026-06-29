"use server";

import { revalidatePath } from 'next/cache';

import { mapAuthError } from '@/lib/auth-errors';
import { generarBillingHistoryInicial } from '@/lib/billing';
import { buildSubscriptionPayload } from '@/lib/subscriptions/form';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, Subscription } from '@/types';

type SubscriptionStatus = Subscription['estado'];

const VALID_STATUSES: SubscriptionStatus[] = ['activa', 'pausada', 'cancelada'];

function mapSupabaseError(message: string): string {
  return mapAuthError(message);
}

function revalidateSubscriptionViews(id?: string): void {
  revalidatePath('/dashboard/subscriptions');
  revalidatePath('/dashboard');
  if (id) {
    revalidatePath(`/dashboard/subscriptions/${id}`);
  }
}

export async function createSubscription(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const payload = buildSubscriptionPayload(formData);
  if (!payload.success) {
    return payload;
  }
  const subscriptionData = payload.data!;

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { success: false, error: mapSupabaseError(userError.message) };
  }

  if (!user) {
    return { success: false, error: 'Inicia sesion para continuar.' };
  }

  const { data: createdSubscription, error } = await supabase
    .from('subscriptions')
    .insert({
      ...subscriptionData,
      user_id: user.id,
      estado: 'activa',
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: mapSupabaseError(error.message) };
  }

  const billingHistoryRows = generarBillingHistoryInicial(
    new Date(`${subscriptionData.fecha_inicio}T00:00:00.000Z`),
    subscriptionData.frecuencia,
    subscriptionData.costo,
  ).map((row) => ({
    subscription_id: createdSubscription.id,
    ...row,
  }));

  if (billingHistoryRows.length > 0) {
    const { error: billingHistoryError } = await supabase
      .from('billing_history')
      .insert(billingHistoryRows);

    if (billingHistoryError) {
      return {
        success: false,
        error: mapSupabaseError(billingHistoryError.message),
      };
    }
  }

  revalidateSubscriptionViews();
  return { success: true };
}

export async function updateSubscription(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const payload = buildSubscriptionPayload(formData);
  if (!payload.success) {
    return payload;
  }
  const subscriptionData = payload.data!;

  const supabase = createClient();
  const { data: current, error: selectError } = await supabase
    .from('subscriptions')
    .select('fecha_inicio, frecuencia, proximo_cobro')
    .eq('id', id)
    .single();

  if (selectError) {
    return { success: false, error: mapSupabaseError(selectError.message) };
  }

  const nextPayload = {
    ...subscriptionData,
    proximo_cobro:
      current.fecha_inicio === subscriptionData.fecha_inicio &&
      current.frecuencia === subscriptionData.frecuencia
        ? current.proximo_cobro
        : subscriptionData.proximo_cobro,
  };

  const { error } = await supabase
    .from('subscriptions')
    .update(nextPayload)
    .eq('id', id);

  if (error) {
    return { success: false, error: mapSupabaseError(error.message) };
  }

  revalidateSubscriptionViews(id);
  return { success: true };
}

export async function updateSubscriptionStatus(
  id: string,
  nuevoEstado: SubscriptionStatus,
): Promise<ActionResult> {
  if (!VALID_STATUSES.includes(nuevoEstado)) {
    return { success: false, error: 'El estado seleccionado no es valido.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('subscriptions')
    .update({ estado: nuevoEstado })
    .eq('id', id);

  if (error) {
    return { success: false, error: mapSupabaseError(error.message) };
  }

  revalidateSubscriptionViews(id);
  return { success: true };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);

  if (error) {
    return { success: false, error: mapSupabaseError(error.message) };
  }

  revalidateSubscriptionViews(id);
  return { success: true };
}
