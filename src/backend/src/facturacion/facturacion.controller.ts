import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { FacturacionService } from './facturacion.service.js';
import { EmitirComprobanteDto } from './dto/emitir-comprobante.dto.js';

@Controller('facturacion')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  /** GET /facturacion/liquidacion?pacienteId=... */
  @Get('liquidacion')
  @Roles('cajero', 'administrador', 'gerencia')
  getLiquidacion(@Query('pacienteId') pacienteId: string) {
    return this.facturacionService.getLiquidacion(
      pacienteId || '20000000-0000-7000-8000-000000000001',
    );
  }

  /** POST /facturacion/comprobantes */
  @Post('comprobantes')
  @Roles('cajero', 'administrador')
  emitirComprobante(@Body() dto: EmitirComprobanteDto) {
    return this.facturacionService.emitirComprobante(dto);
  }
}
