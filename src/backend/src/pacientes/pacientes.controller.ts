import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PacientesService } from './pacientes.service.js';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';

@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  obtenerDirectorio(@Query('q') q?: string, @Query('filtro') filtro?: string) {
    return this.pacientesService.getDirectorio(q, filtro);
  }

  @Post()
  crearPaciente(@Body() dto: CrearPacienteDto) {
    return this.pacientesService.crearPaciente(dto);
  }
}

