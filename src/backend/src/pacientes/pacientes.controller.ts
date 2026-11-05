import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { PacientesService } from './pacientes.service.js';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';

@Controller('pacientes')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('admision', 'administrador')
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

