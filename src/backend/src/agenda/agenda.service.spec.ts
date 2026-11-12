import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaService } from './agenda.service.js';

describe('AgendaService.crearCita (HU01)', () => {
  let service: AgendaService;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn();
    service = new AgendaService({ query } as never);
  });

  it('responde 409 cuando el horario del médico ya está ocupado', async () => {
    query
      .mockResolvedValueOnce([{ id: 1 }]) // consultorio
      .mockRejectedValueOnce(
        Object.assign(new Error('exclusion violation'), { code: '23P01' }),
      );

    const err = await service
      .crearCita({
        pacienteId: '20000000-0000-7000-8000-000000000001',
        medicoId: '30000000-0000-7000-8000-000000000004',
        inicio: '2027-06-01T14:00:00.000Z',
        motivo: 'Control (dato ficticio)',
        enviarRecordatorio: true,
        creadoPor: '10000000-0000-7000-8000-000000000001',
      })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ConflictException);
    expect((err as ConflictException).message).toMatch(/horario no disponible/i);
  });

  it('lista mis citas del día para el médico de la sesión', async () => {
    query.mockResolvedValueOnce([
      {
        id: 'c1',
        inicio: '2026-11-12T15:00:00.000Z',
        fin: '2026-11-12T15:30:00.000Z',
        estado: 'programada',
        motivo: 'Control',
        pacienteId: '20000000-0000-7000-8000-000000000001',
        pacienteNombres: 'Mariana',
        pacienteApellidos: 'Torres Quispe',
        numeroDocumento: '70000001',
      },
    ]);

    const citas = await service.getMisCitas(
      '10000000-0000-7000-8000-000000000004',
      '2026-11-12',
    );

    expect(query).toHaveBeenCalledOnce();
    expect(citas).toHaveLength(1);
    expect(citas[0]?.pacienteId).toBe('20000000-0000-7000-8000-000000000001');
    expect(citas[0]?.inicio).toBe('2026-11-12T15:00:00.000Z');
  });

  it('sin día lista las citas del médico (incluye semana demo)', async () => {
    query.mockResolvedValueOnce([
      {
        id: 'c2',
        inicio: '2026-10-14T19:00:00.000Z',
        fin: '2026-10-14T19:30:00.000Z',
        estado: 'programada',
        motivo: 'Control demo',
        pacienteId: '20000000-0000-7000-8000-000000000001',
        pacienteNombres: 'Mariana',
        pacienteApellidos: 'Torres Quispe',
        numeroDocumento: '70000001',
      },
    ]);

    const citas = await service.getMisCitas('10000000-0000-7000-8000-000000000004');
    expect(query.mock.calls[0]?.[1]).toEqual(['10000000-0000-7000-8000-000000000004']);
    expect(citas[0]?.motivo).toBe('Control demo');
  });
});
