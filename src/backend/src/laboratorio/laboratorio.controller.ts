import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { LaboratorioService } from './laboratorio.service.js';
import { PublicarResultadoDto } from './dto/publicar-resultado.dto.js';

@Controller('laboratorio')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('laboratorio', 'administrador')
export class LaboratorioController {
  constructor(private readonly laboratorioService: LaboratorioService) {}

  @Get('ordenes')
  obtenerCola() {
    return this.laboratorioService.getColaOrdenes();
  }

  @Post('resultados')
  guardarResultado(@Body() dto: PublicarResultadoDto) {
    return this.laboratorioService.guardarResultado(dto);
  }
}
