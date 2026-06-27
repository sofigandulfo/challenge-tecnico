// @vitest-environment jsdom

import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('acepta refs para integrarse con Radix asChild', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const ref = createRef<HTMLButtonElement>();

    act(() => {
      root.render(<Button ref={ref}>Guardar</Button>);
    });

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Guardar');

    act(() => root.unmount());
  });
});
