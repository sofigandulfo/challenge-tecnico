import { describe, expect, it } from 'vitest';

import {
  calcularGastoMensualTotal,
  calcularGastoPorCategoria,
  type DashboardSubscription,
} from './calculations';

const subscriptionBase: DashboardSubscription = {
  id: 'sub-1',
  nombre: 'Base',
  costo: 10,
  frecuencia: 'mensual',
  estado: 'activa',
  proximo_cobro: '2026-07-01',
  category: {
    nombre: 'Productividad',
    color: '#6366F1',
  },
};

function subscription(
  overrides: Partial<DashboardSubscription>,
): DashboardSubscription {
  return {
    ...subscriptionBase,
    ...overrides,
    category:
      overrides.category === undefined
        ? subscriptionBase.category
        : overrides.category,
  };
}

describe('calcularGastoMensualTotal', () => {
  it('suma solo suscripciones activas normalizadas a mensual', () => {
    const subscriptions = [
      subscription({ id: 'mensual', costo: 20, frecuencia: 'mensual' }),
      subscription({ id: 'anual', costo: 120, frecuencia: 'anual' }),
      subscription({ id: 'semanal', costo: 5, frecuencia: 'semanal' }),
      subscription({ id: 'pausada', costo: 99, estado: 'pausada' }),
      subscription({ id: 'cancelada', costo: 99, estado: 'cancelada' }),
    ];

    expect(calcularGastoMensualTotal(subscriptions)).toBe(51.65);
  });

  it('devuelve cero cuando no hay suscripciones activas', () => {
    const subscriptions = [
      subscription({ id: 'pausada', estado: 'pausada' }),
      subscription({ id: 'cancelada', estado: 'cancelada' }),
    ];

    expect(calcularGastoMensualTotal(subscriptions)).toBe(0);
  });
});

describe('calcularGastoPorCategoria', () => {
  it('agrupa el gasto mensual activo por nombre y color de categoria', () => {
    const subscriptions = [
      subscription({
        id: 'notion',
        costo: 12,
        category: { nombre: 'Productividad', color: '#6366F1' },
      }),
      subscription({
        id: 'office',
        costo: 120,
        frecuencia: 'anual',
        category: { nombre: 'Productividad', color: '#6366F1' },
      }),
      subscription({
        id: 'cloud',
        costo: 4,
        frecuencia: 'semanal',
        category: { nombre: 'Servicios Cloud', color: '#0078D4' },
      }),
      subscription({
        id: 'inactive',
        costo: 100,
        estado: 'pausada',
        category: { nombre: 'Servicios Cloud', color: '#0078D4' },
      }),
    ];

    expect(calcularGastoPorCategoria(subscriptions)).toEqual([
      { nombre: 'Productividad', color: '#6366F1', total: 22 },
      { nombre: 'Servicios Cloud', color: '#0078D4', total: 17.32 },
    ]);
  });

  it('usa una categoria fallback cuando la suscripcion no tiene categoria', () => {
    const subscriptions = [
      subscription({ id: 'sin-categoria-1', costo: 8, category: null }),
      subscription({
        id: 'sin-categoria-2',
        costo: 24,
        frecuencia: 'anual',
        category: null,
      }),
    ];

    expect(calcularGastoPorCategoria(subscriptions)).toEqual([
      { nombre: 'Sin categoria', color: '#94A3B8', total: 10 },
    ]);
  });

  it('devuelve un array vacio cuando no hay gasto activo por categoria', () => {
    const subscriptions = [
      subscription({ id: 'pausada', estado: 'pausada' }),
      subscription({ id: 'cancelada', estado: 'cancelada' }),
    ];

    expect(calcularGastoPorCategoria(subscriptions)).toEqual([]);
  });
});
