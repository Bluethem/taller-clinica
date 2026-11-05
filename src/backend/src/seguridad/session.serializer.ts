import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import type { UserSession } from './seguridad.service.js';

type Done = (error: Error | null, user?: UserSession) => void;

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: UserSession, done: Done): void {
    done(null, user);
  }

  deserializeUser(user: UserSession, done: Done): void {
    done(null, user);
  }
}
