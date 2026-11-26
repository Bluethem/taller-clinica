import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../seguridad/decorators/roles.decorator.js';
import { AuthenticatedGuard } from '../seguridad/guards/authenticated.guard.js';
import { RolesGuard } from '../seguridad/guards/roles.guard.js';
import { AuditoriaService } from './auditoria.service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('auditoria')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @Roles('administrador')
  listar(@Query('pacienteId') pacienteId?: string) {
    const pacienteIdLimpio = pacienteId?.trim();
    if (!pacienteIdLimpio) {
      throw new BadRequestException('pacienteId es obligatorio');
    }
    if (!UUID_PATTERN.test(pacienteIdLimpio)) {
      throw new BadRequestException('pacienteId debe ser un UUID válido');
    }
    return this.auditoria.listarPorPaciente(pacienteIdLimpio);
  }
}
