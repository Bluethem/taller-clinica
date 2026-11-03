import { Module } from '@nestjs/common';
import { LaboratorioController } from './laboratorio.controller.js';
import { LaboratorioService } from './laboratorio.service.js';

@Module({
  controllers: [LaboratorioController],
  providers: [LaboratorioService],
  exports: [LaboratorioService],
})
export class LaboratorioModule {}

