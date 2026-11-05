import { describe, expect, it } from 'vitest';
import { createSessionOptions } from './session.config.js';

describe('createSessionOptions', () => {
  it('configura cookie rolling de diez minutos y la tabla seguridad.sesion', () => {
    const options = createSessionOptions({
      DATABASE_URL: 'postgresql://sigc:sigc@localhost:55432/sigc',
      SESSION_SECRET: 'test-secret',
      NODE_ENV: 'test',
    });
    const cookie = options.cookie;
    if (!cookie || typeof cookie === 'function') {
      throw new TypeError('La configuración debe usar CookieOptions estáticas.');
    }

    expect(options.name).toBe('sigc.sid');
    expect(options.rolling).toBe(true);
    expect(cookie.maxAge).toBe(600_000);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('lax');
    expect(cookie.secure).toBe(false);
    expect(options.store).toBeDefined();
  });
});
