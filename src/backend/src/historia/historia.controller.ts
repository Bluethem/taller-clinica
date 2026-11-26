import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import type { UserSession } from '../seguridad/seguridad.service.js';
import { HistoriaService } from './historia.service.js';
import { AnularEntradaDto, CrearConsultaDto } from './dto/historia.dto.js';

@Controller('historia')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('medico', 'enfermera', 'administrador')
export class HistoriaController {
  constructor(
    private readonly historiaService: HistoriaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Get(':pacienteId')
  async obtenerHistoria(
    @Param('pacienteId') pacienteId: string,
    @Req() req: { user: Pick<UserSession, 'id'> },
  ) {
    const historia = await this.historiaService.getHistoria(pacienteId);
    await this.auditoria.registrar({
      usuarioId: req.user.id,
      accion: 'LECTURA',
      recurso: 'hce.entrada',
      pacienteId: historia.pacienteId,
      detalle: { path: 'GET /historia/:pacienteId' },
    });
    return historia;
  }

  @Post('anular')
  anularEntrada(
    @Body() dto: AnularEntradaDto,
    @Req() req: { user: Pick<UserSession, 'id'> },
  ) {
    return this.historiaService.anularEntrada(dto, req.user.id);
  }

  @Post('consulta')
  crearConsulta(
    @Body() dto: CrearConsultaDto,
    @Req() req: { user: Pick<UserSession, 'id'> },
  ) {
    return this.historiaService.crearConsulta(dto, req.user.id);
  }
}
