import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { HistoriaService } from './historia.service.js';
import { AnularEntradaDto, CrearConsultaDto } from './dto/historia.dto.js';

@Controller('historia')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('medico', 'enfermera', 'administrador')
export class HistoriaController {
  constructor(private readonly historiaService: HistoriaService) {}

  @Get(':pacienteId')
  obtenerHistoria(@Param('pacienteId') pacienteId: string) {
    return this.historiaService.getHistoria(pacienteId);
  }

  @Post('anular')
  anularEntrada(@Body() dto: AnularEntradaDto) {
    return this.historiaService.anularEntrada(dto);
  }

  @Post('consulta')
  crearConsulta(@Body() dto: CrearConsultaDto) {
    return this.historiaService.crearConsulta(dto);
  }
}
