import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeguridadService } from './seguridad.service.js';

describe('SeguridadService.validateUser', () => {
  const hash =
    '$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4';
  let service: SeguridadService;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn();
    service = new SeguridadService({ query } as never);
  });

  it('rechaza contraseñas del bypass en claro si no existe el usuario', async () => {
    query.mockResolvedValueOnce([]);

    await expect(
      service.validateUser('nobody', 'password1234'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza contraseñas con menos de 8 caracteres (HU10)', async () => {
    const err = await service
      .validateUser('dramos', 'corta')
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(UnauthorizedException);
    expect((err as UnauthorizedException).getResponse()).toMatchObject({
      message: expect.stringMatching(/8 caracteres/i),
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('acepta al usuario cuando argon2.verify valida el hash', async () => {
    query.mockResolvedValueOnce([
      {
        id: '10000000-0000-7000-8000-000000000007',
        username: 'dramos',
        nombres: 'Diego',
        apellidos: 'Ramos León',
        email: 'dramos@sanrafael.example.pe',
        password_hash: hash,
        activo: true,
        rol: 'admision',
        rol_descripcion: 'Registra pacientes y gestiona citas',
      },
    ]);

    await expect(argon2.verify(hash, 'password1234')).resolves.toBe(true);
    const user = await service.validateUser('dramos', 'password1234');

    expect(user.username).toBe('dramos');
    expect(user).not.toHaveProperty('password_hash');
  });
});
