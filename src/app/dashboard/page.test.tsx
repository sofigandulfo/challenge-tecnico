import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardSubscription } from '@/features/dashboard/calculations';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ name: 'supabase-client' })),
  getSubscriptions: vi.fn(),
  getUpcomingSubscriptions: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/features/dashboard/queries', () => ({
  getSubscriptions: mocks.getSubscriptions,
  getUpcomingSubscriptions: mocks.getUpcomingSubscriptions,
}));

vi.mock('@/features/dashboard/GastoPorCategoriaChart', () => ({
  GastoPorCategoriaChart: ({
    data,
  }: {
    data: Array<{ nombre: string; total: number }>;
  }) =>
    createElement(
      'div',
      { 'data-testid': 'chart' },
      data.map((item) => item.nombre).join(','),
    ),
}));

import DashboardPage from './page';

const subscription: DashboardSubscription = {
  id: 'sub-1',
  nombre: 'GitHub',
  costo: 120,
  frecuencia: 'anual',
  estado: 'activa',
  proximo_cobro: '2026-07-01',
  category: {
    nombre: 'Software',
    color: '#F59E0B',
  },
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra EmptyDashboard cuando no hay suscripciones', async () => {
    mocks.getSubscriptions.mockResolvedValue([]);
    mocks.getUpcomingSubscriptions.mockResolvedValue([]);

    const element = await DashboardPage();
    const html = renderToStaticMarkup(element);

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.getSubscriptions).toHaveBeenCalledWith({
      name: 'supabase-client',
    });
    expect(mocks.getUpcomingSubscriptions).toHaveBeenCalledWith({
      name: 'supabase-client',
    });
    expect(html).toContain('Todavia no hay suscripciones');
    expect(html).toContain('Cargar datos de ejemplo');
    expect(html).not.toContain('Gasto mensual');
  });

  it('muestra metricas, grafico y proximos vencimientos con datos reales', async () => {
    mocks.getSubscriptions.mockResolvedValue([subscription]);
    mocks.getUpcomingSubscriptions.mockResolvedValue([subscription]);

    const element = await DashboardPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Dashboard');
    expect(html).toContain('Gasto mensual');
    expect(html).toContain('$10.00');
    expect(html).toContain('Software');
    expect(html).toContain('GitHub');
    expect(html).not.toContain('Todavia no hay suscripciones');
  });
});
