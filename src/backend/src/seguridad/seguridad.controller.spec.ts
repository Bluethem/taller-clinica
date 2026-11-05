import { describe, expect, it, vi } from 'vitest';
import { SeguridadController } from './seguridad.controller.js';

describe('SeguridadController', () => {
  const user = { username: 'dramos', rol: 'admision' };
  const controller = new SeguridadController();

  it('login devuelve el usuario autenticado por Passport', () => {
    expect(controller.login({ user } as never)).toEqual({
      success: true,
      user,
    });
  });

  it('me devuelve el usuario de la sesión', () => {
    expect(controller.me({ user } as never)).toEqual({ user });
  });

  it('logout destruye la sesión y limpia la cookie', async () => {
    const destroy = vi.fn((done: () => void) => done());
    const request = {
      logout: (done: (error?: Error) => void) => done(),
      session: { destroy },
    };
    const response = { clearCookie: vi.fn() };

    await expect(
      controller.logout(request as never, response as never),
    ).resolves.toEqual({
      success: true,
    });
    expect(destroy).toHaveBeenCalledOnce();
    expect(response.clearCookie).toHaveBeenCalledWith('sigc.sid');
  });
});
