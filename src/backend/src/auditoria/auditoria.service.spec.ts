import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditoriaService } from './auditoria.service.js';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn().mockResolvedValue([]);
    service = new AuditoriaService({ query } as never);
  });

  it('inserta LECTURA con paciente y recurso', async () => {
    await service.registrar({
      usuarioId: '10000000-0000-7000-8000-000000000001',
      accion: 'LECTURA',
      recurso: 'hce.entrada',
      pacienteId: '20000000-0000-7000-8000-000000000001',
      detalle: { via: 'GET /historia/:id' },
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auditoria.bitacora'),
      expect.arrayContaining([
        '10000000-0000-7000-8000-000000000001',
        'LECTURA',
        'hce.entrada',
        '20000000-0000-7000-8000-000000000001',
      ]),
    );
  });

  it('completa nulos y json vacío cuando faltan opcionales (ej. LOGIN_FALLIDO)', async () => {
    await service.registrar({
      usuarioId: null,
      accion: 'LOGIN_FALLIDO',
      recurso: 'seguridad.sesion',
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auditoria.bitacora'),
      [null, 'LOGIN_FALLIDO', 'seguridad.sesion', null, null, null, '{}'],
    );
  });

  it('normaliza una IP vacía a null', async () => {
    await service.registrar({
      usuarioId: null,
      accion: 'LOGIN_FALLIDO',
      recurso: 'seguridad.sesion',
      ip: '   ',
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auditoria.bitacora'),
      [null, 'LOGIN_FALLIDO', 'seguridad.sesion', null, null, null, '{}'],
    );
  });

  it('listarPorPaciente ordena por ocurrio_en DESC y mapea campos a camelCase', async () => {
    query.mockResolvedValueOnce([
      {
        id: 'a1',
        ocurrio_en: '2026-11-26T12:00:00.000Z',
        usuario_id: 'u1',
        accion: 'LECTURA',
        recurso: 'hce.entrada',
        recurso_id: null,
        detalle: {},
      },
      {
        id: 42,
        ocurrio_en: new Date('2026-11-26T11:00:00.000Z'),
        usuario_id: null,
        accion: 'ANULACION',
        recurso: 'hce.anulacion',
        recurso_id: 'r2',
        detalle: { motivo: 'Corrección' },
      },
    ]);
    const rows = await service.listarPorPaciente(
      '20000000-0000-7000-8000-000000000001',
    );
    expect(query.mock.calls[0][0]).toMatch(/ORDER BY ocurrio_en DESC/i);
    expect(query.mock.calls[0][1]).toEqual([
      '20000000-0000-7000-8000-000000000001',
    ]);
    expect(rows).toEqual([
      {
        id: 'a1',
        ocurrioEn: '2026-11-26T12:00:00.000Z',
        usuarioId: 'u1',
        accion: 'LECTURA',
        recurso: 'hce.entrada',
        recursoId: null,
        detalle: {},
      },
      {
        id: '42',
        ocurrioEn: '2026-11-26T11:00:00.000Z',
        usuarioId: null,
        accion: 'ANULACION',
        recurso: 'hce.anulacion',
        recursoId: 'r2',
        detalle: { motivo: 'Corrección' },
      },
    ]);
  });
});
