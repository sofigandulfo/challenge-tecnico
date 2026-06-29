import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

import { createSubscription } from './actions';

type QueryResult = {
  data?: unknown;
  error?: { message: string } | null;
};

class SupabaseQueryBuilder {
  calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(
    private readonly table: string,
    private readonly results: Record<string, QueryResult>,
  ) {}

  insert(...args: unknown[]) {
    this.calls.push({ method: 'insert', args });
    return this;
  }

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  single() {
    this.calls.push({ method: 'single', args: [] });
    return Promise.resolve(this.results[this.table]);
  }

  then(
    resolve: (value: QueryResult) => void,
    reject?: (reason: unknown) => void,
  ) {
    return Promise.resolve(this.results[this.table]).then(resolve, reject);
  }
}

function createSupabase() {
  const builders: Record<string, SupabaseQueryBuilder[]> = {};
  const results = {
    subscriptions: { data: { id: 'sub-1' }, error: null },
    billing_history: { error: null },
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      const builder = new SupabaseQueryBuilder(table, results);
      builders[table] = [...(builders[table] ?? []), builder];
      return builder;
    }),
  };

  return { supabase, builders };
}

function buildFormData() {
  const formData = new FormData();
  formData.set('nombre', 'Netflix');
  formData.set('costo', '12.99');
  formData.set('frecuencia', 'mensual');
  formData.set('categoria_id', '');
  formData.set('fecha_inicio', '2025-01-15');
  formData.set('notas', '');
  return formData;
}

describe('createSubscription', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-15T12:00:00.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('crea billing_history inicial para cada ciclo ya ocurrido', async () => {
    const { supabase, builders } = createSupabase();
    mocks.createClient.mockReturnValue(supabase);

    const result = await createSubscription(null, buildFormData());

    expect(result).toEqual({ success: true });
    expect(builders.subscriptions[0].calls).toEqual([
      {
        method: 'insert',
        args: [
          {
            nombre: 'Netflix',
            costo: 12.99,
            frecuencia: 'mensual',
            categoria_id: null,
            fecha_inicio: '2025-01-15',
            proximo_cobro: '2025-06-15',
            notas: null,
            user_id: 'user-1',
            estado: 'activa',
          },
        ],
      },
      { method: 'select', args: ['id'] },
      { method: 'single', args: [] },
    ]);
    expect(builders.billing_history[0].calls).toEqual([
      {
        method: 'insert',
        args: [
          [
            { subscription_id: 'sub-1', fecha: '2025-01-15', monto: 12.99 },
            { subscription_id: 'sub-1', fecha: '2025-02-15', monto: 12.99 },
            { subscription_id: 'sub-1', fecha: '2025-03-15', monto: 12.99 },
            { subscription_id: 'sub-1', fecha: '2025-04-15', monto: 12.99 },
            { subscription_id: 'sub-1', fecha: '2025-05-15', monto: 12.99 },
          ],
        ],
      },
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      '/dashboard/subscriptions',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});
