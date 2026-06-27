import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  createClient: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

import { signUp } from './actions';

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mocks.createClient.mockReturnValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signUp: mocks.signUp,
      },
    });
    mocks.headers.mockReturnValue({
      get: (name: string) =>
        name.toLowerCase() === 'origin' ? 'https://app.example.com' : null,
    });
    mocks.signUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('configura el callback de auth con el origin del request', async () => {
    const formData = new FormData();
    formData.set('email', 'sofia@example.com');
    formData.set('password', 'secret123');

    await signUp(null, formData);

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'sofia@example.com',
      password: 'secret123',
      options: {
        emailRedirectTo: 'https://app.example.com/auth/callback',
      },
    });
  });

  it('prefiere NEXT_PUBLIC_SITE_URL para construir el callback', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://prod.example.com/';
    const formData = new FormData();
    formData.set('email', 'sofia@example.com');
    formData.set('password', 'secret123');

    await signUp(null, formData);

    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          emailRedirectTo: 'https://prod.example.com/auth/callback',
        },
      }),
    );
  });
});
