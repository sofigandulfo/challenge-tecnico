import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { DashboardSubscription } from './calculations';
import { ProximosVencimientos } from './ProximosVencimientos';

function subscription(index: number): DashboardSubscription {
  return {
    id: `sub-${index}`,
    nombre: `Servicio ${index}`,
    costo: 10 + index,
    frecuencia: 'mensual',
    estado: 'activa',
    proximo_cobro: `2026-07-0${index}`,
    category: {
      nombre: 'Software',
      color: '#F59E0B',
    },
  };
}

describe('ProximosVencimientos', () => {
  it('muestra el mensaje vacio cuando no hay cobros proximos', () => {
    const html = renderToStaticMarkup(
      createElement(ProximosVencimientos, { subscriptions: [] }),
    );

    expect(html).toContain('No hay cobros');
    expect(html).toContain('7');
  });

  it('muestra hasta cinco suscripciones con categoria, fecha y monto', () => {
    const html = renderToStaticMarkup(
      createElement(ProximosVencimientos, {
        subscriptions: [
          subscription(1),
          subscription(2),
          subscription(3),
          subscription(4),
          subscription(5),
          subscription(6),
        ],
      }),
    );

    expect(html).toContain('Servicio 1');
    expect(html).toContain('Software');
    expect(html).toContain('$11.00');
    expect(html).toContain('jul');
    expect(html).toContain('Servicio 5');
    expect(html).not.toContain('Servicio 6');
  });

  it('usa categoria fallback cuando la suscripcion no tiene categoria', () => {
    const html = renderToStaticMarkup(
      createElement(ProximosVencimientos, {
        subscriptions: [{ ...subscription(1), category: null }],
      }),
    );

    expect(html).toContain('Sin categoria');
  });
});
