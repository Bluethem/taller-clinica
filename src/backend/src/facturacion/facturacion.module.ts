import { Module } from '@nestjs/common';
import { FacturacionController } from './facturacion.controller.js';
import { FacturacionService } from './facturacion.service.js';

@Module({
  controllers: [FacturacionController],
  providers: [FacturacionService],
  exports: [FacturacionService],
})
export class FacturacionModule {}

