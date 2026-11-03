import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { HistoriaService } from './historia.service.js';
import { AnularEntradaDto, CrearConsultaDto } from './dto/historia.dto.js';

@Controller('historia')
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

