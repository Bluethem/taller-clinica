import { Module } from '@nestjs/common';
import { HistoriaController } from './historia.controller.js';
import { HistoriaService } from './historia.service.js';

@Module({
  controllers: [HistoriaController],
  providers: [HistoriaService],
  exports: [HistoriaService],
})
export class HistoriaModule {}

