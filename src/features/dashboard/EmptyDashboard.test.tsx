import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmptyDashboard } from './EmptyDashboard';

describe('EmptyDashboard', () => {
  it('muestra mensaje de estado vacio y boton placeholder', () => {
    const html = renderToStaticMarkup(createElement(EmptyDashboard));

    expect(html).toContain('Todavia no hay suscripciones');
    expect(html).toContain('Cargar datos de ejemplo');
    expect(html).toContain('type="button"');
  });
});
