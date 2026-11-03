import { Module } from '@nestjs/common';
import { SeguridadController } from './seguridad.controller.js';
import { SeguridadService } from './seguridad.service.js';

@Module({
  controllers: [SeguridadController],
  providers: [SeguridadService],
  exports: [SeguridadService],
})
export class SeguridadModule {}

