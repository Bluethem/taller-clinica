import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import session, { MemoryStore } from 'express-session';
import passport from 'passport';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

export async function crearApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
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

  return app;
}

export async function loginComo(
  app: INestApplication,
  username: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/seguridad/login')
    .send({ username, password: 'password1234' })
    .expect(200);

  const cookie = response.headers['set-cookie']?.[0];
  if (!cookie) {
    throw new Error(`El login de ${username} no devolvió una cookie de sesión`);
  }
  return cookie;
}
