import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthenticatedGuard } from './guards/authenticated.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { LocalStrategy } from './local.strategy.js';
import { SessionSerializer } from './session.serializer.js';
import type { UserSession } from './seguridad.service.js';

const user: UserSession = {
  id: 'user-id',
  username: 'dramos',
  nombres: 'Diego',
  apellidos: 'Ramos León',
  email: 'dramos@sanrafael.example.pe',
  rol: 'admision',
  rolDescripcion: 'Admisión',
};

function contextWith(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => contextWith,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe('componentes de autenticación', () => {
  it('LocalStrategy delega la validación de credenciales al servicio', async () => {
    const validateUser = vi.fn().mockResolvedValue(user);
    const strategy = new LocalStrategy({ validateUser } as never);

    await expect(strategy.validate('dramos', 'password1234')).resolves.toEqual(
      user,
    );
    expect(validateUser).toHaveBeenCalledWith('dramos', 'password1234');
  });

  it('SessionSerializer conserva el usuario de sesión', () => {
    const serializer = new SessionSerializer();
    const serialized = vi.fn();
    const deserialized = vi.fn();

    serializer.serializeUser(user, serialized);
    serializer.deserializeUser(user, deserialized);

    expect(serialized).toHaveBeenCalledWith(null, user);
    expect(deserialized).toHaveBeenCalledWith(null, user);
  });

  it('AuthenticatedGuard rechaza peticiones sin sesión Passport', () => {
    const guard = new AuthenticatedGuard();
    const context = contextWith({ isAuthenticated: () => false });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('LocalAuthGuard crea la sesión Passport después de autenticar', async () => {
    const guard = new LocalAuthGuard();
    const parent = Object.getPrototypeOf(LocalAuthGuard.prototype) as {
      canActivate: (context: ExecutionContext) => Promise<boolean>;
      logIn: (request: object) => Promise<void>;
    };
    const canActivate = vi.spyOn(parent, 'canActivate').mockResolvedValue(true);
    const logIn = vi.spyOn(parent, 'logIn').mockResolvedValue();
    const request = {};
    const context = contextWith(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(canActivate).toHaveBeenCalledWith(context);
    expect(logIn).toHaveBeenCalledWith(request);
  });

  it('RolesGuard rechaza un rol fuera de la metadata declarada', () => {
    const reflector = { getAllAndOverride: () => ['administrador'] };
    const guard = new RolesGuard(reflector as never);

    expect(() => guard.canActivate(contextWith({ user }))).toThrow(
      ForbiddenException,
    );
  });

  it('RolesGuard permite rutas sin metadata de roles', () => {
    const reflector = { getAllAndOverride: () => undefined };
    const guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(contextWith({}))).toBe(true);
  });
});
