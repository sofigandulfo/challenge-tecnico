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

import { loadSampleData } from './actions';

type QueryResult = {
  data?: unknown;
  error?: { message: string } | null;
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

  in(...args: unknown[]) {
    this.calls.push({ method: 'in', args });
    return Promise.resolve(this.result);
  }

  limit(...args: unknown[]) {
    this.calls.push({ method: 'limit', args });
    return Promise.resolve(this.result);
  }

  insert(...args: unknown[]) {
    this.calls.push({ method: 'insert', args });
    return this;
  }

  then(
    resolve: (value: QueryResult) => void,
    reject?: (reason: unknown) => void,
  ) {
    return Promise.resolve(this.result).then(resolve, reject);
  }
}

const insertedSampleSubscriptions = [
  {
    id: 'sub-netflix',
    nombre: 'Netflix',
    costo: 13.99,
    frecuencia: 'mensual',
    fecha_inicio: '2026-05-24',
  },
  {
    id: 'sub-spotify',
    nombre: 'Spotify',
    costo: 10.99,
    frecuencia: 'mensual',
    fecha_inicio: '2026-04-30',
  },
  {
    id: 'sub-aws',
    nombre: 'AWS',
    costo: 45,
    frecuencia: 'mensual',
    fecha_inicio: '2026-03-19',
  },
  {
    id: 'sub-copilot',
    nombre: 'GitHub Copilot',
    costo: 10,
    frecuencia: 'mensual',
    fecha_inicio: '2026-05-04',
  },
  {
    id: 'sub-notion',
    nombre: 'Notion',
    costo: 8,
    frecuencia: 'mensual',
    fecha_inicio: '2026-04-26',
  },
  {
    id: 'sub-headspace',
    nombre: 'Headspace',
    costo: 70,
    frecuencia: 'anual',
    fecha_inicio: '2026-03-29',
  },
  {
    id: 'sub-disney',
    nombre: 'Disney+',
    costo: 13.99,
    frecuencia: 'mensual',
    fecha_inicio: '2026-05-15',
  },
  {
    id: 'sub-google-one',
    nombre: 'Google One',
    costo: 2.99,
    frecuencia: 'mensual',
    fecha_inicio: '2026-05-07',
  },
];

function createSupabase({
  user = { id: 'user-1' },
  existingSubscriptions = [],
  categories = [
    { id: 'cat-streaming', nombre: 'Streaming' },
    { id: 'cat-cloud', nombre: 'Servicios Cloud' },
    { id: 'cat-software', nombre: 'Software' },
    { id: 'cat-productividad', nombre: 'Productividad' },
    { id: 'cat-bienestar', nombre: 'Bienestar' },
    { id: 'cat-entretenimiento', nombre: 'Entretenimiento' },
  ],
}: {
  user?: { id: string } | null;
  existingSubscriptions?: unknown[];
  categories?: Array<{ id: string; nombre: string }>;
} = {}) {
  const builders: Record<string, SupabaseQueryBuilder[]> = {};

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      const tableBuilders = builders[table] ?? [];
      const result =
        table === 'subscriptions' && tableBuilders.length === 0
          ? { data: existingSubscriptions, error: null }
          : table === 'subscriptions'
            ? { data: insertedSampleSubscriptions, error: null }
            : table === 'categories'
              ? { data: categories, error: null }
              : { error: null };
      const builder = new SupabaseQueryBuilder(result);
      builders[table] = [...(builders[table] ?? []), builder];
      return builder;
    }),
  };

  return { supabase, builders };
}

describe('loadSampleData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no inserta datos cuando el usuario ya tiene suscripciones', async () => {
    const { supabase } = createSupabase({
      existingSubscriptions: [{ id: 'sub-1' }],
    });
    mocks.createClient.mockReturnValue(supabase);

    const result = await loadSampleData();

    expect(result).toEqual({
      success: false,
      error: 'Ya tenés suscripciones cargadas',
    });
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('inserta ocho suscripciones de ejemplo para el usuario autenticado', async () => {
    const { supabase, builders } = createSupabase();
    mocks.createClient.mockReturnValue(supabase);

    const result = await loadSampleData();

    expect(result).toEqual({ success: true });
    expect(supabase.auth.getUser).toHaveBeenCalledOnce();
    expect(builders.subscriptions[0].calls).toEqual([
      { method: 'select', args: ['id'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'limit', args: [1] },
    ]);
    expect(builders.categories[0].calls).toEqual([
      { method: 'select', args: ['id, nombre'] },
      {
        method: 'in',
        args: [
          'nombre',
          [
            'Streaming',
            'Servicios Cloud',
            'Software',
            'Productividad',
            'Bienestar',
            'Entretenimiento',
          ],
        ],
      },
    ]);

    const insertedRows = builders.subscriptions[1].calls[0].args[0] as Array<{
      user_id: string;
      nombre: string;
      costo: number;
      frecuencia: string;
      categoria_id: string;
      estado: string;
      fecha_inicio: string;
      proximo_cobro: string;
    }>;

    expect(insertedRows).toHaveLength(8);
    expect(insertedRows.map((row) => row.nombre)).toEqual([
      'Netflix',
      'Spotify',
      'AWS',
      'GitHub Copilot',
      'Notion',
      'Headspace',
      'Disney+',
      'Google One',
    ]);
    expect(insertedRows).toContainEqual(
      expect.objectContaining({
        user_id: 'user-1',
        nombre: 'Notion',
        costo: 8,
        frecuencia: 'mensual',
        categoria_id: 'cat-productividad',
        estado: 'pausada',
      }),
    );
    expect(insertedRows).toContainEqual(
      expect.objectContaining({
        nombre: 'Disney+',
        estado: 'cancelada',
        categoria_id: 'cat-entretenimiento',
      }),
    );
    expect(insertedRows.every((row) => row.proximo_cobro > '2026-06-27')).toBe(
      true,
    );
    expect(builders.subscriptions[1].calls[1]).toEqual({
      method: 'select',
      args: ['id, nombre, costo, frecuencia, fecha_inicio'],
    });
    expect(builders.billing_history[0].calls).toEqual([
      {
        method: 'insert',
        args: [
          expect.arrayContaining([
            {
              subscription_id: 'sub-copilot',
              fecha: '2026-05-04',
              monto: 10,
            },
            {
              subscription_id: 'sub-copilot',
              fecha: '2026-06-04',
              monto: 10,
            },
          ]),
        ],
      },
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      '/dashboard/subscriptions',
    );
  });
});
