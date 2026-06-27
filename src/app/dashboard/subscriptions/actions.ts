"use server";

import { revalidatePath } from 'next/cache';

import { mapAuthError } from '@/lib/auth-errors';
import { buildSubscriptionPayload } from '@/lib/subscriptions/form';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, Subscription } from '@/types';

type SubscriptionStatus = Subscription['estado'];

const VALID_STATUSES: SubscriptionStatus[] = ['activa', 'pausada', 'cancelada'];

function mapSupabaseError(message: string): string {
  return mapAuthError(message);
}

function revalidateSubscriptionViews(): void {
  revalidatePath('/dashboard/subscriptions');
  revalidatePath('/dashboard');
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

  const { error } = await supabase.from('subscriptions').insert({
    ...subscriptionData,
    user_id: user.id,
    estado: 'activa',
  });

  if (error) {
    return { success: false, error: mapSupabaseError(error.message) };
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

  revalidateSubscriptionViews();
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

  revalidateSubscriptionViews();
  return { success: true };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);

  if (error) {
    return { success: false, error: mapSupabaseError(error.message) };
  }

  revalidateSubscriptionViews();
  return { success: true };
}
