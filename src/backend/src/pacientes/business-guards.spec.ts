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
  it.each([
    AgendaController,
    HistoriaController,
    LaboratorioController,
    FacturacionController,
  ])('%s requiere una sesión autenticada', (controller) => {
    expect(guards(controller)).toEqual([AuthenticatedGuard]);
  });

  it('limita Pacientes a admisión y administración', () => {
    expect(guards(PacientesController)).toEqual([
      AuthenticatedGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, PacientesController)).toEqual([
      'admision',
      'administrador',
    ]);
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
});
