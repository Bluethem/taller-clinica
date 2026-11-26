import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';
import { HistoriaController } from './historia.controller.js';
import { HistoriaService } from './historia.service.js';

@Module({
  imports: [AuditoriaModule],
  controllers: [HistoriaController],
  providers: [HistoriaService],
  exports: [HistoriaService],
})
export class HistoriaModule {}
