import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-local';
import { SeguridadService, type UserSession } from './seguridad.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly seguridadService: SeguridadService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  validate(
    request: Request,
    username: string,
    password: string,
  ): Promise<UserSession> {
    const clientIp = request.ip || request.socket.remoteAddress;
    return this.seguridadService.validateUser(username, password, clientIp);
  }
}
