import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PacientesService } from './pacientes.service.js';

describe('PacientesService.crearPaciente (HU06)', () => {
  let service: PacientesService;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn();
    service = new PacientesService({ query } as never);
  });

  it('rechaza un DNI que no tiene 8 dígitos y no inserta', async () => {
    const err = await service
      .crearPaciente({
        tipoDocumento: 'DNI',
        numeroDocumento: '1234567',
        nombres: 'Ana',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'López',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
      })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(BadRequestException);
    expect((err as BadRequestException).message).toMatch(/8 dígitos/i);
    expect(query).not.toHaveBeenCalled();
  });
});
