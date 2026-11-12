import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { PacientesService } from './pacientes.service.js';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';

@Controller('pacientes')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  @Roles('medico', 'enfermera', 'admision', 'administrador')
  obtenerDirectorio(@Query('q') q?: string, @Query('filtro') filtro?: string) {
    return this.pacientesService.getDirectorio(q, filtro);
  }

  @Get(':id')
  @Roles('medico', 'enfermera', 'admision', 'administrador')
  obtenerFicha(@Param('id') id: string) {
    return this.pacientesService.getFicha(id);
  }

  @Post()
  @Roles('admision', 'administrador')
  crearPaciente(@Body() dto: CrearPacienteDto) {
    return this.pacientesService.crearPaciente(dto);
  }
}
