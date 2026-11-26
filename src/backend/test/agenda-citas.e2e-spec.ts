import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { crearApp, loginComo } from './helpers.js';

describe('Agenda: creación de citas (HU01)', () => {
  const pacienteId = '20000000-0000-7000-8000-000000000001';
  const medicoId = '30000000-0000-7000-8000-000000000001';
  const creadoPor = '10000000-0000-7000-8000-000000000007';
  const diaLaborable = Math.floor(Date.now() / 1000) % 2500;
  const inicioDelDia = new Date(
    Date.UTC(
      2027,
      0,
      4 + Math.floor(diaLaborable / 5) * 7 + (diaLaborable % 5),
      13,
    ),
  );
  const inicios = [
    inicioDelDia.toISOString(),
    new Date(inicioDelDia.getTime() + 60 * 60 * 1000).toISOString(),
  ];
  let app: INestApplication;
  let cookieAdmision: string;

  const bodyPara = (inicio: string) => ({
    pacienteId,
    medicoId,
    inicio,
    motivo: 'Control general E2E HU01',
    enviarRecordatorio: false,
    creadoPor,
  });

  beforeAll(async () => {
    app = await crearApp();
    cookieAdmision = await loginComo(app, 'dramos');
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea con 201 una cita cuando la franja está libre', async () => {
    const response = await request(app.getHttpServer())
      .post('/agenda/citas')
      .set('Cookie', cookieAdmision)
      .send(bodyPara(inicios[0]))
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      folio: expect.stringMatching(/^CIT-\d{4}-\d{4}$/),
    });
  });

  it('rechaza con 409 la segunda cita del mismo médico en la misma franja', async () => {
    const body = bodyPara(inicios[1]);

    await request(app.getHttpServer())
      .post('/agenda/citas')
      .set('Cookie', cookieAdmision)
      .send(body)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/agenda/citas')
      .set('Cookie', cookieAdmision)
      .send(body)
      .expect(409);

    expect(response.body.message).toBe('Horario no disponible');
  });
});
