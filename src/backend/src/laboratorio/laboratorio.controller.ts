import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { LaboratorioService } from './laboratorio.service.js';
import { PublicarResultadoDto } from './dto/publicar-resultado.dto.js';

@Controller('laboratorio')
@UseGuards(AuthenticatedGuard)
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

