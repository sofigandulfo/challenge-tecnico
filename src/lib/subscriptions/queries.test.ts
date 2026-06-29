import { describe, expect, it, vi } from 'vitest';

import {
  getBillingHistoryBySubscriptionId,
  getCategories,
  getSubscriptionById,
  getUserSubscriptions,
} from './queries';

type QueryResult = {
  data: unknown[] | Record<string, unknown> | null;
  error: (Error & { code?: string }) | null;
};

class SupabaseQueryBuilder {
  calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(private readonly result: QueryResult) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
    return Promise.resolve(this.result);
  }

  eq(...args: unknown[]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  maybeSingle() {
    this.calls.push({ method: 'maybeSingle', args: [] });
    return Promise.resolve(this.result);
  }
}

function createSupabase(result: QueryResult) {
  const builder = new SupabaseQueryBuilder(result);
  const supabase = {
    from: vi.fn(() => builder),
  };

  return { supabase, builder };
}

describe('getUserSubscriptions', () => {
  it('trae suscripciones del usuario con category y normaliza costo numerico', async () => {
    const row = {
      id: 'sub-1',
      user_id: 'user-1',
      nombre: 'GitHub',
      costo: '120.00',
      frecuencia: 'anual',
      categoria_id: 'cat-1',
      fecha_inicio: '2026-01-01',
      proximo_cobro: '2027-01-01',
      estado: 'activa',
      notas: 'Repo privado',
      created_at: '2026-06-26T12:00:00.000Z',
      category: [{ id: 'cat-1', nombre: 'Software', color: '#F59E0B' }],
    };
    const { supabase, builder } = createSupabase({ data: [row], error: null });

    const result = await getUserSubscriptions(supabase as never);

    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(builder.calls).toEqual([
      { method: 'select', args: [expect.stringContaining('category:categories')] },
      { method: 'order', args: ['created_at', { ascending: false }] },
    ]);
    expect(result).toEqual([
      {
        ...row,
        costo: 120,
        category: { id: 'cat-1', nombre: 'Software', color: '#F59E0B' },
      },
    ]);
  });

  it('propaga errores de Supabase', async () => {
    const error = new Error('database unavailable');
    const { supabase } = createSupabase({ data: null, error });

    await expect(getUserSubscriptions(supabase as never)).rejects.toThrow(error);
  });
});

describe('getSubscriptionById', () => {
  it('devuelve la suscripcion con categoria cuando existe para el usuario actual', async () => {
    const row = {
      id: 'sub-1',
      user_id: 'user-1',
      nombre: 'GitHub',
      costo: '120.00',
      frecuencia: 'anual',
      categoria_id: 'cat-1',
      fecha_inicio: '2026-01-01',
      proximo_cobro: '2027-01-01',
      estado: 'activa',
      notas: 'Repo privado',
      created_at: '2026-06-26T12:00:00.000Z',
      category: { id: 'cat-1', nombre: 'Software', color: '#F59E0B' },
    };
    const { supabase, builder } = createSupabase({ data: row, error: null });

    const result = await getSubscriptionById(supabase as never, 'sub-1');

    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(builder.calls).toEqual([
      { method: 'select', args: [expect.stringContaining('category:categories')] },
      { method: 'eq', args: ['id', 'sub-1'] },
      { method: 'maybeSingle', args: [] },
    ]);
    expect(result).toEqual({
      ...row,
      costo: 120,
      category: { id: 'cat-1', nombre: 'Software', color: '#F59E0B' },
    });
  });

  it('devuelve null cuando la suscripcion no existe o RLS no la expone', async () => {
    const { supabase } = createSupabase({ data: null, error: null });

    await expect(getSubscriptionById(supabase as never, 'missing')).resolves.toBeNull();
  });

  it('devuelve null cuando Supabase rechaza un id con formato uuid invalido', async () => {
    const error = Object.assign(
      new Error('invalid input syntax for type uuid: "3"'),
      { code: '22P02' },
    );
    const { supabase } = createSupabase({ data: null, error });

    await expect(getSubscriptionById(supabase as never, '3')).resolves.toBeNull();
  });
});

describe('getBillingHistoryBySubscriptionId', () => {
  it('devuelve el historial ordenado por fecha descendente y normaliza monto', async () => {
    const rows = [
      {
        id: 'bill-1',
        subscription_id: 'sub-1',
        fecha: '2026-06-01',
        monto: '10.50',
      },
      {
        id: 'bill-2',
        subscription_id: 'sub-1',
        fecha: '2026-05-01',
        monto: '9.99',
      },
    ];
    const { supabase, builder } = createSupabase({ data: rows, error: null });

    const result = await getBillingHistoryBySubscriptionId(
      supabase as never,
      'sub-1',
    );

    expect(supabase.from).toHaveBeenCalledWith('billing_history');
    expect(builder.calls).toEqual([
      { method: 'select', args: ['id, subscription_id, fecha, monto'] },
      { method: 'eq', args: ['subscription_id', 'sub-1'] },
      { method: 'order', args: ['fecha', { ascending: false }] },
    ]);
    expect(result).toEqual([
      { ...rows[0], monto: 10.5 },
      { ...rows[1], monto: 9.99 },
    ]);
  });
});

describe('getCategories', () => {
  it('trae categorias ordenadas por nombre', async () => {
    const row = { id: 'cat-1', nombre: 'Software', color: '#F59E0B' };
    const { supabase, builder } = createSupabase({ data: [row], error: null });

    const result = await getCategories(supabase as never);

    expect(supabase.from).toHaveBeenCalledWith('categories');
    expect(builder.calls).toEqual([
      { method: 'select', args: ['id, nombre, color'] },
      { method: 'order', args: ['nombre', { ascending: true }] },
    ]);
    expect(result).toEqual([row]);
  });
});
