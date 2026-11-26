import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { HistoriaService } from './historia.service.js';

describe('HistoriaService', () => {
  it('responde 404 cuando el paciente no existe', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const service = new HistoriaService(
      { query } as never,
      { registrar: vi.fn() } as unknown as AuditoriaService,
    );

    await expect(service.getHistoria('identificador-desconocido')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('rechaza entradaId con formato no UUID antes de consultar la base', async () => {
    const transaction = vi.fn();
    const service = new HistoriaService(
      { transaction } as never,
      { registrar: vi.fn() } as unknown as AuditoriaService,
    );

    await expect(
      service.anularEntrada(
        { entradaId: 'no-es-uuid', motivo: 'Motivo clínico suficientemente largo' },
        'usuario-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('responde 404 al anular una entrada inexistente', async () => {
    const manager = { query: vi.fn().mockResolvedValueOnce([]) };
    const transaction = vi.fn(async (callback) => callback(manager));
    const service = new HistoriaService(
      { transaction } as never,
      { registrar: vi.fn() } as unknown as AuditoriaService,
    );

    await expect(
      service.anularEntrada(
        {
          entradaId: '50000000-0000-7000-8000-000000000099',
          motivo: 'Motivo clínico suficientemente largo',
        },
        'usuario-id',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('responde 409 al anular una entrada ya anulada', async () => {
    const manager = {
      query: vi
        .fn()
        .mockResolvedValueOnce([{ paciente_id: 'paciente-id' }])
        .mockResolvedValueOnce([{ id: 'anulacion-existente' }]),
    };
    const transaction = vi.fn(async (callback) => callback(manager));
    const service = new HistoriaService(
      { transaction } as never,
      { registrar: vi.fn() } as unknown as AuditoriaService,
    );

    await expect(
      service.anularEntrada(
        {
          entradaId: '50000000-0000-7000-8000-000000000003',
          motivo: 'Motivo clínico suficientemente largo',
        },
        'usuario-id',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('inserta anulación y auditoría en la misma transacción y devuelve el id real', async () => {
    const entradaId = '50000000-0000-7000-8000-000000000002';
    const manager = {
      query: vi
        .fn()
        .mockResolvedValueOnce([{ paciente_id: 'paciente-id' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'anulacion-id-real' }]),
    };
    const transaction = vi.fn(async (callback) => callback(manager));
    const registrar = vi.fn().mockResolvedValue(undefined);
    const service = new HistoriaService(
      { transaction } as never,
      { registrar } as unknown as AuditoriaService,
    );

    const resultado = await service.anularEntrada(
      { entradaId, motivo: '  Motivo clínico suficientemente largo  ' },
      'usuario-id',
    );

    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hce.anulacion'),
      [entradaId, 'usuario-id', 'Motivo clínico suficientemente largo'],
    );
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 'usuario-id',
        accion: 'ANULACION',
        recursoId: entradaId,
        pacienteId: 'paciente-id',
      }),
      manager,
    );
    expect(resultado).toMatchObject({
      success: true,
      anulacionId: 'anulacion-id-real',
    });
    expect(resultado).not.toHaveProperty('auditId');
  });

  it('propaga errores de auditoría para que la transacción haga rollback', async () => {
    const manager = {
      query: vi
        .fn()
        .mockResolvedValueOnce([{ paciente_id: 'paciente-id' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'anulacion-id-real' }]),
    };
    const transaction = vi.fn(async (callback) => callback(manager));
    const error = new Error('auditoría no disponible');
    const service = new HistoriaService(
      { transaction } as never,
      { registrar: vi.fn().mockRejectedValue(error) } as unknown as AuditoriaService,
    );

    await expect(
      service.anularEntrada(
        {
          entradaId: '50000000-0000-7000-8000-000000000002',
          motivo: 'Motivo clínico suficientemente largo',
        },
        'usuario-id',
      ),
    ).rejects.toBe(error);
  });

  it.each([undefined, '', '   '])(
    'rechaza consulta sin CIE-10 (%j)',
    async (diagnosticoCie10) => {
      const query = vi.fn().mockResolvedValue([{ id: 'entrada-id' }]);
      const registrar = vi.fn().mockResolvedValue(undefined);
      const service = new HistoriaService(
        { query } as never,
        { registrar } as unknown as AuditoriaService,
      );

      await expect(
        service.crearConsulta(
          {
            pacienteId: 'paciente-id',
            motivoConsulta: 'x',
            enfermedadActual: 'y',
            diagnosticoCie10,
          } as never,
          '10000000-0000-7000-8000-000000000001',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(query).not.toHaveBeenCalled();
      expect(registrar).not.toHaveBeenCalled();
    },
  );

  it('rechaza un código CIE-10 inexistente antes de iniciar la transacción', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const transaction = vi.fn();
    const registrar = vi.fn();
    const service = new HistoriaService(
      { query, transaction } as never,
      { registrar } as unknown as AuditoriaService,
    );

    await expect(
      service.crearConsulta(
        {
          pacienteId: 'paciente-id',
          motivoConsulta: 'Control',
          enfermedadActual: 'Evolución estable',
          diagnosticoCie10: 'ZZZ',
        },
        'usuario-sesion-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM hce.cie10'),
      ['ZZZ'],
    );
    expect(transaction).not.toHaveBeenCalled();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('registra diagnóstico, prescripción y auditoría ESCRITURA', async () => {
    const managerQuery = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'entrada-id' }])
      .mockResolvedValue([]);
    const manager = { query: managerQuery };
    const query = vi.fn().mockResolvedValue([{ codigo: 'I10' }]);
    const transaction = vi.fn(async (callback) => callback(manager));
    const registrar = vi.fn().mockResolvedValue(undefined);
    const service = new HistoriaService(
      { query, transaction } as never,
      { registrar } as unknown as AuditoriaService,
    );

    await service.crearConsulta(
      {
        pacienteId: 'paciente-id',
        motivoConsulta: 'Control',
        enfermedadActual: 'Evolución estable',
        diagnosticoCie10: ' I10 ',
        prescripcion: 'Reducir consumo de sodio',
      },
      'usuario-sesion-id',
    );

    expect(managerQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hce.diagnostico'),
      ['entrada-id', 'I10'],
    );
    expect(managerQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hce.indicacion'),
      ['entrada-id', 'Reducir consumo de sodio'],
    );
    expect(registrar).toHaveBeenCalledWith({
      usuarioId: 'usuario-sesion-id',
      accion: 'ESCRITURA',
      recurso: 'hce.entrada',
      recursoId: 'entrada-id',
      pacienteId: 'paciente-id',
      detalle: { prescripcion: 'Reducir consumo de sodio' },
    }, manager);
  });
});
