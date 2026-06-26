import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSubscriptions, getUpcomingSubscriptions } from './queries';

type QueryResult = {
  data: unknown[] | null;
  error: Error | null;
};

class SupabaseQueryBuilder {
  calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(private readonly result: QueryResult) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: unknown[]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  gte(...args: unknown[]) {
    this.calls.push({ method: 'gte', args });
    return this;
  }

  lte(...args: unknown[]) {
    this.calls.push({ method: 'lte', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
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

const row = {
  id: 'sub-1',
  nombre: 'GitHub',
  costo: '120.00',
  frecuencia: 'anual',
  estado: 'activa',
  proximo_cobro: '2026-07-01',
  category: [{ nombre: 'Software', color: '#F59E0B' }],
};

describe('getSubscriptions', () => {
  it('trae suscripciones con categoria y normaliza el costo numerico', async () => {
    const { supabase, builder } = createSupabase({
      data: [row],
      error: null,
    });

    const result = await getSubscriptions(supabase as never);

    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(builder.calls).toEqual([
      { method: 'select', args: [expect.stringContaining('category:categories')] },
      { method: 'order', args: ['created_at', { ascending: false }] },
    ]);
    expect(result).toEqual([
      {
        ...row,
        costo: 120,
        category: { nombre: 'Software', color: '#F59E0B' },
      },
    ]);
  });

  it('propaga errores de Supabase', async () => {
    const error = new Error('database unavailable');
    const { supabase } = createSupabase({ data: null, error });

    await expect(getSubscriptions(supabase as never)).rejects.toThrow(error);
  });
});

describe('getUpcomingSubscriptions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('filtra suscripciones activas con proximo cobro en los siguientes 7 dias', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-26T12:00:00.000Z'));

    const { supabase, builder } = createSupabase({
      data: [{ ...row, category: null }],
      error: null,
    });

    const result = await getUpcomingSubscriptions(supabase as never);

    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(builder.calls).toEqual([
      { method: 'select', args: [expect.stringContaining('category:categories')] },
      { method: 'eq', args: ['estado', 'activa'] },
      { method: 'gte', args: ['proximo_cobro', '2026-06-26'] },
      { method: 'lte', args: ['proximo_cobro', '2026-07-03'] },
      { method: 'order', args: ['proximo_cobro', { ascending: true }] },
    ]);
    expect(result).toEqual([{ ...row, costo: 120, category: null }]);
  });
});
