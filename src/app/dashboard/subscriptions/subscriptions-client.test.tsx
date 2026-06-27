// @vitest-environment jsdom

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubscriptionWithCategory } from '@/lib/subscriptions/queries';
import type { Category } from '@/types';

vi.mock('@/app/dashboard/subscriptions/actions', () => ({
  createSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  updateSubscriptionStatus: vi.fn(),
}));

import { SubscriptionsClient } from './subscriptions-client';

const categories: Category[] = [
  {
    id: 'cat-software',
    nombre: 'Software',
    color: '#2563eb',
  },
];

const subscriptions: SubscriptionWithCategory[] = [
  {
    id: 'sub-1',
    user_id: 'user-1',
    categoria_id: 'cat-software',
    nombre: 'GitHub',
    costo: 10,
    frecuencia: 'mensual',
    fecha_inicio: '2026-01-01',
    proximo_cobro: '2026-07-01',
    estado: 'activa',
    notas: null,
    created_at: '2026-01-01T00:00:00Z',
    category: categories[0],
  },
  {
    id: 'sub-2',
    user_id: 'user-1',
    categoria_id: null,
    nombre: 'Netflix',
    costo: 15,
    frecuencia: 'mensual',
    fecha_inicio: '2026-01-01',
    proximo_cobro: '2026-07-05',
    estado: 'pausada',
    notas: null,
    created_at: '2026-01-01T00:00:00Z',
    category: null,
  },
];

describe('SubscriptionsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filtra busqueda y estado en el cliente sin enviar formularios', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <SubscriptionsClient
          subscriptions={subscriptions}
          categories={categories}
        />,
      );
    });

    expect(container.textContent).toContain('GitHub');
    expect(container.textContent).toContain('Netflix');
    expect(container.querySelector('form')).toBeNull();

    const searchInput = container.querySelector(
      'input[placeholder="Buscar por nombre"]',
    ) as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set?.call(searchInput, 'net');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.textContent).not.toContain('GitHub');
    expect(container.textContent).toContain('Netflix');

    act(() => root.unmount());
  });
});
