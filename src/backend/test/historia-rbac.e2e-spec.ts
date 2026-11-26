import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { crearApp, loginComo } from './helpers.js';

function fechaClinicaEnMs(fecha: string): number {
  const meses: Record<string, number> = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };
  const partes = fecha.match(/^(\d{1,2}) de ([a-záéíóú]+)(?:,| de) (\d{4})$/i);
  if (!partes) throw new Error(`Fecha clínica inesperada: ${fecha}`);
  return Date.UTC(
    Number(partes[3]),
    meses[partes[2].toLowerCase()],
    Number(partes[1]),
  );
}

describe('Historia clínica: orden, rol y auditoría (HU03)', () => {
  const pacienteId = '20000000-0000-7000-8000-000000000001';
  let app: INestApplication;
  let dataSource: DataSource;
  let cookieMedico: string;
  let cookieCajero: string;
  let cookieAdministrador: string;

  beforeAll(async () => {
    app = await crearApp();
    dataSource = app.get(DataSource);
    [cookieMedico, cookieCajero, cookieAdministrador] = await Promise.all([
      loginComo(app, 'lparedes'),
      loginComo(app, 'evargas'),
      loginComo(app, 'scampos'),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('devuelve entradas ordenadas por fecha DESC', async () => {
    const response = await request(app.getHttpServer())
      .get(`/historia/${pacienteId}`)
      .set('Cookie', cookieMedico)
      .expect(200);

    const fechas = response.body.entradas.map((entrada: { fecha: string }) =>
      fechaClinicaEnMs(entrada.fecha),
    );
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  it('cajero recibe 403', async () => {
    await request(app.getHttpServer())
      .get(`/historia/${pacienteId}`)
      .set('Cookie', cookieCajero)
      .expect(403);
  });

  it('administrador consulta GET /auditoria y recibe la lista', async () => {
    const response = await request(app.getHttpServer())
      .get(`/auditoria?pacienteId=${pacienteId}`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('médico recibe 403 en GET /auditoria', async () => {
    await request(app.getHttpServer())
      .get(`/auditoria?pacienteId=${pacienteId}`)
      .set('Cookie', cookieMedico)
      .expect(403);
  });

  it('administrador recibe 400 con pacienteId no UUID en GET /auditoria', async () => {
    await request(app.getHttpServer())
      .get('/auditoria?pacienteId=no-es-uuid')
      .set('Cookie', cookieAdministrador)
      .expect(400);
  });

  it('consulta exitosa incrementa LECTURA en bitácora', async () => {
    const contarLecturas = async (): Promise<number> => {
      const [row]: Array<{ n: number }> = await dataSource.query(
        `SELECT count(*)::int AS n
         FROM auditoria.bitacora
         WHERE accion = 'LECTURA' AND paciente_id = $1`,
        [pacienteId],
      );
      return row.n;
    };

    const antes = await contarLecturas();

    await request(app.getHttpServer())
      .get(`/historia/${pacienteId}`)
      .set('Cookie', cookieMedico)
      .expect(200);

    expect(await contarLecturas()).toBe(antes + 1);
  });
});
