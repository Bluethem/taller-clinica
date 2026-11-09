import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';

export interface UserSession {
  id: string;
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  rolDescripcion: string;
}

@Injectable()
export class SeguridadService {
  constructor(private readonly dataSource: DataSource) {}

  async validateUser(
    usernameOrEmail: string,
    passwordPlain: string,
    clientIp = '127.0.0.1',
  ): Promise<UserSession> {
    if (!usernameOrEmail || !passwordPlain) {
      throw new UnauthorizedException({
        success: false,
        message: 'Usuario y contraseña requeridos',
        intentosRestantes: 2,
      });
    }

    const trimmed = usernameOrEmail.trim().toLowerCase();
    const alias = trimmed.split('@')[0];

    // Buscar usuario en el esquema seguridad
    const users = await this.dataSource.query(
      `SELECT u.id, u.username, u.nombres, u.apellidos, u.email, u.password_hash, u.activo,
              r.nombre as rol, r.descripcion as rol_descripcion
       FROM seguridad.usuario u
       JOIN seguridad.rol r ON r.id = u.rol_id
       WHERE (LOWER(u.username) = $1 OR LOWER(u.email) = $1 OR LOWER(u.username) = $2)
         AND u.activo = true
       LIMIT 1`,
      [trimmed, alias],
    );

    const user = users[0];

    let isValid = false;
    if (user?.password_hash) {
      try {
        isValid = await argon2.verify(user.password_hash, passwordPlain);
      } catch {
        isValid = false;
      }
    }

    const cleanIp =
      clientIp === '::1' || !clientIp.includes('.') ? '127.0.0.1' : clientIp;

    if (!user || !isValid) {
      // Registrar intento fallido en auditoria.bitacora (HU11)
      try {
        await this.dataSource.query(
          `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, ip, detalle)
           VALUES ($1, 'LOGIN_FALLIDO', 'seguridad.sesion', $2::inet, $3::jsonb)`,
          [
            user ? user.id : null,
            cleanIp,
            JSON.stringify({ intento_usuario: trimmed }),
          ],
        );
      } catch (err) {
        console.error('Error registrando auditoría:', err);
      }

      throw new UnauthorizedException({
        success: false,
        message: 'Usuario o contraseña incorrectos.',
        intentosRestantes: 2,
      });
    }

    // Registrar inicio de sesión exitoso en auditoria.bitacora (HU11)
    try {
      await this.dataSource.query(
        `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, ip, detalle)
         VALUES ($1, 'LOGIN', 'seguridad.sesion', $2::inet, $3::jsonb)`,
        [
          user.id,
          cleanIp,
          JSON.stringify({ rol: user.rol, username: user.username }),
        ],
      );
    } catch (err) {
      console.error('Error registrando auditoría:', err);
    }

    return {
      id: user.id,
      username: user.username,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      rol: user.rol,
      rolDescripcion: user.rol_descripcion,
    };
  }
}
