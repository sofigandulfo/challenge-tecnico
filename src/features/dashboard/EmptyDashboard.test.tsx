import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { EmptyDashboard } from './EmptyDashboard';

describe('EmptyDashboard', () => {
  it('muestra mensaje de estado vacio y acciones para crear o cargar ejemplo', () => {
    const html = renderToStaticMarkup(createElement(EmptyDashboard));

    expect(html).toContain('Todavía no agregaste ninguna suscripción.');
    expect(html).toContain('Agregar suscripción');
    expect(html).toContain('href="/dashboard/subscriptions"');
    expect(html).toContain('Cargar datos de ejemplo');
    expect(html).toContain('type="button"');
  });
});
