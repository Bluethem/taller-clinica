import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { SeguridadService, type UserSession } from './seguridad.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly seguridadService: SeguridadService) {
    super({ usernameField: 'username', passwordField: 'password' });
  }

  validate(username: string, password: string): Promise<UserSession> {
    return this.seguridadService.validateUser(username, password);
  }
}
