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
});
