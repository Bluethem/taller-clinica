import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthenticatedGuard } from './guards/authenticated.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { LocalStrategy } from './local.strategy.js';
import { SeguridadController } from './seguridad.controller.js';
import { SeguridadService } from './seguridad.service.js';
import { SessionSerializer } from './session.serializer.js';

export { Roles } from './decorators/roles.decorator.js';
export { AuthenticatedGuard } from './guards/authenticated.guard.js';
export { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [SeguridadController],
  providers: [
    SeguridadService,
    LocalStrategy,
    SessionSerializer,
    AuthenticatedGuard,
    LocalAuthGuard,
    RolesGuard,
  ],
  exports: [SeguridadService, AuthenticatedGuard, RolesGuard],
})
export class SeguridadModule {}
