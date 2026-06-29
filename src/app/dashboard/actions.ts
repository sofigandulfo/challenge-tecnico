"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation";

import {
  calcularProximoCobro,
  generarBillingHistoryInicial,
  type FrecuenciaBilling,
} from '@/lib/billing';
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Subscription } from '@/types';

type SampleSubscription = Pick<
  Subscription,
  'nombre' | 'costo' | 'frecuencia' | 'estado'
> & {
  categoryName: string;
  monthsAgo: number;
  dayOffset: number;
};

type InsertedSampleSubscription = {
  id: string;
  costo: number | string;
  frecuencia: FrecuenciaBilling;
  fecha_inicio: string;
};

const SAMPLE_SUBSCRIPTIONS: SampleSubscription[] = [
  {
    nombre: 'Netflix',
    costo: 13.99,
    frecuencia: 'mensual',
    categoryName: 'Streaming',
    estado: 'activa',
    monthsAgo: 1,
    dayOffset: -3,
  },
  {
    nombre: 'Spotify',
    costo: 10.99,
    frecuencia: 'mensual',
    categoryName: 'Streaming',
    estado: 'activa',
    monthsAgo: 2,
    dayOffset: 4,
  },
  {
    nombre: 'AWS',
    costo: 45,
    frecuencia: 'mensual',
    categoryName: 'Servicios Cloud',
    estado: 'activa',
    monthsAgo: 3,
    dayOffset: -8,
  },
  {
    nombre: 'GitHub Copilot',
    costo: 10,
    frecuencia: 'mensual',
    categoryName: 'Software',
    estado: 'activa',
    monthsAgo: 1,
    dayOffset: 7,
  },
  {
    nombre: 'Notion',
    costo: 8,
    frecuencia: 'mensual',
    categoryName: 'Productividad',
    estado: 'pausada',
    monthsAgo: 2,
    dayOffset: -1,
  },
  {
    nombre: 'Headspace',
    costo: 70,
    frecuencia: 'anual',
    categoryName: 'Bienestar',
    estado: 'activa',
    monthsAgo: 3,
    dayOffset: 2,
  },
  {
    nombre: 'Disney+',
    costo: 13.99,
    frecuencia: 'mensual',
    categoryName: 'Entretenimiento',
    estado: 'cancelada',
    monthsAgo: 1,
    dayOffset: -12,
  },
  {
    nombre: 'Google One',
    costo: 2.99,
    frecuencia: 'mensual',
    categoryName: 'Servicios Cloud',
    estado: 'activa',
    monthsAgo: 2,
    dayOffset: 10,
  },
];

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sampleStartDate(monthsAgo: number, dayOffset: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function sampleCategoryNames(): string[] {
  return Array.from(
    new Set(SAMPLE_SUBSCRIPTIONS.map((subscription) => subscription.categoryName)),
  );
}

export async function signOut(_formData?: FormData): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();

  redirect("/login");
}

export async function loadSampleData(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { success: false, error: userError.message };
  }

  if (!user) {
    return { success: false, error: 'Inicia sesion para continuar.' };
  }

  const { data: existingSubscriptions, error: existingError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  if ((existingSubscriptions ?? []).length > 0) {
    return { success: false, error: 'Ya tenés suscripciones cargadas' };
  }

  const categoryNames = sampleCategoryNames();
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, nombre')
    .in('nombre', categoryNames);

  if (categoriesError) {
    return { success: false, error: categoriesError.message };
  }

  const categoryIdByName = new Map(
    (categories ?? []).map((category) => [category.nombre, category.id]),
  );

  if (categoryIdByName.size !== categoryNames.length) {
    return {
      success: false,
      error: 'No se encontraron todas las categorias de ejemplo',
    };
  }

  const rows = SAMPLE_SUBSCRIPTIONS.map((subscription) => {
    const fechaInicio = sampleStartDate(
      subscription.monthsAgo,
      subscription.dayOffset,
    );

    return {
      user_id: user.id,
      nombre: subscription.nombre,
      costo: subscription.costo,
      frecuencia: subscription.frecuencia,
      categoria_id: categoryIdByName.get(subscription.categoryName)!,
      fecha_inicio: toDateString(fechaInicio),
      proximo_cobro: toDateString(
        calcularProximoCobro(fechaInicio, subscription.frecuencia),
      ),
      estado: subscription.estado,
      notas: null,
    };
  });

  const { data: insertedSubscriptions, error: insertError } = await supabase
    .from('subscriptions')
    .insert(rows)
    .select('id, nombre, costo, frecuencia, fecha_inicio');

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const billingHistoryRows = (
    (insertedSubscriptions ?? []) as InsertedSampleSubscription[]
  ).flatMap((subscription) =>
    generarBillingHistoryInicial(
      new Date(`${subscription.fecha_inicio}T00:00:00.000Z`),
      subscription.frecuencia,
      Number(subscription.costo),
    ).map((row) => ({
      subscription_id: subscription.id,
      ...row,
    })),
  );

  if (billingHistoryRows.length > 0) {
    const { error: billingHistoryError } = await supabase
      .from('billing_history')
      .insert(billingHistoryRows);

    if (billingHistoryError) {
      return { success: false, error: billingHistoryError.message };
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/subscriptions');

  return { success: true };
}
