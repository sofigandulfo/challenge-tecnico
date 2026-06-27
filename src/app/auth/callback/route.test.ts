import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

import { GET } from './route';

describe('auth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue({
      auth: {
        exchangeCodeForSession: mocks.exchangeCodeForSession,
      },
    });
  });

  it('intercambia el code por una sesion y redirige al dashboard', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request('https://app.example.com/auth/callback?code=abc-123') as never,
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('abc-123');
    expect(response.headers.get('location')).toBe(
      'https://app.example.com/dashboard',
    );
  });

  it('redirige al login con mensaje cuando Supabase rechaza el code', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error('invalid code'),
    });

    const response = await GET(
      new Request('https://app.example.com/auth/callback?code=bad') as never,
    );
    const location = response.headers.get('location');

    expect(location).toContain('https://app.example.com/login');
    expect(location).toContain('message=');
  });
});
