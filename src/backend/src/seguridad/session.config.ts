import connectPgSimple from 'connect-pg-simple';
import session, { type SessionOptions } from 'express-session';

const PgSessionStore = connectPgSimple(session);

type Environment = Record<string, string | undefined>;

function databaseUrl(env: Environment): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const user = encodeURIComponent(env.POSTGRES_USER ?? 'sigc');
  const password = encodeURIComponent(env.POSTGRES_PASSWORD ?? 'sigc');
  const host = env.POSTGRES_HOST ?? env.PGHOST ?? 'localhost';
  const port = env.POSTGRES_PORT ?? '5432';
  const database = encodeURIComponent(env.POSTGRES_DB ?? 'sigc');
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export function createSessionOptions(
  env: Environment = process.env,
): SessionOptions {
  const secret = env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET es obligatorio.');
  }

  return {
    name: 'sigc.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new PgSessionStore({
      conString: databaseUrl(env),
      schemaName: 'seguridad',
      tableName: 'sesion',
      createTableIfMissing: false,
    }),
    cookie: {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
    },
  };
}
