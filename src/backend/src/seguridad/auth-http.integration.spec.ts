import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import session, { MemoryStore } from 'express-session';
import passport from 'passport';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AgendaController } from '../agenda/agenda.controller.js';
import { AgendaService } from '../agenda/agenda.service.js';
import { PacientesController } from '../pacientes/pacientes.controller.js';
import { PacientesService } from '../pacientes/pacientes.service.js';
import { SeguridadModule } from './seguridad.module.js';
import {
  SeguridadService,
  type UserSession,
} from './seguridad.service.js';

type TestAgent = ReturnType<typeof request.agent>;

const admision: UserSession = {
  id: 'admision-id',
  username: 'admision',
  nombres: 'Ana',
  apellidos: 'Admisión',
  email: 'admision@sanrafael.example.pe',
  rol: 'admision',
  rolDescripcion: 'Admisión',
};

const medico: UserSession = {
  ...admision,
  id: 'medico-id',
  username: 'medico',
  rol: 'medico',
  rolDescripcion: 'Médico',
};

describe('autenticación HTTP', () => {
  let app: INestApplication;
  let admisionAgent: TestAgent;

  beforeAll(async () => {
    const seguridadService = {
      validateUser: vi.fn(
        async (username: string): Promise<UserSession> =>
          username === 'medico' ? medico : admision,
      ),
    };
    const pacientesService = {
      getDirectorio: vi.fn().mockResolvedValue([]),
      crearPaciente: vi.fn(),
    };
    const agendaService = {
      buscarPaciente: vi.fn().mockResolvedValue([]),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [SeguridadModule],
      controllers: [PacientesController, AgendaController],
      providers: [
        { provide: PacientesService, useValue: pacientesService },
        { provide: AgendaService, useValue: agendaService },
      ],
    })
      .overrideProvider(SeguridadService)
      .useValue(seguridadService)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(
      session({
        name: 'sigc.sid',
        secret: 'integration-test-secret',
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore(),
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());
    await app.init();
    admisionAgent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('login responde 200, establece cookie y autentica la sesión', async () => {
    const login = await admisionAgent
      .post('/auth/login')
      .send({ username: 'admision', password: 'correcta' })
      .expect(200);

    expect(login.headers['set-cookie']?.[0]).toContain('sigc.sid=');
    expect(login.body).toMatchObject({
      success: true,
      user: { username: 'admision', rol: 'admision' },
    });
    await admisionAgent
      .get('/auth/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.username).toBe('admision');
      });
  });

  it('/auth/me responde 401 sin cookie y 200 con sesión', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await admisionAgent.get('/auth/me').expect(200);
  });

  it('logout invalida la sesión para /auth/me', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/login')
      .send({ username: 'admision', password: 'correcta' })
      .expect(200);
    await agent.post('/auth/logout').expect(201);
    await agent.get('/auth/me').expect(401);
  });

  it('protege pacientes por autenticación; médico puede leer directorio', async () => {
    await request(app.getHttpServer()).get('/pacientes').expect(401);

    const medicoAgent = request.agent(app.getHttpServer());
    await login(medicoAgent, 'medico');
    await medicoAgent.get('/pacientes').expect(200);

    await admisionAgent.get('/pacientes').expect(200);
  });

  it('restringe la búsqueda de pacientes en agenda a admisión y administración', async () => {
    await request(app.getHttpServer())
      .get('/agenda/pacientes/buscar?q=Torres')
      .expect(401);

    const medicoAgent = request.agent(app.getHttpServer());
    await login(medicoAgent, 'medico');
    await medicoAgent.get('/agenda/pacientes/buscar?q=Torres').expect(403);

    await admisionAgent.get('/agenda/pacientes/buscar?q=Torres').expect(200);
  });
});

async function login(agent: TestAgent, username: string): Promise<void> {
  await agent
    .post('/auth/login')
    .send({ username, password: 'correcta' });
}
