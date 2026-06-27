import { describe, expect, it, vi } from 'vitest';

import { getCategories, getUserSubscriptions } from './queries';

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
