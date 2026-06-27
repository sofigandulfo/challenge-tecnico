import { calcularProximoCobro, type FrecuenciaBilling } from '@/lib/billing';
import type { ActionResult } from '@/types';

export type SubscriptionPayload = {
  nombre: string;
  costo: number;
  frecuencia: FrecuenciaBilling;
  categoria_id: string | null;
  fecha_inicio: string;
  proximo_cobro: string;
  notas: string | null;
};

const FRECUENCIAS: FrecuenciaBilling[] = ['mensual', 'anual', 'semanal'];

function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isFrecuencia(value: string): value is FrecuenciaBilling {
  return FRECUENCIAS.includes(value as FrecuenciaBilling);
}

export function buildSubscriptionPayload(
  formData: FormData,
): ActionResult<SubscriptionPayload> {
  const nombre = getString(formData, 'nombre');
  const costoRaw = getString(formData, 'costo');
  const frecuenciaRaw = getString(formData, 'frecuencia');
  const categoriaId = getString(formData, 'categoria_id');
  const fechaInicio = getString(formData, 'fecha_inicio');
  const notas = getString(formData, 'notas');
  const costo = Number(costoRaw);

  if (!nombre) {
    return { success: false, error: 'El nombre es requerido.' };
  }

  if (!Number.isFinite(costo) || costo < 0) {
    return { success: false, error: 'El costo debe ser mayor o igual a 0.' };
  }

  if (!isFrecuencia(frecuenciaRaw)) {
    return { success: false, error: 'Selecciona una frecuencia valida.' };
  }

  if (!fechaInicio) {
    return { success: false, error: 'La fecha de inicio es requerida.' };
  }

  const fechaInicioDate = new Date(`${fechaInicio}T00:00:00.000Z`);
  if (Number.isNaN(fechaInicioDate.getTime())) {
    return { success: false, error: 'La fecha de inicio no es valida.' };
  }

  return {
    success: true,
    data: {
      nombre,
      costo,
      frecuencia: frecuenciaRaw,
      categoria_id: categoriaId || null,
      fecha_inicio: fechaInicio,
      proximo_cobro: toDateOnly(
        calcularProximoCobro(fechaInicioDate, frecuenciaRaw),
      ),
      notas: notas || null,
    },
  };
}
