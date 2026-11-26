import type { INestApplication } from '@nestjs/common';
import {
  CONTROLLER_WATERMARK,
  GUARDS_METADATA,
  MODULE_METADATA,
} from '@nestjs/common/constants.js';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { AuditoriaController } from './auditoria.controller.js';
import { AuditoriaModule } from './auditoria.module.js';
import { AuditoriaService } from './auditoria.service.js';

describe('AuditoriaController', () => {
  let app: INestApplication;
  let listarPorPaciente: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    listarPorPaciente = vi.fn().mockResolvedValue([
      {
        id: '1',
        ocurrioEn: '2026-11-26T12:00:00.000Z',
        usuarioId: 'admin-id',
        accion: 'LECTURA',
        recurso: 'hce.entrada',
        recursoId: null,
        detalle: {},
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      controllers: [AuditoriaController],
      providers: [
        {
          provide: AuditoriaService,
          useValue: { listarPorPaciente },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const role = req.header('x-test-role');
      req.isAuthenticated = (() => Boolean(role)) as Request['isAuthenticated'];
      if (role) {
        req.user = { id: 'user-id', username: role, rol: role } as Express.User;
      }
      next();
    });
    await app.init();
  });

  beforeEach(() => {
    listarPorPaciente.mockClear();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('declara AuthenticatedGuard + RolesGuard, @Roles("administrador") y está registrado en AuditoriaModule', () => {
    expect(Reflect.getMetadata(CONTROLLER_WATERMARK, AuditoriaController)).toBe(true);
    expect(Reflect.getMetadata(GUARDS_METADATA, AuditoriaController)).toEqual([
      AuthenticatedGuard,
      RolesGuard,
    ]);
    const handler = Object.getOwnPropertyDescriptor(
      AuditoriaController.prototype,
      'listar',
    )?.value as object;
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['administrador']);
    expect(
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, AuditoriaModule),
    ).toContain(AuditoriaController);
  });

  it('responde 401 sin sesión autenticada', async () => {
    await request(app.getHttpServer())
      .get('/auditoria?pacienteId=20000000-0000-7000-8000-000000000001')
      .expect(401);
    expect(listarPorPaciente).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el rol no es administrador', async () => {
    await request(app.getHttpServer())
      .get('/auditoria?pacienteId=20000000-0000-7000-8000-000000000001')
      .set('x-test-role', 'medico')
      .expect(403);
    expect(listarPorPaciente).not.toHaveBeenCalled();
  });

  it('responde 400 cuando falta pacienteId o está en blanco', async () => {
    await request(app.getHttpServer())
      .get('/auditoria')
      .set('x-test-role', 'administrador')
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('pacienteId es obligatorio');
      });

    await request(app.getHttpServer())
      .get('/auditoria?pacienteId=%20%20%20')
      .set('x-test-role', 'administrador')
      .expect(400);

    expect(listarPorPaciente).not.toHaveBeenCalled();
  });

  it('responde 400 cuando pacienteId no tiene formato UUID', async () => {
    await request(app.getHttpServer())
      .get('/auditoria?pacienteId=no-es-uuid')
      .set('x-test-role', 'administrador')
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('pacienteId debe ser un UUID válido');
      });

    expect(listarPorPaciente).not.toHaveBeenCalled();
  });

  it('responde 200 con la bitácora del paciente para administrador y hace trim de pacienteId', async () => {
    const res = await request(app.getHttpServer())
      .get('/auditoria?pacienteId=%2020000000-0000-7000-8000-000000000001%20')
      .set('x-test-role', 'administrador')
      .expect(200);

    expect(listarPorPaciente).toHaveBeenCalledWith(
      '20000000-0000-7000-8000-000000000001',
    );
    expect(res.body).toEqual([
      {
        id: '1',
        ocurrioEn: '2026-11-26T12:00:00.000Z',
        usuarioId: 'admin-id',
        accion: 'LECTURA',
        recurso: 'hce.entrada',
        recursoId: null,
        detalle: {},
      },
    ]);
  });
});
