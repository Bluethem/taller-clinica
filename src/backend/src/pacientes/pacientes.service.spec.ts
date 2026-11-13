import { BadRequestException, NotFoundException } from '@nestjs/common';
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

describe('PacientesService.getFicha', () => {
  let service: PacientesService;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn();
    service = new PacientesService({ query } as never);
  });

  it('lanza NotFoundException si el paciente no existe', async () => {
    query.mockResolvedValueOnce([]);
    await expect(
      service.getFicha('20000000-0000-7000-8000-000000000099'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('devuelve demografía, antecedentes y citas recientes', async () => {
    const id = '20000000-0000-7000-8000-000000000001';
    query
      .mockResolvedValueOnce([
        {
          id,
          tipo_documento: 'DNI',
          numero_documento: '70000001',
          nombres: 'Mariana',
          apellido_paterno: 'Torres',
          apellido_materno: 'Quispe',
          fecha_nacimiento: '1988-03-14',
          sexo: 'F',
          telefono: '900000001',
          email: 'mariana.torres@example.pe',
          direccion: 'Av. Ficticia 101, San Borja',
          canal_recordatorio: 'email',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'a1',
          tipo: 'alergia',
          descripcion: 'Alergia a penicilina',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'c1',
          inicio: '2026-10-14T15:00:00.000Z',
          fin: '2026-10-14T15:30:00.000Z',
          estado: 'programada',
          motivo: 'Control',
          medico_nombre: 'Andrés Huamán Torres',
        },
      ]);

    const ficha = await service.getFicha(id);

    expect(ficha.id).toBe(id);
    expect(ficha.numeroDocumento).toBe('70000001');
    expect(ficha.antecedentes).toHaveLength(1);
    expect(ficha.citasRecientes[0].estado).toBe('programada');
    expect(query).toHaveBeenCalledTimes(3);
  });
});
