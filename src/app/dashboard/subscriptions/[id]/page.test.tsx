import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubscriptionWithCategory } from '@/lib/subscriptions/queries';
import type { BillingHistory, Category } from '@/types';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ name: 'supabase-client' })),
  getBillingHistoryBySubscriptionId: vi.fn(),
  getCategories: vi.fn(),
  getSubscriptionById: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/subscriptions/queries', () => ({
  getBillingHistoryBySubscriptionId: mocks.getBillingHistoryBySubscriptionId,
  getCategories: mocks.getCategories,
  getSubscriptionById: mocks.getSubscriptionById,
}));

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}));

vi.mock('./subscription-detail-actions', () => ({
  SubscriptionDetailActions: () =>
    createElement('div', null, 'Acciones de detalle'),
}));

import SubscriptionDetailPage from './page';

const category: Category = {
  id: 'cat-software',
  nombre: 'Software',
  color: '#2563eb',
};

const subscription: SubscriptionWithCategory = {
  id: 'sub-1',
  user_id: 'user-1',
  categoria_id: category.id,
  nombre: 'GitHub',
  costo: 10,
  frecuencia: 'mensual',
  fecha_inicio: '2026-01-01',
  proximo_cobro: '2026-07-01',
  estado: 'activa',
  notas: null,
  created_at: '2026-01-01T00:00:00Z',
  category,
};

describe('SubscriptionDetailPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
    vi.clearAllMocks();
    mocks.getCategories.mockResolvedValue([category]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra estado vacio cuando no hay billing_history', async () => {
    mocks.getSubscriptionById.mockResolvedValue({
      ...subscription,
      fecha_inicio: '2026-07-01',
      proximo_cobro: '2026-07-01',
    });
    mocks.getBillingHistoryBySubscriptionId.mockResolvedValue([]);

    const element = await SubscriptionDetailPage({ params: { id: 'sub-1' } });
    const html = renderToStaticMarkup(element);

    expect(mocks.getSubscriptionById).toHaveBeenCalledWith(
      { name: 'supabase-client' },
      'sub-1',
    );
    expect(html).toContain('GitHub');
    expect(html).toContain(
      'Todav\u00eda no hay cobros registrados para esta suscripci\u00f3n',
    );
    expect(html).not.toContain('<table');
  });

  it('muestra historial calculado cuando la suscripcion pasada todavia no tiene billing_history', async () => {
    mocks.getSubscriptionById.mockResolvedValue({
      ...subscription,
      fecha_inicio: '2026-02-26',
      proximo_cobro: '2026-07-26',
    });
    mocks.getBillingHistoryBySubscriptionId.mockResolvedValue([]);

    const element = await SubscriptionDetailPage({ params: { id: 'sub-1' } });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('<table');
    expect(html).toContain('26/06/2026');
    expect(html).toContain('26/05/2026');
    expect(html).toContain('$10.00');
    expect(html).not.toContain(
      'Todav\u00eda no hay cobros registrados para esta suscripci\u00f3n',
    );
  });

  it('muestra la tabla de historial cuando hay cobros registrados', async () => {
    const billingHistory: BillingHistory[] = [
      {
        id: 'bill-1',
        subscription_id: 'sub-1',
        fecha: '2026-06-01',
        monto: 10,
      },
      {
        id: 'bill-2',
        subscription_id: 'sub-1',
        fecha: '2026-05-01',
        monto: 9,
      },
    ];
    mocks.getSubscriptionById.mockResolvedValue(subscription);
    mocks.getBillingHistoryBySubscriptionId.mockResolvedValue(billingHistory);

    const element = await SubscriptionDetailPage({ params: { id: 'sub-1' } });
    const html = renderToStaticMarkup(element);

    expect(mocks.getBillingHistoryBySubscriptionId).toHaveBeenCalledWith(
      { name: 'supabase-client' },
      'sub-1',
    );
    expect(html).toContain('<table');
    expect(html).toContain('01/06/2026');
    expect(html).toContain('$10.00');
    expect(html).toContain('01/05/2026');
    expect(html).not.toContain(
      'Todav\u00eda no hay cobros registrados para esta suscripci\u00f3n',
    );
  });

  it('usa notFound cuando la suscripcion no existe o no pertenece al usuario', async () => {
    mocks.getSubscriptionById.mockResolvedValue(null);

    await expect(
      SubscriptionDetailPage({ params: { id: 'missing' } }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.getBillingHistoryBySubscriptionId).not.toHaveBeenCalled();
  });

  it('usa notFound cuando el id no tiene formato uuid valido', async () => {
    mocks.getSubscriptionById.mockResolvedValue(null);

    await expect(
      SubscriptionDetailPage({ params: { id: '3' } }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.getSubscriptionById).toHaveBeenCalledWith(
      { name: 'supabase-client' },
      '3',
    );
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.getBillingHistoryBySubscriptionId).not.toHaveBeenCalled();
  });
});
