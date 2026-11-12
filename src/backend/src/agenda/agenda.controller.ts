import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { AgendaService } from './agenda.service.js';
import { CrearCitaDto } from './dto/crear-cita.dto.js';

@Controller('agenda')
@UseGuards(AuthenticatedGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('especialidades')
  getEspecialidades() {
    return this.agendaService.getEspecialidades();
  }

  @Get('medicos')
  getMedicos(@Query('especialidadId') especialidadId: string) {
    return this.agendaService.getMedicosByEspecialidad(Number(especialidadId));
  }

  @Get('pacientes/buscar')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('admision', 'administrador')
  buscarPaciente(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.agendaService.buscarPaciente(q);
  }

  @Get('slots/:medicoId')
  getSlots(
    @Param('medicoId') medicoId: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.agendaService.getSlotsDisponibles(medicoId, desde, hasta);
  }

  @Get('mis-citas')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('medico', 'administrador')
  getMisCitas(@Req() req: Request, @Query('dia') dia?: string) {
    const usuario = req.user as { id: string };
    return this.agendaService.getMisCitas(usuario.id, dia);
  }

  @Post('citas')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('admision', 'administrador')
  crearCita(@Body() dto: CrearCitaDto) {
    return this.agendaService.crearCita(dto);
  }
}
