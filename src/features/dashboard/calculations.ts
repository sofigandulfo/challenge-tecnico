import { normalizarAMensual, type FrecuenciaBilling } from '@/lib/billing';

export type DashboardSubscription = {
  id: string;
  nombre: string;
  costo: number;
  frecuencia: FrecuenciaBilling;
  estado: 'activa' | 'pausada' | 'cancelada';
  proximo_cobro: string;
  category: {
    nombre: string;
    color: string;
  } | null;
};

export type GastoPorCategoria = {
  nombre: string;
  color: string;
  total: number;
};

const CATEGORIA_FALLBACK = {
  nombre: 'Sin categoría',
  color: '#94A3B8',
};

function redondearADosDecimales(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularGastoMensualTotal(
  subscriptions: DashboardSubscription[],
): number {
  const total = subscriptions
    .filter((subscription) => subscription.estado === 'activa')
    .reduce(
      (acumulado, subscription) =>
        acumulado +
        normalizarAMensual(subscription.costo, subscription.frecuencia),
      0,
    );

  return redondearADosDecimales(total);
}

export function calcularGastoPorCategoria(
  subscriptions: DashboardSubscription[],
): GastoPorCategoria[] {
  const categorias = new Map<string, GastoPorCategoria>();

  subscriptions
    .filter((subscription) => subscription.estado === 'activa')
    .forEach((subscription) => {
      const category = subscription.category ?? CATEGORIA_FALLBACK;
      const key = `${category.nombre}-${category.color}`;
      const gastoMensual = normalizarAMensual(
        subscription.costo,
        subscription.frecuencia,
      );
      const actual = categorias.get(key);

      if (!actual) {
        categorias.set(key, {
          nombre: category.nombre,
          color: category.color,
          total: gastoMensual,
        });
        return;
      }

      actual.total = redondearADosDecimales(actual.total + gastoMensual);
    });

  return Array.from(categorias.values());
}
