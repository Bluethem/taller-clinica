import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import session, { MemoryStore } from 'express-session';
import passport from 'passport';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let agent: ReturnType<typeof request.agent>;
  let medicoAgent: ReturnType<typeof request.agent>;
  let laboratorioAgent: ReturnType<typeof request.agent>;
  let cajeroAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      session({
        name: 'sigc.sid',
        secret: 'e2e-test-secret',
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore(),
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());
    await app.init();
    dataSource = app.get(DataSource);

    agent = request.agent(app.getHttpServer());
    medicoAgent = request.agent(app.getHttpServer());
    laboratorioAgent = request.agent(app.getHttpServer());
    cajeroAgent = request.agent(app.getHttpServer());

    await Promise.all([
      medicoAgent
        .post('/seguridad/login')
        .send({ username: 'lparedes', password: 'password1234' })
        .expect(200),
      laboratorioAgent
        .post('/seguridad/login')
        .send({ username: 'jnavarro', password: 'password1234' })
        .expect(200),
      cajeroAgent
        .post('/seguridad/login')
        .send({ username: 'evargas', password: 'password1234' })
        .expect(200),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return agent.get('/').expect(200).expect('Hello World!');
  });

  it('/seguridad/login (POST) con credenciales válidas', async () => {
    const res = await agent
      .post('/seguridad/login')
      .send({ username: 'dramos', password: 'password1234' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('dramos');
    expect(res.body.user.rol).toBe('admision');
  });

  it('/seguridad/login (POST) con credenciales inválidas', async () => {
    const localAgent = request.agent(app.getHttpServer());
    const res = await localAgent
      .post('/seguridad/login')
      .send({ username: 'dramos', password: 'wrongpassword' })
      .expect(401);

    expect(res.body.message).toContain('incorrectos');
  });

  it('/agenda/especialidades (GET) retorna catálogo', async () => {
    const res = await agent.get('/agenda/especialidades').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('nombre');
  });

  it('/agenda/pacientes/buscar (GET) busca por documento o apellido', async () => {
    const res = await agent
      .get('/agenda/pacientes/buscar?q=Torres')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].apellido_paterno).toBe('Torres');
  });

  it('/laboratorio/ordenes (GET) retorna la cola de muestras de laboratorio', async () => {
    const res = await laboratorioAgent.get('/laboratorio/ordenes').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('codigoOrden');
    expect(res.body[0]).toHaveProperty('valores');
  });

  it('/laboratorio/resultados (POST) publica resultado en la historia clínica', async () => {
    const res = await laboratorioAgent
      .post('/laboratorio/resultados')
      .send({
        ordenItemId: '61000000-0000-7000-8000-000000000001',
        pacienteId: '20000000-0000-7000-8000-000000000001',
        colTotal: 215,
        trigliceridos: 160,
        colHdl: 48,
        colLdl: 135,
        observaciones:
          'Muestra sin hemólisis ni lipemia visible. Valores concordantes con historial previo.',
        registradoPor: '10000000-0000-7000-8000-000000000009',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('id');
  });

  it('/facturacion/liquidacion (GET) retorna liquidación del paciente demo', async () => {
    const res = await cajeroAgent
      .get(
        '/facturacion/liquidacion?pacienteId=20000000-0000-7000-8000-000000000001',
      )
      .expect(200);

    expect(res.body).toHaveProperty('pacienteNombre');
    expect(res.body).toHaveProperty('convenio');
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('totalCopago');
  });

  it('/facturacion/comprobantes (POST) emite boleta y retorna número', async () => {
    const res = await cajeroAgent
      .post('/facturacion/comprobantes')
      .send({
        pacienteId: '20000000-0000-7000-8000-000000000001',
        citaId: null,
        convenioId: 2,
        tipo: 'boleta',
        serie: 'B003',
        metodoPago: 'pos',
        referenciaPos: 'REF-9999999',
        emitidoPor: '10000000-0000-7000-8000-000000000010',
        items: [
          {
            conceptoId: 2,
            descripcion: 'Consulta Médica Especializada Cardiología',
            cantidad: 1,
            precioUnitario: 180,
            copagoMonto: 27,
          },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('numero');
    expect(res.body).toHaveProperty('comprobanteId');
  });

  it('/historia/:pacienteId (GET) retorna la historia clínica del paciente', async () => {
    const res = await medicoAgent
      .get('/historia/20000000-0000-7000-8000-000000000001')
      .expect(200);

    expect(res.body).toHaveProperty('numeroHc');
    expect(res.body).toHaveProperty('entradas');
    expect(Array.isArray(res.body.entradas)).toBe(true);
    expect(res.body.entradas.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('alertasCriticas');
  });

  it('/historia/anular (POST) valida motivo mínimo de 10 caracteres', async () => {
    await medicoAgent
      .post('/historia/anular')
      .send({
        entradaId: '50000000-0000-7000-8000-000000000001',
        motivo: 'corto',
      })
      .expect(400);
  });

  it('/historia/anular (POST) anula entrada con motivo válido', async () => {
    const [entrada]: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO hce.entrada
         (paciente_id, medico_id, motivo_consulta, enfermedad_actual)
       SELECT $1, id, $2, $3
       FROM agenda.medico
       ORDER BY id
       LIMIT 1
       RETURNING id`,
      [
        '20000000-0000-7000-8000-000000000001',
        'Prueba E2E de anulación',
        'Registro temporal para validar el flujo transaccional',
      ],
    );
    const entradaId = entrada.id;
    const res = await medicoAgent
      .post('/historia/anular')
      .send({
        entradaId,
        motivo:
          'Anulación solicitada por auditoría médica tras revisión clínica.',
        anuladoPor: '10000000-0000-7000-8000-000000000002',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('anulacionId');
    expect(res.body).not.toHaveProperty('auditId');

    const [bitacora]: Array<{
      accion: string;
      usuario_id: string;
      paciente_id: string;
    }> = await dataSource.query(
      `SELECT accion, usuario_id, paciente_id
       FROM auditoria.bitacora
       WHERE recurso = 'hce.anulacion' AND recurso_id = $1
       ORDER BY ocurrio_en DESC
       LIMIT 1`,
      [entradaId],
    );
    expect(bitacora).toMatchObject({
      accion: 'ANULACION',
      usuario_id: '10000000-0000-7000-8000-000000000001',
      paciente_id: '20000000-0000-7000-8000-000000000001',
    });

    const [anulacion]: Array<{ anulado_por: string }> = await dataSource.query(
      `SELECT anulado_por FROM hce.anulacion WHERE entrada_id = $1`,
      [entradaId],
    );
    expect(anulacion.anulado_por).toBe(
      '10000000-0000-7000-8000-000000000001',
    );

    await medicoAgent
      .post('/historia/anular')
      .send({
        entradaId,
        motivo: 'Segundo intento de anulación sobre la misma entrada clínica.',
      })
      .expect(409);
  });

  it('/pacientes (GET) retorna directorio de pacientes', async () => {
    const res = await agent.get('/pacientes').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('numeroDocumento');
    expect(res.body[0]).toHaveProperty('numeroHc');
    expect(res.body[0]).toHaveProperty('seguro');
  });

  it('/pacientes (POST) registra un nuevo paciente', async () => {
    const randomDni = String(Math.floor(70000000 + Math.random() * 9999999));
    const res = await agent
      .post('/pacientes')
      .send({
        tipoDocumento: 'DNI',
        numeroDocumento: randomDni,
        nombres: 'Valeria',
        apellidoPaterno: 'Castillo',
        apellidoMaterno: 'Flores',
        fechaNacimiento: '1995-05-12',
        sexo: 'F',
        telefono: '+51 987 654 321',
        email: `valeria.${randomDni}@ejemplo.pe`,
        direccion: 'Av. Las Camelias 412, San Borja',
        seguro: 'Rímac Seguros',
        alergias: 'Penicilina',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('id');
  });
});
