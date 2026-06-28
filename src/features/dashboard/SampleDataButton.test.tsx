// @vitest-environment jsdom

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadSampleData: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/dashboard/actions', () => ({
  loadSampleData: mocks.loadSampleData,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { SampleDataButton } from './SampleDataButton';

describe('SampleDataButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra un error claro cuando la carga de ejemplo falla', async () => {
    mocks.loadSampleData.mockResolvedValue({
      success: false,
      error: 'Ya tenés suscripciones cargadas',
    });
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<SampleDataButton />);
    });

    const button = container.querySelector('button') as HTMLButtonElement;

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.loadSampleData).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Ya tenés suscripciones cargadas');
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(mocks.refresh).not.toHaveBeenCalled();

    await act(async () => root.unmount());
  });

  it('refresca el dashboard cuando carga los datos de ejemplo', async () => {
    mocks.loadSampleData.mockResolvedValue({ success: true });
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<SampleDataButton />);
    });

    const button = container.querySelector('button') as HTMLButtonElement;

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.refresh).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
