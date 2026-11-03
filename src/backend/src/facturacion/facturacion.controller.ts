import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FacturacionService } from './facturacion.service.js';
import { EmitirComprobanteDto } from './dto/emitir-comprobante.dto.js';

@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  /** GET /facturacion/liquidacion?pacienteId=... */
  @Get('liquidacion')
  getLiquidacion(@Query('pacienteId') pacienteId: string) {
    return this.facturacionService.getLiquidacion(
      pacienteId || '20000000-0000-7000-8000-000000000001',
    );
  }

  /** POST /facturacion/comprobantes */
  @Post('comprobantes')
  emitirComprobante(@Body() dto: EmitirComprobanteDto) {
    return this.facturacionService.emitirComprobante(dto);
  }
}

