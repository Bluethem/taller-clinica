import { NestFactory } from '@nestjs/core';
import session from 'express-session';
import passport from 'passport';
import { AppModule, ObserveInstrument } from './app.module.js';
import { createSessionOptions } from './seguridad/session.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.use(session(createSessionOptions()));
  app.use(passport.initialize());
  app.use(passport.session());

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
await bootstrap();
