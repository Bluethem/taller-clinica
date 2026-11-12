import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';
import { AgendaController } from '../agenda/agenda.controller.js';
import { FacturacionController } from '../facturacion/facturacion.controller.js';
import { HistoriaController } from '../historia/historia.controller.js';
import { LaboratorioController } from '../laboratorio/laboratorio.controller.js';
import { ROLES_KEY } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { PacientesController } from './pacientes.controller.js';

function guards(target: object): unknown[] {
  return Reflect.getMetadata(GUARDS_METADATA, target) ?? [];
}

describe('guards de controladores de negocio', () => {
  it('Agenda exige autenticación a nivel de controlador', () => {
    expect(guards(AgendaController)).toEqual([AuthenticatedGuard]);
  });

  it.each([
    [HistoriaController, ['medico', 'enfermera', 'administrador']],
    [LaboratorioController, ['laboratorio', 'administrador']],
  ])('%s exige autenticación + roles', (controller, roles) => {
    expect(guards(controller)).toEqual([AuthenticatedGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, controller)).toEqual(roles);
  });

  it('Facturacion exige autenticación + RolesGuard; roles por método', () => {
    expect(guards(FacturacionController)).toEqual([AuthenticatedGuard, RolesGuard]);
    const liquidacion = Object.getOwnPropertyDescriptor(
      FacturacionController.prototype,
      'getLiquidacion',
    )?.value as object;
    const emitir = Object.getOwnPropertyDescriptor(
      FacturacionController.prototype,
      'emitirComprobante',
    )?.value as object;
    expect(Reflect.getMetadata(ROLES_KEY, liquidacion)).toEqual([
      'cajero',
      'administrador',
      'gerencia',
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, emitir)).toEqual(['cajero', 'administrador']);
  });

  it('Pacientes exige autenticación + RolesGuard; lectura vs escritura por método', () => {
    expect(guards(PacientesController)).toEqual([AuthenticatedGuard, RolesGuard]);
    const directorio = Object.getOwnPropertyDescriptor(
      PacientesController.prototype,
      'obtenerDirectorio',
    )?.value as object;
    const crear = Object.getOwnPropertyDescriptor(
      PacientesController.prototype,
      'crearPaciente',
    )?.value as object;
    expect(Reflect.getMetadata(ROLES_KEY, directorio)).toEqual([
      'medico',
      'enfermera',
      'admision',
      'administrador',
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, crear)).toEqual(['admision', 'administrador']);
  });

  it('limita la creación de citas a admisión y administración', () => {
    const handler = Object.getOwnPropertyDescriptor(
      AgendaController.prototype,
      'crearCita',
    )?.value as object;

    expect(guards(handler)).toEqual([AuthenticatedGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'admision',
      'administrador',
    ]);
  });

  it('expone mis-citas a médico y administrador', () => {
    const handler = Object.getOwnPropertyDescriptor(
      AgendaController.prototype,
      'getMisCitas',
    )?.value as object;

    expect(guards(handler)).toEqual([AuthenticatedGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['medico', 'administrador']);
  });
});
