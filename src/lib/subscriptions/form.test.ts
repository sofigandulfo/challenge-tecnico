import { describe, expect, it, vi } from 'vitest';

import { buildSubscriptionPayload } from './form';

vi.mock('@/lib/billing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/billing')>(
    '@/lib/billing',
  );

  return {
    ...actual,
    calcularProximoCobro: vi.fn(() => new Date('2026-07-26T00:00:00.000Z')),
  };
});

describe('buildSubscriptionPayload', () => {
  it('valida campos requeridos y costo no negativo', () => {
    const formData = new FormData();
    formData.set('nombre', ' ');
    formData.set('costo', '-1');
    formData.set('frecuencia', 'mensual');
    formData.set('fecha_inicio', '');

    const result = buildSubscriptionPayload(formData);

    expect(result).toEqual({
      success: false,
      error: 'El nombre es requerido.',
    });
  });

  it('arma payload limpio y calcula proximo_cobro con billing', async () => {
    const { calcularProximoCobro } = await import('@/lib/billing');
    const formData = new FormData();
    formData.set('nombre', ' GitHub ');
    formData.set('costo', '120.50');
    formData.set('frecuencia', 'anual');
    formData.set('categoria_id', 'cat-1');
    formData.set('fecha_inicio', '2026-06-26');
    formData.set('notas', ' Plan anual ');

    const result = buildSubscriptionPayload(formData);

    expect(result).toEqual({
      success: true,
      data: {
        nombre: 'GitHub',
        costo: 120.5,
        frecuencia: 'anual',
        categoria_id: 'cat-1',
        fecha_inicio: '2026-06-26',
        proximo_cobro: '2026-07-26',
        notas: 'Plan anual',
      },
    });
    expect(calcularProximoCobro).toHaveBeenCalledWith(
      new Date('2026-06-26T00:00:00.000Z'),
      'anual',
    );
  });

  it('convierte categoria y notas vacias a null', () => {
    const formData = new FormData();
    formData.set('nombre', 'Netflix');
    formData.set('costo', '10');
    formData.set('frecuencia', 'mensual');
    formData.set('categoria_id', '');
    formData.set('fecha_inicio', '2026-06-26');
    formData.set('notas', ' ');

    const result = buildSubscriptionPayload(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data!.categoria_id).toBeNull();
      expect(result.data!.notas).toBeNull();
    }
  });
});
