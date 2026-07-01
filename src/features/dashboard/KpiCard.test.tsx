import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('muestra el label y el valor destacado', () => {
    const html = renderToStaticMarkup(
      createElement(KpiCard, { label: 'Gasto mensual', value: '$145.00' }),
    );

    expect(html).toContain('Gasto mensual');
    expect(html).toContain('$145.00');
    expect(html).toContain('text-6xl');
    expect(html).toContain('Estimado según suscripciones activas.');
  });
});
