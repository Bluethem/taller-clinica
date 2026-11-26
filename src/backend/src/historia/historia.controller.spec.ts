import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants.js';
import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { ROLES_KEY } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { HistoriaController } from './historia.controller.js';
import { HistoriaModule } from './historia.module.js';
import { HistoriaService, type HistoriaPaciente } from './historia.service.js';

describe('HistoriaController', () => {
  it('audita una LECTURA exitosa con el usuario de sesión y el paciente resuelto', async () => {
    const historia = {
      pacienteId: 'paciente-id',
    } as HistoriaPaciente;
    const getHistoria = vi.fn().mockResolvedValue(historia);
    const registrar = vi.fn().mockResolvedValue(undefined);
    const controller = new HistoriaController(
      { getHistoria } as unknown as HistoriaService,
      { registrar } as unknown as AuditoriaService,
    );

    await expect(
      controller.obtenerHistoria('70000001', {
        user: { id: 'usuario-sesion-id' },
      }),
    ).resolves.toBe(historia);

    expect(registrar).toHaveBeenCalledWith({
      usuarioId: 'usuario-sesion-id',
      accion: 'LECTURA',
      recurso: 'hce.entrada',
      pacienteId: 'paciente-id',
      detalle: { path: 'GET /historia/:pacienteId' },
    });
  });

  it('no audita LECTURA cuando getHistoria falla y propaga el error', async () => {
    const error = new NotFoundException('Paciente no encontrado');
    const getHistoria = vi.fn().mockRejectedValue(error);
    const registrar = vi.fn().mockResolvedValue(undefined);
    const controller = new HistoriaController(
      { getHistoria } as unknown as HistoriaService,
      { registrar } as unknown as AuditoriaService,
    );

    await expect(
      controller.obtenerHistoria('70000001', {
        user: { id: 'usuario-sesion-id' },
      }),
    ).rejects.toBe(error);

    expect(registrar).not.toHaveBeenCalled();
  });

  it('crea una consulta con el usuario autenticado de la sesión', async () => {
    const crearConsulta = vi.fn().mockResolvedValue({ success: true });
    const controller = new HistoriaController(
      { crearConsulta } as unknown as HistoriaService,
      { registrar: vi.fn() } as unknown as AuditoriaService,
    );
    const dto = {
      pacienteId: 'paciente-id',
      motivoConsulta: 'Control',
      enfermedadActual: 'Estable',
      diagnosticoCie10: 'I10',
    };

    await controller.crearConsulta(dto, {
      user: { id: 'usuario-sesion-id' },
    });

    expect(crearConsulta).toHaveBeenCalledWith(dto, 'usuario-sesion-id');
  });

  it('declara AuthenticatedGuard + RolesGuard y @Roles("medico", "enfermera", "administrador")', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, HistoriaController)).toEqual([
      AuthenticatedGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, HistoriaController)).toEqual([
      'medico',
      'enfermera',
      'administrador',
    ]);
  });

  it('importa AuditoriaModule explícitamente', () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, HistoriaModule),
    ).toContain(AuditoriaModule);
  });
});
